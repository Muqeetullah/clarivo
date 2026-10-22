import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const files = new Map([
  ["/", ["index.html", "text/html"]],
  ["/playground.js", ["playground.js", "text/javascript"]],
]);
createServer(async (request, response) => {
  if (new URL(request.url, "http://localhost:4000").pathname === "/preview") {
    response
      .writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      })
      .end(
        "<!doctype html><html><head><title>Preview</title></head><body></body></html>",
      );
    return;
  }
  const file = files.get(
    new URL(request.url, "http://localhost:4000").pathname,
  );
  if (!file) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const body = await readFile(new URL(file[0], import.meta.url));
    response
      .writeHead(200, {
        "Content-Type": `${file[1]}; charset=utf-8`,
        "Cache-Control": "no-store",
      })
      .end(body);
  } catch {
    response.writeHead(500).end("Unable to load playground");
  }
}).listen(4000, "127.0.0.1", () => {
  console.log("Clarivo script playground: http://localhost:4000");
});
