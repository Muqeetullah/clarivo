"use client";

import PartySocket from "partysocket";
import {
  conversationEventSchema,
  workspaceEventSchema,
  type ConversationEvent,
  type WorkspaceEvent,
} from "@clarivo/shared/realtime";
import type {
  Conversation,
  InboxConversation,
  Message,
} from "@clarivo/shared/schemas";

export type RealtimeStatus =
  "connecting" | "syncing" | "connected" | "disconnected";
type Room = { type: "workspace" | "conversation"; id: string };
export type RealtimeEvent = ConversationEvent | WorkspaceEvent;

export interface RealtimeConnectionOptions<Snapshot> {
  room: Room;
  host?: string;
  /** Must call the authorized API each time; do not cache admission tokens. */
  getToken: () => Promise<{ token: string; room: Room }>;
  /** Authoritative API read, after the socket opens. Respect the abort signal where possible. */
  loadSnapshot: (signal: AbortSignal) => Promise<Snapshot>;
  onSnapshot: (snapshot: Snapshot) => void;
  /** Reducers must ignore stale entity versions and merge messages by persisted id. */
  onEvent: (event: RealtimeEvent) => void;
  onStatus?: (status: RealtimeStatus) => void;
  onError?: (error: unknown) => void;
}

/** Subscribe -> snapshot -> replay closes the gap between a database read and room admission. */
export function createRealtimeConnection<Snapshot>(
  options: RealtimeConnectionOptions<Snapshot>,
) {
  const host = options.host ?? process.env.NEXT_PUBLIC_REALTIME_HOST;
  if (!host) {
    options.onStatus?.("disconnected");
    options.onError?.(new Error("Realtime delivery is not configured."));
    return {
      close() {},
      reconnect() {},
      sendTyping: (isTyping: boolean) => {
        void isTyping;
      },
    };
  }
  let closed = false;
  let generation = 0;
  let status: RealtimeStatus = "connecting";
  let snapshotAbort: AbortController | undefined;
  let buffered: RealtimeEvent[] = [];
  const seen = new Set<string>();
  const setStatus = (value: RealtimeStatus) => {
    status = value;
    options.onStatus?.(value);
  };
  const socket = new PartySocket({
    host,
    party: options.room.type,
    room: options.room.id,
    startClosed: true,
    maxEnqueuedMessages: 0, // Typing indicators have no meaning after a reconnect.
    maxReconnectionDelay: 10_000,
    query: async () => {
      const admission = await options.getToken();
      if (closed) throw new Error("Connection closed.");
      if (
        admission.room.type !== options.room.type ||
        admission.room.id !== options.room.id
      ) {
        throw new Error("The authorized room changed.");
      }
      return { token: admission.token };
    },
  });

  const apply = (event: RealtimeEvent) => {
    if ("eventId" in event && seen.has(event.eventId)) return;
    options.onEvent(event);
    if ("eventId" in event) {
      seen.add(event.eventId);
      if (seen.size > 2048) seen.delete(seen.values().next().value!);
    }
  };
  const recover = async () => {
    const current = ++generation;
    snapshotAbort?.abort();
    snapshotAbort = new AbortController();
    buffered = [];
    setStatus("syncing");
    try {
      const snapshot = await options.loadSnapshot(snapshotAbort.signal);
      if (closed || current !== generation) return;
      options.onSnapshot(snapshot);
      // All handlers run on the same JS thread: replay and becoming connected are atomic.
      for (const event of buffered) apply(event);
      buffered = [];
      setStatus("connected");
    } catch (error) {
      if (closed || current !== generation) return;
      options.onError?.(error);
      socket.reconnect();
    }
  };
  socket.addEventListener("open", () => {
    void recover();
  });
  socket.addEventListener("close", () => {
    generation++;
    snapshotAbort?.abort();
    buffered = [];
    if (!closed) setStatus("disconnected");
  });
  socket.addEventListener("error", () => {
    if (!closed) {
      setStatus("disconnected");
      // PartySocket errors can contain a token-bearing URL; expose only a safe message.
      options.onError?.(
        new Error("Realtime connection unavailable; retrying."),
      );
    }
  });
  socket.addEventListener("message", (message) => {
    if (closed || typeof message.data !== "string") return;
    let value: unknown;
    try {
      value = JSON.parse(message.data);
    } catch {
      return;
    }
    const parsed = (
      options.room.type === "workspace"
        ? workspaceEventSchema
        : conversationEventSchema
    ).safeParse(value);
    if (!parsed.success) return;
    const event = parsed.data;
    if (
      (options.room.type === "workspace" &&
        "workspaceId" in event &&
        event.workspaceId !== options.room.id) ||
      ("conversationId" in event && event.conversationId !== options.room.id)
    )
      return;
    if (status === "syncing") {
      if (event.type === "typing") return;
      // Bound transient memory. Overflow requires a new authoritative snapshot, never dropped data.
      if (buffered.length >= 2048) {
        socket.reconnect();
        return;
      }
      buffered.push(event);
    } else if (status === "connected") {
      try {
        apply(event);
      } catch (error) {
        options.onError?.(error);
        socket.reconnect();
      }
    }
  });
  setStatus("connecting");
  socket.reconnect();
  return {
    close() {
      closed = true;
      generation++;
      snapshotAbort?.abort();
      buffered = [];
      socket.close(1000, "View closed");
    },
    reconnect() {
      if (!closed) socket.reconnect();
    },
    sendTyping(isTyping: boolean) {
      if (
        !closed &&
        options.room.type === "conversation" &&
        status === "connected" &&
        socket.readyState === PartySocket.OPEN
      ) {
        socket.send(JSON.stringify({ type: "typing", isTyping }));
      }
    },
  };
}

/** A late snapshot or delayed event cannot roll a conversation state backwards. */
export function newestConversation(
  current: Conversation | null | undefined,
  incoming: Conversation,
): Conversation {
  return current && current.version > incoming.version ? current : incoming;
}

/** Optimistic retries and duplicate publications converge on persisted message ids. */
export function mergeMessages(
  current: readonly Message[],
  incoming: readonly Message[],
): Message[] {
  const byId = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) byId.set(message.id, message);
  return [...byId.values()].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}

export function mergeInboxItem(
  current: InboxConversation | undefined,
  incoming: InboxConversation,
): InboxConversation {
  if (!current) return incoming;
  const conversation = newestConversation(
    current.conversation,
    incoming.conversation,
  );
  const visitor =
    current.visitor.lastSeenAt > incoming.visitor.lastSeenAt
      ? current.visitor
      : incoming.visitor;
  const lastMessage =
    !incoming.lastMessage ||
    (current.lastMessage &&
      current.lastMessage.createdAt > incoming.lastMessage.createdAt)
      ? current.lastMessage
      : incoming.lastMessage;
  return { conversation, visitor, lastMessage };
}
