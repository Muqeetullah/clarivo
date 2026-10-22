import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import * as db from "@clarivo/db/app";
import { idSchema, normalizeEmbedHost } from "@clarivo/shared";
import { hostAllowed } from "@/lib/visitor/development-hosts";
import { avatarUrl } from "@/lib/storage/avatars";
import { WidgetChat } from "@/components/widget/chat";

export default function WidgetPage(props: { params: Promise<{ workspaceId: string }>; searchParams: Promise<{ host?: string; parentOrigin?: string }> }) {
  return <Suspense fallback={<p role="status">Loading support…</p>}><WidgetPageContent {...props} /></Suspense>;
}
async function WidgetPageContent({ params, searchParams }: { params: Promise<{ workspaceId: string }>; searchParams: Promise<{ host?: string; parentOrigin?: string }> }) {
  await connection();
  const { workspaceId } = await params;
  if (!idSchema.safeParse(workspaceId).success) notFound();
  const input = await searchParams;
  let host: string, parentOrigin: string;
  try {
    host = normalizeEmbedHost(input.host ?? "");
    const parent = new URL(input.parentOrigin ?? "");
    if (!["https:", "http:"].includes(parent.protocol) || parent.hostname !== host || parent.origin !== input.parentOrigin) notFound();
    parentOrigin = parent.origin;
  } catch { notFound(); }
  const workspace = await db.getPublicWorkspace(workspaceId);
  if (!workspace || !hostAllowed(host, workspace.settings.allowedDomains)) notFound();
  const owner = await db.getPublicOwnerPresentation(workspace.id);
  return <WidgetChat workspaceId={workspaceId} host={host} parentOrigin={parentOrigin} owner={owner} settings={{ ...workspace.settings, avatarUrl: avatarUrl(workspace.settings.avatarKey) }} />;
}
