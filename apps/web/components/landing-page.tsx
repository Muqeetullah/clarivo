"use client";
import { BackgroundVideo } from "@/components/background-video";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, MessageCircle, UserRound } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const highlights = [
  {
    glyph: "*",
    value: "Your knowledge",
    label: "Answers grounded in your business",
  },
  {
    glyph: "↗",
    value: "Human handoff",
    label: "A person, with the full context",
  },
  { glyph: "#", value: "One inbox", label: "Every conversation, together" },
  {
    glyph: "<",
    value: "One snippet",
    label: "Live chat, right on your website",
  },
];
const steps = [
  {
    title: "Give it your knowledge",
    text: "Add your PDFs, Markdown, text files, or written answers. Your business knowledge is the agent’s source of truth.",
  },
  {
    title: "Meet visitors where they are",
    text: "Add a chat widget to your website with one snippet. Visitors can ask for help without creating an account.",
  },
  {
    title: "Be there when it matters",
    text: "When the agent cannot answer, or a visitor asks for you, take over with the entire conversation in view.",
  },
];
type Panel = "menu" | "product" | "how";
const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;

export function LandingPage() {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("menu");

  useEffect(() => {
    if (!open || panel !== "menu") return;
    const media = window.matchMedia("(min-width: 721px)");
    const closeMenu = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", closeMenu);
    return () => media.removeEventListener("change", closeMenu);
  }, [open, panel]);

  return (
    <main className="landing-page" id="home">
      <div className="landing-background" aria-hidden="true">
        <BackgroundVideo />
        <div className="landing-scrim" />
      </div>
      <a className="landing-skip" href="#main-content">
        Skip to content
      </a>
      <Sheet open={open} onOpenChange={setOpen}>
        <header className="landing-header">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "marketing", size: "icon-lg" }),
              "landing-logo",
            )}
            aria-label="Clarivo home"
          >
            <Image
              src="/assets/logo.svg"
              alt=""
              width={52}
              height={52}
              priority
            />
          </Link>
          <nav className="landing-nav" aria-label="Main navigation">
            <Link
              href="/"
              className="landing-nav-link active"
              aria-current="page"
            >
              Home
            </Link>
            <SheetTrigger
              render={<Button variant="ghost" className="landing-nav-link" />}
              onClick={() => setPanel("product")}
            >
              Product
            </SheetTrigger>
            <SheetTrigger
              render={<Button variant="ghost" className="landing-nav-link" />}
              onClick={() => setPanel("how")}
            >
              How it works
            </SheetTrigger>
            <Link href="/login" className="landing-nav-link">
              Log in <ArrowUpRight aria-hidden="true" />
            </Link>
          </nav>
          <Link
            href="/demo"
            className={cn(
              buttonVariants({ variant: "marketing-dark" }),
              "landing-demo",
            )}
          >
            Explore demo <ArrowUpRight aria-hidden="true" />
          </Link>
          <SheetTrigger
            render={
              <Button
                variant="marketing-dark"
                size="icon-lg"
                className="landing-burger"
                aria-label="Open navigation"
              />
            }
            onClick={() => setPanel("menu")}
          >
            <span aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </SheetTrigger>
        </header>
        <SheetContent
          side="top"
          className={cn(
            "landing-sheet",
            panel === "menu" && "landing-menu-sheet",
          )}
          overlayClassName="landing-overlay"
        >
          <SheetTitle>
            {panel === "menu"
              ? "Clarivo"
              : panel === "product"
                ? "Good support knows its limits."
                : "From your knowledge to their answer."}
          </SheetTitle>
          <SheetDescription>
            {panel === "menu"
              ? "Thoughtful support. Human when it matters."
              : "The Clarivo product vision. Explore the local dashboard prototype today."}
          </SheetDescription>
          {panel === "menu" ? (
            <nav className="landing-menu-links" aria-label="Mobile navigation">
              <Link href="/" onClick={() => setOpen(false)} aria-current="page">
                Home <span aria-hidden="true">•••</span>
              </Link>
              <Link href="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
              <Button variant="ghost" onClick={() => setPanel("product")}>
                Product
              </Button>
              <Button variant="ghost" onClick={() => setPanel("how")}>
                How it works
              </Button>
              <Link
                href="/demo"
                onClick={() => setOpen(false)}
                className={buttonVariants({ variant: "default", size: "lg" })}
              >
                Explore the demo <ArrowUpRight aria-hidden="true" />
              </Link>
            </nav>
          ) : (
            <>
              <ol className="landing-explainer">
                {(panel === "how"
                  ? steps
                  : [
                      {
                        title: "Answers from your business",
                        text: "The agent answers support questions from your knowledge base, declines off-topic requests, and hands off when there is not enough evidence.",
                      },
                      {
                        title: "A smooth handoff",
                        text: "Visitors can ask for a person at any time. You pick up the conversation with its history, reply, and hand it back when you are ready.",
                      },
                      {
                        title: "A calmer place to work",
                        text: "Keep conversations, knowledge sources, and your widget settings in one focused support workspace.",
                      },
                    ]
                ).map((step, index) => (
                  <li key={step.title}>
                    <span>0{index + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="landing-prototype-note">
                Available now: a dashboard demo with sample data. AI, uploads,
                authentication, and the installable widget are still in
                development.
              </p>
              <Link href="/demo" className={buttonVariants({ size: "lg" })}>
                Explore the dashboard demo <ArrowUpRight aria-hidden="true" />
              </Link>
            </>
          )}
          <a
            className="landing-font-credit"
            href="https://www.onlinewebfonts.com/fonts"
            target="_blank"
            rel="noreferrer"
          >
            Display font via OnlineWebFonts
          </a>
        </SheetContent>
      </Sheet>
      <section
        className="landing-hero"
        id="main-content"
        aria-labelledby="landing-heading"
        tabIndex={-1}
      >
        <div className="landing-trust landing-reveal" style={delay(0.05)}>
          <div className="landing-trust-icons" aria-hidden="true">
            {[BookOpen, MessageCircle, UserRound].map((Icon) => (
              <span key={Icon.displayName}>
                <span>
                  <Icon />
                </span>
              </span>
            ))}
          </div>
          <span className="landing-trust-pill">
            Your knowledge. A human touch.
          </span>
        </div>
        <h1 id="landing-heading" className="landing-headline">
          <span>Thoughtful support.</span>
          <span>Human when it matters.</span>
        </h1>
        <p className="landing-subhead landing-reveal" style={delay(0.28)}>
          AI that answers from your knowledge. A seamless handoff
          <br className="landing-desktop-break" /> to you when it can’t. Meet
          Clarivo.
        </p>
        <div className="landing-actions landing-reveal" style={delay(0.4)}>
          <Link
            href="/demo"
            className={cn(
              buttonVariants({ variant: "marketing", size: "lg" }),
              "landing-cta",
            )}
          >
            Explore the demo{" "}
            <ArrowUpRight data-icon="inline-end" aria-hidden="true" />
          </Link>
          <span className="landing-demo-note">
            A little less busywork. A lot more human.
          </span>
        </div>
      </section>
      <footer className="landing-footer">
        <dl className="landing-highlights">
          {highlights.map((item, index) => (
            <div
              key={item.value}
              className="landing-highlight landing-reveal"
              style={delay(0.5 + index * 0.08)}
            >
              <span className="landing-glyph" aria-hidden="true">
                {item.glyph}
              </span>
              <dt>{item.value}</dt>
              <dd>{item.label}</dd>
            </div>
          ))}
        </dl>
        <div className="landing-bottom">
          <span>
            CLARIVO <span className="landing-bottom-dot">/</span> BUILT AROUND
            PEOPLE
          </span>
          <span>
            PRODUCT PREVIEW <span className="landing-status-dot" />
          </span>
        </div>
      </footer>
    </main>
  );
}
