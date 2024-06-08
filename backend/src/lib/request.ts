import { z } from "zod";
import { badRequestResponse } from "./response.js";

export async function parseJsonBody(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  ) {
    throw badRequestResponse("content-type must be application/json");
  }
  return await request.json();
}

/**
 * @deprecated switch to zod
 */
export async function validateJsonBody<
  Req extends string = never,
  Opt extends string = never,
  ReqNum extends string = never,
  OptNum extends string = never,
>(
  request: Request,
  config: {
    required: readonly (Req | { type: "number"; key: ReqNum })[];
    optional: readonly (Opt | { type: "number"; key: OptNum })[];
  },
): Promise<
  { [key in Opt]: string | null | undefined } & { [key in Req]: string } & {
    [key in OptNum]: number | null | undefined;
  } & { [key in ReqNum]: number }
> {
  const json: any = await parseJsonBody(request);

  // Check for extras
  const set = new Set<string>();
  for (const o of config.required) set.add(typeof o === "string" ? o : o.key);
  for (const o of config.optional) set.add(typeof o === "string" ? o : o.key);
  for (const key of Object.keys(json)) {
    if (!set.has(key)) {
      throw badRequestResponse("Unexpected key " + key);
    }
  }

  // check required
  for (const req of config.required) {
    if (typeof req === "string") {
      if (!json[req]) {
        throw badRequestResponse("Key " + req + " is required");
      }
      if (typeof json[req] !== "string") {
        throw badRequestResponse("Value of key " + req + " must be string");
      }
    } else {
      if (!json[req.key] && typeof json[req.key] !== "number") {
        throw badRequestResponse("Key " + req.key + " is required");
      }
      if (typeof json[req.key] !== "number") {
        throw badRequestResponse("Value of key " + req.key + " must be number");
      }
    }
  }

  // check optional
  for (const opt of config.optional) {
    if (json[opt] === undefined) {
      // it's optional
    } else if (typeof opt === "string") {
      if (typeof json[opt] !== "string") {
        throw badRequestResponse("Value of key " + opt + " must be string");
      }
    } else {
      if (typeof json[opt.key] !== "number") {
        throw badRequestResponse("Value of key " + opt.key + " must be number");
      }
    }
  }

  return json;
}

export async function validateZodJsonBody<T>(
  request: Request,
  schema: z.Schema<T>,
): Promise<T> {
  const json: any = await parseJsonBody(request);
  const res = schema.safeParse(json);
  if (res.error) {
    throw badRequestResponse(JSON.stringify(res.error));
  }
  return res.data;
}
