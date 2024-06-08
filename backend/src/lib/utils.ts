import latinize from "latinize";

export function slugify(part: string) {
  return latinize(part)
    .replace(/[^a-z_0-9]/gi, " ")
    .trim()
    .replace(/ +/g, "-")
    .toLowerCase();
}
export async function randomID(length: number) {
  const bytes = crypto.getRandomValues(
    new Uint8Array(Math.ceil((length / 3) * 2) + 1 + 3)
  );
  if (!bytes) throw new Error("Could not generate random bytes");
  let ret = bufferToBase64(bytes)
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .slice(0, length)
    .replace(/=/g, "");
  while (ret.length < length) {
    ret += await randomID(length - ret.length);
  }
  return ret;
}
function bufferToBase64(buf: Uint8Array) {
  var binstr = Array.prototype.map
    .call(buf, function (ch) {
      return String.fromCharCode(ch);
    })
    .join("");
  return btoa(binstr);
}
