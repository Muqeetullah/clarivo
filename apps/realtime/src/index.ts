import { jwtVerify } from "jose";
import {
  routePartykitRequest,
  Server,
  type Connection,
  type ConnectionContext,
} from "partyserver";
import {
  clientTypingEventSchema,
  conversationPublishEventSchema,
  realtimeTokenClaimsSchema,
  workspaceEventSchema,
  type RealtimeTokenClaims,
} from "@clarivo/shared/realtime";
import {
  idSchema,
  REALTIME_TOKEN_LIFETIME_SECONDS,
} from "@clarivo/shared/schemas";

export interface Env {
  Workspace: DurableObjectNamespace<Workspace>;
  Conversation: DurableObjectNamespace<Conversation>;
  REALTIME_TOKEN_SECRET: string;
  REALTIME_PUBLISH_SECRET: string;
}

const TRUSTED_CLAIMS_HEADER = "x-clarivo-claims";
const MAX_PUBLISH_BYTES = 256 * 1024;
const encoder = new TextEncoder();

function strippedRequest(request: Request) {
  const headers = new Headers(request.headers);
  for (const name of [...headers.keys()]) {
    if (name.toLowerCase().startsWith("x-clarivo-")) headers.delete(name);
  }
  return new Request(request, { headers });
}

function configured(env: Env) {
  return (
    typeof env.REALTIME_TOKEN_SECRET === "string" &&
    typeof env.REALTIME_PUBLISH_SECRET === "string" &&
    encoder.encode(env.REALTIME_TOKEN_SECRET).byteLength >= 32 &&
    encoder.encode(env.REALTIME_PUBLISH_SECRET).byteLength >= 32 &&
    env.REALTIME_TOKEN_SECRET !== env.REALTIME_PUBLISH_SECRET
  );
}

async function publisherAuthorized(request: Request, env: Env) {
  const authorization = request.headers.get("authorization") ?? "";
  if (
    !configured(env) ||
    !authorization.startsWith("Bearer ") ||
    authorization.length > 4096
  )
    return false;
  // Hash to fixed-length buffers before the Workers constant-time comparison.
  const [actual, expected] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(authorization.slice(7))),
    crypto.subtle.digest(
      "SHA-256",
      encoder.encode(env.REALTIME_PUBLISH_SECRET),
    ),
  ]);
  return crypto.subtle.timingSafeEqual(actual, expected);
}

async function admit(
  request: Request,
  room: { party: string; name: string },
  env: Env,
) {
  const token = new URL(request.url).searchParams.get("token");
  if (!configured(env))
    return new Response("Realtime is not configured.", { status: 503 });
  if (!token || token.length > 4096)
    return new Response("Unauthorized", { status: 401 });
  let claims: RealtimeTokenClaims;
  try {
    const { payload } = await jwtVerify(
      token,
      encoder.encode(env.REALTIME_TOKEN_SECRET),
      {
        algorithms: ["HS256"],
        audience: "realtime",
        maxTokenAge: REALTIME_TOKEN_LIFETIME_SECONDS,
        requiredClaims: ["sub", "iat", "exp"],
      },
    );
    claims = realtimeTokenClaimsSchema.parse(payload);
    const now = Math.floor(Date.now() / 1000);
    if (
      claims.exp - claims.iat > REALTIME_TOKEN_LIFETIME_SECONDS ||
      claims.exp <= claims.iat ||
      claims.iat > now
    ) {
      return new Response("Unauthorized", { status: 401 });
    }
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }
  if (
    claims.roomType !== room.party ||
    claims.roomId !== room.name ||
    (room.party === "workspace" &&
      (claims.role !== "owner" || claims.workspaceId !== room.name))
  ) {
    return new Response("Forbidden", { status: 403 });
  }
  const headers = new Headers(request.headers);
  headers.set(TRUSTED_CLAIMS_HEADER, JSON.stringify(claims));
  // The admission credential is no longer needed past this edge; don't forward it to a room.
  const url = new URL(request.url);
  url.searchParams.delete("token");
  return new Request<unknown, CfProperties>(
    url,
    new Request(request, { headers }),
  );
}

async function boundedJson(request: Request): Promise<unknown> {
  const declared = request.headers.get("content-length");
  if (
    declared !== null &&
    (!/^\d+$/u.test(declared) || Number(declared) > MAX_PUBLISH_BYTES)
  ) {
    throw new Response("Payload too large", { status: 413 });
  }
  if (!request.body) throw new Response("Missing body", { status: 400 });
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_PUBLISH_BYTES) {
      await reader.cancel();
      throw new Response("Payload too large", { status: 413 });
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(body),
    );
  } catch {
    throw new Response("Invalid JSON", { status: 400 });
  }
}

abstract class AuthorizedRoom extends Server<Env> {
  static options = { hibernate: true };
  abstract readonly roomType: "workspace" | "conversation";

