import "server-only";
import { geolocation } from "@vercel/functions";
import { UAParser } from "ua-parser-js";
import { normalizeBrowserMetadata, type VisitorDetails } from "@clarivo/shared";

function text(value: string | undefined, max = 160) {
  return value && value.length <= max && !/[\u0000-\u001f\u007f]/u.test(value)
    ? value
    : null;
}
/** Reads no raw IP and never guesses location on a local server. */
export function normalizeVisitorDetails(
  request: Request,
  metadata: unknown,
): VisitorDetails {
  const ua = new UAParser(
    (request.headers.get("user-agent") ?? "").slice(0, 2048),
  ).getResult();
  const geo = process.env.VERCEL === "1" ? geolocation(request) : {};
  return {
    ...normalizeBrowserMetadata(metadata),
    country: text(geo.country),
    city: text(geo.city),
    device: text(ua.device.type ?? (ua.browser.name ? "Desktop" : undefined)),
    browser: text(
      [ua.browser.name, ua.browser.version].filter(Boolean).join(" ") ||
        undefined,
    ),
    os: text(
      [ua.os.name, ua.os.version].filter(Boolean).join(" ") || undefined,
    ),
  };
}
