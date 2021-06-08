import latinize from "latinize";
import nodeCrypto from "crypto";

export function slugify(part: string) {
  return latinize(part)
    .replace(/[^a-z_0-9]/gi, " ")
    .trim()
    .replace(/ +/g, "-")
    .toLowerCase();
}
export async function randomID(length: number) {
  let ret = nodeCrypto
    .randomBytes(Math.ceil((length / 3) * 2) + 1 + 3)
    .toString("base64")
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .slice(0, length)
    .replace(/=/g, "");
  while (ret.length < length) {
    ret += randomID(length - ret.length);
  }
  return ret;
}
