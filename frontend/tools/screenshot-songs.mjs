// Screenshot every song in the songbook.
//
// Connects to the Playwright server started by `playwright-start` (see
// flake.nix), fetches the full song list from the `/api/songs` endpoint and
// saves a full-page screenshot of each `/song/:slug` page.
//
// Usage:
//   playwright-start                      # start the browser server (once)
//   node tools/screenshot-songs.mjs [baseUrl]
//
// Defaults:
//   baseUrl  $SCREENSHOT_BASE_URL  or  http://localhost:5513
//
// The browser runs inside the Playwright container (host networking), so a
// baseUrl of http://localhost:5513 reaches a local `pnpm dev` server.

import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = (process.argv[2] ?? process.env.SCREENSHOT_BASE_URL ?? "http://localhost:5513").replace(/\/$/, "");
const outDir = "song-screenshots";
const wsEndpoint = process.env.PLAYWRIGHT_WS_ENDPOINT ?? "ws://localhost:3000/";
const CONCURRENCY = Number(process.env.SCREENSHOT_CONCURRENCY ?? 8);

// A filesystem-safe file name derived from a song slug.
function safeName(slug) {
  return slug.replace(/[^a-zA-Z0-9._-]/g, "_");
}

// Fetch every song slug from the API. Mirrors the app's own load query:
// POST /api/songs with skipDeleted so only current songs come back.
async function fetchSlugs() {
  const res = await fetch(`${baseUrl}/api/songs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      modifiedAfter: null,
      deletedAfter: new Date().toISOString(),
      skipDeleted: true,
    }),
  });
  if (!res.ok) throw new Error(`GET song list failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors) throw new Error(`API errors: ${JSON.stringify(json.errors)}`);
  const songs = json.data?.songs ?? [];
  return Array.from(new Set(songs.map(s => s.data?.slug).filter(Boolean)));
}

async function main() {
  await mkdir(outDir, { recursive: true });

  console.log(`Fetching song list from ${baseUrl}/api/songs …`);
  const slugs = await fetchSlugs();
  console.log(`Found ${slugs.length} songs.`);

  console.log(`Connecting to Playwright server at ${wsEndpoint} …`);
  const browser = await chromium.connect(wsEndpoint);
  const context = await browser.newContext({
    viewport: { width: 1200, height: 1600 },
    deviceScaleFactor: 2,
  });

  try {
    // Warm the data cache once before fanning out.
    const warmup = await context.newPage();
    await warmup.goto(`${baseUrl}/all-songs`, { waitUntil: "networkidle" });
    await warmup.close();

    let done = 0;
    // Screenshot one song on the given (worker-owned) page.
    async function shoot(page, slug) {
      const url = `${baseUrl}/song/${slug}`;
      try {
        await page.goto(url, { timeout: 30_000 });
        // The song content lives in <main>; wait for it to have real content.
        await page.waitForSelector("main div", { timeout: 15_000 });
        const file = `${outDir}/${safeName(slug)}.png`;
        await page.screenshot({ path: file, fullPage: true });
        console.log(`[${++done}/${slugs.length}] ${slug} -> ${file}`);
      } catch (err) {
        console.error(`[${++done}/${slugs.length}] FAILED ${slug}: ${err.message}`);
      }
    }

    // Fan out over a pool of pages, each pulling from a shared queue.
    const concurrency = Math.min(CONCURRENCY, slugs.length);
    const queue = slugs.slice();
    await Promise.all(
      Array.from({ length: concurrency }, async () => {
        const page = await context.newPage();
        try {
          for (let slug = queue.shift(); slug !== undefined; slug = queue.shift()) {
            await shoot(page, slug);
          }
        } finally {
          await page.close();
        }
      }),
    );

    // Leave a small manifest alongside the images.
    await writeFile(
      `${outDir}/index.json`,
      JSON.stringify({ baseUrl, count: slugs.length, slugs, generatedAt: new Date().toISOString() }, null, 2),
    );

    console.log(`Done. Screenshots saved to ${outDir}/`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
