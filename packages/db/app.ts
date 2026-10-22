import "server-only";
import { randomUUID } from "node:crypto";
import type { TimestamptzString } from "@prisma/orm-postgres/target/codec-types";
import { and, or } from "@prisma/orm-postgres/orm-client";
import {
  businessNameSchema,
  conversationSchema,
  messageSchema,
  saveSettingsInputSchema,
  visitorSchema,
  widgetSettingsSchema,
  type Conversation,
  type ConversationState,
  type InboxConversation,
  type Message,
  type SaveSettingsInput,
  type SendMessageOutput,
  type Visitor,
  type VisitorDetails,
  type WidgetHistory,
  type WidgetSettings,
  type Workspace,
  type OwnerPresentation,
} from "@clarivo/shared/schemas";
import type { Models } from "./generated-app/contract.d";
import { appClient, type AppTransaction } from "./app-runtime";
import { readAuthOwnerPresentation } from "./index";
type WorkspaceRow = Models.clarivo_Workspace;
type VisitorRow = Omit<Models.clarivo_Visitor, "workspace">;
type ConversationRow = Omit<Models.clarivo_Conversation, "visitor">;
type MessageRow = Omit<Models.clarivo_Message, "conversation" | "member">;
export class AppDataError extends Error {
  constructor(
    public readonly code:
      "NOT_FOUND" | "CONFLICT" | "FORBIDDEN" | "INVALID_INPUT",
    message: string,
  ) {
    super(message);
    this.name = "AppDataError";
  }
}
// Branding follows normalization to valid millisecond UTC text; Prisma owns the codec.
const dbTime = (value: string | Date): TimestamptzString<3> =>
  new Date(value).toISOString() as TimestamptzString<3>;
const nowISO = () => dbTime(new Date());
const iso = (v: string) => new Date(v).toISOString();
const nullableISO = (v: string | null) => (v === null ? null : iso(v));
function requireRow<T>(row: T | null): T {
  if (row === null)
    throw new AppDataError("NOT_FOUND", "The requested record was not found.");
  return row;
}
function mapSettings(row: WorkspaceRow): WidgetSettings {
  return widgetSettingsSchema.parse({
    agentName: row.agentName,
    greeting: row.greeting,
    accentColor: row.accentColor,
    position: row.position,
    avatarKey: row.avatarKey,
    avatarUrl: null,
    allowedDomains: row.allowedDomains,
    version: row.settingsVersion,
    installedAt: nullableISO(row.installedAt),
  });
}
function mapVisitor(row: VisitorRow): Visitor {
  return visitorSchema.parse({
    id: row.id,
    details: {
      country: row.country,
      city: row.city,
      device: row.device,
      browser: row.browser,
      os: row.os,
      timeZone: row.timeZone,
      language: row.language,
      page: row.page,
      referrer: row.referrer,
    },
    firstSeenAt: iso(row.firstSeenAt),
    lastSeenAt: iso(row.lastSeenAt),
    visitCount: row.visitCount,
  });
}
function mapConversation(row: ConversationRow): Conversation {
  return conversationSchema.parse({
    ...row,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    lastMessageAt: iso(row.lastMessageAt),
    closedAt: nullableISO(row.closedAt),
  });
}
function mapMessage(row: MessageRow): Message {
  return messageSchema.parse({ ...row, createdAt: iso(row.createdAt) });
}
async function workspaceRow(workspaceId: string) {
  return requireRow(
    await appClient().orm.clarivo.Workspace.where({ id: workspaceId }).first(),
  );
}

