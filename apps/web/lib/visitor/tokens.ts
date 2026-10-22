import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import {
  VISITOR_TOKEN_LIFETIME_SECONDS,
  idSchema,
  normalizeEmbedHost,
} from "@clarivo/shared";

function signingKey() {
  const secret = process.env.VISITOR_TOKEN_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32)
    throw new Error("VISITOR_TOKEN_SECRET must contain at least 32 bytes.");
  return new TextEncoder().encode(secret);
}
export function newVisitorSecret() {
  return randomBytes(32).toString("base64url");
}
export function hashVisitorSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
export function matchesVisitorSecret(value: string, hash: string) {
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(hashVisitorSecret(value), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export async function issueVisitorToken(
  visitorId: string,
  workspaceId: string,
  host: string,
  secret: string,
) {
  const expires =
    Math.floor(Date.now() / 1000) + VISITOR_TOKEN_LIFETIME_SECONDS;
  const token = await new SignJWT({ wid: workspaceId, host, vsk: secret })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("widget")
    .setSubject(visitorId)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(signingKey());
  return { token, tokenExpiresAt: new Date(expires * 1000).toISOString() };
}
export async function readVisitorToken(token: string) {
  const { payload } = await jwtVerify(token, signingKey(), {
    algorithms: ["HS256"],
    audience: "widget",
    requiredClaims: ["sub", "wid", "host", "vsk", "iat", "exp"],
  });
  const visitorId = idSchema.parse(payload.sub);
  const workspaceId = idSchema.parse(payload.wid);
  if (
    typeof payload.host !== "string" ||
    typeof payload.vsk !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(payload.vsk)
  )
    throw new Error("Invalid visitor claims.");
  return {
    visitorId,
    workspaceId,
    host: normalizeEmbedHost(payload.host),
    secret: payload.vsk,
    issuedAt: payload.iat!,
    expiresAt: payload.exp!,
  };
}
