export async function handleUltimateGuitar(
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const ug = url.searchParams.get("url");
  const begin = "https://tabs.ultimate-guitar.com/tab/";
  if (
    !ug ||
    !ug.startsWith(begin) ||
    !ug.substring(begin.length).match(/^[a-z0-9-]+\/[a-z0-9-]+$/i)
  ) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const r = await fetch(ug);
  if (r.status !== 200) {
    return new Response(JSON.stringify({ error: "Cannot load from UG" }), {
      status: 424,
      headers: { "content-type": "application/json" },
    });
  }
  const html = await r.text();

  const json = before(
    after(html, 'class="js-store" data-content="'),
    '"',
  ).replace(/&quot;/g, '"');
  console.log(json);

  const data = JSON.parse(json);
  const pageData = data["store"]["page"]["data"];
  const text = pageData["tab_view"]["wiki_tab"]["content"];

  return new Response(
    JSON.stringify({
      text,
      author: pageData["tab"]["artist_name"],
      title: pageData["tab"]["song_name"],
    }),
    { headers: { "content-type": "application/json" } },
  );
}

function after(text: string, delimiter: string) {
  const index = text.indexOf(delimiter);
  if (index < 0) return "";
  return text.substring(index + delimiter.length);
}

function before(text: string, delimiter: string) {
  const index = text.indexOf(delimiter);
  if (index < 0) return "";
  return text.substring(0, index);
}
