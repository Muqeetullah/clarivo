import { z } from "zod";
import {
  conversationSchema,
  dateTimeSchema,
  embedHostSchema,
  idSchema,
  inboxConversationSchema,
  messageSchema,
  widgetSettingsSchema,
} from "./schemas";

const eventEnvelope = {
  eventId: idSchema,
  workspaceId: idSchema,
  occurredAt: dateTimeSchema,
};

export const messageCreatedEventSchema = z
  .object({
    ...eventEnvelope,
    type: z.literal("message.created"),
    conversationId: idSchema,
    message: messageSchema,
    conversation: conversationSchema,
  })
  .strict()
  .refine(
    (event) =>
      event.conversationId === event.message.conversationId &&
      event.conversationId === event.conversation.id,
    "Conversation identifiers must agree.",
  );
export const conversationUpdatedEventSchema = z
  .object({
    ...eventEnvelope,
    type: z.literal("conversation.updated"),
    conversationId: idSchema,
    conversation: conversationSchema,
  })
  .strict()
  .refine(
    (event) => event.conversationId === event.conversation.id,
    "Conversation identifiers must agree.",
  );
export const inboxUpdatedEventSchema = z
  .object({
    ...eventEnvelope,
    type: z.literal("inbox.updated"),
    item: inboxConversationSchema,
    notificationMessage: messageSchema.optional(),
  })
  .strict();
export const settingsUpdatedEventSchema = z
  .object({
    ...eventEnvelope,
    type: z.literal("settings.updated"),
    settings: widgetSettingsSchema,
  })
  .strict();
/** Publish to affected conversation rooms after a domain removal; close matching visitor sockets. */
export const accessRevokedEventSchema = z
  .object({
    ...eventEnvelope,
    type: z.literal("access.revoked"),
    hosts: z.array(embedHostSchema),
  })
  .strict();

export const clientTypingEventSchema = z
  .object({ type: z.literal("typing"), isTyping: z.boolean() })
  .strict();
export const typingEventSchema = z
  .object({
    type: z.literal("typing"),
    conversationId: idSchema,
    role: z.enum(["owner", "visitor"]),
    isTyping: z.boolean(),
  })
  .strict();
/** Only these persisted server events may be published into a conversation room. */
export const conversationPublishEventSchema = z.union([
  messageCreatedEventSchema,
  conversationUpdatedEventSchema,
  accessRevokedEventSchema,
]);
export const conversationEventSchema = z.union([
  conversationPublishEventSchema,
  typingEventSchema,
]);
export const workspaceEventSchema = z.union([
  inboxUpdatedEventSchema,
  settingsUpdatedEventSchema,
]);
export const serverEventSchema = z.union([
  conversationPublishEventSchema,
  workspaceEventSchema,
]);

export const visitorTokenClaimsSchema = z
  .object({
    aud: z.literal("widget"),
    sub: idSchema,
    wid: idSchema,
    host: embedHostSchema,
    vsk: z.string().min(32).max(128),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().positive(),
  })
  .strict();
const realtimeClaimsBase = {
  aud: z.literal("realtime"),
  sub: z.string().min(1).max(256),
  workspaceId: idSchema,
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
};
/** Runtime union prevents a visitor token from ever authorizing a workspace room. */
export const realtimeTokenClaimsSchema = z.union([
  z
    .object({
      ...realtimeClaimsBase,
      role: z.literal("owner"),
      roomType: z.literal("workspace"),
      roomId: idSchema,
    })
    .strict()
    .refine(
      (claims) => claims.roomId === claims.workspaceId,
      "Room identifiers must agree.",
    ),
  z
    .object({
      ...realtimeClaimsBase,
      role: z.literal("owner"),
      roomType: z.literal("conversation"),
      roomId: idSchema,
      conversationId: idSchema,
    })
    .strict()
    .refine(
      (claims) => claims.roomId === claims.conversationId,
      "Room identifiers must agree.",
    ),
  z
    .object({
      ...realtimeClaimsBase,
      role: z.literal("visitor"),
      roomType: z.literal("conversation"),
      roomId: idSchema,
      conversationId: idSchema,
      host: embedHostSchema,
    })
    .strict()
    .refine(
      (claims) => claims.roomId === claims.conversationId,
      "Room identifiers must agree.",
    ),
]);

/** Parent and iframe messages must also verify event.source and exact event.origin. */
export const embedParentMessageSchema = z
  .object({
    type: z.literal("clarivo:context"),
    workspaceId: idSchema,
    host: embedHostSchema,
    page: z.string().max(2048),
    referrer: z.string().max(2048),
    visitId: idSchema,
  })
  .strict();
export const embedWidgetMessageSchema = z.union([
  z.object({ type: z.literal("clarivo:ready") }).strict(),
  z.object({ type: z.literal("clarivo:close") }).strict(),
  z
    .object({
      type: z.literal("clarivo:unread"),
      count: z.number().int().min(0).max(9999),
    })
    .strict(),
]);
export type ServerEvent = z.infer<typeof serverEventSchema>;
export type WorkspaceEvent = z.infer<typeof workspaceEventSchema>;
export type ConversationEvent = z.infer<typeof conversationEventSchema>;
export type ConversationPublishEvent = z.infer<
  typeof conversationPublishEventSchema
>;
export type ClientTypingEvent = z.infer<typeof clientTypingEventSchema>;
export type RealtimeTokenClaims = z.infer<typeof realtimeTokenClaimsSchema>;
export type VisitorTokenClaims = z.infer<typeof visitorTokenClaimsSchema>;
export type EmbedParentMessage = z.infer<typeof embedParentMessageSchema>;
export type EmbedWidgetMessage = z.infer<typeof embedWidgetMessageSchema>;

export const embedAppearanceMessageSchema = z.object({
  type: z.literal("clarivo:appearance"),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/iu),
  position: z.enum(["left", "right"]),
}).strict();
