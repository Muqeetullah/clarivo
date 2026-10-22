"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import {
  collectBrowserMetadata,
  embedParentMessageSchema,
  type WidgetSettings,
  type WidgetHistory,
  type EmbedParentMessage,
  type OwnerPresentation,
} from "@clarivo/shared";
import { createClient } from "@/lib/rpc/client";
import {
  createRealtimeConnection,
  mergeMessages,
  newestConversation,
} from "@/lib/realtime/client";
import styles from "./chat.module.css";
import { PersonAvatar } from "@/components/connected/avatar";
import { foreground } from "@/components/connected/preview";
import { ChatBody } from "@/components/chat-body";
import { useMessageNotifications } from "@/lib/notifications/use-message-notifications";

function mergeHistorySnapshot(
  previous: WidgetHistory | undefined,
  snapshot: WidgetHistory,
): WidgetHistory {
  if (!previous) return snapshot;
  const conversations = new Map(
    snapshot.conversations.map((conversation) => [
      conversation.id,
      conversation,
    ]),
  );
  for (const conversation of previous.conversations)
    conversations.set(
      conversation.id,
      newestConversation(
        conversation,
        conversations.get(conversation.id) ?? conversation,
      ),
    );
  const ordered = [...conversations.values()].sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  );
  // Rebuild pagination from the latest authoritative page, while keeping sends
  // acknowledged after that read (including messages with tied timestamps).
  return {
    ...snapshot,
    conversations: ordered,
    latestConversationId: ordered[0]?.id ?? null,
    messages: mergeMessages(
      snapshot.messages,
      previous.messages.filter(
        (message) =>
          message.createdAt >= (snapshot.messages.at(-1)?.createdAt ?? ""),
      ),
    ),
  };
}

