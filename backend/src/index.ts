import { createServer } from "node:http";

import { handleCreateSong } from "./endpoints/create-song.ts";
import { handleGraphql } from "./endpoints/graphql.ts";
import { handleImport } from "./endpoints/import.ts";
import { handleLogin } from "./endpoints/login.ts";
import { handleLogout } from "./endpoints/logout.ts";
import { handleReleases } from "./endpoints/releases.ts";
import { forward } from "./forward.ts";
import type { MyContext } from "./lib/context.ts";
import { contextPair } from "./lib/context.ts";

async function handleRequest(
  request: Request,
  createContext: () => Promise<MyContext>,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api")) url.pathname = url.pathname.slice(4);
    if (url.pathname === "/hello") return new Response("World");
    if (url.pathname === "/graphql")
      return await handleGraphql(request, await createContext());
    if (request.method === "POST") {
      if (url.pathname === "/login")
        return await handleLogin(request, await createContext());
      if (url.pathname === "/logout")
        return await handleLogout(await createContext());
      if (url.pathname === "/song")
        return await handleCreateSong(request, await createContext());
    }
    if (url.pathname === "/ultimate-guitar" || url.pathname === "/import")
      return await handleImport(request);
    if (url.pathname === "/releases") return await handleReleases(request);
    if (url.pathname === "/beacon.min.js")
      return await forward(
        request,
        "https://static.cloudflareinsights.com/beacon.min.js",
      );
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

server.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
});