  private liveClaims(connection: Connection<RealtimeTokenClaims>) {
    const claims = connection.state;
    if (
      !claims ||
      claims.exp * 1000 <= Date.now() ||
      claims.roomType !== this.roomType ||
      claims.roomId !== this.name
    ) {
      connection.close(4001, "Fresh authorization required");
      return null;
    }
    return claims;
  }

  async onConnect(
    connection: Connection<RealtimeTokenClaims>,
    context: ConnectionContext,
  ) {
    try {
      const claims = realtimeTokenClaimsSchema.parse(
        JSON.parse(
          context.request.headers.get(TRUSTED_CLAIMS_HEADER) ?? "null",
        ),
      );
      connection.setState(claims);
      if (!this.liveClaims(connection)) return;
      await this.scheduleExpiry();
    } catch {
      connection.close(1008, "Unauthorized");
    }
  }

  /** Alarms survive hibernation. Every admission expires with its 60-second token. */
  private async scheduleExpiry() {
    let next = Infinity;
    for (const connection of this.getConnections<RealtimeTokenClaims>()) {
      const claims = this.liveClaims(connection);
      if (claims) next = Math.min(next, claims.exp * 1000);
    }
    if (Number.isFinite(next)) await this.ctx.storage.setAlarm(next);
    else await this.ctx.storage.deleteAlarm();
  }

  async onAlarm() {
    await this.scheduleExpiry();
  }

  onMessage(
    connection: Connection<RealtimeTokenClaims>,
    message: string | ArrayBuffer,
  ) {
    const claims = this.liveClaims(connection);
    if (!claims) return;
    if (
      this.roomType !== "conversation" ||
      typeof message !== "string" ||
      encoder.encode(message).byteLength > 256
    ) {
      connection.close(1008, "Only conversation typing is permitted");
      return;
    }
    let value: unknown;
    try {
      value = JSON.parse(message);
    } catch {
      connection.close(1008, "Invalid event");
      return;
    }
    const parsed = clientTypingEventSchema.safeParse(value);
    if (!parsed.success) {
      connection.close(1008, "Invalid event");
      return;
    }
    this.deliver(
      JSON.stringify({
        ...parsed.data,
        conversationId: this.name,
        role: claims.role,
      }),
      claims.workspaceId,
      connection.id,
    );
  }

  private deliver(message: string, workspaceId: string, exclude?: string) {
    for (const connection of this.getConnections<RealtimeTokenClaims>()) {
      const claims = this.liveClaims(connection);
      if (
        claims &&
        claims.workspaceId === workspaceId &&
        connection.id !== exclude
      )
        connection.send(message);
    }
  }

  async onRequest(request: Request) {
    if (request.method !== "POST")
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "POST" },
      });
    if (!(await publisherAuthorized(request, this.env)))
      return new Response("Unauthorized", { status: 401 });
    if (
      request.headers.get("content-type")?.split(";", 1)[0].trim() !==
      "application/json"
    ) {
      return new Response("Expected application/json", { status: 415 });
    }
    let body: unknown;
    try {
      body = await boundedJson(request);
    } catch (error) {
      return error instanceof Response
        ? error
        : new Response("Invalid body", { status: 400 });
    }
    const parsed = (
      this.roomType === "workspace"
        ? workspaceEventSchema
        : conversationPublishEventSchema
    ).safeParse(body);
    if (!parsed.success) return new Response("Invalid event", { status: 400 });
    const event = parsed.data;
    if (
      (this.roomType === "workspace" && event.workspaceId !== this.name) ||
      ("conversationId" in event && event.conversationId !== this.name)
    ) {
      return new Response("Wrong room", { status: 403 });
    }
    if (event.type === "access.revoked") {
      for (const connection of this.getConnections<RealtimeTokenClaims>()) {
        const claims = this.liveClaims(connection);
        if (
          claims?.role === "visitor" &&
          claims.workspaceId === event.workspaceId &&
          event.hosts.includes(claims.host)
        ) {
          connection.close(4003, "Embedding access revoked");
        }
      }
    } else {
      this.deliver(JSON.stringify(event), event.workspaceId);
    }
    return new Response(null, { status: 202 });
  }
}

export class Workspace extends AuthorizedRoom {
  readonly roomType = "workspace" as const;
}
export class Conversation extends AuthorizedRoom {
  readonly roomType = "conversation" as const;
}

export default {
  async fetch(incoming: Request, env: Env): Promise<Response> {
    const url = new URL(incoming.url);
    if (url.pathname === "/health" && incoming.method === "GET") {
      return Response.json({
        service: "clarivo-realtime",
        configured: configured(env),
      });
    }
    const route = /^\/parties\/(workspace|conversation)\/([^/]+)$/u.exec(
      url.pathname,
    );
    if (!route || !idSchema.safeParse(route[2]).success)
      return new Response("Not found", { status: 404 });
    const request = strippedRequest(incoming);
    return (
      (await routePartykitRequest(request, env, {
        onBeforeConnect: (request, room) => admit(request, room, env),
        onBeforeRequest: async (request) =>
          (await publisherAuthorized(request, env))
            ? request
            : new Response("Unauthorized", { status: 401 }),
      })) ?? new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
