import { getPublicWorkspace } from "@clarivo/db/app";
import { frameAncestors } from "@/lib/visitor/development-hosts";
import { logAuthFailure } from "@/lib/auth/diagnostics";
import { NextResponse, type NextRequest } from "next/server";
import { getAuth } from "@/lib/auth/server";

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/widget/")) {
    try {
      const id = request.nextUrl.pathname.split("/")[2];
      const workspace = await getPublicWorkspace(id);
      const response = NextResponse.next();
      response.headers.set(
        "Content-Security-Policy",
        workspace
          ? frameAncestors(workspace.settings.allowedDomains)
          : "frame-ancestors 'none'",
      );
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    } catch {
      return new NextResponse("Support temporarily unavailable", {
        status: 503,
        headers: { "Content-Security-Policy": "frame-ancestors 'none'" },
      });
    }
  }
  if (request.nextUrl.pathname === "/") {
    // Shared-provider returns can land at the origin root. Send the verifier
    // to the SDK-protected callback destination so Neon exchanges it there.
    if (request.nextUrl.searchParams.has("neon_auth_session_verifier")) {
      const callback = request.nextUrl.clone();
      callback.pathname = "/dashboard";
      return NextResponse.redirect(callback);
    }
    return NextResponse.next();
  }
  try {
    // The SDK also exchanges the OAuth verifier on return to /dashboard.
    return await getAuth().middleware({ loginUrl: "/login" })(request);
  } catch (error) {
    logAuthFailure("proxy", error);
    return NextResponse.redirect(new URL("/auth-error", request.url));
  }
}

export const config = { matcher: ["/", "/dashboard/:path*", "/widget/:path*"] };
