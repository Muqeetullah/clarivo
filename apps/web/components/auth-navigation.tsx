"use client";

import {
  Fragment,
  createContext,
  useContext,
  useState,
  useTransition,
  type ComponentProps,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircleIcon } from "lucide-react";

type AuthDestination =
  | "/login"
  | "/signup"
  | "/dashboard"
  | "/auth-error"
  | `/verify-email?${string}`;
type Navigate = (
  href: AuthDestination,
  options?: { replace?: boolean; refreshSession?: boolean },
) => void;
const NavigationContext = createContext<{
  navigate: Navigate;
  navigating: boolean;
  sessionVersion: number;
} | null>(null);

export function AuthNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [sessionVersion, setSessionVersion] = useState(0);
  const [navigating, startTransition] = useTransition();
  const [message, setMessage] = useState("Getting things ready…");
  const navigate: Navigate = (href, options) => {
    if (options?.refreshSession) setSessionVersion((version) => version + 1);
    setMessage(
      href === "/dashboard"
        ? "Opening your workspace…"
        : href.startsWith("/verify-email")
          ? "Preparing email verification…"
          : href === "/signup"
            ? "Preparing your account…"
            : "Opening sign in…",
    );
    startTransition(() => {
      // SDK mutations change cookies outside Server Actions. Drop cached route
      // payloads before navigating so guards read the updated server session.
      if (options?.refreshSession) router.refresh();
      if (options?.replace) router.replace(href);
      else router.push(href);
    });
  };
  return (
    <NavigationContext.Provider
      value={{ navigate, navigating, sessionVersion }}
    >
      <div inert={navigating} style={{ display: "contents" }}>
        {children}
      </div>
      {navigating && (
        <div
          className="auth-navigation-overlay"
          role="status"
          aria-live="polite"
          aria-label={message}
        >
          <div className="auth-navigation-progress">
            <LoaderCircleIcon
              className="size-6 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            <span>{message}</span>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  );
}

export function useAuthNavigation() {
  const context = useContext(NavigationContext);
  if (!context)
    throw new Error("Auth navigation requires AuthNavigationProvider.");
  return context;
}

export function AuthLink({
  href,
  children,
  disabled = false,
  ...props
}: Omit<ComponentProps<typeof Link>, "href"> & {
  href: AuthDestination;
  disabled?: boolean;
}) {
  const { navigate, navigating } = useAuthNavigation();
  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      aria-disabled={disabled || navigating || undefined}
      onNavigate={(event) => {
        event.preventDefault();
        if (!disabled && !navigating) navigate(href);
      }}
    >
      {children}
    </Link>
  );
}

// Do not restore another account's cached form values after a session mutation.
export function AuthFormBoundary({ children }: { children: ReactNode }) {
  const { sessionVersion } = useAuthNavigation();
  return <Fragment key={sessionVersion}>{children}</Fragment>;
}
