"use client";

import { useEffect, useRef } from "react";

const videoUrl =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4";

export function BackgroundVideo({
  desktopOnly = false,
}: {
  desktopOnly?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      const active = !motion.matches && (!desktopOnly || desktop.matches);
      if (active) {
        if (!element.hasAttribute("src")) {
          element.src = videoUrl;
          element.load();
        }
        void element.play().catch(() => {});
      } else {
        element.pause();
        if (element.hasAttribute("src")) {
          element.removeAttribute("src");
          element.load();
        }
      }
    };
    sync();
    motion.addEventListener("change", sync);
    desktop.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      desktop.removeEventListener("change", sync);
      element.pause();
      element.removeAttribute("src");
      element.load();
    };
  }, [desktopOnly]);
  return (
    <video
      ref={video}
      muted
      loop
      playsInline
      preload="none"
      className="landing-video"
    />
  );
}
