import { oc } from "@orpc/contract";
import { openapi } from "@orpc/openapi";
import { z } from "zod";
import {
  avatarUploadSchema,
  confirmAvatarUploadInputSchema,
  conversationDetailSchema,
  conversationIdInputSchema,
  conversationSchema,
  createAvatarUploadInputSchema,
  emptyInputSchema,
  inboxGetInputSchema,
  inboxListInputSchema,
  inboxListOutputSchema,
  onboardInputSchema,
  ownerRealtimeInputSchema,
  ownerSendInputSchema,
  publicWidgetInputSchema,
  realtimeTokenOutputSchema,
  removeAvatarInputSchema,
  saveSettingsInputSchema,
  sendMessageOutputSchema,
  updateVisitorDetailsInputSchema,
  visitorRealtimeInputSchema,
  visitorSchema,
  visitorSendInputSchema,
  widgetConfigSchema,
  widgetHistoryInputSchema,
  widgetHistoryOutputSchema,
  widgetSettingsSchema,
  widgetStartInputSchema,
  widgetStartOutputSchema,
  workspaceOutputSchema,
  workspaceSchema,
} from "./schemas";

/** Errors contain only safe UI data; never database/provider exception details. */
export const apiErrors = {
  UNAUTHORIZED: { status: 401, message: "Sign in to continue." },
  FORBIDDEN: {
    status: 403,
    message: "You do not have access to this resource.",
  },
  NOT_FOUND: { status: 404, message: "This resource was not found." },
  BAD_REQUEST: { status: 400, message: "Check the supplied details." },
  CONFLICT: {
    status: 409,
    message: "This resource changed. Reload it and try again.",
  },
  ONBOARDING_REQUIRED: {
    status: 403,
    message: "Complete business setup to continue.",
  },
  CONVERSATION_CLOSED: { status: 409, message: "This conversation is closed." },
  INVALID_UPLOAD: {
    status: 400,
    message: "Choose a PNG, JPEG, WebP or GIF image up to 2 MB.",
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: "This service is temporarily unavailable. Try again.",
  },
} as const;

const base = oc.errors(apiErrors);

