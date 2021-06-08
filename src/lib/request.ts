import { badRequestResponse } from "./response";

export async function parseJsonBody(request: Request) {
  if (
    request.headers
      .get("content-type")
      ?.split(";")[0]
      .trim() !== "application/json"
  ) {
    throw badRequestResponse("content-type must be application/json");
  }
  return await request.json();
}
