import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

import { handleCreateSong } from "#/endpoints/create-song.ts";
import { handleImport } from "#/endpoints/import.ts";
import { handleLogin } from "#/endpoints/login.ts";
import { handleLogout } from "#/endpoints/logout.ts";
import { handleReleases } from "#/endpoints/releases.ts";
import { handleRest } from "#/endpoints/rest.ts";
import { forward } from "#/forward.ts";
import type { MyContext } from "#/lib/context.ts";
import { contextPair } from "#/lib/context.ts";

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

async function handleRequest(request: Request, createContext: () => Promise<MyContext>): Promise<Response> {
  try {
    const url = new URL(request.url);
    const isApi = url.pathname.startsWith("/api");
    if (isApi) url.pathname = url.pathname.slice(4);
    if (url.pathname === "/hello") return new Response("World");
    if (request.method === "POST" && url.pathname.startsWith("/rest/"))
      return await handleRest(url.pathname.slice("/rest/".length), request, await createContext());
    if (request.method === "POST") {
      if (url.pathname === "/login") return await handleLogin(request, await createContext());
      if (url.pathname === "/logout") return await handleLogout(await createContext());
      if (url.pathname === "/song") return await handleCreateSong(request, await createContext());
    }
    if (url.pathname === "/ultimate-guitar" || url.pathname === "/import") return await handleImport(request);
    if (url.pathname === "/releases") return await handleReleases(request);
    if (url.pathname === "/beacon.min.js")
      return await forward(request, "https://static.cloudflareinsights.com/beacon.min.js");
    if (!isApi && (request.method === "GET" || request.method === "HEAD")) {
      const staticResponse = await serveStatic(url.pathname);
      if (staticResponse) return staticResponse;
    }
    return new Response("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    console.error(err.stack);
    return new Response(err.stack, {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}

const port = 5512;

const server = createServer(async (req, res) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else {
      headers.append(key, value);
    }
  }
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers,
    ...(hasBody ? { body: req as any, duplex: "half" } : {}),
  });

  const { createContext, finishContext } = contextPair(request);
  const response = await handleRequest(request, createContext);
  finishContext(response);

  res.statusCode = response.status;
  for (const [key, value] of response.headers) res.setHeader(key, value);
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
});

const host = process.env.DOCKER ? "::" : "localhost";

server.listen(port, host, () => {
  console.log(`listening on http://${host === "::" ? "[::]" : host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
