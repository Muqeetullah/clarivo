import { z } from "zod";
import { normalizeAllowedDomain, normalizeEmbedHost } from "./normalization";

export const MAX_MESSAGE_LENGTH = 4000;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
export const VISITOR_TOKEN_LIFETIME_SECONDS = 30 * 24 * 60 * 60;
export const VISITOR_TOKEN_REFRESH_SECONDS = 24 * 60 * 60;
export const REALTIME_TOKEN_LIFETIME_SECONDS = 60;
export const AUTO_CLOSE_AFTER_MS = 24 * 60 * 60 * 1000;
export const idSchema = z.uuid();
export const dateTimeSchema = z.iso.datetime();
export const clientMessageIdSchema = z.uuid();
export const emptyInputSchema = z.object({}).strict();
export const conversationIdInputSchema = z
  .object({ conversationId: idSchema })
  .strict();
export const conversationStateSchema = z.enum([
  "ai",
  "waiting",
  "human",
  "closed",
]);
export const handoffReasonSchema = z.enum([
  "low_confidence",
  "no_relevant_knowledge",
  "visitor_requested",
  "agent_off",
]);
export const messageAuthorSchema = z.enum([
  "visitor",
  "agent",
  "member",
  "system",
]);
export const avatarMimeSchema = z.enum(AVATAR_MIME_TYPES);

export const allowedDomainSchema = z
  .string()
  .max(2048)
  .transform((value, ctx) => {
    try {
      return normalizeAllowedDomain(value);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid exact domain without a port or wildcard.",
      });
      return z.NEVER;
    }
  });
export const embedHostSchema = z
  .string()
  .max(253)
  .transform((value, ctx) => {
    try {
      return normalizeEmbedHost(value);
    } catch {
      ctx.addIssue({ code: "custom", message: "Enter a valid hostname." });
      return z.NEVER;
    }
  });
export const businessNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your business name.")
  .max(120);
export const widgetAppearanceInputSchema = z
  .object({
    agentName: z.string().trim().min(1).max(120),
    greeting: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/u)
      .transform((value) => value.toLowerCase()),
    position: z.enum(["left", "right"]),
    allowedDomains: z
      .array(allowedDomainSchema)
      .transform((domains) => [...new Set(domains)]),
  })
  .strict();
export const saveSettingsInputSchema = widgetAppearanceInputSchema.extend({
  expectedVersion: z.number().int().nonnegative(),
});
export const widgetSettingsSchema = z.object({
  agentName: z.string(),
  greeting: z.string(),
  accentColor: z.string(),
  position: z.enum(["left", "right"]),
  avatarKey: z.string().nullable(),
  avatarUrl: z.url().nullable(),
  allowedDomains: z.array(z.string()),
  version: z.number().int().nonnegative(),
  installedAt: dateTimeSchema.nullable(),
});
export const workspaceSchema = z.object({
  id: idSchema,
  name: z.string(),
  createdAt: dateTimeSchema,
  membership: z.object({ id: idSchema, role: z.literal("owner") }),
});
export const workspaceOutputSchema = z.object({
  workspace: workspaceSchema.nullable(),
});
export const onboardInputSchema = z
  .object({ name: businessNameSchema })
  .strict();

export const createAvatarUploadInputSchema = z
  .object({
    mime: avatarMimeSchema,
    size: z.number().int().positive().max(MAX_AVATAR_BYTES),
  })
  .strict();
export const avatarUploadSchema = z.object({
  uploadId: idSchema,
  putUrl: z.url(),
  headers: z.record(z.string(), z.string()),
  expiresAt: dateTimeSchema,
});
export const confirmAvatarUploadInputSchema = z
  .object({ uploadId: idSchema })
  .strict();
export const removeAvatarInputSchema = z
  .object({ expectedAvatarKey: z.string().max(1024).nullable() })
  .strict();

export const browserMetadataInputSchema = z
  .object({
    timeZone: z.string().max(100).nullable().optional(),
    language: z.string().max(80).nullable().optional(),
    page: z.string().max(2048).nullable().optional(),
    referrer: z.string().max(2048).nullable().optional(),
  })
  .strict();
