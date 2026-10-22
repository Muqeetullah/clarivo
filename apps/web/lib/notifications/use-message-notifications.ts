"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Message } from "@clarivo/shared";

function currentPermission(): NotificationPermission | "unsupported" {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}
function subscribePermission(listener: () => void) {
  window.addEventListener("focus", listener);
  window.addEventListener("clarivo:notification-permission", listener);
  return () => { window.removeEventListener("focus", listener); window.removeEventListener("clarivo:notification-permission", listener); };
}
/** Permission is requested only by the owner's explicit Enable notifications action. */
export function useMessageNotifications(onUnread?: (count: number) => void) {
  const permission = useSyncExternalStore(subscribePermission, currentPermission, () => "default" as const);
  const [unread, setUnread] = useState(0);
  const seen = useRef(new Set<string>());
  const audio = useRef<AudioContext | null>(null);
  const originalTitle = useRef("Clarivo");
  const unreadListener = useRef(onUnread);
  useEffect(() => { unreadListener.current = onUnread; }, [onUnread]);
  useEffect(() => {
    originalTitle.current = document.title;
    const prepare = () => {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume().catch(() => {});
      } catch { /* Browser may block audio; messages still arrive normally. */ }
    };
    const read = () => { if (!document.hidden && document.hasFocus()) setUnread(0); };
    document.addEventListener("pointerdown", prepare, { once: true });
    window.addEventListener("focus", read);
    document.addEventListener("visibilitychange", read);
    return () => {
      document.removeEventListener("pointerdown", prepare);
      window.removeEventListener("focus", read);
      document.removeEventListener("visibilitychange", read);
      document.title = originalTitle.current;
      void audio.current?.close().catch(() => {});
    };
  }, []);
  useEffect(() => {
    document.title = unread ? `(${unread}) ${originalTitle.current}` : originalTitle.current;
    unreadListener.current?.(unread);
  }, [unread]);
  async function enable() {
    if (typeof Notification === "undefined") return;
    try { await Notification.requestPermission(); } catch { /* Permission can remain unavailable. */ }
    window.dispatchEvent(new Event("clarivo:notification-permission"));
  }
  const notify = useCallback((message: Message, options: { browserNotification: boolean; onlyWhenUnfocused?: boolean }) => {
    if (seen.current.has(message.id)) return;
    seen.current.add(message.id);
    if (seen.current.size > 2048) seen.current.delete(seen.current.values().next().value!);
    const unfocused = document.hidden || !document.hasFocus();
    if (options.onlyWhenUnfocused && !unfocused) return;
    if (unfocused) setUnread(count => count + 1);
    const context = audio.current;
    if (context?.state === "running") {
      const tone = context.createOscillator();
      const volume = context.createGain();
      tone.frequency.value = 660;
      volume.gain.setValueAtTime(.045, context.currentTime);
      volume.gain.exponentialRampToValueAtTime(.001, context.currentTime + .15);
      tone.connect(volume); volume.connect(context.destination);
      tone.start(); tone.stop(context.currentTime + .16);
    }
    if (options.browserNotification && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try { new Notification("New support message", { body: message.body.slice(0, 180), tag: message.id }); } catch { /* Some mobile browsers require service-worker notifications. */ }
    }
  }, []);
  return { permission, unread, enable, notify };
}
