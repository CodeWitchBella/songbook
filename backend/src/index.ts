import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { etag } from "hono/etag";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

import { api } from "#/app.ts";
import { migrate } from "#/db/migrate.ts";

async function readCommitFile(name: string): Promise<string> {
  try {
    return (await readFile(join(import.meta.dirname, "..", name), "utf8")).trim();
  } catch {
    return "";
  }
}
const commitSha = await readCommitFile(".commit-sha");
const commitTime = await readCommitFile(".commit-time");
const version =
  [commitTime ? new Date(Number(commitTime) * 1000).toISOString() : "", commitSha ? commitSha.slice(0, 8) : ""]
    .filter(Boolean)
    .join(" ") || "dev";
console.log(`songbook backend ${version}`);

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

const UPDATE_GATED = "public, max-age=0, s-maxage=5, must-revalidate";

function cacheControl(pathname: string): string {
  if (pathname?.startsWith("/assets/")) return "public, max-age=31536000, immutable";
  return UPDATE_GATED;
}

async function serveStatic(pathname: string): Promise<Response | null> {
  const exact = await readIfInside(join(publicDir, pathname));
  if (exact) {
    const contentType = mimeTypes[extname(pathname)] ?? "text/html; charset=utf-8";
    return new Response(new Uint8Array(exact), {
      headers: { "content-type": contentType, "cache-control": cacheControl(pathname) },
    });
  }

  if (pathname.startsWith("/assets/")) return null;
  if (pathname.includes(".")) return null;

  const shell = await readIfInside(join(publicDir, "index.html"));
  if (!shell) return null;
  return new Response(new Uint8Array(shell), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": UPDATE_GATED },
  });
}

const app = new Hono();

// The REST/OpenAPI surface lives under /api.
app.route("/api", api);

// Everything else falls back to the built static frontend (SPA).
app.get("*", etag(), async c => {
  const staticResponse = await serveStatic(new URL(c.req.url).pathname);
  if (staticResponse) return staticResponse;
  return c.text("Not found", 404);
});

app.onError((err, c) => {
  if (err instanceof Response) return err;
  console.error(err.stack);
  return c.text(err.stack ?? String(err), 500);
});

migrate();

const port = process.env.PORT ? Number(process.env.PORT) : 5512;

// In Docker bind the IPv6 wildcard (dual-stack, all interfaces). Locally bind
// only the loopback addresses on both stacks so the server is reachable via
// 127.0.0.1 (e.g. Vite's proxy) and ::1, but not from other hosts.
const hostnames = process.env.DOCKER ? ["::"] : ["127.0.0.1", "::1"];

for (const hostname of hostnames) {
  serve({ fetch: app.fetch, port, hostname }, info => {
    console.log(`listening on http://${hostname.includes(":") ? `[${hostname}]` : hostname}:${info.port}`);
  });
}
