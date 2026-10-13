"use client";

import { useState } from "react";
import { Bot, Code2, MessageCircle, Send } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

function accentForeground(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return luminance > 0.179 ? "#171717" : "#ffffff";
}

export function WidgetSettings() {
  const [agentName, setAgentName] = useState("Clarivo Agent");
  const [greeting, setGreeting] = useState(
    "Hi there! 👋 How can we help you today?",
  );
  const [accent, setAccent] = useState("#7860db");

  return (
    <div className="widget-page">
      <Card>
        <CardHeader>
          <CardTitle>A welcome that feels like you</CardTitle>
          <CardDescription>
            Try the local preview. Settings reset on reload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="widget-fields">
            <Field>
              <FieldLabel htmlFor="agent-name">Agent name</FieldLabel>
              <Input
                id="agent-name"
                value={agentName}
                maxLength={80}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="greeting">Welcome message</FieldLabel>
              <Textarea
                id="greeting"
                value={greeting}
                maxLength={500}
                onChange={(e) => setGreeting(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="accent">Accent color</FieldLabel>
              <div className="color-field">
                <input
                  id="accent"
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                />
                <code>{accent}</code>
              </div>
            </Field>
            <div className="widget-note">
              <Code2 />
              <div>
                <strong>Installation comes next</strong>
                <p>
                  The embeddable widget and allowed-domain settings will be
                  connected with the live chat backend.
                </p>
              </div>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>
      <div className="widget-preview-area">
        <span className="preview-label">LIVE PREVIEW</span>
        <div className="widget-preview">
          <div
            className="widget-preview-header"
            style={{
              background: accent,
              color: accentForeground(accent),
            }}
          >
            <Bot />
            <strong>{agentName || "Your agent"}</strong>
            <span>We’re here to help.</span>
          </div>
          <div className="widget-preview-body">
            <span className="preview-message">{greeting || "Hello!"}</span>
            <span className="preview-caption">
              Your visitor’s conversation starts here.
            </span>
          </div>
          <div className="preview-composer">
            Write a message…
            <Send />
          </div>
          <div className="powered-by">
            Powered by <strong>Clarivo</strong>
          </div>
        </div>
        <span
          className="preview-launcher"
          style={{
            background: accent,
            color: accentForeground(accent),
          }}
        >
          <MessageCircle />
        </span>
      </div>
    </div>
  );
}