export function WidgetChat(props: {
  workspaceId: string;
  host: string;
  parentOrigin: string;
  settings: WidgetSettings;
  owner: OwnerPresentation;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1 }, mutations: { retry: false } },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <Chat {...props} />
    </QueryClientProvider>
  );
}
function Chat({
  workspaceId,
  host,
  parentOrigin,
  settings,
  owner: initialOwner,
}: {
  workspaceId: string;
  host: string;
  parentOrigin: string;
  settings: WidgetSettings;
  owner: OwnerPresentation;
}) {
  const [owner, setOwner] = useState(initialOwner);
  const queryClient = useQueryClient();
  const transcript = useRef<HTMLElement | null>(null);
  const followLatest = useRef(true);
  const olderAnchor = useRef<{ height: number; top: number } | null>(null);
  const [credentials] = useState<{ token?: string }>(() => ({}));
  const starting = useRef(false);
  const parentContext = useRef<EmbedParentMessage | null>(null);
  const liveSocket = useRef<ReturnType<
    typeof createRealtimeConnection<WidgetHistory>
  > | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [session, setSession] = useState(false);
  const [error, setError] = useState("");
  const [storageLimited, setStorageLimited] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const historyGeneration = useRef(0);
  const olderRequest = useRef<AbortController | null>(null);
  const [status, setStatus] = useState("connecting");
  const [typing, setTyping] = useState(false);
  const retrySend = useRef<
    { body: string; clientMessageId: string } | undefined
  >(undefined);
  const [client] = useState(() => createClient(() => credentials.token));
  const api = useMemo(() => createTanstackQueryUtils(client), [client]);
  const historyKey = useMemo(
    () => api.widget.history.queryKey({ input: { limit: 100 } }),
    [api],
  );
  const cancelOlder = useCallback(() => {
    historyGeneration.current++;
    olderRequest.current?.abort();
  }, []);
  useEffect(() => () => cancelOlder(), [cancelOlder]);
  const historyOptions = api.widget.history.queryOptions({
    input: { limit: 100 },
  });
  const history = useQuery({
    ...historyOptions,
    queryFn: async ({ signal }) => {
      cancelOlder();
      const snapshot = await client.widget.history({ limit: 100 }, { signal });
      return mergeHistorySnapshot(
        queryClient.getQueryData<WidgetHistory>(historyKey),
        snapshot,
      );
    },
    enabled:
      session && !sending && status !== "connected" && status !== "syncing",
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useLayoutEffect(() => {
    const element = transcript.current;
    if (!element) return;
    if (olderAnchor.current) {
      element.scrollTop =
        olderAnchor.current.top +
        element.scrollHeight -
        olderAnchor.current.height;
      olderAnchor.current = null;
    } else if (followLatest.current) element.scrollTop = element.scrollHeight;
  }, [history.data?.messages]);
  const key = `clarivo:visitor:${workspaceId}:${host}`;
  const tellParent = useCallback(
    (message: object) => window.parent.postMessage(message, parentOrigin),
    [parentOrigin],
  );
  const onUnread = useCallback(
    (count: number) => tellParent({ type: "clarivo:unread", count }),
    [tellParent],
  );
  const { notify } = useMessageNotifications(onUnread);
  useEffect(() => {
    tellParent({
      type: "clarivo:appearance",
      accentColor: settings.accentColor,
      position: settings.position,
    });
    tellParent({ type: "clarivo:ready" });
    const start = async (context: EmbedParentMessage) => {
      if (starting.current) return;
      starting.current = true;
      setError("");
      try {
        let saved = credentials.token;
        try {
          saved ??= localStorage.getItem(key) ?? undefined;
        } catch {
          setStorageLimited(true);
        }
        const input = {
          workspaceId,
          host,
          visitId: context.visitId,
          metadata: collectBrowserMetadata(context.page, context.referrer),
        };
        const result = await client.widget.start({ ...input, token: saved });
        setOwner(result.config.owner);
        credentials.token = result.token;
        try {
          localStorage.setItem(key, result.token);
        } catch {
          setStorageLimited(true);
        }
        setSession(true);
      } catch {
        starting.current = false;
        setError(
          "Support could not connect. Reload this page to retry. If your saved session expired, reset it below.",
        );
      }
    };
    const listener = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== parentOrigin)
        return;
      const parsed = embedParentMessageSchema.safeParse(event.data);
      if (
        !parsed.success ||
        parsed.data.workspaceId !== workspaceId ||
        parsed.data.host !== host
      )
        return;
      try {
        if (new URL(parsed.data.page).origin !== parentOrigin) return;
      } catch {
        return;
      }
      parentContext.current = parsed.data;
      void start(parsed.data);
    };
    window.addEventListener("message", listener);
    let refreshing = false;
    const refreshTimer = setInterval(
      () => {
        if (!parentContext.current || !credentials.token || refreshing) return;
        refreshing = true;
        starting.current = false;
        void start(parentContext.current).finally(() => {
          refreshing = false;
        });
      },
      24 * 60 * 60 * 1000,
    );
    return () => {
      clearInterval(refreshTimer);
      window.removeEventListener("message", listener);
    };
  }, [
    client,
    credentials,
    host,
    key,
    parentOrigin,
    settings.accentColor,
    settings.position,
    tellParent,
    workspaceId,
  ]);
  const conversationId = history.data?.latestConversationId;
  useEffect(() => {
    if (!session || !conversationId) return;
    const live = createRealtimeConnection<WidgetHistory>({
      room: { type: "conversation", id: conversationId },
      getToken: () => client.widget.getRealtimeToken({ conversationId }),
      loadSnapshot: async (signal) => {
        cancelOlder();
        await queryClient.cancelQueries({ queryKey: historyKey, exact: true });
        return client.widget.history({ limit: 100 }, { signal });
      },
      onSnapshot: (snapshot) => {
        void queryClient.cancelQueries({ queryKey: historyKey, exact: true });
        queryClient.setQueryData<WidgetHistory>(historyKey, (previous) =>
          mergeHistorySnapshot(previous, snapshot),
        );
      },
      onEvent: (event) => {
        if (event.type === "typing") {
          clearTimeout(typingTimer.current);
          setTyping(event.role === "owner" && event.isTyping);
          typingTimer.current = setTimeout(() => setTyping(false), 5000);
          return;
        }
        if (event.type === "access.revoked") {
          setError("This website no longer has access to support.");
          return;
        }
        if (
          event.type === "message.created" ||
          event.type === "conversation.updated"
        ) {
          if (
            event.type === "message.created" &&
            event.message.author === "member"
          )
            notify(event.message, {
              browserNotification: false,
              onlyWhenUnfocused: true,
            });
          queryClient.setQueryData<WidgetHistory>(historyKey, (previous) =>
            previous
              ? {
                  ...previous,
                  messages:
                    event.type === "message.created"
                      ? mergeMessages(previous.messages, [event.message])
                      : previous.messages,
                  conversations: [
                    ...previous.conversations.filter(
                      (c) => c.id !== event.conversation.id,
                    ),
                    (previous.conversations.find(
                      (c) => c.id === event.conversation.id,
                    )?.version ?? -1) > event.conversation.version
                      ? previous.conversations.find(
                          (c) => c.id === event.conversation.id,
                        )!
                      : event.conversation,
                  ],
                }
              : previous,
          );
        }
      },
      onStatus: setStatus,
      onError: () => setStatus("disconnected"),
    });
    liveSocket.current = live;
    return () => {
      live.close();
      liveSocket.current = null;
      clearTimeout(typingTimer.current);
    };
  }, [
    cancelOlder,
    client,
    conversationId,
    historyKey,
    notify,
    queryClient,
    session,
  ]);
  const current = history.data?.conversations.find(
    (c) => c.id === conversationId,
  );
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() || sending || !session) return;
    const input =
      retrySend.current?.body === body.trim()
        ? retrySend.current
        : { body: body.trim(), clientMessageId: crypto.randomUUID() };
    retrySend.current = input;
    setSending(true);
    setError("");
    followLatest.current = true;
    liveSocket.current?.sendTyping(false);
    try {
      // Cancel the initial read before committing, even when realtime has no room yet.
      await queryClient.cancelQueries({ queryKey: historyKey, exact: true });
      const sent = await client.widget.sendMessage(input);
      queryClient.setQueryData<WidgetHistory>(historyKey, (previous) => {
        const conversations = [
          ...(previous?.conversations ?? []).filter(
            (c) => c.id !== sent.conversation.id,
          ),
          newestConversation(
            previous?.conversations.find((c) => c.id === sent.conversation.id),
            sent.conversation,
          ),
        ].sort(
          (a, b) =>
            b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
        );
        return {
          messages: mergeMessages(previous?.messages ?? [], sent.messages),
          conversations,
          latestConversationId: conversations[0]?.id ?? null,
          nextCursor: previous?.nextCursor ?? null,
        };
      });
      retrySend.current = undefined;
      setBody("");
    } catch {
      setError(
        "Your message was not confirmed. Try Send again to safely retry.",
      );
    } finally {
      setSending(false);
    }
  }
  async function older() {
    if (
      !history.data?.nextCursor ||
      olderRequest.current ||
      status === "syncing"
    )
      return;
    const controller = new AbortController();
    olderRequest.current = controller;
    const generation = historyGeneration.current;
    setLoadingOlder(true);
    try {
      const page = await client.widget.history(
        { limit: 100, cursor: history.data.nextCursor },
        { signal: controller.signal },
      );
      if (controller.signal.aborted || generation !== historyGeneration.current)
        return;
      if (transcript.current)
        olderAnchor.current = {
          height: transcript.current.scrollHeight,
          top: transcript.current.scrollTop,
        };
      queryClient.setQueryData<WidgetHistory>(historyKey, (previous) =>
        previous
          ? {
              ...previous,
              messages: mergeMessages(page.messages, previous.messages),
              conversations: page.conversations
                .map((conversation) =>
                  newestConversation(
                    previous.conversations.find(
                      (current) => current.id === conversation.id,
                    ),
                    conversation,
                  ),
                )
                .concat(
                  previous.conversations.filter(
                    (conversation) =>
                      !page.conversations.some(
                        (current) => current.id === conversation.id,
                      ),
                  ),
                ),
              nextCursor: page.nextCursor,
            }
          : page,
      );
    } catch {
      if (!controller.signal.aborted)
        setError("Earlier messages could not load. Try again.");
    } finally {
      if (olderRequest.current === controller) {
        olderRequest.current = null;
        setLoadingOlder(false);
      }
    }
  }
  return (
    <main
      className={styles.widget}
      style={
        {
          "--widget-accent": settings.accentColor,
          "--widget-foreground": foreground(settings.accentColor),
        } as React.CSSProperties
      }
    >
      <header className={styles.header}>
        <div className={styles.avatar}>
          <PersonAvatar
            seed={settings.agentName}
            name={settings.agentName}
            url={settings.avatarUrl}
          />
        </div>
        <div className={styles.identity}>
          <strong>{settings.agentName}</strong>
          <small>We’re here to help</small>
        </div>
        <button
          aria-label="Minimize chat"
          onClick={() => tellParent({ type: "clarivo:close" })}
        >
          −
        </button>
      </header>
      <section
        ref={transcript}
        onScroll={(event) => {
          const element = event.currentTarget;
          followLatest.current =
            element.scrollHeight - element.scrollTop - element.clientHeight <
            80;
        }}
        className={styles.messages}
        aria-label="Conversation history"
        aria-live="polite"
      >
        {history.data?.nextCursor && (
          <button
            disabled={loadingOlder || status === "syncing"}
            onClick={() => void older()}
          >
            {loadingOlder
              ? "Loading earlier messages…"
              : "Load earlier messages"}
          </button>
        )}
        {!history.data?.messages.length && (
          <p className={styles.received}>{settings.greeting}</p>
        )}
        {history.data?.messages.map((message) => (
          <div
            className={
              message.author === "visitor"
                ? styles.sent
                : message.author === "system"
                  ? styles.notice
                  : styles.received
            }
            key={message.id}
          >
            {message.author === "member" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <PersonAvatar
                  seed={owner.name}
                  name={owner.name}
                  url={owner.avatarUrl}
                  size="sm"
                />
                <strong style={{ minWidth: 0 }}>{owner.name}</strong>
              </div>
            )}
            {message.author === "system" ? (
              <p>{message.body}</p>
            ) : (
              <ChatBody>{message.body}</ChatBody>
            )}
            <small>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </div>
        ))}
        {current?.state === "waiting" &&
          !history.data?.messages.some(
            (message) =>
              message.author === "system" &&
              message.body.includes("connected to a person shortly"),
          ) && (
            <p className={styles.notice}>
              You’ll be connected to a person shortly. It can take a little
              while, so please hang on.
            </p>
          )}
        {current?.state === "closed" && (
          <p className={styles.notice}>
            This conversation has ended. Send a message to start a new one.
          </p>
        )}
        {typing && <p role="status">Someone is typing…</p>}
        {history.isPending && session && (
          <p role="status">Loading your conversation…</p>
        )}
        {history.isError && (
          <p role="alert">
            History could not load.{" "}
            <button disabled={sending} onClick={() => void history.refetch()}>
              Retry
            </button>
          </p>
        )}
      </section>
      {storageLimited && (
        <p className={styles.notice}>
          Your browser is blocking saved chat history. This chat will last while
          this page stays open.
        </p>
      )}
      {status === "disconnected" && session && (
        <p className={styles.notice}>
          Live updates are disconnected. Your messages can still be sent.
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
          {!session && (
            <button
              onClick={() => {
                try {
                  localStorage.removeItem(key);
                } catch {}
                window.location.reload();
              }}
            >
              Reset saved session
            </button>
          )}
        </p>
      )}
      <form className={styles.composer} onSubmit={send}>
        <textarea
          aria-label="Your message"
          placeholder="Write a message…"
          maxLength={4000}
          value={body}
          disabled={sending || !session}
          onChange={(event) => {
            setBody(event.target.value);
            liveSocket.current?.sendTyping(true);
          }}
          onBlur={() => liveSocket.current?.sendTyping(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") tellParent({ type: "clarivo:close" });
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button type="submit" disabled={!session || sending || !body.trim()}>
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
      <footer className={styles.footer}>Powered by Clarivo</footer>
    </main>
  );
}
