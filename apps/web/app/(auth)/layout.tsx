import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { AuthVisual } from "@/components/auth-visual";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell dark grid min-h-svh lg:grid-cols-2">
      <div className="auth-form-panel flex min-w-0 flex-col">
        <Link
          href="/"
          className="auth-brand flex w-fit items-center gap-3"
          aria-label="Clarivo home"
        >
          <span className="auth-brand-mark">
            <Image src="/assets/logo.svg" alt="" width={36} height={36} />
          </span>
          <span className="text-xl font-semibold tracking-tight">clarivo</span>
        </Link>
        <div className="auth-form-body flex flex-1 items-center justify-center">
          <div className="auth-form-width w-full">{children}</div>
        </div>
      </div>
      <AuthVisual />
    </main>
  );
}
