import { RPCHandler } from "@orpc/server/fetch";
import { router } from "@/lib/rpc/router";
const handler = new RPCHandler(router);
async function handle(request: Request) {
  const result = await handler.handle(request, { prefix: "/rpc", context: { request } });
  const response = result.response ?? new Response("Not found", { status: 404 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
export const maxDuration = 30;