/** Every owner procedure derives its workspace from the verified session/membership. */
export const contract = {
  workspace: {
    get: base
      .meta(
        openapi({
          method: "GET",
          path: "/workspace",
          summary: "Read the owner's workspace or onboarding status",
          tags: ["Workspace"],
        }),
      )
      .input(emptyInputSchema)
      .output(workspaceOutputSchema),
    onboard: base
      .meta(
        openapi({
          method: "POST",
          path: "/workspace",
          summary: "Idempotently create the owner's first workspace",
          tags: ["Workspace"],
        }),
      )
      .input(onboardInputSchema)
      .output(z.object({ workspace: workspaceSchema })),
  },
  settings: {
    get: base
      .meta(
        openapi({
          method: "GET",
          path: "/settings",
          summary: "Read saved widget settings",
          tags: ["Settings"],
        }),
      )
      .input(emptyInputSchema)
      .output(widgetSettingsSchema),
    save: base
      .meta(
        openapi({
          method: "PUT",
          path: "/settings",
          summary: "Save widget appearance and exact allowed domains",
          tags: ["Settings"],
        }),
      )
      .input(saveSettingsInputSchema)
      .output(widgetSettingsSchema),
    createAvatarUpload: base
      .meta(
        openapi({
          method: "POST",
          path: "/settings/avatar/uploads",
          summary: "Create a protected short-lived avatar upload",
          tags: ["Settings"],
        }),
      )
      .input(createAvatarUploadInputSchema)
      .output(avatarUploadSchema),
    confirmAvatarUpload: base
      .meta(
        openapi({
          method: "POST",
          path: "/settings/avatar/confirm",
          summary: "Validate and attach a pending avatar upload",
          tags: ["Settings"],
        }),
      )
      .input(confirmAvatarUploadInputSchema)
      .output(widgetSettingsSchema),
    removeAvatar: base
      .meta(
        openapi({
          method: "DELETE",
          path: "/settings/avatar",
          summary: "Remove the expected current avatar",
          tags: ["Settings"],
        }),
      )
      .input(removeAvatarInputSchema)
      .output(widgetSettingsSchema),
  },
  inbox: {
    list: base
      .meta(
        openapi({
          method: "GET",
          path: "/inbox",
          summary: "Search and filter conversations with waiting first",
          tags: ["Inbox"],
        }),
      )
      .input(inboxListInputSchema)
      .output(inboxListOutputSchema),
    get: base
      .meta(
        openapi({
          method: "GET",
          path: "/inbox/{conversationId}",
          summary: "Read a conversation, visitor details, and message page",
          tags: ["Inbox"],
        }),
      )
      .input(inboxGetInputSchema)
      .output(conversationDetailSchema),
    sendMessage: base
      .meta(
        openapi({
          method: "POST",
          path: "/inbox/{conversationId}/messages",
          summary: "Persist an idempotent owner reply and take over atomically",
          tags: ["Inbox"],
        }),
      )
      .input(ownerSendInputSchema)
      .output(sendMessageOutputSchema),
    takeover: base
      .meta(
        openapi({
          method: "POST",
          path: "/inbox/{conversationId}/takeover",
          summary: "Take over an open conversation",
          tags: ["Inbox"],
        }),
      )
      .input(conversationIdInputSchema)
      .output(conversationSchema),
    close: base
      .meta(
        openapi({
          method: "POST",
          path: "/inbox/{conversationId}/close",
          summary: "Close a conversation idempotently",
          tags: ["Inbox"],
        }),
      )
      .input(conversationIdInputSchema)
      .output(conversationSchema),
  },
  widget: {
    config: base
      .meta(
        openapi({
          method: "GET",
          path: "/widget/config",
          summary: "Read public appearance for an allowed embed host",
          tags: ["Widget"],
        }),
      )
      .input(publicWidgetInputSchema)
      .output(widgetConfigSchema),
    start: base
      .meta(
        openapi({
          method: "POST",
          path: "/widget/start",
          summary: "Create or restore an allowed-host visitor session",
          tags: ["Widget"],
        }),
      )
      .input(widgetStartInputSchema)
      .output(widgetStartOutputSchema),
    history: base
      .meta(
        openapi({
          method: "GET",
          path: "/widget/history",
          summary:
            "Restore the authenticated visitor's current and closed history",
          tags: ["Widget"],
        }),
      )
      .input(widgetHistoryInputSchema)
      .output(widgetHistoryOutputSchema),
    sendMessage: base
      .meta(
        openapi({
          method: "POST",
          path: "/widget/messages",
          summary:
            "Persist an idempotent visitor message, starting a waiting conversation if needed",
          tags: ["Widget"],
        }),
      )
      .input(visitorSendInputSchema)
      .output(sendMessageOutputSchema),
    updateDetails: base
      .meta(
        openapi({
          method: "PUT",
          path: "/widget/details",
          summary:
            "Record bounded browser details and a deduplicated page visit",
          tags: ["Widget"],
        }),
      )
      .input(updateVisitorDetailsInputSchema)
      .output(visitorSchema),
    getRealtimeToken: base
      .meta(
        openapi({
          method: "POST",
          path: "/widget/realtime-token",
          summary: "Authorize this visitor's conversation subscription",
          tags: ["Realtime"],
        }),
      )
      .input(visitorRealtimeInputSchema)
      .output(realtimeTokenOutputSchema),
  },
  realtime: {
    getToken: base
      .meta(
        openapi({
          method: "POST",
          path: "/realtime/token",
          summary:
            "Authorize an owner's workspace or owned conversation subscription",
          tags: ["Realtime"],
        }),
      )
      .input(ownerRealtimeInputSchema)
      .output(realtimeTokenOutputSchema),
  },
};

export type Contract = typeof contract;