export const visitorDetailsSchema = z.object({
  country: z.string().nullable(),
  city: z.string().nullable(),
  device: z.string().nullable(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  timeZone: z.string().nullable(),
  language: z.string().nullable(),
  page: z.string().nullable(),
  referrer: z.string().nullable(),
});
export const visitorSchema = z.object({
  id: idSchema,
  details: visitorDetailsSchema,
  firstSeenAt: dateTimeSchema,
  lastSeenAt: dateTimeSchema,
  visitCount: z.number().int().nonnegative(),
});
export const messageSchema = z.object({
  id: idSchema,
  conversationId: idSchema,
  author: messageAuthorSchema,
  memberId: idSchema.nullable(),
  body: z.string(),
  clientMessageId: clientMessageIdSchema.nullable(),
  createdAt: dateTimeSchema,
});
export const conversationSchema = z.object({
  id: idSchema,
  visitorId: idSchema,
  state: conversationStateSchema,
  handoffReason: handoffReasonSchema.nullable(),
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  lastMessageAt: dateTimeSchema,
  closedAt: dateTimeSchema.nullable(),
  version: z.number().int().nonnegative(),
});
export const inboxConversationSchema = z.object({
  conversation: conversationSchema,
  visitor: visitorSchema,
  lastMessage: messageSchema.nullable(),
});
export const cursorSchema = z.string().min(1).max(2048);
export const pageInputShape = {
  cursor: cursorSchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
};
export const inboxListInputSchema = z
  .object({
    ...pageInputShape,
    search: z.string().trim().max(500).optional(),
    openOnly: z.boolean().optional(),
    state: conversationStateSchema.optional(),
  })
  .strict();
export const inboxListOutputSchema = z.object({
  items: z.array(inboxConversationSchema),
  nextCursor: cursorSchema.nullable(),
});
export const inboxGetInputSchema = z
  .object({ ...pageInputShape, conversationId: idSchema })
  .strict();
export const conversationDetailSchema = z.object({
  conversation: conversationSchema,
  visitor: visitorSchema,
  messages: z.array(messageSchema),
  nextCursor: cursorSchema.nullable(),
});
export const sendMessageBodySchema = z
  .string()
  .trim()
  .min(1, "Enter a message.")
  .max(MAX_MESSAGE_LENGTH);
export const ownerSendInputSchema = z
  .object({
    conversationId: idSchema,
    body: sendMessageBodySchema,
    clientMessageId: clientMessageIdSchema,
  })
  .strict();
export const visitorSendInputSchema = z
  .object({
    body: sendMessageBodySchema,
    clientMessageId: clientMessageIdSchema,
  })
  .strict();
export const sendMessageOutputSchema = z.object({
  conversation: conversationSchema,
  message: messageSchema,
  messages: z.array(messageSchema),
});

export const publicWidgetInputSchema = z
  .object({ workspaceId: idSchema, host: embedHostSchema })
  .strict();
export const ownerPresentationSchema = z.object({
  name: z.string().min(1),
  avatarUrl: z.string().url().nullable(),
});
export const widgetConfigSchema = z.object({
  workspaceId: idSchema,
  businessName: z.string(),
  owner: ownerPresentationSchema,
  settings: widgetSettingsSchema.omit({
    allowedDomains: true,
    installedAt: true,
    avatarKey: true,
  }),
  agentAvailable: z.literal(false),
});
export const widgetStartInputSchema = publicWidgetInputSchema.extend({
  token: z.string().min(1).max(4096).optional(),
  visitId: idSchema,
  metadata: browserMetadataInputSchema,
});
export const widgetStartOutputSchema = z.object({
  token: z.string(),
  tokenExpiresAt: dateTimeSchema,
  visitor: visitorSchema,
  config: widgetConfigSchema,
  latestConversationId: idSchema.nullable(),
});
/** A page is messages ordered oldest-to-newest; nextCursor retrieves older messages. */
export const widgetHistoryInputSchema = z
  .object({ ...pageInputShape, conversationId: idSchema.optional() })
  .strict();
export const widgetHistoryOutputSchema = z.object({
  conversations: z.array(conversationSchema),
  messages: z.array(messageSchema),
  latestConversationId: idSchema.nullable(),
  nextCursor: cursorSchema.nullable(),
});
export const updateVisitorDetailsInputSchema = z
  .object({ visitId: idSchema, metadata: browserMetadataInputSchema })
  .strict();
export const ownerRealtimeInputSchema = z
  .object({
    room: z.discriminatedUnion("type", [
      z.object({ type: z.literal("workspace") }).strict(),
      z
        .object({ type: z.literal("conversation"), conversationId: idSchema })
        .strict(),
    ]),
  })
  .strict();
export const visitorRealtimeInputSchema = z
  .object({ conversationId: idSchema.optional() })
  .strict();
export const realtimeTokenOutputSchema = z.object({
  token: z.string(),
  expiresAt: dateTimeSchema,
  room: z.object({ type: z.enum(["workspace", "conversation"]), id: idSchema }),
});

export type Workspace = z.infer<typeof workspaceSchema>;
export type WidgetSettings = z.infer<typeof widgetSettingsSchema>;
export type WidgetAppearanceInput = z.infer<typeof widgetAppearanceInputSchema>;
export type SaveSettingsInput = z.infer<typeof saveSettingsInputSchema>;
export type Visitor = z.infer<typeof visitorSchema>;
export type VisitorDetails = z.infer<typeof visitorDetailsSchema>;
export type Conversation = z.infer<typeof conversationSchema>;
export type ConversationState = z.infer<typeof conversationStateSchema>;
export type Message = z.infer<typeof messageSchema>;
export type InboxConversation = z.infer<typeof inboxConversationSchema>;
export type WidgetConfig = z.infer<typeof widgetConfigSchema>;
export type OwnerPresentation = z.infer<typeof ownerPresentationSchema>;
export type BrowserMetadataInput = z.infer<typeof browserMetadataInputSchema>;
export type WidgetHistory = z.infer<typeof widgetHistoryOutputSchema>;
export type SendMessageOutput = z.infer<typeof sendMessageOutputSchema>;
