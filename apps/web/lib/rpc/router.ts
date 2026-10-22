import "server-only";
import { randomUUID } from "node:crypto";
import { implement, ORPCError } from "@orpc/server";
import {
  contract,
  VISITOR_TOKEN_REFRESH_SECONDS,
  type WidgetSettings,
  type SendMessageOutput,
  type Conversation,
} from "@clarivo/shared";
import * as db from "@clarivo/db/app";
import {
  ownerContext,
  verifiedOwner,
  visitorContext,
  type RpcContext,
} from "./context";
import {
  avatarUrl,
  createAvatarUpload,
  confirmAvatarUpload,
  removeAvatar,
} from "@/lib/storage/avatars";
import { hostAllowed } from "@/lib/visitor/development-hosts";
import { normalizeVisitorDetails } from "@/lib/visitor/details";
import {
  newVisitorSecret,
  hashVisitorSecret,
  readVisitorToken,
  matchesVisitorSecret,
  issueVisitorToken,
} from "@/lib/visitor/tokens";

import {
  issueRealtimeToken,
  publishRealtimeEvent,
} from "@/lib/realtime/server";

async function publishConversation(
  workspaceId: string,
  conversation: Conversation,
  sent?: SendMessageOutput,
) {
  try {
    const room = { type: "conversation" as const, id: conversation.id };
    const envelope = () => ({
      eventId: randomUUID(),
      workspaceId,
      occurredAt: new Date().toISOString(),
    });
    await Promise.all(
      (sent?.messages ?? []).map((message) =>
        publishRealtimeEvent(room, {
          ...envelope(),
          type: "message.created",
          conversationId: conversation.id,
          conversation,
          message,
        }),
      ),
    );
    await publishRealtimeEvent(room, {
      ...envelope(),
      type: "conversation.updated",
      conversationId: conversation.id,
      conversation,
    });
    const detail = await db.getInboxConversation(workspaceId, conversation.id, {
      limit: 1,
    });
    await publishRealtimeEvent(
      { type: "workspace", id: workspaceId },
      {
        ...envelope(),
        type: "inbox.updated",
        ...(sent?.message.author === "visitor" ? { notificationMessage: sent.message } : {}),
        item: {
          conversation: detail.conversation,
          visitor: detail.visitor,
          lastMessage: detail.messages.at(-1) ?? null,
        },
      },
    );
  } catch {
    console.warn("conversation_publish_after_commit_failed");
  }
}
const implementation = implement(contract).$context<RpcContext>();
const base = implementation.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof ORPCError) throw error;
    if (error instanceof db.AppDataError)
      throw new ORPCError(
        error.code === "INVALID_INPUT" ? "BAD_REQUEST" : error.code,
      );
    console.error(
      "rpc_service_failure",
      error instanceof Error ? error.name : "Unknown",
    );
    throw new ORPCError("SERVICE_UNAVAILABLE");
  }
});
const owner = base.use(async ({ context, next }) =>
  next({ context: await ownerContext(context) }),
);
const visitor = base.use(async ({ context, next }) =>
  next({ context: await visitorContext(context) }),
);
function settingsOutput(settings: WidgetSettings): WidgetSettings {
  return { ...settings, avatarUrl: avatarUrl(settings.avatarKey) };
}
async function publicConfig(workspaceId: string, host: string) {
  const workspace = await db.getPublicWorkspace(workspaceId);
  if (!workspace || !hostAllowed(host, workspace.settings.allowedDomains))
    throw new ORPCError("FORBIDDEN");
  const saved = settingsOutput(workspace.settings);
  const settings = {
    agentName: saved.agentName,
    greeting: saved.greeting,
    accentColor: saved.accentColor,
    position: saved.position,
    avatarUrl: saved.avatarUrl,
    version: saved.version,
  };
  return {
    workspaceId,
    businessName: workspace.name,
    owner: await db.getPublicOwnerPresentation(workspace.id),
    settings,
    agentAvailable: false as const,
  };
}
export const router = base.router({
  workspace: {
    get: base.workspace.get.handler(async ({ context }) => ({
      workspace: await db.workspaceForOwner((await verifiedOwner(context)).id),
    })),
    onboard: base.workspace.onboard.handler(async ({ context, input }) => ({
      workspace: await db.onboardWorkspace(
        (await verifiedOwner(context)).id,
        input.name,
      ),
    })),
  },
  settings: {
    get: owner.settings.get.handler(async ({ context }) =>
      settingsOutput(await db.getSettings(context.workspaceId)),
    ),
    save: owner.settings.save.handler(async ({ context, input }) =>
      settingsOutput(await db.saveSettings(context.workspaceId, input)),
    ),
    createAvatarUpload: owner.settings.createAvatarUpload.handler(
      ({ context, input }) => createAvatarUpload(context.workspaceId, input),
    ),
    confirmAvatarUpload: owner.settings.confirmAvatarUpload.handler(
      async ({ context, input }) =>
        settingsOutput(
          await confirmAvatarUpload(context.workspaceId, input.uploadId),
        ),
    ),
    removeAvatar: owner.settings.removeAvatar.handler(
      async ({ context, input }) =>
        settingsOutput(
          await removeAvatar(context.workspaceId, input.expectedAvatarKey),
        ),
    ),
  },
  inbox: {
    list: owner.inbox.list.handler(({ context, input }) =>
      db.listInbox(context.workspaceId, input),
    ),
    get: owner.inbox.get.handler(({ context, input }) =>
      db.getInboxConversation(context.workspaceId, input.conversationId, input),
    ),
    sendMessage: owner.inbox.sendMessage.handler(async ({ context, input }) => {
      const sent = await db.ownerSend(
        context.workspaceId,
        context.memberId,
        input.conversationId,
        input,
      );
      await publishConversation(context.workspaceId, sent.conversation, sent);
      return sent;
    }),
    takeover: owner.inbox.takeover.handler(async ({ context, input }) => {
      const conversation = await db.takeoverConversation(
        context.workspaceId,
        input.conversationId,
      );
      await publishConversation(context.workspaceId, conversation);
      return conversation;
    }),
    close: owner.inbox.close.handler(async ({ context, input }) => {
      const conversation = await db.closeConversation(
        context.workspaceId,
        input.conversationId,
      );
      await publishConversation(context.workspaceId, conversation);
      return conversation;
    }),
  },
  widget: {
    config: base.widget.config.handler(({ input }) =>
      publicConfig(input.workspaceId, input.host),
    ),
    start: base.widget.start.handler(async ({ context, input }) => {
      const config = await publicConfig(input.workspaceId, input.host);
      let identity: Awaited<ReturnType<typeof readVisitorToken>> | undefined;
      if (input.token) {
        try {
          identity = await readVisitorToken(input.token);
          const stored = await db.getVisitorIdentity(
            input.workspaceId,
            identity.visitorId,
          );
          if (
            identity.workspaceId !== input.workspaceId ||
            identity.host !== input.host ||
            !stored ||
            !matchesVisitorSecret(identity.secret, stored.secretHash)
          )
            throw new Error("Invalid visitor.");
        } catch {
          throw new ORPCError("UNAUTHORIZED");
        }
      }
      const secret = identity?.secret ?? newVisitorSecret();
      const visitorId = identity?.visitorId ?? randomUUID();
      const details = normalizeVisitorDetails(context.request, input.metadata);
      const currentVisitor = identity
        ? await db.touchVisitor(input.workspaceId, visitorId, {
            visitId: input.visitId,
            details,
          })
        : await db.createVisitor(input.workspaceId, {
            id: visitorId,
            secretHash: hashVisitorSecret(secret),
            visitId: input.visitId,
            details,
          });
      const session =
        identity &&
        Date.now() / 1000 - identity.issuedAt < VISITOR_TOKEN_REFRESH_SECONDS
          ? {
              token: input.token!,
              tokenExpiresAt: new Date(identity.expiresAt * 1000).toISOString(),
            }
          : await issueVisitorToken(
              visitorId,
              input.workspaceId,
              input.host,
              secret,
            );
      if (input.host !== "localhost") await db.markInstalled(input.workspaceId);
      const history = await db.visitorHistory(input.workspaceId, visitorId, {
        limit: 1,
      });
      return {
        ...session,
        visitor: currentVisitor,
        config,
        latestConversationId: history.latestConversationId,
      };
    }),
    history: visitor.widget.history.handler(({ context, input }) =>
      db.visitorHistory(context.workspaceId, context.visitorId, input),
    ),
    sendMessage: visitor.widget.sendMessage.handler(
      async ({ context, input }) => {
        const sent = await db.visitorSend(
          context.workspaceId,
          context.visitorId,
          input,
        );
        await publishConversation(context.workspaceId, sent.conversation, sent);
        return sent;
      },
    ),
    updateDetails: visitor.widget.updateDetails.handler(({ context, input }) =>
      db.touchVisitor(context.workspaceId, context.visitorId, {
        visitId: input.visitId,
        details: normalizeVisitorDetails(context.request, input.metadata),
      }),
    ),
    getRealtimeToken: visitor.widget.getRealtimeToken.handler(
      async ({ context, input }) => {
        const history = await db.visitorHistory(
          context.workspaceId,
          context.visitorId,
          { conversationId: input.conversationId, limit: 1 },
        );
        const conversationId =
          input.conversationId ?? history.latestConversationId;
        if (
          !conversationId ||
          !history.conversations.some((c) => c.id === conversationId)
        )
          throw new ORPCError("NOT_FOUND");
        return issueRealtimeToken({
          role: "visitor",
          sub: context.visitorId,
          workspaceId: context.workspaceId,
          host: context.host,
          roomType: "conversation",
          roomId: conversationId,
          conversationId,
        });
      },
    ),
  },
  realtime: {
    getToken: owner.realtime.getToken.handler(async ({ context, input }) => {
      if (input.room.type === "workspace")
        return issueRealtimeToken({
          role: "owner",
          sub: context.user.id,
          workspaceId: context.workspaceId,
          roomType: "workspace",
          roomId: context.workspaceId,
        });
      await db.getInboxConversation(
        context.workspaceId,
        input.room.conversationId,
        { limit: 1 },
      );
      return issueRealtimeToken({
        role: "owner",
        sub: context.user.id,
        workspaceId: context.workspaceId,
        roomType: "conversation",
        roomId: input.room.conversationId,
        conversationId: input.room.conversationId,
      });
    }),
  },
});
