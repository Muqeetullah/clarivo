"use client";
import { useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  PanelRight,
  UserRound,
  CircleCheck,
  Bot,
  Send,
  X,
  ArrowRightLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Message,
  MessageAvatar,
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
import type { useConversations } from "./use-conversations";
import { InboxAvatar, visitorLabel } from "./inbox-avatar";
import { InboxVisitorDetails } from "./inbox-visitor-details";
import { StateBadge } from "./conversation-ui";
const query = "(max-width: 1199px)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function InboxChat({
  selected,
  setSelectedId,
  changeState,
  reply,
  setReply,
  sendReply,
}: ReturnType<typeof useConversations>) {
  const narrow = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
  const [detailsOverride, setDetailsOverride] = useState<boolean | null>(null);
  const detailsOpen = detailsOverride ?? !narrow;
  const themeClass = useDashboardThemeClass();
  if (!selected) return null;
  const closed = selected.state === "closed";
  const name = visitorLabel(selected);
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
            onClick={() => setSelectedId(null)}
          >
            <ArrowLeft />
          </Button>
          <InboxAvatar seed={selected.id} label={name} />
          <div className="inbox-chat-title">
            <div>
              <h2>{name}</h2>
              <StateBadge state={selected.state} compact />
            </div>
            <p>
              {selected.location} · {selected.timezone}
            </p>
          </div>
          <div className="inbox-chat-actions">
            {!closed &&
              (selected.state === "human" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeState("ai")}
                >
                  <Bot data-icon="inline-start" />
                  Hand back
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="inbox-takeover"
                  onClick={() => changeState("human")}
                >
                  <UserRound data-icon="inline-start" />
                  Take over
                </Button>
              ))}
            {!closed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeState("closed")}
              >
                <CircleCheck data-icon="inline-start" />
                Close
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
          <MessageScrollerProvider key={selected.id} autoScroll>
            <MessageScroller>
              <MessageScrollerViewport aria-label="Conversation history">
                <MessageScrollerContent className="inbox-chat-messages">
                  <MessageScrollerItem messageId="subject">
                    <Marker variant="separator">
                      <MarkerContent>{selected.subject}</MarkerContent>
                    </Marker>
                  </MessageScrollerItem>
                  {selected.messages.map((message) => (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                    >
                      {message.author === "system" ? (
                        <Marker variant="separator">
                          <MarkerContent>
                            <ArrowRightLeft aria-hidden="true" />
                            {message.body}
                          </MarkerContent>
                        </Marker>
                      ) : (
                        <Message
                          align={message.author === "visitor" ? "start" : "end"}
                        >
                          <MessageAvatar>
                            <InboxAvatar
                              seed={
                                message.author === "visitor"
                                  ? selected.id
                                  : message.author === "agent"
                                    ? "clarivo-agent"
                                    : "clarivo-owner"
                              }
                              label={
                                message.author === "visitor"
                                  ? name
                                  : message.author === "agent"
                                    ? "Clarivo Agent"
                                    : "You"
                              }
                              size="sm"
                            />
                          </MessageAvatar>
                          <MessageContent>
                            <MessageHeader>
                              <span>
                                {message.author === "visitor"
                                  ? name
                                  : message.author === "agent"
                                    ? "Clarivo Agent"
                                    : "You"}
                              </span>
                              <time>{message.time}</time>
                            </MessageHeader>
                            <Bubble
                              variant={
                                message.author === "visitor"
                                  ? "muted"
                                  : "outline"
                              }
                            >
                              <BubbleContent>
                                <p>{message.body}</p>
                              </BubbleContent>
                            </Bubble>
                            {message.declined && (
                              <Badge variant="outline">Declined</Badge>
                            )}
                          </MessageContent>
                        </Message>
                      )}
                    </MessageScrollerItem>
                  ))}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>
        <form className="inbox-chat-composer" onSubmit={sendReply}>
          <Field>
            <FieldLabel htmlFor="inbox-reply" className="sr-only">
              Reply to visitor
            </FieldLabel>
            <Textarea
              id="inbox-reply"
              value={reply}
              disabled={closed}
              maxLength={4000}
              placeholder={
                closed
                  ? "This conversation is closed."
                  : "Reply to the visitor…"
              }
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  (e.metaKey || e.ctrlKey) &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
            />
          </Field>
          <div className="inbox-composer-footer">
            <span>
              {closed
                ? "Closed conversations can’t receive replies."
                : "Sending a reply takes over this conversation."}
            </span>
            <kbd>⌘ / Ctrl ↵</kbd>
            <Button
              type="submit"
              size="sm"
              className="inbox-send"
              disabled={closed || !reply.trim()}
            >
              Send
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
          <InboxVisitorDetails conversation={selected} />
        </aside>
      )}
      <Sheet open={detailsOpen && narrow} onOpenChange={setDetailsOverride}>
        <SheetContent className={cn(themeClass, "inbox-details-sheet")}>
          <SheetHeader>
            <SheetTitle>Visitor details</SheetTitle>
            <SheetDescription>Sample information for {name}.</SheetDescription>
          </SheetHeader>
          <InboxVisitorDetails conversation={selected} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
