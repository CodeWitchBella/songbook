import * as rend from "./pkg/songbook_renderer.js";

const wasm = await fetchWasm();
const mod = await rend.default({
  module_or_path: wasm,
});
console.log(mod);
console.log(mod.run());

window.addEventListener("resize", resize);

reloading();

function resize() {
  mod.run();
}

async function reloading() {
  while (true) {
    await new Promise((r) => setTimeout(r, 100));
    try {
      const w2 = await fetchWasm({ cache: "reload", method: "HEAD" });
      const cmp = (header) =>
        w2.headers.get(header) !== wasm.headers.get(header);
      if (
        w2.status === 200 &&
        (cmp("content-length") || cmp("last-modified"))
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