/** Only call after validating a verified provider session; never an account lookup endpoint. */
export async function workspaceForOwner(
  ownerId: string,
): Promise<Workspace | null> {
  const member = await appClient()
    .orm.clarivo.Member.where({ userId: ownerId })
    .first();
  if (!member) return null;
  const row = requireRow(
    await appClient()
      .orm.clarivo.Workspace.where({ id: member.workspaceId, ownerId })
      .first(),
  );
  return {
    id: row.id,
    name: row.name,
    createdAt: iso(row.createdAt),
    membership: { id: member.id, role: "owner" },
  };
}
/** Unique owner/member keys arbitrate concurrent tabs; a losing transaction reads the winner. */
export async function onboardWorkspace(
  ownerId: string,
  name: string,
): Promise<Workspace> {
  const validName = businessNameSchema.parse(name);
  const existing = await workspaceForOwner(ownerId);
  if (existing) return existing;
  try {
    return await appClient().transaction(async (tx) => {
      const id = randomUUID(),
        createdAt = nowISO();
      await tx.orm.clarivo.Workspace.create({
        id,
        ownerId,
        name: validName,
        createdAt,
        agentName: `${validName.slice(0, 114)} Agent`,
        greeting: "Hi there! How can we help you today?",
        accentColor: "#2563eb",
        position: "right",
        avatarKey: null,
        allowedDomains: [],
        settingsVersion: 0,
        installedAt: null,
      });
      const member = await tx.orm.clarivo.Member.create({
        id: randomUUID(),
        workspaceId: id,
        userId: ownerId,
        role: "owner",
      });
      return {
        id,
        name: validName,
        createdAt,
        membership: { id: member.id, role: "owner" as const },
      };
    });
  } catch (error) {
    const winner = await workspaceForOwner(ownerId);
    if (winner) return winner;
    throw error;
  }
}
export async function getSettings(
  workspaceId: string,
): Promise<WidgetSettings> {
  return mapSettings(await workspaceRow(workspaceId));
}
export async function getPublicWorkspace(workspaceId: string) {
  const row = await appClient()
    .orm.clarivo.Workspace.where({ id: workspaceId })
    .first();
  return row
    ? { id: row.id, name: row.name, settings: mapSettings(row) }
    : null;
}
/** Public widget identity only; caller must first enforce this workspace's allowed host. */
export async function getPublicOwnerPresentation(
  workspaceId: string,
): Promise<OwnerPresentation> {
  const member = await appClient()
    .orm.clarivo.Member.where({ workspaceId, role: "owner" })
    .select("userId")
    .first();
  const user = member ? await readAuthOwnerPresentation(member.userId) : null;
  let avatarUrl: string | null = null;
  if (user?.image) {
    try {
      const image = new URL(user.image);
      if (["https:", "http:"].includes(image.protocol)) avatarUrl = image.href;
    } catch {
      // Invalid profile images use the widget's DiceBear fallback.
    }
  }
  return { name: user?.name.trim() || "Support team", avatarUrl };
}
export async function saveSettings(
  workspaceId: string,
  input: SaveSettingsInput,
): Promise<WidgetSettings> {
  const { expectedVersion, ...settings } = saveSettingsInputSchema.parse(input);
  return appClient().transaction(async (tx) => {
    const row = requireRow(
      await tx.orm.clarivo.Workspace.where({ id: workspaceId })
        .forNoKeyUpdate()
        .first(),
    );
    if (row.settingsVersion !== expectedVersion)
      throw new AppDataError(
        "CONFLICT",
        "Settings changed in another tab. Reload before saving.",
      );
    return mapSettings(
      requireRow(
        await tx.orm.clarivo.Workspace.where({ id: workspaceId }).update({
          ...settings,
          settingsVersion: row.settingsVersion + 1,
        }),
      ),
    );
  });
}
export async function markInstalled(workspaceId: string): Promise<void> {
  await appClient().transaction(async (tx) => {
    const row = requireRow(
      await tx.orm.clarivo.Workspace.where({ id: workspaceId })
        .forNoKeyUpdate()
        .first(),
    );
    if (!row.installedAt)
      await tx.orm.clarivo.Workspace.where({ id: workspaceId }).update({
        installedAt: nowISO(),
      });
  });
}
export type PendingAvatarInput = {
  id: string;
  key: string;
  mime: string;
  size: number;
  expiresAt: string;
};
export async function createPendingAvatar(
  workspaceId: string,
  input: PendingAvatarInput,
) {
  if (
    !input.key.startsWith(`workspaces/${workspaceId}/agent-avatar/`) ||
    input.key.includes("..")
  )
    throw new AppDataError("INVALID_INPUT", "Invalid avatar object key.");
  await workspaceRow(workspaceId);
  return appClient().orm.clarivo.AvatarUpload.create({
    ...input,
    expiresAt: dbTime(input.expiresAt),
    workspaceId,
    createdAt: nowISO(),
    confirmedAt: null,
  });
}
export async function getPendingAvatar(workspaceId: string, uploadId: string) {
  const row = await appClient()
    .orm.clarivo.AvatarUpload.where({ workspaceId, id: uploadId })
    .first();
  return row
    ? {
        ...row,
        confirmed: row.confirmedAt !== null,
        createdAt: iso(row.createdAt),
        expiresAt: iso(row.expiresAt),
        confirmedAt: nullableISO(row.confirmedAt),
      }
    : null;
}
/** Storage validation must complete before this call. A confirmed upload never reattaches itself. */
export async function attachAvatar(
  workspaceId: string,
  uploadId: string,
  finalKey?: string,
): Promise<{ settings: WidgetSettings; previousKey: string | null }> {
  return appClient().transaction(async (tx) => {
    const row = requireRow(
      await tx.orm.clarivo.Workspace.where({ id: workspaceId })
        .forNoKeyUpdate()
        .first(),
    );
    const upload = requireRow(
      await tx.orm.clarivo.AvatarUpload.where({ workspaceId, id: uploadId })
        .forNoKeyUpdate()
        .first(),
    );
    if (upload.confirmedAt)
      return { settings: mapSettings(row), previousKey: null };
    if (
      !finalKey ||
      finalKey === upload.key ||
      !finalKey.startsWith(`workspaces/${workspaceId}/agent-avatar/`) ||
      finalKey.includes("..")
    ) {
      throw new AppDataError(
        "INVALID_INPUT",
        "A unique server-published avatar key is required.",
      );
    }
    if (Date.parse(upload.expiresAt) < Date.now())
      throw new AppDataError(
        "CONFLICT",
        "The avatar upload expired. Upload it again.",
      );
    const updated = requireRow(
      await tx.orm.clarivo.Workspace.where({ id: workspaceId }).update({
        avatarKey: finalKey,
        settingsVersion: row.settingsVersion + 1,
      }),
    );
    await tx.orm.clarivo.AvatarUpload.where({
      workspaceId,
      id: uploadId,
    }).update({ confirmedAt: nowISO() });
    return { settings: mapSettings(updated), previousKey: row.avatarKey };
  });
}
export async function removeAvatar(
  workspaceId: string,
  expectedAvatarKey: string | null,
): Promise<{ settings: WidgetSettings; previousKey: string | null }> {
  return appClient().transaction(async (tx) => {
    const row = requireRow(
      await tx.orm.clarivo.Workspace.where({ id: workspaceId })
        .forNoKeyUpdate()
        .first(),
    );
    if (row.avatarKey === null)
      return { settings: mapSettings(row), previousKey: null };
    if (row.avatarKey !== expectedAvatarKey)
      throw new AppDataError(
        "CONFLICT",
        "The avatar changed. Reload before removing it.",
      );
    const updated = requireRow(
      await tx.orm.clarivo.Workspace.where({ id: workspaceId }).update({
        avatarKey: null,
        settingsVersion: row.settingsVersion + 1,
      }),
    );
    return { settings: mapSettings(updated), previousKey: row.avatarKey };
  });
}
export async function createVisitor(
  workspaceId: string,
  input: {
    id: string;
    secretHash: string;
    visitId: string;
    details: VisitorDetails;
  },
): Promise<Visitor> {
  return appClient().transaction(async (tx) => {
    const stamp = nowISO();
    const row = await tx.orm.clarivo.Visitor.create({
      id: input.id,
      workspaceId,
      secretHash: input.secretHash,
      ...input.details,
      firstSeenAt: stamp,
      lastSeenAt: stamp,
      visitCount: 1,
    });
    await tx.orm.clarivo.VisitorVisit.create({
      id: randomUUID(),
      workspaceId,
      visitorId: row.id,
      visitId: input.visitId,
      createdAt: stamp,
    });
    return mapVisitor(row);
  });
}
export async function getVisitorIdentity(
  workspaceId: string,
  visitorId: string,
): Promise<{ visitor: Visitor; secretHash: string } | null> {
  const row = await appClient()
    .orm.clarivo.Visitor.where({ workspaceId, id: visitorId })
    .first();
  return row ? { visitor: mapVisitor(row), secretHash: row.secretHash } : null;
}
/** visitId is one top-level page lifecycle, reused on iframe renders/reconnects. */
export async function touchVisitor(
  workspaceId: string,
  visitorId: string,
  input: { visitId: string; details: Partial<VisitorDetails> },
): Promise<Visitor> {
  return appClient().transaction(async (tx) => {
    const row = requireRow(
      await tx.orm.clarivo.Visitor.where({ workspaceId, id: visitorId })
        .forNoKeyUpdate()
        .first(),
    );
    const visit = await tx.orm.clarivo.VisitorVisit.where({
      workspaceId,
      visitorId,
      visitId: input.visitId,
    }).first();
    const stamp = nowISO();
    if (!visit)
      await tx.orm.clarivo.VisitorVisit.create({
        id: randomUUID(),
        workspaceId,
        visitorId,
        visitId: input.visitId,
        createdAt: stamp,
      });
    return mapVisitor(
      requireRow(
        await tx.orm.clarivo.Visitor.where({
          workspaceId,
          id: visitorId,
        }).update({
          ...input.details,
          lastSeenAt: stamp,
          visitCount: row.visitCount + (visit ? 0 : 1),
        }),
      ),
    );
  });
}

