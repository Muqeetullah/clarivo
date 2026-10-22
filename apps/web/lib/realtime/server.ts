import "server-only";

import { SignJWT } from "jose";
import {
  conversationPublishEventSchema,
  realtimeTokenClaimsSchema,
  workspaceEventSchema,
  type RealtimeTokenClaims,
  type ServerEvent,
} from "@clarivo/shared/realtime";
import { REALTIME_TOKEN_LIFETIME_SECONDS } from "@clarivo/shared/schemas";

type WithoutRegisteredClaims<T> = T extends RealtimeTokenClaims
  ? Omit<T, "aud" | "iat" | "exp">
  : never;
export type RealtimeAdmission = WithoutRegisteredClaims<RealtimeTokenClaims>;
export type RealtimeRoom = { type: "workspace" | "conversation"; id: string };

function realtimeKey() {
  const secret = process.env.REALTIME_TOKEN_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("REALTIME_TOKEN_SECRET must contain at least 32 bytes.");
  }
  if (
    secret === process.env.VISITOR_TOKEN_SECRET ||
    secret === process.env.REALTIME_PUBLISH_SECRET
  ) {
    throw new Error(
      "Realtime signing, visitor signing, and publishing require separate secrets.",
    );
  }
  return new TextEncoder().encode(secret);
}

/** Call only after server-side owner membership / visitor conversation authorization. */
export async function issueRealtimeToken(input: RealtimeAdmission) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const claims = realtimeTokenClaimsSchema.parse({
    ...input,
    aud: "realtime",
    iat: issuedAt,
    exp: issuedAt + REALTIME_TOKEN_LIFETIME_SECONDS,
  });
  if (claims.roomType === "workspace" && claims.roomId !== claims.workspaceId) {
    throw new Error("Workspace room must match the authorized workspace.");
  }
  const token = await new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .sign(realtimeKey());
  return {
    token,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
    room: { type: claims.roomType, id: claims.roomId },
  };
}

/** Best effort, after commit. A provider failure must never turn a saved write into a failed send. */
export async function publishRealtimeEvent(
  room: RealtimeRoom,
  event: ServerEvent,
): Promise<boolean> {
  try {
    const parsed = (
      room.type === "workspace"
        ? workspaceEventSchema
        : conversationPublishEventSchema
    ).parse(event);
    if (
      (room.type === "workspace" && parsed.workspaceId !== room.id) ||
      ("conversationId" in parsed && parsed.conversationId !== room.id)
    ) {
      throw new Error("Event does not belong to the target room.");
    }
    const origin = process.env.REALTIME_URL;
    const secret = process.env.REALTIME_PUBLISH_SECRET;
    if (
      !origin ||
      !secret ||
      Buffer.byteLength(secret) < 32 ||
      secret === process.env.REALTIME_TOKEN_SECRET
    ) {
      throw new Error(
        "Realtime publishing is not configured with a separate secret.",
      );
    }
    const url = new URL(
      `/parties/${room.type}/${encodeURIComponent(room.id)}`,
      origin,
    );
    if (
      url.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
    ) {
      throw new Error(
        "Realtime publishing requires HTTPS outside local development.",
      );
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify(parsed),
      signal: AbortSignal.timeout(2500),
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok) throw new Error(`Worker returned ${response.status}.`);
    return true;
  } catch (error) {
    // Do not log tokens, payloads, message bodies, or provider URLs with credentials.
    console.warn("Realtime delivery failed after persistence.", {
      roomType: room.type,
      eventId: event.eventId,
      reason:
        error instanceof Error && error.name === "TimeoutError"
          ? "timeout"
          : "publish_failed",
    });
    return false;
  }
}
