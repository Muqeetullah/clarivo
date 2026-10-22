"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  widgetAppearanceInputSchema,
  createAvatarUploadInputSchema,
  normalizeAllowedDomain,
  type WidgetSettings,
  type WidgetAppearanceInput,
} from "@clarivo/shared";
import { Check, UploadCloud, X, Plus, Globe, Copy, Code2 } from "lucide-react";
import { api, rpc } from "@/lib/rpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { WidgetColorPicker } from "@/components/dashboard/widget-color-picker";
import { WidgetPosition } from "@/components/dashboard/widget-position";
import { Feedback, errorMessage } from "./feedback";
import { SettingsPreview, foreground } from "./preview";
import { PersonAvatar } from "./avatar";
const colors = [
  "#93c5fd",
  "#a5b4fc",
  "#c4b5fd",
  "#f9a8d4",
  "#fca5a5",
  "#fdba74",
  "#86efac",
];
function appearance(settings: WidgetSettings): WidgetAppearanceInput {
  return {
    agentName: settings.agentName,
    greeting: settings.greeting,
    accentColor: settings.accentColor,
    position: settings.position,
    allowedDomains: settings.allowedDomains,
  };
}
export function ConnectedSettings({
  workspaceId,
  appOrigin,
}: {
  workspaceId: string;
  appOrigin: string;
}) {
  const query = useQuery(
    api.settings.get.queryOptions({ input: {}, refetchInterval: 30_000 }),
  );
  if (!query.data)
    return (
      <section className="dashboard-home">
        <Feedback
          message={
            query.isError
              ? "Your settings couldn’t load. Try again."
              : "Loading your saved settings…"
          }
          error={query.isError}
        />
        {query.isError && (
          <Button onClick={() => query.refetch()}>Try again</Button>
        )}
      </section>
    );
  return (
    <SettingsEditor
      initial={query.data}
      installedAt={query.data.installedAt}
      workspaceId={workspaceId}
      appOrigin={appOrigin}
    />
  );
}
function SettingsEditor({
  initial,
  installedAt,
  workspaceId,
  appOrigin,
}: {
  initial: WidgetSettings;
  installedAt: string | null;
  workspaceId: string;
  appOrigin: string;
}) {
  const cache = useQueryClient();
  const [saved, setSaved] = useState(initial);
  const [appearanceConflict, setAppearanceConflict] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [domain, setDomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const form = useForm<WidgetAppearanceInput>({
    resolver: zodResolver(widgetAppearanceInputSchema),
    defaultValues: appearance(initial),
  });
  const values = useWatch({ control: form.control }) as WidgetAppearanceInput;
  const mutation = useMutation(api.settings.save.mutationOptions());
  const busy = mutation.isPending || avatarBusy;
  function remember(next: WidgetSettings) {
    setSaved(next);
    setAppearanceConflict(false);
    cache.setQueryData(api.settings.get.queryKey({ input: {} }), next);
  }
  function rememberAvatar(next: WidgetSettings) {
    // An avatar write may return appearance saved by another tab. Do not use
    // that newer version to silently overwrite it with this form's old edits.
    const unchanged =
      !appearanceConflict &&
      JSON.stringify(appearance(next)) === JSON.stringify(appearance(saved));
    // Keep the form's original appearance baseline as well as its version.
    // Otherwise a second avatar response can bless a foreign tab's appearance
    // version even though this form still contains edits based on older values.
    setSaved(
      unchanged
        ? next
        : { ...next, ...appearance(saved), version: saved.version },
    );
    cache.setQueryData(api.settings.get.queryKey({ input: {} }), next);
    if (!unchanged) {
      setAppearanceConflict(true);
      setError(
        "Settings changed in another tab. Your edits are still here. Reload the saved settings before saving again.",
      );
    }
  }
  async function uploadAvatar(file?: File) {
    if (!file || busy) return;
    const checked = createAvatarUploadInputSchema.safeParse({
      mime: file.type,
      size: file.size,
    });
    if (!checked.success) {
      setAvatarError("Choose a PNG, JPEG, WebP or GIF image up to 2 MB.");
      return;
    }
    setAvatarBusy(true);
    setAvatarError("");
    try {
      const upload = await rpc.settings.createAvatarUpload(checked.data);
      const response = await fetch(upload.putUrl, {
        method: "PUT",
        headers: upload.headers,
        body: file,
      });
      if (!response.ok) throw new Error("Upload failed");
      const next = await rpc.settings.confirmAvatarUpload({
        uploadId: upload.uploadId,
      });
      rememberAvatar(next);
      setNotice("Avatar saved.");
    } catch (failure) {
      setAvatarError(errorMessage(failure));
    } finally {
      setAvatarBusy(false);
    }
  }
  async function removeAvatar() {
    if (busy) return;
    setAvatarBusy(true);
    setAvatarError("");
    try {
      rememberAvatar(
        await rpc.settings.removeAvatar({ expectedAvatarKey: saved.avatarKey }),
      );
      setNotice("Avatar removed.");
    } catch (failure) {
      setAvatarError(errorMessage(failure));
    } finally {
      setAvatarBusy(false);
    }
  }
  function addDomain() {
    try {
      const host = normalizeAllowedDomain(domain);
      if (values.allowedDomains.includes(host)) {
        setDomainError("This domain is already on your list.");
        return;
      }
      form.setValue("allowedDomains", [...values.allowedDomains, host], {
        shouldDirty: true,
        shouldValidate: true,
      });
      setDomain("");
      setDomainError("");
    } catch {
      setDomainError("Enter an exact domain without a port or wildcard.");
    }
  }
  const snippet = `<script\n  async\n  src="${appOrigin}/embed.js"\n  data-workspace="${workspaceId}"\n></script>`;
  return (
    <section className="dashboard-home" aria-label="Widget settings">
      <div className="dashboard-page-heading">
        <h2>Widget</h2>
        <p>
          Choose how the widget looks on your website. Preview changes
          instantly, then save when you’re ready.
        </p>
      </div>
      <div className="widget-config">
        <section
          className="setup-checklist setup-panel"
          aria-label="Widget setup progress"
        >
          <div className="setup-checklist-title">
            <h3>Get your widget live</h3>
            <span>
              {Number(saved.allowedDomains.length > 0) + Number(!!installedAt)}{" "}
              of 2 complete
            </span>
          </div>
          <ol>
            {[
              {
                title: "Add an allowed domain",
                description: "Choose where the widget loads.",
                href: "#widget-domains",
                done: saved.allowedDomains.length > 0,
              },
              {
                title: "Install the snippet",
                description: installedAt
                  ? "A website visitor connected successfully."
                  : "Connect your website to your inbox.",
                href: "#widget-install",
                done: !!installedAt,
              },
            ].map((step, index) => (
              <li key={step.title}>
                <a href={step.href} data-done={step.done}>
                  <span className="setup-step-number">
                    {step.done ? <Check /> : index + 1}
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
            <form
              onSubmit={form.handleSubmit(async (input) => {
                if (appearanceConflict) return;
                setError("");
                setNotice("");
                try {
                  const next = await mutation.mutateAsync({
                    ...input,
                    expectedVersion: saved.version,
                  });
                  remember(next);
                  form.reset(appearance(next));
                  setNotice("Widget settings saved.");
                } catch (failure) {
                  setError(errorMessage(failure));
                }
              })}
            >
              <fieldset disabled={busy} className="min-w-0">
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
                      <Field
                        className="setup-setting-row"
                        data-invalid={!!form.formState.errors.agentName}
                      >
                        <div>
                          <FieldLabel htmlFor="agent-name">
                            Agent name
                          </FieldLabel>
                          <FieldDescription>
                            Shown at the top of the widget.
                          </FieldDescription>
                        </div>
                        <div>
                          <Input
                            id="agent-name"
                            maxLength={120}
                            aria-invalid={!!form.formState.errors.agentName}
                            {...form.register("agentName")}
                          />
                          <FieldError>
                            {form.formState.errors.agentName?.message}
                          </FieldError>
                        </div>
                      </Field>
                      <Field
                        className="setup-setting-row"
                        data-invalid={!!avatarError}
                      >
                        <div>
                          <FieldLabel htmlFor="agent-avatar">
                            Agent avatar
                          </FieldLabel>
                          <FieldDescription>
                            Avatar uploads save immediately.
                          </FieldDescription>
                        </div>
                        <div>
                          <div className="setup-avatar-upload">
                            <span className="setup-agent-avatar">
                              <PersonAvatar
                                seed={`agent-${values.agentName}`}
                                name={values.agentName}
                                url={saved.avatarUrl}
                              />
                            </span>
                            <label
                              className="setup-dropzone setup-avatar-drop"
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={(event) => {
                                event.preventDefault();
                                void uploadAvatar(event.dataTransfer.files[0]);
                              }}
                            >
                              <UploadCloud aria-hidden="true" />
                              <div>
                                <strong>
                                  {avatarBusy
                                    ? "Saving avatar…"
                                    : "Drop an image"}
                                </strong>
                                <span>PNG, JPEG, WebP or GIF, up to 2 MB.</span>
                              </div>
                              <input
                                id="agent-avatar"
                                className="setup-file-input"
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                onChange={(event) => {
                                  void uploadAvatar(event.target.files?.[0]);
                                  event.target.value = "";
                                }}
                              />
                            </label>
                            {saved.avatarKey && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Remove avatar"
                                onClick={() => void removeAvatar()}
                              >
                                <X />
                              </Button>
                            )}
                          </div>
                          <FieldDescription>
                            Your saved avatar stays in place if an upload fails.
                          </FieldDescription>
                          <FieldError>{avatarError}</FieldError>
                        </div>
                      </Field>
                      <Field className="setup-setting-row">
                        <div>
                          <FieldLabel>Accent color</FieldLabel>
                          <FieldDescription>
                            Used for the header, launcher and visitor messages.
                          </FieldDescription>
                        </div>
                        <div className="setup-swatches">
                          {colors.map((color) => (
                            <label key={color} style={{ background: color }}>
                              <input
                                className="sr-only"
                                type="radio"
                                name="widget-color"
                                aria-label={`Accent ${color}`}
                                checked={values.accentColor === color}
                                onChange={() =>
                                  form.setValue("accentColor", color, {
                                    shouldDirty: true,
                                  })
                                }
                              />
                              <Check
                                aria-hidden="true"
                                style={{ color: foreground(color) }}
                              />
                            </label>
                          ))}
                          <WidgetColorPicker
                            value={values.accentColor}
                            onChange={(value) =>
                              form.setValue("accentColor", value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          />
                        </div>
                      </Field>
                      <Field className="setup-setting-row">
                        <div>
                          <FieldLabel>Position</FieldLabel>
                          <FieldDescription>
                            Which corner the widget appears in.
                          </FieldDescription>
                        </div>
                        <WidgetPosition
                          value={values.position}
                          onChange={(value) =>
                            form.setValue(
                              "position",
                              value === "left" ? "left" : "right",
                              { shouldDirty: true },
                            )
                          }
                          accent={values.accentColor}
                          foreground={foreground(values.accentColor)}
                        />
                      </Field>
                      <Field
                        className="setup-setting-row"
                        data-invalid={!!form.formState.errors.greeting}
                      >
                        <div>
                          <FieldLabel htmlFor="greeting">
                            Welcome message
                          </FieldLabel>
                          <FieldDescription>
                            The first thing visitors see.
                          </FieldDescription>
                        </div>
                        <div>
                          <Textarea
                            id="greeting"
                            maxLength={4000}
                            aria-invalid={!!form.formState.errors.greeting}
                            {...form.register("greeting")}
                          />
                          <FieldError>
                            {form.formState.errors.greeting?.message}
                          </FieldError>
                        </div>
                      </Field>
                    </FieldGroup>
                  </div>
                </section>
                <section
                  id="widget-domains"
                  className="setup-section"
                  aria-labelledby="domains-heading"
                >
                  <div className="setup-section-heading">
                    <h3 id="domains-heading">Allowed domains</h3>
                    <p>
                      Add each subdomain separately, for example example.com and
                      www.example.com.
                    </p>
                  </div>
                  <div className="setup-panel">
                    <FieldGroup>
                      <Field
                        className="setup-setting-row"
                        data-invalid={!!domainError}
                      >
                        <div>
                          <FieldLabel htmlFor="allowed-domain">
                            Add a domain
                          </FieldLabel>
                          <FieldDescription>
                            Full website addresses normalize to exact hostnames.
                          </FieldDescription>
                        </div>
                        <div>
                          <div className="setup-inline-input">
                            <Input
                              id="allowed-domain"
                              placeholder="example.com"
                              value={domain}
                              aria-invalid={!!domainError}
                              onChange={(event) => {
                                setDomain(event.target.value);
                                setDomainError("");
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  addDomain();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={addDomain}
                            >
                              <Plus data-icon="inline-start" />
                              Add
                            </Button>
                          </div>
                          <FieldError>{domainError}</FieldError>
                        </div>
                      </Field>
                    </FieldGroup>
                    <ul className="setup-domain-list">
                      {values.allowedDomains.map((host) => (
                        <li key={host}>
                          <Globe aria-hidden="true" />
                          <span>{host}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove ${host}`}
                            onClick={() =>
                              form.setValue(
                                "allowedDomains",
                                values.allowedDomains.filter(
                                  (value) => value !== host,
                                ),
                                { shouldDirty: true },
                              )
                            }
                          >
                            <X />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <p className="setup-footnote">
                      Domain additions and removals apply when you select Save
                      changes. Exact subdomains only; removing a domain revokes
                      visitor access.
                    </p>
                  </div>
                </section>
              </fieldset>
              <div className="flex flex-col gap-3 py-4">
                <Feedback message={error || notice} error={!!error} />
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="submit"
                    disabled={
                      busy || appearanceConflict || !form.formState.isDirty
                    }
                  >
                    {mutation.isPending ? "Saving…" : "Save changes"}
                  </Button>
                  <span role="status">
                    {avatarBusy
                      ? "Saving avatar…"
                      : form.formState.isDirty
                        ? "Unsaved changes"
                        : "All changes saved"}
                  </span>
                  {error && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={async () => {
                        try {
                          const latest = await rpc.settings.get({});
                          remember(latest);
                          form.reset(appearance(latest));
                          setError("");
                          setNotice("Latest saved settings loaded.");
                        } catch (failure) {
                          setError(errorMessage(failure));
                        }
                      }}
                    >
                      Discard edits and reload saved settings
                    </Button>
                  )}
                </div>
              </div>
            </form>
            <section
              id="widget-install"
              className="setup-section"
              aria-labelledby="install-heading"
            >
              <div className="setup-section-heading">
                <h3 id="install-heading">Install</h3>
                <p>
                  Paste this snippet before your website’s closing{" "}
                  <code>&lt;/body&gt;</code> tag.
                </p>
              </div>
              <div className="setup-panel setup-install">
                <div className="setup-code">
                  <div className="setup-code-toolbar">
                    <span className="setup-code-file">
                      <Code2 aria-hidden="true" />
                      index.html <small>HTML</small>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(snippet);
                          setCopyStatus("Installation snippet copied.");
                        } catch {
                          setCopyStatus("Select and copy the code below.");
                        }
                      }}
                    >
                      <Copy data-icon="inline-start" />
                      Copy
                    </Button>
                  </div>
                  <pre tabIndex={0} aria-label="Installation snippet">
                    <code>
                      {snippet.split("\n").map((line, index) => (
                        <span className="setup-code-line" key={index}>
                          <span
                            className="setup-line-number"
                            aria-hidden="true"
                          >
                            {index + 1}
                          </span>
                          <span>{line}</span>
                        </span>
                      ))}
                    </code>
                  </pre>
                </div>
                <p className="setup-footnote">
                  {installedAt
                    ? "Installed · A visitor session connected from an allowed website."
                    : "Not installed yet · Installation completes when a visitor connects from a saved allowed domain. Localhost previews don’t count."}
                </p>
                <p className="setup-copy-status" role="status">
                  {copyStatus}
                </p>
              </div>
            </section>
          </div>
          <SettingsPreview values={values} avatar={saved.avatarUrl} />
        </div>
      </div>
    </section>
  );
}
