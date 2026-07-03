import { setProjectAnnotations } from "@storybook/react-vite";

import * as preview from "./preview";

// Apply this project's Storybook decorators/parameters/globals to the stories
// when they run as Vitest tests.
setProjectAnnotations([preview.default]);
