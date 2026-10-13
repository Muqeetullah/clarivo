"use client";
import { BackgroundVideo } from "@/components/background-video";

import { BookOpenIcon, MessageCircleIcon, UserRoundIcon } from "lucide-react";

// Same source, cover treatment and scrim as the landing page.

export function AuthVisual() {
  return (
    <aside
      className="auth-visual relative hidden min-w-0 flex-col justify-end overflow-hidden p-12 lg:flex"
      aria-label="Our support philosophy"
    >
      <div className="auth-video-background" aria-hidden="true">
        <BackgroundVideo desktopOnly />
        <div className="landing-scrim" />
      </div>

      <div className="relative flex flex-col gap-7">
        <div className="auth-promise">
          <div className="auth-promise-icons" aria-hidden="true">
            {[BookOpenIcon, MessageCircleIcon, UserRoundIcon].map((Icon, i) => (
              <span key={i}>
                <Icon />
              </span>
            ))}
          </div>
          <span>Your knowledge. A human touch.</span>
        </div>
        <p className="auth-headline">
          Thoughtful support.
          <br />
          Human when it matters.
        </p>
        <p className="max-w-sm text-base leading-relaxed">
          AI that answers from your knowledge. A seamless handoff to you when it
          can’t. Meet Clarivo.
        </p>
      </div>
    </aside>
  );
}