type PageInput = { limit?: number; cursor?: string };
function pageLimit(value = 50) {
  return Math.max(1, Math.min(100, value));
}
function pageOffset(cursor?: string) {
  if (!cursor) return 0;
  if (!/^\d{1,9}$/.test(cursor))
    throw new AppDataError("INVALID_INPUT", "Invalid pagination cursor.");
  return Number(cursor);
}
function historyCursor(
  cursor?: string,
): { createdAt: TimestamptzString<3>; id: string } | null {
  if (!cursor) return null;
  try {
    const value: unknown = JSON.parse(
      Buffer.from(cursor, "base64url").toString(),
    );
    if (
      !value ||
      typeof value !== "object" ||
      !("createdAt" in value) ||
      !("id" in value) ||
      typeof value.createdAt !== "string" ||
      typeof value.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value.id,
      ) ||
      !Number.isFinite(Date.parse(value.createdAt))
    )
      throw new Error();
    return { createdAt: dbTime(value.createdAt), id: value.id };
  } catch {
    throw new AppDataError("INVALID_INPUT", "Invalid history cursor.");
  }
}
function encodeHistoryCursor(row: MessageRow) {
  return Buffer.from(
    JSON.stringify({ createdAt: row.createdAt, id: row.id }),
  ).toString("base64url");
}
async function messagePage(
  workspaceId: string,
  conversationId: string | string[],
  input: PageInput,
) {
  const limit = pageLimit(input.limit),
    cursor = historyCursor(input.cursor);
  const collection = appClient()
    .orm.clarivo.Message.where({ workspaceId })
    .where((m) =>
      typeof conversationId === "string"
        ? m.conversationId.eq(conversationId)
        : m.conversationId.in(conversationId),
    );
  const filtered = cursor
    ? collection.where((m) =>
        or(
          m.createdAt.lt(cursor.createdAt),
          and(m.createdAt.eq(cursor.createdAt), m.id.lt(cursor.id)),
        ),
      )
    : collection;
  const rows = await filtered
    .orderBy([(m) => m.createdAt.desc(), (m) => m.id.desc()])
    .limit(limit + 1)
    .all();
  const page = rows.slice(0, limit);
  return {
    messages: page.map(mapMessage).reverse(),
    nextCursor:
      rows.length > limit ? encodeHistoryCursor(page[page.length - 1]!) : null,
  };
}
export async function listInbox(
  workspaceId: string,
  input: PageInput & {
    state?: ConversationState;
    search?: string;
    openOnly?: boolean;
  } = {},
): Promise<{ items: InboxConversation[]; nextCursor: string | null }> {
  const limit = pageLimit(input.limit),
    offset = pageOffset(input.cursor);
  let collection = appClient().orm.clarivo.Conversation.where({ workspaceId });
  if (input.state) collection = collection.where({ state: input.state });
  else if (input.openOnly)
    collection = collection.where((c) => c.state.neq("closed"));
  const search = input.search?.trim();
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    const messages = await appClient()
      .orm.clarivo.Message.where({ workspaceId })
      .where((m) => m.body.ilike(pattern))
      .select("conversationId")
      .all();
    const visitors = await appClient()
      .orm.clarivo.Visitor.where({ workspaceId })
      .where((v) =>
        or(
          v.city.ilike(pattern),
          v.country.ilike(pattern),
          v.page.ilike(pattern),
        ),
      )
      .select("id")
      .all();
    const messageIds = [...new Set(messages.map((m) => m.conversationId))],
      visitorIds = visitors.map((v) => v.id);
    collection = collection.where((c) =>
      or(c.id.in(messageIds), c.visitorId.in(visitorIds)),
    );
  }
  // Waiting is a separate ordered band; preserve newest-first ordering inside each band.
  const waiting = await collection
    .where({ state: "waiting" })
    .orderBy([(c) => c.lastMessageAt.desc(), (c) => c.id.desc()])
    .limit(offset + limit + 1)
    .all();
  const other =
    waiting.length > offset + limit
      ? []
      : await collection
          .where((c) => c.state.neq("waiting"))
          .orderBy([(c) => c.lastMessageAt.desc(), (c) => c.id.desc()])
          .limit(offset + limit + 1)
          .all();
  const rows = [...waiting, ...other],
    page = rows.slice(offset, offset + limit);
  const items = await Promise.all(
    page.map(async (row) => {
      const [visitor, lastMessage] = await Promise.all([
        appClient()
          .orm.clarivo.Visitor.where({ workspaceId, id: row.visitorId })
          .first(),
        appClient()
          .orm.clarivo.Message.where({ workspaceId, conversationId: row.id })
          .orderBy([(m) => m.createdAt.desc(), (m) => m.id.desc()])
          .first(),
      ]);
      return {
        conversation: mapConversation(row),
        visitor: mapVisitor(requireRow(visitor)),
        lastMessage: lastMessage ? mapMessage(lastMessage) : null,
      };
    }),
  );
  return {
    items,
    nextCursor: rows.length > offset + limit ? String(offset + limit) : null,
  };
}
export async function getInboxConversation(
  workspaceId: string,
  conversationId: string,
  input: PageInput = {},
) {
  const row = requireRow(
    await appClient()
      .orm.clarivo.Conversation.where({ workspaceId, id: conversationId })
      .first(),
  );
  const [visitor, page] = await Promise.all([
    appClient()
      .orm.clarivo.Visitor.where({ workspaceId, id: row.visitorId })
      .first(),
    messagePage(workspaceId, conversationId, input),
  ]);
  return {
    conversation: mapConversation(row),
    visitor: mapVisitor(requireRow(visitor)),
    ...page,
  };
}
export async function visitorHistory(
  workspaceId: string,
  visitorId: string,
  input: PageInput & { conversationId?: string } = {},
): Promise<WidgetHistory> {
  requireRow(
    await appClient()
      .orm.clarivo.Visitor.where({ workspaceId, id: visitorId })
      .first(),
  );
  const rows = await appClient()
    .orm.clarivo.Conversation.where({ workspaceId, visitorId })
    .orderBy([(c) => c.createdAt.desc(), (c) => c.id.desc()])
    .all();
  const conversationIds = input.conversationId
    ? [
        requireRow(rows.find((row) => row.id === input.conversationId) ?? null)
          .id,
      ]
    : rows.map((row) => row.id);
  const page = conversationIds.length
    ? await messagePage(workspaceId, conversationIds, input)
    : { messages: [], nextCursor: null };
  return {
    conversations: rows.map(mapConversation),
    ...page,
    latestConversationId: rows[0]?.id ?? null,
  };
}

