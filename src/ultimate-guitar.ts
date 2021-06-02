export async function handleUltimateGuitar(
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);
  const id = Number.parseInt(url.searchParams.get("id") || "0", 10);
  if (!id) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
    });
  }
  const r = await fetch(
    "https://www.ultimate-guitar.com/contribution/correct/create?id=" + id,
  );
  if (r.status !== 200) {
    return new Response(JSON.stringify({ error: "Cannot load from UG" }), {
      status: 424,
    });
  }
  const data = await r.text();

  const text = before(
    after(after(data, '<textarea id="js-tab-text"'), ">"),
    "</textarea>",
  );

  return new Response(JSON.stringify({ text }));
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
