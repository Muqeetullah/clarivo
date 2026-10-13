"use client";

import { ArrowDownLeft, Bot, CheckCheck, Globe2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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

import { type Conversation, type ConversationState } from "@/lib/demo-data";

import { StateBadge } from "./conversation-ui";
export function ConversationDetail({
  selected,
  setSelectedId,
  changeState,
  reply,
  setReply,
  sendReply,
}: {
  selected: Conversation | undefined;
  setSelectedId: (id: string | null) => void;
  changeState: (state: ConversationState) => void;
  reply: string;
  setReply: (reply: string) => void;
  sendReply: (event: React.FormEvent) => void;
}) {
  return (
    <Sheet
      open={Boolean(selected)}
      onOpenChange={(open) => {
        if (!open) setSelectedId(null);
      }}
    >
      <SheetContent className="conversation-sheet">
        {selected && (
          <>
            <SheetHeader>
              <SheetTitle>{selected.subject}</SheetTitle>
              <SheetDescription>
                {selected.visitor} · Conversation #{selected.id}
              </SheetDescription>
            </SheetHeader>
            <div className="conversation-sheet-content">
              <div className="detail-status">
                <StateBadge state={selected.state} />
                <span>{selected.location}</span>
              </div>
              {selected.reason && (
                <div className="handoff-reason">
                  <ArrowDownLeft />
                  Handoff: {selected.reason}
                </div>
              )}
              <div className="visitor-context">
                <span>
                  <Globe2 />
                  {selected.timezone}
                </span>
                <span>{selected.browser}</span>
                <span>
                  {selected.page} · {selected.visits} visits
                </span>
              </div>
              <div className="detail-actions">
                {(selected.state === "ai" || selected.state === "waiting") && (
                  <Button size="sm" onClick={() => changeState("human")}>
                    Take over
                  </Button>
                )}
                {selected.state === "human" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => changeState("ai")}
                  >
                    <Bot data-icon="inline-start" />
                    Hand to agent
                  </Button>
                )}
                {selected.state !== "closed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => changeState("closed")}
                  >
                    <CheckCheck data-icon="inline-start" />
                    Close conversation
                  </Button>
                )}
              </div>
              <div className="transcript-frame">
                <MessageScrollerProvider key={selected.id} autoScroll>
                  <MessageScroller>
                    <MessageScrollerViewport aria-label="Conversation history">
                      <MessageScrollerContent className="message-history">
                        {selected.messages.map((message) => (
                          <MessageScrollerItem
                            key={message.id}
                            messageId={message.id}
                          >
                            {message.author === "system" ? (
                              <Marker variant="separator">
                                <MarkerContent>{message.body}</MarkerContent>
                              </Marker>
                            ) : (
                              <Message>
                                <MessageContent>
                                  <MessageHeader>
                                    {message.author === "visitor"
                                      ? selected.visitor
                                      : message.author === "agent"
                                        ? "Clarivo Agent"
                                        : "Jan Marshal"}
                                    <time className="ml-auto">
                                      {message.time}
                                    </time>
                                  </MessageHeader>
                                  <Bubble
                                    variant={
                                      message.author === "member"
                                        ? "tinted"
                                        : "muted"
                                    }
                                  >
                                    <BubbleContent>
                                      <p className="whitespace-pre-wrap break-words">
                                        {message.body}
                                      </p>
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
              <form onSubmit={sendReply} className="reply-form">
                <FieldGroup>
                  <Field>
                    <FieldLabel className="sr-only" htmlFor="reply">
                      Your reply
                    </FieldLabel>
                    <Textarea
                      id="reply"
                      placeholder={
                        selected.state === "closed"
                          ? "This conversation is closed."
                          : "Write a thoughtful reply…"
                      }
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      disabled={selected.state === "closed"}
                      maxLength={4000}
                    />
                  </Field>
                </FieldGroup>
                <div>
                  <span>
                    {selected.state === "closed"
                      ? "Closed conversations can’t receive replies."
                      : "Sending a reply assigns this conversation to you."}
                  </span>
                  <Button
                    type="submit"
                    disabled={!reply.trim() || selected.state === "closed"}
                  >
                    Send reply
                    <Send data-icon="inline-end" />
                  </Button>
                </div>
              </form>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
