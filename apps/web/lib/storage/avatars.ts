import "server-only";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";
import { MAX_AVATAR_BYTES, avatarMimeSchema } from "@clarivo/shared";
import * as db from "@clarivo/db/app";

const bucket = "profile-images";
function config() {
  const {
    STORAGE_ENDPOINT,
    STORAGE_ACCESS_KEY_ID,
    STORAGE_SECRET_ACCESS_KEY,
    STORAGE_PUBLIC_BASE_URL,
  } = process.env;
  if (
    !STORAGE_ENDPOINT ||
    !STORAGE_ACCESS_KEY_ID ||
    !STORAGE_SECRET_ACCESS_KEY ||
    !STORAGE_PUBLIC_BASE_URL
  )
    throw new Error("Avatar storage is not configured.");
  return {
    endpoint: STORAGE_ENDPOINT,
    publicBase: STORAGE_PUBLIC_BASE_URL.replace(/\/$/u, ""),
    credentials: {
      accessKeyId: STORAGE_ACCESS_KEY_ID,
      secretAccessKey: STORAGE_SECRET_ACCESS_KEY,
    },
  };
}
function client() {
  const settings = config();
  return new S3Client({
    endpoint: settings.endpoint,
    region: process.env.STORAGE_REGION ?? "us-east-2",
    credentials: settings.credentials,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}
export function avatarUrl(key: string | null) {
  return key
    ? `${config().publicBase}/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`
    : null;
}
async function retire(key: string | null) {
  if (!key) return;
  try {
    await client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    console.warn("avatar_retire_failed");
  }
}
export async function createAvatarUpload(
  workspaceId: string,
  input: { mime: string; size: number },
) {
  const mime = avatarMimeSchema.parse(input.mime);
  if (input.size <= 0 || input.size > MAX_AVATAR_BYTES)
    throw new Error("Invalid avatar size.");
  const id = randomUUID();
  const ext = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  }[mime];
  const key = `workspaces/${workspaceId}/agent-avatar/${id}.${ext}`;
  const expiresAt = new Date(Date.now() + 120_000).toISOString();
  const headers = {
    "Content-Type": mime,
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  const putUrl = await getSignedUrl(
    client(),
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mime,
      CacheControl: headers["Cache-Control"],
    }),
    { expiresIn: 120 },
  );
  await db.createPendingAvatar(workspaceId, {
    id,
    key,
    mime,
    size: input.size,
    expiresAt,
  });
  return { uploadId: id, putUrl, headers, expiresAt };
}
export async function confirmAvatarUpload(
  workspaceId: string,
  uploadId: string,
) {
  const pending = await db.getPendingAvatar(workspaceId, uploadId);
  if (!pending) throw new Error("Unknown avatar upload.");
  if (pending.confirmed) return db.getSettings(workspaceId);
  if (!pending.key.startsWith(`workspaces/${workspaceId}/agent-avatar/`))
    throw new Error("Invalid avatar key.");
  let validatedBytes: Buffer;
  try {
    const object = await client().send(
      new GetObjectCommand({ Bucket: bucket, Key: pending.key }),
      { abortSignal: AbortSignal.timeout(10_000) },
    );
    if (
      !object.ContentLength ||
      object.ContentLength > MAX_AVATAR_BYTES ||
      object.ContentLength !== pending.size ||
      object.ContentType !== pending.mime ||
      !object.Body
    )
      throw new Error("Invalid avatar object.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for await (const chunk of object.Body as AsyncIterable<Uint8Array>) {
      size += chunk.byteLength;
      if (size > MAX_AVATAR_BYTES) throw new Error("Avatar too large.");
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    validatedBytes = bytes;
    const image = sharp(bytes, {
      limitInputPixels: 16_000_000,
      animated: false,
    });
    const metadata = await image.metadata();
    const formats: Record<string, string> = {
      png: "image/png",
      jpeg: "image/jpeg",
      webp: "image/webp",
      gif: "image/gif",
    };
    const actualMime = formats[metadata.format ?? ""];
    if (actualMime !== pending.mime || !metadata.width || !metadata.height)
      throw new Error("Invalid image content.");
    // Decode the pixels as well as inspecting headers; a claimed MIME type is insufficient.
    await image.resize({ width: 1, height: 1 }).raw().toBuffer();
  } catch {
    await retire(pending.key);
    throw new Error("Invalid avatar upload.");
  }
  const finalKey = `workspaces/${workspaceId}/agent-avatar/${randomUUID()}.${pending.key.split(".").at(-1)}`;
  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: finalKey,
      Body: validatedBytes,
      ContentType: pending.mime,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  let result;
  try {
    result = await db.attachAvatar(workspaceId, uploadId, finalKey);
  } catch (error) {
    await retire(finalKey);
    throw error;
  }
  if (result.settings.avatarKey !== finalKey) await retire(finalKey);
  await retire(result.previousKey);
  await retire(pending.key);
  return result.settings;
}
export async function removeAvatar(
  workspaceId: string,
  expectedAvatarKey: string | null,
) {
  const result = await db.removeAvatar(workspaceId, expectedAvatarKey);
  await retire(result.previousKey);
  return result.settings;
}
