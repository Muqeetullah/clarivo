"use client";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  sendMessageBodySchema,
  type Conversation,
  type ConversationState,
  type InboxConversation,
  type Message as StoredMessage,
  type Visitor,
} from "@clarivo/shared";
import { z } from "zod";
import {
  ArrowLeft,
  Check,
  Inbox,
  PanelRight,
  Search,
  Send,
  UserRound,
  X,
} from "lucide-react";
import { api, rpc } from "@/lib/rpc/client";
import {
  createRealtimeConnection,
  mergeInboxItem,
  mergeMessages,
  newestConversation,
  type RealtimeStatus,
} from "@/lib/realtime/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  Message,
  MessageContent,
  MessageHeader,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useDashboardThemeClass } from "@/components/dashboard-theme";
import { cn } from "@/lib/utils";
import { Feedback, errorMessage } from "./feedback";
import { PersonAvatar } from "./avatar";
import { ChatBody } from "@/components/chat-body";
import { useMessageNotifications } from "@/lib/notifications/use-message-notifications";
const labels = {
  waiting: "Waiting",
  human: "You",
  ai: "Agent",
  closed: "Closed",
};
const filters = ["all", "waiting", "human", "closed"] as const;
type Filter = (typeof filters)[number];
type ListPage = Awaited<ReturnType<typeof rpc.inbox.list>>;
type DetailPage = Awaited<ReturnType<typeof rpc.inbox.get>>;
export const initialInboxInput = { openOnly: true, limit: 50 };
export function listOptions(filter: Filter, search: string) {
  return api.inbox.list.infiniteOptions({
    input: (cursor: string | undefined) => ({
      limit: 50,
      ...(cursor ? { cursor } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(filter === "all" ? { openOnly: true } : { state: filter }),
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  });
}
function name(visitor: Visitor) {
  return visitor.details.city
    ? `Visitor from ${visitor.details.city}`
    : `Visitor ${visitor.id.slice(0, 6)}`;
}
function date(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
function time(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
function State({ state }: { state: ConversationState }) {
  return (
    <Badge variant="outline" className={cn("state-badge", `state-${state}`)}>
      <span className="status-dot" />
      {labels[state]}
    </Badge>
  );
}
function sortItems(items: InboxConversation[]) {
  return items.sort(
    (a, b) =>
      Number(b.conversation.state === "waiting") -
        Number(a.conversation.state === "waiting") ||
      b.conversation.lastMessageAt.localeCompare(
        a.conversation.lastMessageAt,
      ) ||
      b.conversation.id.localeCompare(a.conversation.id),
  );
}
function filterMatch(item: InboxConversation, filter: Filter) {
  return filter === "all"
    ? item.conversation.state !== "closed"
    : item.conversation.state === filter;
}
export function ConnectedInbox({ workspaceId }: { workspaceId: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const { notify, permission, enable } = useMessageNotifications();
  const cache = useQueryClient();
  const options = listOptions(filter, search);
  const query = useInfiniteQuery({
    ...options,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const key = JSON.stringify(options.queryKey);
  useEffect(() => {
    const currentOptions = listOptions(filter, search);
    const connection = createRealtimeConnection({
      room: { type: "workspace", id: workspaceId },
      getToken: () => rpc.realtime.getToken({ room: { type: "workspace" } }),
      loadSnapshot: async (signal) => {
        await cache.cancelQueries({
          queryKey: currentOptions.queryKey,
          exact: true,
        });
        return rpc.inbox.list(
          {
            ...initialInboxInput,
            ...(filter === "all" ? {} : { state: filter, openOnly: false }),
            ...(search.trim() ? { search: search.trim() } : {}),
          },
          { signal },
        );
      },
      onSnapshot: (snapshot) => {
        // Cancellation restores query state synchronously, before this write.
        // A normal fetch started before recovery must not overwrite its result.
        void cache.cancelQueries({
          queryKey: currentOptions.queryKey,
          exact: true,
        });
        cache.setQueryData(currentOptions.queryKey, {
          pages: [snapshot],
          pageParams: [undefined],
        });
      },
      onStatus: setStatus,
      onEvent: (event) => {
        if (event.type !== "inbox.updated") return;
        const message = event.notificationMessage ?? event.item.lastMessage;
        if (
          message?.author === "visitor" &&
          (event.item.conversation.state === "waiting" ||
            event.item.conversation.state === "human")
        )
          notify(message, { browserNotification: true });
        void cache.cancelQueries({
          queryKey: currentOptions.queryKey,
          exact: true,
        });
        // Search spans all stored messages; the event only contains the latest
        // message. Ask the authoritative search rather than guessing membership.
        if (search.trim()) {
          cache.setQueryData<InfiniteData<ListPage>>(
            currentOptions.queryKey,
            (previous) =>
              previous
                ? {
                    pages: [{ ...previous.pages[0], nextCursor: null }],
                    pageParams: [undefined],
                  }
                : previous,
          );
          void cache
            .fetchInfiniteQuery({ ...currentOptions, staleTime: 0 })
            .catch(() => {});
          return;
        }
        let reloadFirstPage = false;
        cache.setQueryData<InfiniteData<ListPage>>(
          currentOptions.queryKey,
          (previous) => {
            if (!previous) return previous;
            const existing = previous.pages.flatMap((page) => page.items);
            const current = existing.find(
              (item) => item.conversation.id === event.item.conversation.id,
            );
            const incoming = mergeInboxItem(current, event.item);
            const matches = filterMatch(incoming, filter);
            // Offset cursors depend on membership and order. Patch the event
            // immediately, then rebuild a bounded first page when either moves.
            reloadFirstPage =
              (!current && matches) ||
              (!!current &&
                (!matches ||
                  (current.conversation.state === "waiting") !==
                    (incoming.conversation.state === "waiting") ||
                  current.conversation.lastMessageAt !==
                    incoming.conversation.lastMessageAt));
            if (!reloadFirstPage)
              return {
                ...previous,
                pages: previous.pages.map((page) => ({
                  ...page,
                  items: page.items.map((item) =>
                    item.conversation.id === incoming.conversation.id
                      ? incoming
                      : item,
                  ),
                })),
              };
            const items = existing.filter(
              (item) => item.conversation.id !== incoming.conversation.id,
            );
            if (matches) items.push(incoming);
            return {
              ...previous,
              pages: [
                {
                  ...previous.pages[0],
                  items: sortItems(items).slice(0, initialInboxInput.limit),
                  nextCursor: null,
                },
              ],
              pageParams: [undefined],
            };
          },
        );
        if (reloadFirstPage)
          void cache
            .fetchInfiniteQuery({ ...currentOptions, staleTime: 0 })
            .catch(() => {});
      },
    });
    return () => connection.close();
    // The serialized query key describes the complete filter/search input.
  }, [cache, workspaceId, key, filter, search, notify]);
  const items = sortItems([
    ...new Map(
      (query.data?.pages.flatMap((page) => page.items) || []).map((item) => [
        item.conversation.id,
        item,
      ]),
    ).values(),
  ]);
  const visibleItems = items.filter((item) => filterMatch(item, filter));
  return (
    <section
      aria-label="Support inbox"
      className={cn(
        "dashboard-inbox inbox-reference",
        selected && "has-selection",
      )}
    >
      <section className="inbox-list-panel" aria-label="Conversations">
        <header className="inbox-list-heading">
          <div>
            <h2>Inbox</h2>
            <Badge variant="secondary">
              {status === "connected"
                ? "Live"
                : status === "syncing"
                  ? "Syncing…"
                  : "Reconnecting…"}
            </Badge>
          </div>
          <div
            className="inbox-filters"
            role="group"
            aria-label="Filter conversations"
          >
            {filters.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "All open" : labels[value]}
              </button>
            ))}
          </div>
          <label className="inbox-search">
            <Search aria-hidden="true" />
            <span className="sr-only">Search conversations</span>
            <Input
              value={search}
              maxLength={500}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations…"
            />
          </label>
        </header>
        <div className="inbox-conversations">
          {query.isPending && (
            <p role="status" className="p-4">
              Loading conversations…
            </p>
          )}
          {query.isError && (
            <div className="p-4">
              <Feedback
                message="Conversations couldn’t load. Try again."
                error
              />
              <Button onClick={() => query.refetch()}>Try again</Button>
            </div>
          )}
          {visibleItems.map((item) => (
            <button
              type="button"
              className="inbox-conversation"
              key={item.conversation.id}
              aria-current={
                selected === item.conversation.id ? "true" : undefined
              }
              onClick={() => setSelected(item.conversation.id)}
            >
              <PersonAvatar seed={item.visitor.id} name={name(item.visitor)} />
              <div className="inbox-row-content">
                <div className="inbox-row-top">
                  <strong>{name(item.visitor)}</strong>
                  <time dateTime={item.conversation.lastMessageAt}>
                    {time(item.conversation.lastMessageAt)}
                  </time>
                </div>
                <p>{item.lastMessage?.body || "No messages yet"}</p>
                <div className="inbox-row-status">
                  <State state={item.conversation.state} />
                  {item.conversation.state === "waiting" && (
                    <span>Waiting for a person</span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {!query.isPending && !query.isError && !visibleItems.length && (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  {search || filter !== "all"
                    ? "No conversations found"
                    : "No open conversations"}
                </EmptyTitle>
                <EmptyDescription>
                  {search || filter !== "all"
                    ? "Try another search or conversation state."
                    : "New visitor messages will appear here. Choose Closed to view previous conversations."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          {query.hasNextPage && (
            <Button
              variant="ghost"
              disabled={query.isFetching}
              onClick={() => query.fetchNextPage()}
            >
              {query.isFetchingNextPage
                ? "Loading…"
                : "Load more conversations"}
            </Button>
          )}
        </div>
        <footer className="inbox-list-footer">
          {status === "connected"
            ? "Messages are saved and delivered live."
            : "Live updates are unavailable. Refresh to check for new messages."}
          <Button variant="ghost" size="sm" onClick={() => query.refetch()}>
            Refresh
          </Button>
          {permission === "unsupported" ? (
            <span>Browser notifications are unavailable here.</span>
          ) : permission === "denied" ? (
            <span>Notifications are blocked in your browser.</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={permission === "granted"}
              onClick={() => void enable()}
            >
              {permission === "granted"
                ? "Notifications enabled"
                : "Enable notifications"}
            </Button>
          )}
        </footer>
      </section>
      {selected ? (
        <ConversationView
          key={selected}
          conversationId={selected}
          onBack={() => setSelected(null)}
        />
      ) : (
        <Empty className="inbox-unselected">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Inbox />
            </EmptyMedia>
            <EmptyTitle>A space for thoughtful support</EmptyTitle>
            <EmptyDescription>
              Select a conversation to read the history and help your visitor.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}
const mediaQuery = "(max-width: 1199px)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(mediaQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function detailOptions(conversationId: string) {
  return api.inbox.get.infiniteOptions({
    input: (cursor: string | undefined) => ({
      conversationId,
      limit: 50,
      ...(cursor ? { cursor } : {}),
    }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor || undefined,
  });
}
const replySchema = z.object({ body: sendMessageBodySchema });
function ConversationView({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const cache = useQueryClient();
  const options = detailOptions(conversationId);
  const query = useInfiniteQuery({
    ...options,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const [error, setError] = useState("");
  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const [visitorTyping, setVisitorTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socket = useRef<ReturnType<typeof createRealtimeConnection> | null>(
    null,
  );
  const retry = useRef<{ body: string; id: string } | null>(null);
  const sending = useRef(false);
  const narrow = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(mediaQuery).matches,
    () => false,
  );
  const [detailsOverride, setDetailsOverride] = useState<boolean | null>(null);
  const detailsOpen = detailsOverride ?? !narrow;
  const theme = useDashboardThemeClass();
  const form = useForm({
    resolver: zodResolver(replySchema),
    defaultValues: { body: "" },
  });
  function applyConversation(
    conversation: Conversation,
    messages: StoredMessage[] = [],
  ) {
    void cache.cancelQueries({ queryKey: options.queryKey, exact: true });
    void cache.cancelQueries({ queryKey: api.inbox.list.key() });
    cache.setQueryData<InfiniteData<DetailPage>>(
      options.queryKey,
      (previous) =>
        previous
          ? {
              ...previous,
              pages: previous.pages.map((page, index) =>
                index === 0
                  ? {
                      ...page,
                      conversation: newestConversation(
                        page.conversation,
                        conversation,
                      ),
                      messages: mergeMessages(page.messages, messages),
                    }
                  : page,
              ),
            }
          : previous,
    );
    cache.setQueriesData<InfiniteData<ListPage>>(
      { queryKey: api.inbox.list.key() },
      (previous) =>
        previous
          ? {
              pages: [
                {
                  ...previous.pages[0],
                  nextCursor: null,
                  items: previous.pages[0].items.map((item) =>
                    item.conversation.id === conversation.id
                      ? {
                          ...item,
                          conversation: newestConversation(
                            item.conversation,
                            conversation,
                          ),
                          lastMessage:
                            mergeMessages(
                              item.lastMessage ? [item.lastMessage] : [],
                              messages,
                            ).at(-1) || item.lastMessage,
                        }
                      : item,
                  ),
                },
              ],
              pageParams: [undefined],
            }
          : previous,
    );
    // Replies and state changes can move filtered offset boundaries even if
    // post-commit publication fails. Refresh the active list from page one.
    void cache.invalidateQueries({ queryKey: api.inbox.list.key() });
  }
  useEffect(() => {
    const currentOptions = detailOptions(conversationId);
    socket.current = createRealtimeConnection({
      room: { type: "conversation", id: conversationId },
      getToken: () =>
        rpc.realtime.getToken({
          room: { type: "conversation", conversationId },
        }),
      loadSnapshot: async (signal) => {
        await cache.cancelQueries({
          queryKey: currentOptions.queryKey,
          exact: true,
        });
        return rpc.inbox.get({ conversationId, limit: 50 }, { signal });
      },
      onSnapshot: (snapshot) => {
        void cache.cancelQueries({
          queryKey: currentOptions.queryKey,
          exact: true,
        });
        // Rebuild the cursor chain from the authoritative newest page. Keeping
        // old older pages here can skip messages sent during a long disconnect.
        cache.setQueryData<InfiniteData<DetailPage>>(
          currentOptions.queryKey,
          (previous) => ({
            pages: [
              {
                ...snapshot,
                conversation: newestConversation(
                  previous?.pages[0]?.conversation,
                  snapshot.conversation,
                ),
                messages: mergeMessages(
                  snapshot.messages,
                  previous?.pages
                    .flatMap((page) => page.messages)
                    .filter(
                      (message) =>
                        message.createdAt >
                        (snapshot.messages.at(-1)?.createdAt ?? ""),
                    ) ?? [],
                ),
              },
            ],
            pageParams: [undefined],
          }),
        );
      },
      onStatus: setStatus,
      onEvent: (event) => {
        if (
          event.type === "message.created" ||
          event.type === "conversation.updated"
        ) {
          void cache.cancelQueries({
            queryKey: currentOptions.queryKey,
            exact: true,
          });
          cache.setQueryData<InfiniteData<DetailPage>>(
            currentOptions.queryKey,
            (previous) =>
              previous
                ? {
                    ...previous,
                    pages: previous.pages.map((page, index) =>
                      index === 0
                        ? {
                            ...page,
                            conversation: newestConversation(
                              page.conversation,
                              event.conversation,
                            ),
                            messages:
                              event.type === "message.created"
                                ? mergeMessages(page.messages, [event.message])
                                : page.messages,
                          }
                        : page,
                    ),
                  }
                : previous,
          );
        } else if (event.type === "typing" && event.role === "visitor") {
          setVisitorTyping(event.isTyping);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setVisitorTyping(false), 5000);
        }
      },
    });
    return () => {
      socket.current?.close();
      socket.current = null;
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [cache, conversationId]);
  const replyBody = useWatch({ control: form.control, name: "body" });
  const send = useMutation(api.inbox.sendMessage.mutationOptions());
  const takeover = useMutation(api.inbox.takeover.mutationOptions());
  const close = useMutation(api.inbox.close.mutationOptions());
  const detail = query.data?.pages[0];
  const messages = useMemo(
    () =>
      mergeMessages(
        [],
        query.data?.pages.flatMap((page) => page.messages) || [],
      ),
    [query.data],
  );
  if (!detail)
    return (
      <section className="inbox-chat-panel p-5">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" />
          Back to inbox
        </Button>
        <Feedback
          message={
            query.isError
              ? "This conversation couldn’t load. Try again."
              : "Loading conversation…"
          }
          error={query.isError}
        />
        {query.isError && (
          <Button onClick={() => query.refetch()}>Try again</Button>
        )}
      </section>
    );
  const closed = detail.conversation.state === "closed";
  const busy = send.isPending || takeover.isPending || close.isPending;
  async function changeState(action: "takeover" | "close") {
    setError("");
    try {
      const next = await (action === "close" ? close : takeover).mutateAsync({
        conversationId,
      });
      applyConversation(next);
      await query.refetch();
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }
  return (
    <div
      className={cn(
        "inbox-conversation-workspace",
        detailsOpen && !narrow && "with-details",
      )}
    >
      <section className="inbox-chat-panel" aria-label="Selected conversation">
        <header className="inbox-chat-toolbar">
          <Button
            variant="ghost"
            size="icon"
            className="inbox-chat-back"
            aria-label="Back to inbox"
            onClick={onBack}
          >
            <ArrowLeft />
          </Button>
          <PersonAvatar seed={detail.visitor.id} name={name(detail.visitor)} />
          <div className="inbox-chat-title">
            <div>
              <h2>{name(detail.visitor)}</h2>
              <State state={detail.conversation.state} />
            </div>
            <p>
              {[detail.visitor.details.city, detail.visitor.details.country]
                .filter(Boolean)
                .join(", ") || "Location unknown"}
            </p>
          </div>
          <div className="inbox-chat-actions">
            {!closed && detail.conversation.state !== "human" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => void changeState("takeover")}
              >
                <UserRound data-icon="inline-start" />
                {takeover.isPending ? "Taking over…" : "Take over"}
              </Button>
            )}
            {!closed && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => void changeState("close")}
              >
                <Check data-icon="inline-start" />
                {close.isPending ? "Closing…" : "Close"}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle visitor details"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOverride(!detailsOpen)}
            >
              <PanelRight />
            </Button>
          </div>
        </header>
        <div className="inbox-chat-transcript">
          <MessageScrollerProvider key={conversationId} autoScroll>
            <MessageScroller>
              <MessageScrollerViewport aria-label="Conversation history">
                <MessageScrollerContent className="inbox-chat-messages">
                  {query.hasNextPage && (
                    <MessageScrollerItem messageId="older">
                      <Button
                        variant="ghost"
                        disabled={query.isFetchingNextPage}
                        onClick={() => query.fetchNextPage()}
                      >
                        {query.isFetchingNextPage
                          ? "Loading older messages…"
                          : "Load older messages"}
                      </Button>
                    </MessageScrollerItem>
                  )}
                  {messages.map((message) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                    >
                      {message.author === "system" ? (
                        <Marker variant="separator">
                          <MarkerContent>{message.body}</MarkerContent>
                        </Marker>
                      ) : (
                        <Message
                          align={message.author === "visitor" ? "start" : "end"}
                        >
                          <MessageContent>
                            <MessageHeader>
                              <span>
                                {message.author === "visitor"
                                  ? name(detail.visitor)
                                  : message.author === "member"
                                    ? "You"
                                    : "Agent"}
                              </span>
                              <time dateTime={message.createdAt}>
                                {time(message.createdAt)}
                              </time>
                            </MessageHeader>
                            <Bubble
                              variant={
                                message.author === "visitor"
                                  ? "muted"
                                  : "outline"
                              }
                            >
                              <BubbleContent>
                                <ChatBody>{message.body}</ChatBody>
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      )}
                    </MessageScrollerItem>
                  ))}
                  {visitorTyping && (
                    <MessageScrollerItem messageId="typing">
                      <p role="status">Visitor is typing…</p>
                    </MessageScrollerItem>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>
        <form
          className="inbox-chat-composer"
          onSubmit={(event) =>
            void form.handleSubmit(async ({ body }) => {
              if (sending.current || closed) return;
              sending.current = true;
              setError("");
              if (!retry.current || retry.current.body !== body)
                retry.current = { body, id: crypto.randomUUID() };
              try {
                const result = await send.mutateAsync({
                  conversationId,
                  body,
                  clientMessageId: retry.current.id,
                });
                applyConversation(result.conversation, result.messages);
                retry.current = null;
                form.reset({ body: "" });
                socket.current?.sendTyping(false);
              } catch (failure) {
                setError(errorMessage(failure));
              } finally {
                sending.current = false;
              }
            })(event)
          }
        >
          <Feedback message={error} error />
          <Field data-invalid={!!form.formState.errors.body}>
            <FieldLabel htmlFor="inbox-reply" className="sr-only">
              Reply to visitor
            </FieldLabel>
            <Textarea
              id="inbox-reply"
              disabled={closed || busy}
              maxLength={4000}
              placeholder={
                closed
                  ? "This conversation is closed."
                  : "Reply to the visitor…"
              }
              aria-invalid={!!form.formState.errors.body}
              {...form.register("body")}
              onChange={(event) => {
                form.setValue("body", event.target.value, {
                  shouldDirty: true,
                });
                socket.current?.sendTyping(true);
              }}
              onBlur={() => socket.current?.sendTyping(false)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  (event.metaKey || event.ctrlKey) &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <FieldError>{form.formState.errors.body?.message}</FieldError>
          </Field>
          <div className="inbox-composer-footer">
            <span>
              {closed
                ? "Closed conversations can’t receive replies."
                : status === "connected"
                  ? "Sending a reply takes over this conversation."
                  : "Live delivery is reconnecting. Replies are still saved."}
            </span>
            <kbd>⌘ / Ctrl ↵</kbd>
            <Button
              type="submit"
              size="sm"
              className="inbox-send"
              disabled={closed || busy || !replyBody.trim()}
            >
              {send.isPending ? "Sending…" : "Send"}
              <Send data-icon="inline-end" />
            </Button>
          </div>
        </form>
      </section>
      {detailsOpen && !narrow && (
        <aside className="inbox-details-panel" aria-label="Visitor details">
          <header>
            <h2>Details</h2>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Hide visitor details"
              onClick={() => setDetailsOverride(false)}
            >
              <X />
            </Button>
          </header>
          <VisitorDetails
            visitor={detail.visitor}
            conversation={detail.conversation}
          />
        </aside>
      )}
      <Sheet open={detailsOpen && narrow} onOpenChange={setDetailsOverride}>
        <SheetContent className={cn(theme, "inbox-details-sheet")}>
          <SheetHeader>
            <SheetTitle>Visitor details</SheetTitle>
            <SheetDescription>
              Information for {name(detail.visitor)}.
            </SheetDescription>
          </SheetHeader>
          <VisitorDetails
            visitor={detail.visitor}
            conversation={detail.conversation}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
function VisitorDetails({
  visitor,
  conversation,
}: {
  visitor: Visitor;
  conversation: Conversation;
}) {
  const details = visitor.details;
  const localTime = useSyncExternalStore(
    (callback) => {
      const timer = setInterval(callback, 30_000);
      return () => clearInterval(timer);
    },
    () => {
      try {
        return details.timeZone
          ? new Intl.DateTimeFormat(undefined, {
              timeZone: details.timeZone,
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date())
          : "Unknown";
      } catch {
        return "Unknown";
      }
    },
    () => "Unknown",
  );
  const rows = [
    ["Location", [details.city, details.country].filter(Boolean).join(", ")],
    ["Local time", localTime],
    ["Timezone", details.timeZone],
    ["Language", details.language],
    ["Device", details.device],
    ["Browser", details.browser],
    ["System", details.os],
    ["Current page", details.page],
    ["Came from", details.referrer],
    ["First seen", date(visitor.firstSeenAt)],
    ["Last seen", date(visitor.lastSeenAt)],
    ["Visits", String(visitor.visitCount)],
  ];
  return (
    <div className="inbox-visitor-content">
      <div className="inbox-visitor-identity">
        <PersonAvatar seed={visitor.id} name={name(visitor)} size="lg" />
        <strong>{name(visitor)}</strong>
        <span>Anonymous visitor</span>
      </div>
      <h3>Visitor</h3>
      <dl className="inbox-metadata">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className="break-words">{value || "Unknown"}</dd>
          </div>
        ))}
      </dl>
      <h3>Conversation</h3>
      <dl className="inbox-metadata">
        <div>
          <dt>ID</dt>
          <dd className="break-all">{conversation.id}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <State state={conversation.state} />
          </dd>
        </div>
        {conversation.handoffReason && (
          <div>
            <dt>Handoff</dt>
            <dd>
              {conversation.handoffReason === "agent_off"
                ? "Waiting for a person"
                : conversation.handoffReason.replaceAll("_", " ")}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
