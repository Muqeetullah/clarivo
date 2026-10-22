import { randomUUID, timingSafeEqual } from "node:crypto";
import { autoCloseConversations, getInboxConversation } from "@clarivo/db/app";
import { parseTriggerDelivery } from "@neon/functions/triggers";
import { waitUntil } from "@neon/functions";
import {
  conversationUpdatedEventSchema,
  inboxUpdatedEventSchema,
  messageCreatedEventSchema,
  type ServerEvent,
} from "@clarivo/shared/realtime";

const TRIGGER_NAME = "clarivo-auto-close-development";
const BATCH_SIZE = 100;

function manualAuthorization(request: Request): boolean {
  const secret = process.env.FUNCTIONS_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) return false;
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Publication is bounded and best effort; the database change is already committed. */
async function publish(
  room: "workspace" | "conversation",
  id: string,
  event: ServerEvent,
): Promise<boolean> {
  try {
    const origin = process.env.REALTIME_URL;
    const secret = process.env.REALTIME_PUBLISH_SECRET;
    if (!origin || !secret || Buffer.byteLength(secret) < 32) return false;
    const url = new URL(`/parties/${room}/${encodeURIComponent(id)}`, origin);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(2500),
      redirect: "error",
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function closeInactiveConversations() {
  if (process.env.NEON_BRANCH && process.env.NEON_BRANCH !== "development") {
    throw new Error("This milestone's scheduler is restricted to development.");
  }
  // The database rechecks the 24-hour cutoff under the same locks as sends.
  const closed = await autoCloseConversations({ limit: BATCH_SIZE });
  let published = 0;
  // Limit concurrent provider requests; avoid one unbounded Promise.all over tenants.
  for (let offset = 0; offset < closed.length; offset += 8) {
    await Promise.all(
      closed.slice(offset, offset + 8).map(async (record) => {
        const { workspaceId, ...conversation } = record;
        const occurredAt = new Date().toISOString();
        const event = conversationUpdatedEventSchema.parse({
          eventId: randomUUID(),
          workspaceId,
          occurredAt,
          type: "conversation.updated",
          conversationId: conversation.id,
          conversation,
        });
        if (await publish("conversation", conversation.id, event))
          published += 1;
        try {
          const snapshot = await getInboxConversation(
            workspaceId,
            conversation.id,
            { limit: 1 },
          );
          const notice = snapshot.messages.at(-1);
          if (notice) {
            const message = messageCreatedEventSchema.parse({
              eventId: randomUUID(),
              workspaceId,
              occurredAt,
              type: "message.created",
              conversationId: conversation.id,
              conversation: snapshot.conversation,
              message: notice,
            });
            if (await publish("conversation", conversation.id, message))
              published += 1;
          }
          const inbox = inboxUpdatedEventSchema.parse({
            eventId: randomUUID(),
            workspaceId,
            occurredAt,
            type: "inbox.updated",
            notificationMessage: notice,
            item: {
              conversation: snapshot.conversation,
              visitor: snapshot.visitor,
              lastMessage: snapshot.messages.at(-1) ?? null,
            },
          });
          if (await publish("workspace", workspaceId, inbox)) published += 1;
        } catch {
          // Snapshot/publication errors must not misreport a committed closure as failed.
        }
      }),
    );
  }
  return { closed: closed.length, published, batchLimit: BATCH_SIZE };
}

export default {
  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path !== "/triggers/auto-close")
      return new Response("Not found", { status: 404 });
    if (request.method !== "POST")
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "POST" },
      });

    let invocationId = "manual";
    let scheduledAt: string | undefined;
    if (!manualAuthorization(request)) {
      // The deployed Neon proxy strips user-supplied x-neon-* headers. The
      // parser binds the trusted invocation header to the validated JSON body.
      const parsed = await parseTriggerDelivery(request);
      if (!parsed.ok)
        return new Response("Unauthorized trigger delivery", { status: 401 });
      if (
        parsed.invocation.type !== "schedule" ||
        parsed.invocation.trigger.name !== TRIGGER_NAME
      ) {
        return new Response("Unexpected trigger", { status: 403 });
      }
      invocationId = parsed.invocation.invocationId;
      scheduledAt = parsed.invocation.data.scheduledAt;
    }

    waitUntil(
      closeInactiveConversations()
        .then((result) => {
          console.info("Clarivo auto-close completed", {
            invocationId,
            scheduledAt,
            ...result,
          });
        })
        .catch(() => {
          console.error("Clarivo auto-close database operation failed", {
            invocationId,
          });
        }),
    );
    return Response.json({ accepted: true }, { status: 202 });
  },
};
