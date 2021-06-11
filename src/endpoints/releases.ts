import { MyContext } from "../lib/context";
import {
  firestoreDoc,
  queryFieldEqualsSingle,
  serverTimestamp,
} from "../lib/firestore";
import { parseJsonBody, validateJsonBody } from "../lib/request";
import {
  badRequestResponse,
  jsonResponse,
  methodNotAllowedResponse,
} from "../lib/response";
import { getViewerCheck } from "../lib/server-config";
import { randomID, slugify } from "../lib/utils";

type GithubResponse = {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  author: any; // there is bunch of fields that I don't care about
  node_id: string;
  tag_name: string; //"v2021-06-08";
  target_commitish: string; //"main";
  name: string; //"8th June 2021 / 8. června 2021";
  draft: boolean;
  prerelease: boolean;
  created_at: string; // "2021-06-08T16:03:55Z";
  published_at: string; // "2021-06-08T20:58:36Z";
  assets: any[]; // []
  tarball_url: string;
  zipball_url: string;
  body: string; // "## English\r\n\r\n- ...\r\n\r\n## Česky\r\n\r\n- ...\r\n";
};

export async function handleReleases(event: FetchEvent) {
  const { request } = event;
  if (request.method !== "GET") return methodNotAllowedResponse();

  let response = await caches.default.match(request.url);
  if (!response) {
    const fetched = await fetch(
      "https://api.github.com/repos/CodeWitchBella/songbook/releases?per_page=100",
      {
        headers: {
          accept: "application/vnd.github.v3+json",
          "User-Agent": "codewitchbella-songbook-workers",
        },
      },
    );
    if (fetched.status !== 200) {
      response = new Response(
        JSON.stringify({
          error: "subrequest failed",
          status: fetched.status,
          body: await fetched.text(),
        }),
        {
          status: 500,
          headers: { "Cache-Control": "s-maxage=10" },
        },
      );
    } else {
      const json: GithubResponse[] = await fetched.json();
      response = new Response(
        JSON.stringify({
          data: json
            .filter(entry => !entry.prerelease && !entry.draft)
            .map(entry => ({
              name: entry.name,
              tagName: entry.tag_name,
              body: entry.body.replaceAll("\r\n", "\n"),
            })),
        }),
        { status: 200 },
      );
      response.headers.append(
        "cache-control",
        "s-maxage=60,s-stale-while-revalidate=1200",
      );
    }
    response.headers.append("content-type", "application/json; charset=utf-8");
    event.waitUntil(caches.default.put(request.url, response.clone()));
  }
  return response;
}