const WAITING_NOTICE = "You'll be connected to a person shortly.";
const CLOSED_NOTICE = "This conversation has been closed.";
async function insertMessage(
  tx: AppTransaction,
  workspaceId: string,
  conversationId: string,
  body: string,
  author: "visitor" | "member" | "system",
  options: {
    clientMessageId?: string;
    memberId?: string;
    createdAt?: string;
  } = {},
) {
  return tx.orm.clarivo.Message.create({
    id: randomUUID(),
    workspaceId,
    conversationId,
    author,
    body,
    memberId: options.memberId ?? null,
    clientMessageId: options.clientMessageId ?? null,
    createdAt: options.createdAt ? dbTime(options.createdAt) : nowISO(),
  });
}
function validateBody(body: string) {
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 4000)
    throw new AppDataError(
      "INVALID_INPUT",
      "Messages must contain 1–4,000 characters.",
    );
  return trimmed;
}
async function priorSend(
  tx: AppTransaction,
  workspaceId: string,
  clientMessageId: string,
) {
  return tx.orm.clarivo.Message.where({ workspaceId, clientMessageId }).first();
}
function assertRetry(
  message: MessageRow,
  body: string,
  author: "visitor" | "member",
  memberId: string | null,
) {
  if (
    message.author !== author ||
    message.body !== body ||
    message.memberId !== memberId
  )
    throw new AppDataError(
      "CONFLICT",
      "This message identifier has already been used.",
    );
}
async function sendResult(
  tx: AppTransaction,
  workspaceId: string,
  row: ConversationRow,
  message: MessageRow,
  created: MessageRow[],
): Promise<SendMessageOutput> {
  return {
    conversation: mapConversation(
      requireRow(
        await tx.orm.clarivo.Conversation.where({
          workspaceId,
          id: row.id,
        }).first(),
      ),
    ),
    message: mapMessage(message),
    messages: created.map(mapMessage),
  };
}
export async function visitorSend(
  workspaceId: string,
  visitorId: string,
  input: { body: string; clientMessageId: string },
): Promise<SendMessageOutput> {
  const body = validateBody(input.body);
  return appClient().transaction(async (tx) => {
    // Serializes first-send/open/close decisions across tabs for this visitor.
    requireRow(
      await tx.orm.clarivo.Visitor.where({ workspaceId, id: visitorId })
        .forNoKeyUpdate()
        .first(),
    );
    const prior = await priorSend(tx, workspaceId, input.clientMessageId);
    if (prior) {
      assertRetry(prior, body, "visitor", null);
      const row = requireRow(
        await tx.orm.clarivo.Conversation.where({
          workspaceId,
          id: prior.conversationId,
          visitorId,
        }).first(),
      );
      return sendResult(tx, workspaceId, row, prior, [prior]);
    }
    let row = await tx.orm.clarivo.Conversation.where({
      workspaceId,
      visitorId,
    })
      .where((c) => c.state.neq("closed"))
      .forNoKeyUpdate()
      .first();
    const created: MessageRow[] = [];
    const stamp = row
      ? dbTime(
          new Date(Math.max(Date.now(), Date.parse(row.lastMessageAt) + 1)),
        )
      : nowISO();
    if (!row) {
      const settings = requireRow(
        await tx.orm.clarivo.Workspace.where({ id: workspaceId }).first(),
      );
      row = await tx.orm.clarivo.Conversation.create({
        id: randomUUID(),
        workspaceId,
        visitorId,
        state: "waiting",
        handoffReason: "agent_off",
        createdAt: stamp,
        updatedAt: stamp,
        lastMessageAt: stamp,
        closedAt: null,
        version: 0,
      });
      // Distinct milliseconds preserve deterministic greeting → visitor → waiting order.
      created.push(
        await insertMessage(
          tx,
          workspaceId,
          row.id,
          settings.greeting,
          "system",
          { createdAt: new Date(Date.parse(stamp) - 1).toISOString() },
        ),
      );
    }
    const message = await insertMessage(
      tx,
      workspaceId,
      row.id,
      body,
      "visitor",
      { clientMessageId: input.clientMessageId, createdAt: stamp },
    );
    created.push(message);
    if (created.length === 2)
      created.push(
        await insertMessage(tx, workspaceId, row.id, WAITING_NOTICE, "system", {
          createdAt: new Date(Date.parse(stamp) + 1).toISOString(),
        }),
      );
    const lastStamp = created[created.length - 1]!.createdAt;
    await tx.orm.clarivo.Conversation.where({ workspaceId, id: row.id }).update(
      {
        lastMessageAt: lastStamp,
        updatedAt: lastStamp,
        version: row.version + 1,
      },
    );
    await tx.orm.clarivo.Visitor.where({ workspaceId, id: visitorId }).update({
      lastSeenAt: stamp,
    });
    return sendResult(tx, workspaceId, row, message, created);
  });
}
/** Everywhere locks visitor first, then conversation, so close/send/reply share one order. */
async function lockConversation(
  tx: AppTransaction,
  workspaceId: string,
  conversationId: string,
) {
  const initial = requireRow(
    await tx.orm.clarivo.Conversation.where({
      workspaceId,
      id: conversationId,
    }).first(),
  );
  requireRow(
    await tx.orm.clarivo.Visitor.where({ workspaceId, id: initial.visitorId })
      .forNoKeyUpdate()
      .first(),
  );
  return requireRow(
    await tx.orm.clarivo.Conversation.where({ workspaceId, id: conversationId })
      .forNoKeyUpdate()
      .first(),
  );
}
export async function ownerSend(
  workspaceId: string,
  memberId: string,
  conversationId: string,
  input: { body: string; clientMessageId: string },
): Promise<SendMessageOutput> {
  const body = validateBody(input.body);
  return appClient().transaction(async (tx) => {
    requireRow(
      await tx.orm.clarivo.Member.where({ workspaceId, id: memberId }).first(),
    );
    const row = await lockConversation(tx, workspaceId, conversationId),
      prior = await priorSend(tx, workspaceId, input.clientMessageId);
    if (prior) {
      assertRetry(prior, body, "member", memberId);
      if (prior.conversationId !== conversationId)
        throw new AppDataError(
          "CONFLICT",
          "This message identifier belongs to another conversation.",
        );
      return sendResult(tx, workspaceId, row, prior, [prior]);
    }
    if (row.state === "closed")
      throw new AppDataError(
        "CONFLICT",
        "Closed conversations cannot receive owner replies.",
      );
    const stamp = dbTime(
      new Date(Math.max(Date.now(), Date.parse(row.lastMessageAt) + 1)),
    );
    const message = await insertMessage(
      tx,
      workspaceId,
      row.id,
      body,
      "member",
      { memberId, clientMessageId: input.clientMessageId, createdAt: stamp },
    );
    await tx.orm.clarivo.Conversation.where({ workspaceId, id: row.id }).update(
      {
        state: "human",
        handoffReason: null,
        lastMessageAt: stamp,
        updatedAt: stamp,
        version: row.version + 1,
      },
    );
    return sendResult(tx, workspaceId, row, message, [message]);
  });
}
export async function takeoverConversation(
  workspaceId: string,
  conversationId: string,
): Promise<Conversation> {
  return appClient().transaction(async (tx) => {
    const row = await lockConversation(tx, workspaceId, conversationId);
    if (row.state === "closed")
      throw new AppDataError("CONFLICT", "This conversation is closed.");
    if (row.state === "human") return mapConversation(row);
    return mapConversation(
      requireRow(
        await tx.orm.clarivo.Conversation.where({
          workspaceId,
          id: row.id,
        }).update({
          state: "human",
          handoffReason: null,
          updatedAt: nowISO(),
          version: row.version + 1,
        }),
      ),
    );
  });
}
async function closeLocked(
  tx: AppTransaction,
  workspaceId: string,
  row: ConversationRow,
  stamp: TimestamptzString<3>,
) {
  if (row.state === "closed") return mapConversation(row);
  stamp = dbTime(
    new Date(Math.max(Date.parse(stamp), Date.parse(row.lastMessageAt) + 1)),
  );
  await insertMessage(tx, workspaceId, row.id, CLOSED_NOTICE, "system", {
    createdAt: stamp,
  });
  return mapConversation(
    requireRow(
      await tx.orm.clarivo.Conversation.where({
        workspaceId,
        id: row.id,
      }).update({
        state: "closed",
        closedAt: stamp,
        updatedAt: stamp,
        version: row.version + 1,
      }),
    ),
  );
}
export async function closeConversation(
  workspaceId: string,
  conversationId: string,
): Promise<Conversation> {
  return appClient().transaction(async (tx) =>
    closeLocked(
      tx,
      workspaceId,
      await lockConversation(tx, workspaceId, conversationId),
      nowISO(),
    ),
  );
}
/** Scheduler-only administrative entry. Rechecks inactivity under the same locks as sends. */
export async function autoCloseConversations(
  input: { now?: Date; limit?: number } = {},
): Promise<Array<Conversation & { workspaceId: string }>> {
  const now = input.now ?? new Date(),
    cutoff = dbTime(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const candidates = await appClient()
    .orm.clarivo.Conversation.where((c) =>
      and(c.state.neq("closed"), c.lastMessageAt.lte(cutoff)),
    )
    .orderBy((c) => c.lastMessageAt.asc())
    .limit(input.limit ?? 100)
    .all();
  const closed: Array<Conversation & { workspaceId: string }> = [];
  for (const candidate of candidates) {
    const result = await appClient().transaction(async (tx) => {
      const row = await lockConversation(
        tx,
        candidate.workspaceId,
        candidate.id,
      );
      if (
        row.state === "closed" ||
        Date.parse(row.lastMessageAt) > Date.parse(cutoff)
      )
        return null;
      return closeLocked(tx, candidate.workspaceId, row, dbTime(now));
    });
    if (result) closed.push({ ...result, workspaceId: candidate.workspaceId });
  }
  return closed;
}
