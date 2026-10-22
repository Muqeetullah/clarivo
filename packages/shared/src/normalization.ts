/** Exact DNS hosts only. Full pasted HTTP(S) URLs are accepted; paths are discarded. */
export function normalizeAllowedDomain(value: string): string {
  const raw = value.trim();
  if (!raw || raw.length > 2048 || /[\s\\*]/u.test(raw)) {
    throw new Error("Enter a domain without a port or wildcard.");
  }
  const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  const authority = raw.includes("://")
    ? raw.split("://")[1]?.split(/[/?#]/u)[0]
    : raw.split(/[/?#]/u)[0];
  const hostname = url.hostname.toLowerCase();
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port ||
    authority?.includes(":") ||
    hostname.length > 253 ||
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9](?:[a-z0-9-]{0,57}[a-z0-9])?)$/u.test(
      hostname,
    )
  ) {
    throw new Error(
      "Enter a valid domain, such as example.com, without a port or wildcard.",
    );
  }
  return hostname;
}

/** A reported embed host is a hostname, never a URL, wildcard, or port. */
export function normalizeEmbedHost(value: string): string {
  const host = value.trim().toLowerCase();
  if (host === "localhost") return host;
  if (/[/:?#@\\]/u.test(host)) throw new Error("A hostname is required.");
  return normalizeAllowedDomain(host);
}

export function isHostAllowed(
  host: string,
  allowedDomains: readonly string[],
  production: boolean,
): boolean {
  try {
    const normalized = normalizeEmbedHost(host);
    return (
      (!production && normalized === "localhost") ||
      allowedDomains.includes(normalized)
    );
  } catch {
    return false;
  }
}

export interface BrowserMetadata {
  timeZone: string | null;
  language: string | null;
  page: string | null;
  referrer: string | null;
}

function boundedText(value: unknown, limit: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed &&
    trimmed.length <= limit &&
    !/[\u0000-\u001f\u007f]/u.test(trimmed)
    ? trimmed
    : null;
}

function normalizedPage(value: unknown): string | null {
  const text = boundedText(value, 2048);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
    url.hash = "";
    return url.href.length <= 2048 ? url.href : null;
  } catch {
    return null;
  }
}

/** Run on the server even when the request already passed schema validation. */
export function normalizeBrowserMetadata(value: unknown): BrowserMetadata {
  const input =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  let timeZone = boundedText(input.timeZone, 100);
  if (timeZone) {
    try {
      timeZone = new Intl.DateTimeFormat("en", { timeZone }).resolvedOptions()
        .timeZone;
    } catch {
      timeZone = null;
    }
  }
  return {
    timeZone,
    language: boundedText(input.language, 80),
    page: normalizedPage(input.page),
    referrer: normalizedPage(input.referrer),
  };
}

/** Browser-only collection stays separate from server normalization/persistence. */
export function collectBrowserMetadata(
  page: string,
  referrer: string,
): BrowserMetadata {
  return normalizeBrowserMetadata({
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: typeof navigator === "undefined" ? null : navigator.language,
    page,
    referrer,
  });
}
