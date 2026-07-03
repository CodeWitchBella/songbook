import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

import { api } from "#/app.ts";

const publicDir = resolve(process.env.PUBLIC_DIR ?? join(import.meta.dirname, "../public"));

const mimeTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

async function readIfInside(filePath: string): Promise<Buffer | null> {
  const resolved = resolve(filePath);
  if (resolved !== publicDir && !resolved.startsWith(publicDir + "/")) return null;
  try {
    return await readFile(resolved);
  } catch {
    return null;
  }
}

async function serveStatic(pathname: string): Promise<Response | null> {
  const body = (await readIfInside(join(publicDir, pathname))) ?? (await readIfInside(join(publicDir, "index.html")));
  if (!body) return null;
  const contentType = mimeTypes[extname(pathname)] ?? "text/html; charset=utf-8";
  return new Response(body, { headers: { "content-type": contentType } });
}

const app = new Hono();

// The REST/OpenAPI surface lives under /api.
app.route("/api", api);

// Everything else falls back to the built static frontend (SPA).
app.get("*", async c => {
  const staticResponse = await serveStatic(new URL(c.req.url).pathname);
  if (staticResponse) return staticResponse;
  return c.text("Not found", 404);
});

app.onError((err, c) => {
  if (err instanceof Response) return err;
  console.error(err.stack);
  return c.text(err.stack ?? String(err), 500);
});

const port = 5512;

// In Docker bind the IPv6 wildcard (dual-stack, all interfaces). Locally bind
// only the loopback addresses on both stacks so the server is reachable via
// 127.0.0.1 (e.g. Vite's proxy) and ::1, but not from other hosts.
const hostnames = process.env.DOCKER ? ["::"] : ["127.0.0.1", "::1"];

for (const hostname of hostnames) {
  serve({ fetch: app.fetch, port, hostname }, info => {
    console.log(`listening on http://${hostname.includes(":") ? `[${hostname}]` : hostname}:${info.port}`);
  });
}
