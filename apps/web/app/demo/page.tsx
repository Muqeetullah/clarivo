import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = { title: "Dashboard demo — Clarivo" };

export default function DemoPage() {
  return <Dashboard />;
}
