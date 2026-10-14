"use client";
import { useEffect, useState } from "react";
import { Check, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldSet,
  FieldLegend,
  FieldError,
} from "@/components/ui/field";
import { WidgetKnowledge } from "./widget-knowledge";
import { WidgetDomains, WidgetInstall } from "./widget-domains";
import { WidgetAvatar, WidgetPreview } from "./widget-preview";
import { WidgetColorPicker } from "./widget-color-picker";
import { WidgetPosition } from "./widget-position";
import { initialPreviewSources } from "./widget-setup-data";

const colors = [
  { name: "Blue", hex: "#93c5fd" },
  { name: "Indigo", hex: "#a5b4fc" },
  { name: "Violet", hex: "#c4b5fd" },
  { name: "Pink", hex: "#f9a8d4" },
  { name: "Red", hex: "#fca5a5" },
  { name: "Orange", hex: "#fdba74" },
  { name: "Green", hex: "#86efac" },
];
function accentForeground(hex: string) {
  const channels = [1, 3, 5].map((offset) => {
    const v = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 >
    0.179
    ? "#171717"
    : "#ffffff";
}
export function WidgetSettings() {
  const [name, setName] = useState("Clarivo Agent");
  const [greeting, setGreeting] = useState(
    "Hi there! How can we help you today?",
  );
  const [accent, setAccent] = useState(colors[0].hex);
  const [position, setPosition] = useState("right");
  const [avatar, setAvatar] = useState<string>();
  const [avatarError, setAvatarError] = useState("");
  const [sources, setSources] = useState(initialPreviewSources);
  const [domains, setDomains] = useState<string[]>([]);
  useEffect(
    () => () => {
      if (avatar) URL.revokeObjectURL(avatar);
    },
    [avatar],
  );
  function addAvatar(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
        file.type,
      ) ||
      !file.size ||
      file.size > 2 * 1024 * 1024
    ) {
      setAvatarError("Choose a PNG, JPEG, WebP or GIF image up to 2 MB.");
      return;
    }
    setAvatar(URL.createObjectURL(file));
    setAvatarError("");
  }
  const ready = sources.some((s) => s.status === "ready");
  const steps = [
    {
      title: "Add a source",
      description: "Teach the agent what you know.",
      href: "#widget-knowledge",
      done: ready,
    },
    {
      title: "Add an allowed domain",
      description: "Choose where the widget loads.",
      href: "#widget-domains",
      done: domains.length > 0,
    },
    {
      title: "Install the snippet",
      description: "Preview your installation code.",
      href: "#widget-install",
      done: false,
    },
  ];
  return (
    <div className="widget-config">
      <section
        className="setup-checklist setup-panel"
        aria-label="Widget setup progress"
      >
        <div className="setup-checklist-title">
          <h3>Get your widget live</h3>
          <span>
            {steps.filter((s) => s.done).length} of 3 configured in preview
          </span>
        </div>
        <ol>
          {steps.map((step, i) => (
            <li key={step.title}>
              <a href={step.href} data-done={step.done}>
                <span className="setup-step-number">
                  {step.done ? <Check /> : i + 1}
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <small>{step.description}</small>
                </span>
              </a>
            </li>
          ))}
        </ol>
      </section>
      <div className="setup-layout">
        <div className="setup-editor">
          <section
            className="setup-section"
            aria-labelledby="appearance-heading"
          >
            <div className="setup-section-heading">
              <h3 id="appearance-heading">Appearance</h3>
              <p>How the widget looks on your website.</p>
            </div>
            <div className="setup-panel">
              <FieldGroup className="setup-appearance-fields">
                <Field className="setup-setting-row">
                  <div>
                    <FieldLabel htmlFor="agent-name">Agent name</FieldLabel>
                    <FieldDescription>
                      Shown at the top of the widget and next to the agent’s
                      messages.
                    </FieldDescription>
                  </div>
                  <Input
                    id="agent-name"
                    value={name}
                    maxLength={80}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field
                  className="setup-setting-row"
                  data-invalid={!!avatarError}
                >
                  <div>
                    <FieldLabel htmlFor="agent-avatar">Agent avatar</FieldLabel>
                    <FieldDescription>
                      Shown next to the agent’s messages. Optional.
                    </FieldDescription>
                  </div>
                  <div>
                    <div className="setup-avatar-upload">
                      <WidgetAvatar url={avatar} name={name} />
                      <label
                        className="setup-dropzone setup-avatar-drop"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          addAvatar(e.dataTransfer.files[0]);
                        }}
                      >
                        <UploadCloud aria-hidden="true" />
                        <div>
                          <strong>Drop an image</strong>
                          <span>PNG, JPEG, WebP or GIF, up to 2 MB.</span>
                        </div>
                        <input
                          id="agent-avatar"
                          className="setup-file-input"
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          onChange={(e) => {
                            addAvatar(e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {avatar && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remove avatar"
                          onClick={() => setAvatar(undefined)}
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                    <FieldDescription>
                      Until you add one, your agent gets an avatar based on its
                      name.
                    </FieldDescription>
                    {avatarError && <FieldError>{avatarError}</FieldError>}
                  </div>
                </Field>
                <FieldSet className="setup-setting-row">
                  <div>
                    <FieldLegend>Accent color</FieldLegend>
                    <FieldDescription>
                      Used for the header, launcher and visitor messages.
                    </FieldDescription>
                  </div>
                  <div>
                    <div className="setup-swatches">
                      {colors.map((color) => (
                        <label
                          key={color.hex}
                          style={{ background: color.hex }}
                          title={color.name}
                        >
                          <input
                            className="sr-only"
                            type="radio"
                            name="widget-color"
                            aria-label={color.name}
                            checked={accent === color.hex}
                            onChange={() => setAccent(color.hex)}
                          />
                          <Check
                            aria-hidden="true"
                            style={{ color: accentForeground(color.hex) }}
                          />
                        </label>
                      ))}
                      <WidgetColorPicker value={accent} onChange={setAccent} />
                    </div>
                    <FieldDescription>
                      {colors.find((c) => c.hex === accent)?.name || accent},
                      with{" "}
                      {accentForeground(accent) === "#ffffff"
                        ? "white"
                        : "dark"}{" "}
                      text to stay readable.
                    </FieldDescription>
                  </div>
                </FieldSet>
                <FieldSet className="setup-setting-row">
                  <div>
                    <FieldLegend>Position</FieldLegend>
                    <FieldDescription>
                      Which corner of the page the widget appears in.
                    </FieldDescription>
                  </div>
                  <WidgetPosition
                    value={position}
                    onChange={setPosition}
                    accent={accent}
                    foreground={accentForeground(accent)}
                  />
                </FieldSet>
                <Field className="setup-setting-row">
                  <div>
                    <FieldLabel htmlFor="greeting">Welcome message</FieldLabel>
                    <FieldDescription>
                      The first thing your visitors see when they open the
                      widget.
                    </FieldDescription>
                  </div>
                  <Textarea
                    id="greeting"
                    value={greeting}
                    maxLength={500}
                    onChange={(e) => setGreeting(e.target.value)}
                  />
                </Field>
              </FieldGroup>
            </div>
          </section>
          <WidgetKnowledge sources={sources} setSources={setSources} />
          <WidgetDomains domains={domains} setDomains={setDomains} />
          <WidgetInstall />
        </div>
        <WidgetPreview
          name={name}
          greeting={greeting}
          accent={accent}
          foreground={accentForeground(accent)}
          avatar={avatar}
          position={position}
          sources={sources}
          domain={domains[0]}
        />
      </div>
    </div>
  );
}
