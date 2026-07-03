export function jsonResponse(json: any, status = 200): Response {
  return new Response(JSON.stringify(json), {
    headers: { "content-type": "application/json" },
    status,
  });
}

export function badRequestResponse(error: string): Response {
  return jsonResponse({ error }, 400);
}

export function methodNotAllowedResponse(): Response {
  return new Response("Method not allowed", {
    status: 405,
    headers: { "content-type": "text/plain" },
  });
}
