"use client";
import { useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  BookOpen,
  ChevronDown,
  Send,
  UserRound,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Message, MessageContent } from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from "@/components/ui/message-scroller";
import { InboxAvatar } from "./inbox-avatar";
import { previewQuestions, type PreviewSource } from "./widget-setup-data";

export function WidgetAvatar({ url, name }: { url?: string; name: string }) {
  return (
    <span className="setup-agent-avatar">
      {url ? (
        <Image
          src={url}
          alt={`${name} avatar`}
          width={48}
          height={48}
          unoptimized
        />
      ) : (
        <InboxAvatar seed={`agent-${name}`} label={name || "Your agent"} />
      )}
    </span>
  );
}
export function WidgetPreview({
  name,
  greeting,
  accent,
  foreground,
  avatar,
  position,
  sources,
  domain,
}: {
  name: string;
  greeting: string;
  accent: string;
  foreground: string;
  avatar?: string;
  position: string;
  sources: PreviewSource[];
  domain?: string;
}) {
  const [mode, setMode] = useState("new");
  const [question, setQuestion] = useState("");
  const [input, setInput] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const ready = sources.some((s) => s.status === "ready");
  const currentQuestion = question || previewQuestions[0].question;
  const sample = previewQuestions.find((q) => q.question === currentQuestion);
  const answer =
    sample?.answer &&
    sources.some((s) => s.id === sample.source && s.status === "ready")
      ? sample.answer
      : "I don’t have a ready source for that in this demo. I’ll bring in a person who can help.";
  function ask(value: string) {
    if (!value.trim()) return;
    setQuestion(value.trim());
    setMode("after");
    setInput("");
  }
  return (
    <aside className="setup-preview-column" aria-label="Widget preview">
      <div className="setup-preview-heading">
        <h3>Preview</h3>
        <Tabs
          value={mode}
          onValueChange={(value) => {
            setMode(String(value));
            setQuestion("");
          }}
        >
          <TabsList aria-label="Preview state">
            <TabsTrigger value="new">New visitor</TabsTrigger>
            <TabsTrigger value="after">After a message</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div
        className="setup-preview-canvas"
        data-position={position}
        style={
          {
            "--widget-accent": accent,
            "--widget-on-accent": foreground,
          } as CSSProperties
        }
      >
        <div className="setup-browser-bar">
          <span aria-hidden="true">•••</span>
          <span>{domain || "yourwebsite.com"}</span>
        </div>
        {!collapsed && (
          <div className="setup-chat">
            <header className="setup-chat-header">
              <WidgetAvatar url={avatar} name={name} />
              <div>
                <strong>{name || "Your agent"}</strong>
                <span>
                  ● {ready ? "Replies right away" : "Waiting for a human"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Minimize preview"
                onClick={() => setCollapsed(true)}
              >
                <ChevronDown />
              </Button>
            </header>
            <div className="setup-chat-history">
              <MessageScrollerProvider autoScroll>
                <MessageScroller>
                  <MessageScrollerViewport aria-label="Widget preview conversation">
                    <MessageScrollerContent className="setup-preview-messages">
                      <MessageScrollerItem messageId="knowledge">
                        <span className="setup-knowledge-pill">
                          <BookOpen />
                          {ready
                            ? "Answers only from our knowledge base"
                            : "No ready knowledge sources"}
                        </span>
                      </MessageScrollerItem>
                      <MessageScrollerItem messageId="greeting">
                        <Message>
                          <MessageContent>
                            <span className="setup-chat-author">
                              {name || "Your agent"}
                            </span>
                            <Bubble variant="muted">
                              <BubbleContent>
                                {greeting || "Hello! How can we help?"}
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                      {mode === "new" ? (
                        ready && (
                          <MessageScrollerItem messageId="questions">
                            <div className="setup-suggested-questions">
                              {previewQuestions.map((q) => (
                                <Button
                                  key={q.question}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => ask(q.question)}
                                >
                                  {q.question}
                                </Button>
                              ))}
                            </div>
                          </MessageScrollerItem>
                        )
                      ) : (
                        <>
                          <MessageScrollerItem
                            messageId={`question-${currentQuestion}`}
                          >
                            <Message align="end">
                              <MessageContent>
                                <Bubble>
                                  <BubbleContent className="setup-visitor-bubble">
                                    {currentQuestion}
                                  </BubbleContent>
                                </Bubble>
                              </MessageContent>
                            </Message>
                          </MessageScrollerItem>
                          <MessageScrollerItem messageId={`answer-${answer}`}>
                            <Message>
                              <MessageContent>
                                <Bubble variant="muted">
                                  <BubbleContent>{answer}</BubbleContent>
                                </Bubble>
                                <span className="setup-chat-author">
                                  Scripted demo response
                                </span>
                              </MessageContent>
                            </Message>
                          </MessageScrollerItem>
                        </>
                      )}
                    </MessageScrollerContent>
                  </MessageScrollerViewport>
                  <MessageScrollerButton />
                </MessageScroller>
              </MessageScrollerProvider>
            </div>
            {ready && (
              <Button
                variant="ghost"
                className="setup-human-button"
                onClick={() => ask("I’d like to talk to a human.")}
              >
                <UserRound data-icon="inline-start" />
                Talk to a human
              </Button>
            )}
            <form
              className="setup-preview-composer"
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
            >
              <Input
                aria-label="Preview message"
                placeholder="Write a message…"
                maxLength={500}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send preview message"
                disabled={!input.trim()}
              >
                <Send />
              </Button>
            </form>
          </div>
        )}
        <Button
          className="setup-launcher"
          size="icon"
          aria-label={
            collapsed ? "Open widget preview" : "Close widget preview"
          }
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <MessageCircle /> : <ChevronDown />}
        </Button>
      </div>
      <p className="setup-preview-caption">
        Local preview with scripted replies. Uploaded files aren’t read yet.
      </p>
    </aside>
  );
}
