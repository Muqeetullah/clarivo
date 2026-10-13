import { logAuthFailure } from "@/lib/auth/diagnostics";
import { getAuth } from "@/lib/auth/server";
import { authUserExistsById } from "@clarivo/db";
import { z } from "zod";

type Context = { params: Promise<{ path: string[] }> };
type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
const signupResult = z.object({ user: z.object({ id: z.string().min(1) }) });

async function handle(method: Method, request: Request, context: Context) {
  const { path } = await context.params;
  // Live branches have magic links disabled and signup protection unset. Keep
  // both issuance and redemption closed until Managed Auth's verified-only
  // behavior has been confirmed. A client flag cannot enforce this policy.
  const endpoint = path.join("/");
  if (endpoint === "sign-in/magic-link" || endpoint === "magic-link/verify") {
    return Response.json(
      {
        code: "MAGIC_LINK_UNAVAILABLE",
        message:
          "Magic link sign-in is awaiting secure configuration. Please use your password or Google.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const response = await getAuth().handler()[method](request, context);
    if (method === "POST" && endpoint === "sign-up/email" && response.ok) {
      // With required verification, Better Auth deliberately returns a
      // synthetic success for existing emails. Check the upstream-generated
      // ID, never a client-supplied identity, before claiming signup succeeded.
      const result = signupResult.parse(await response.clone().json());
      if (!(await authUserExistsById(result.user.id))) {
        return Response.json(
          {
            code: "USER_ALREADY_EXISTS",
            message:
              "An account already exists with this email. Log in instead, or continue with Google if you used Google to sign up.",
          },
          { status: 409, headers: { "Cache-Control": "no-store" } },
        );
      }
    }
    return response;
  } catch (error) {
    logAuthFailure("handler", error);
    return Response.json(
      {
        code: "AUTH_UNAVAILABLE",
        message: "Sign-in is temporarily unavailable. Please try again.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const GET = (request: Request, context: Context) =>
  handle("GET", request, context);
export const POST = (request: Request, context: Context) =>
  handle("POST", request, context);
export const PUT = (request: Request, context: Context) =>
  handle("PUT", request, context);
export const DELETE = (request: Request, context: Context) =>
  handle("DELETE", request, context);
export const PATCH = (request: Request, context: Context) =>
  handle("PATCH", request, context);
