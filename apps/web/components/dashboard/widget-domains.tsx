"use client";
import { useState } from "react";
import { Globe, Plus, X, Copy, Check, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { demoSnippet } from "./widget-setup-data";

export function WidgetDomains({
  domains,
  setDomains,
}: {
  domains: string[];
  setDomains: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  function addDomain(e: React.FormEvent) {
    e.preventDefault();
    try {
      const raw = value.trim();
      const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
      const hostname = url.hostname.toLowerCase();
      if (
        !["http:", "https:"].includes(url.protocol) ||
        !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(
          hostname,
        ) ||
        url.username ||
        url.password ||
        url.port
      )
        throw new Error();
      if (domains.includes(hostname)) {
        setError("This domain is already on your list.");
        return;
      }
      setDomains((current) => [...current, hostname]);
      setValue("");
      setError("");
    } catch {
      setError(
        "Enter a valid domain, such as example.com, without a port or wildcard.",
      );
    }
  }
  return (
    <section
      id="widget-domains"
      className="setup-section"
      aria-labelledby="domains-heading"
    >
      <div className="setup-section-heading">
        <h3 id="domains-heading">Allowed domains</h3>
        <p>Choose the websites where your widget will appear.</p>
      </div>
      <div className="setup-panel">
        <form onSubmit={addDomain}>
          <FieldGroup>
            <Field className="setup-setting-row" data-invalid={!!error}>
              <div>
                <FieldLabel htmlFor="allowed-domain">Add a domain</FieldLabel>
                <FieldDescription>
                  Add each subdomain on its own, for example both example.com
                  and www.example.com.
                </FieldDescription>
              </div>
              <div>
                <div className="setup-inline-input">
                  <Input
                    id="allowed-domain"
                    placeholder="example.com"
                    value={value}
                    aria-invalid={!!error}
                    aria-describedby={error ? "domain-error" : "domain-help"}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setError("");
                    }}
                  />
                  <Button type="submit" variant="outline">
                    <Plus data-icon="inline-start" />
                    Add
                  </Button>
                </div>
                <FieldDescription id="domain-help">
                  Pasting a full address works too. Only the domain is kept.
                </FieldDescription>
                {error && <FieldError id="domain-error">{error}</FieldError>}
              </div>
            </Field>
          </FieldGroup>
        </form>
        {!!domains.length && (
          <ul className="setup-domain-list">
            {domains.map((domain) => (
              <li key={domain}>
                <Globe aria-hidden="true" />
                <span>{domain}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${domain}`}
                  onClick={() =>
                    setDomains((current) => current.filter((d) => d !== domain))
                  }
                >
                  <X />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="setup-footnote">
          {domains.length
            ? "Preview list only. Domain restrictions will apply once the widget is connected."
            : "No allowed domains yet. The live widget will need at least one domain."}
        </p>
      </div>
    </section>
  );
}

export function WidgetInstall() {
  const [copyStatus, setCopyStatus] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(demoSnippet);
      setCopyStatus("Copied preview snippet");
    } catch {
      setCopyStatus("Copy unavailable. Select and copy the code below.");
    }
  }
  return (
    <section
      id="widget-install"
      className="setup-section"
      aria-labelledby="install-heading"
    >
      <div className="setup-section-heading">
        <h3 id="install-heading">Install</h3>
        <p>
          When connected, paste your snippet before the closing{" "}
          <code>&lt;/body&gt;</code> tag on your website.
        </p>
      </div>
      <div className="setup-panel setup-install">
        <div className="setup-code">
          <div className="setup-code-toolbar">
            <span className="setup-code-file">
              <Code2 aria-hidden="true" />
              index.html <small>HTML</small>
            </span>
            <Button variant="ghost" size="sm" onClick={copy}>
              {copyStatus === "Copied preview snippet" ? (
                <Check data-icon="inline-start" />
              ) : (
                <Copy data-icon="inline-start" />
              )}
              Copy
            </Button>
          </div>
          <pre tabIndex={0} aria-label="Preview installation snippet">
            <code>
              {demoSnippet.split("\n").map((line, index) => (
                <span className="setup-code-line" key={index}>
                  <span aria-hidden="true" className="setup-line-number">
                    {index + 1}
                  </span>
                  <span>
                    {line
                      .split(
                        /("[^"]*"|<!--.*-->|<\/?script|async|src=|data-workspace=)/g,
                      )
                      .map((token, i) => (
                        <span
                          key={i}
                          className={
                            token.startsWith('"')
                              ? "code-string"
                              : token.startsWith("<!--")
                                ? "code-comment"
                                : /^(<|async|src=|data-workspace=)/.test(token)
                                  ? "code-keyword"
                                  : undefined
                          }
                        >
                          {token}
                        </span>
                      ))}
                  </span>
                </span>
              ))}
            </code>
          </pre>
        </div>
        <p className="setup-footnote">
          Example snippet only. Installation and connection checks will be
          available later.
        </p>
        <p className="setup-copy-status" role="status">
          {copyStatus}
        </p>
      </div>
    </section>
  );
}
