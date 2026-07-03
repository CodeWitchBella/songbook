import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";

import viteConfig from "./vite.config";

const dirname = fileURLToPath(new URL(".", import.meta.url));

// Run the Storybook stories as Vitest browser tests. The browser itself does
// not run locally: we connect to the Playwright server the flake starts in
// podman (see `playwright-start`, ws://localhost:3000/). PLAYWRIGHT_WS_ENDPOINT
// is exported by the dev shell / process-compose; the default keeps
// `pnpm run test-storybook` working when the server is started by hand.
const wsEndpoint = process.env.PLAYWRIGHT_WS_ENDPOINT || "ws://localhost:3000/";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({ configDir: `${dirname}.storybook`, storybookScript: "pnpm run storybook --ci" }),
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({
                connectOptions: {
                  wsEndpoint,
                  // Let the containerized browser reach the Vitest dev server
                  // running on the host over loopback.
                  exposeNetwork: "<loopback>",
                },
              }),
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  }),
);
