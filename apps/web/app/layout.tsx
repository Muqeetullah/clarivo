import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthNavigationProvider } from "@/components/auth-navigation";

export const metadata: Metadata = {
  title: "Clarivo — Thoughtful support. Human when it matters.",
  description:
    "AI support grounded in your knowledge. A human when it matters. Explore the Clarivo customer support demo.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* App Router has no pages/_document; the supplied CDN font is shared here. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://db.onlinewebfonts.com/c/8cb707a9b8a73f8a7403336b861c3074?family=BubbledotICG-FinePos"
        />
      </head>
      <body>
        <AuthNavigationProvider>{children}</AuthNavigationProvider>
      </body>
    </html>
  );
}
