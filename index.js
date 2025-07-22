import * as rend from "./pkg/songbook_renderer.js";

const wasm = await fetchWasm();
const mod = await rend.default({
  module_or_path: wasm,
});
console.log(mod);
console.log(mod.run());

reloading();

async function reloading() {
  while (true) {
    await new Promise((r) => setTimeout(r, 100));
    try {
      const w2 = await fetchWasm({ cache: "reload", method: "HEAD" });
      if (
        w2.status === 200 &&
        w2.headers.get("content-length") !== wasm.headers.get("content-length")
      ) {
        window.location.reload();
      }
    } catch {}
  }
}

function fetchWasm(opts) {
  return fetch(
    new URL("./pkg/songbook_renderer_bg.wasm", import.meta.url),
    opts,
  );
}
