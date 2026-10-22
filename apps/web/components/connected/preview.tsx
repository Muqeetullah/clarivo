"use client";
import { useState, type CSSProperties } from "react";
import { ChevronDown, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { WidgetAppearanceInput } from "@clarivo/shared";
import { PersonAvatar } from "./avatar";
export function foreground(hex: string) {
  const c = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
    ? "#000000"
    : "#ffffff";
}
export function SettingsPreview({
  values,
  avatar,
}: {
  values: WidgetAppearanceInput;
  avatar: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState("");
  const accent = /^#[0-9a-f]{6}$/iu.test(values.accentColor)
    ? values.accentColor
    : "#93c5fd";
  return (
    <aside className="setup-preview-column" aria-label="Widget preview">
      <div className="setup-preview-heading">
        <h3>Preview</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSent("");
            setMessage("");
          }}
        >
          Reset preview
        </Button>
      </div>
      <div
        className="setup-preview-canvas"
        data-position={values.position}
        style={
          {
            "--widget-accent": accent,
            "--widget-on-accent": foreground(accent),
          } as CSSProperties
        }
      >
        <div className="setup-browser-bar">
          <span aria-hidden="true">•••</span>
          <span>{values.allowedDomains[0] || "yourwebsite.com"}</span>
        </div>
        {!collapsed && (
          <div className="setup-chat">
            <header className="setup-chat-header">
              <span className="setup-agent-avatar">
                <PersonAvatar
                  seed={`agent-${values.agentName}`}
                  name={values.agentName || "Your agent"}
                  url={avatar}
                />
              </span>
              <div>
                <strong>{values.agentName || "Your agent"}</strong>
                <span>● Waiting for a human</span>
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
                  <MessageScrollerViewport aria-label="Preview conversation">
                    <MessageScrollerContent className="setup-preview-messages">
                      <MessageScrollerItem messageId="greeting">
                        <Message>
                          <MessageContent>
                            <span className="setup-chat-author">
                              {values.agentName || "Your agent"}
                            </span>
                            <Bubble variant="muted">
                              <BubbleContent>
                                {values.greeting || "Hello! How can we help?"}
                              </BubbleContent>
                            </Bubble>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
                      {sent && (
                        <>
                          <MessageScrollerItem messageId="visitor">
                            <Message align="end">
                              <MessageContent>
                                <Bubble>
                                  <BubbleContent className="setup-visitor-bubble">
                                    {sent}
                                  </BubbleContent>
                                </Bubble>
                              </MessageContent>
                            </Message>
                          </MessageScrollerItem>
                          <MessageScrollerItem messageId="waiting">
                            <Message>
                              <MessageContent>
                                <Bubble variant="muted">
                                  <BubbleContent>
                                    You’ll be connected to a person shortly.
                                  </BubbleContent>
                                </Bubble>
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
            <form
              className="setup-preview-composer"
              onSubmit={(event) => {
                event.preventDefault();
                if (message.trim()) {
                  setSent(message.trim());
                  setMessage("");
                }
              }}
            >
              <Input
                aria-label="Preview message"
                value={message}
                maxLength={4000}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write a message…"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Send preview message"
                disabled={!message.trim()}
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
        Preview only. Messages here aren’t sent or saved.
      </p>
    </aside>
  );
}
