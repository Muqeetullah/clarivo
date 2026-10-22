function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function appearance(
  value: unknown,
): { accentColor: string; position: "left" | "right" } | null {
  if (
    !isObject(value) ||
    Object.keys(value).length !== 3 ||
    value.type !== "clarivo:appearance" ||
    typeof value.accentColor !== "string" ||
    !/^#[0-9a-f]{6}$/iu.test(value.accentColor) ||
    (value.position !== "left" && value.position !== "right")
  )
    return null;
  return { accentColor: value.accentColor, position: value.position };
}
function accentForeground(hex: string) {
  const values = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance =
    values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05)
    ? "#000000"
    : "#ffffff";
}
function widgetMessage(
  value: unknown,
): { type: string; count?: number } | null {
  if (!isObject(value)) return null;
  if (
    (value.type === "clarivo:ready" || value.type === "clarivo:close") &&
    Object.keys(value).length === 1
  )
    return { type: value.type };
  if (
    value.type === "clarivo:unread" &&
    Object.keys(value).length === 2 &&
    typeof value.count === "number" &&
    Number.isInteger(value.count) &&
    value.count >= 0 &&
    value.count <= 9999
  )
    return { type: value.type, count: value.count };
  return null;
}

(() => {
  const script = document.currentScript;
  if (!(script instanceof HTMLScriptElement)) return;
  const workspaceId = script.dataset.workspace;
  if (!workspaceId || document.getElementById("clarivo-widget-root")) return;
  const origin = new URL(script.src).origin;
  const visitId = crypto.randomUUID();
  const root = document.createElement("div");
  root.id = "clarivo-widget-root";
  const shadow = root.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `:host{position:fixed;bottom:20px;right:20px;z-index:2147483000;font-family:system-ui}button{width:56px;height:56px;border:0;border-radius:50%;background:#93c5fd;color:#171717;box-shadow:0 4px 24px #0003;cursor:pointer;font-size:24px}button:focus-visible{outline:3px solid #171717;outline-offset:3px}iframe{display:none;position:absolute;bottom:72px;right:0;width:380px;height:600px;max-height:calc(100dvh - 112px);border:0;border-radius:20px;box-shadow:0 8px 48px #0003;background:white}@media(max-width:480px){:host{bottom:16px;right:16px}iframe{position:fixed;inset:0;width:100%;height:100dvh;max-height:none;border-radius:0}}`;
  const button = document.createElement("button");
  button.hidden = true;
  button.type = "button";
  button.textContent = "✦";
  button.setAttribute("aria-label", "Open support chat");
  button.setAttribute("aria-expanded", "false");
  const frame = document.createElement("iframe");
  frame.title = "Support chat";
  frame.src = `${origin}/widget/${encodeURIComponent(workspaceId)}?host=${encodeURIComponent(location.hostname)}&parentOrigin=${encodeURIComponent(location.origin)}`;
  frame.setAttribute("allow", "");
  let open = false;
  const context = () => {
    if (open)
      frame.contentWindow?.postMessage(
        {
          type: "clarivo:context",
          workspaceId,
          host: location.hostname,
          page: location.href.slice(0, 2048),
          referrer: document.referrer.slice(0, 2048),
          visitId,
        },
        origin,
      );
  };
  function setOpen(value: boolean) {
    open = value;
    frame.style.display = value ? "block" : "none";
    button.setAttribute("aria-expanded", String(value));
    button.setAttribute(
      "aria-label",
      value ? "Minimize support chat" : "Open support chat",
    );
    if (value) {
      context();
      frame.focus();
    } else button.focus();
  }
  button.addEventListener("click", () => setOpen(!open));
  frame.addEventListener("load", context);
  window.addEventListener("message", (event) => {
    if (event.origin !== origin || event.source !== frame.contentWindow) return;
    const looks = appearance(event.data);
    if (looks) {
      button.hidden = false;
      button.style.background = looks.accentColor;
      button.style.color = accentForeground(looks.accentColor);
      const left = looks.position === "left";
      root.style.left = left ? "20px" : "auto";
      root.style.right = left ? "auto" : "20px";
      frame.style.left = left ? "0" : "auto";
      frame.style.right = left ? "auto" : "0";
      return;
    }
    const message = widgetMessage(event.data);
    if (!message) return;
    if (message.type === "clarivo:ready") {
      button.hidden = false;
      context();
    }
    if (message.type === "clarivo:close") setOpen(false);
    if (message.type === "clarivo:unread")
      button.setAttribute(
        "aria-label",
        message.count
          ? `${message.count} unread support messages`
          : open
            ? "Minimize support chat"
            : "Open support chat",
      );
  });
  shadow.append(style, frame, button);
  document.body.append(root);
})();
