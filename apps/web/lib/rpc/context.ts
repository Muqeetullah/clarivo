import "server-only";
import { ORPCError } from "@orpc/server";
import * as db from "@clarivo/db/app";
import { getAuth } from "@/lib/auth/server";
import { hostAllowed } from "@/lib/visitor/development-hosts";
import { matchesVisitorSecret, readVisitorToken } from "@/lib/visitor/tokens";

export type RpcContext = { request: Request };
export async function verifiedOwner(context: RpcContext) {
  const origin = context.request.headers.get("origin");
  if (origin && origin !== new URL(context.request.url).origin)
    throw new ORPCError("FORBIDDEN");
  const result = await getAuth().getSession({
    query: { disableCookieCache: "true", disableRefresh: true },
  });
  const user = result.error ? undefined : result.data?.user;
  if (!user || !user.emailVerified) throw new ORPCError("UNAUTHORIZED");
  return user;
}
export async function ownerContext(context: RpcContext) {
  const user = await verifiedOwner(context);
  const workspace = await db.workspaceForOwner(user.id);
  if (!workspace) throw new ORPCError("ONBOARDING_REQUIRED");
  return { user, workspaceId: workspace.id, memberId: workspace.membership.id };
}
export async function visitorContext(context: RpcContext) {
  const bearer = context.request.headers.get("authorization");
  if (!bearer?.startsWith("Bearer ")) throw new ORPCError("UNAUTHORIZED");
  try {
    const identity = await readVisitorToken(bearer.slice(7));
    const [stored, workspace] = await Promise.all([
      db.getVisitorIdentity(identity.workspaceId, identity.visitorId),
      db.getPublicWorkspace(identity.workspaceId),
    ]);
    if (
      !stored ||
      !workspace ||
      !matchesVisitorSecret(identity.secret, stored.secretHash) ||
      !hostAllowed(identity.host, workspace.settings.allowedDomains)
    )
      throw new ORPCError("FORBIDDEN");
    return identity;
  } catch (error) {
    if (error instanceof ORPCError) throw error;
    throw new ORPCError("UNAUTHORIZED");
  }
}
