import * as Sentry from "@sentry/react";
import "@fontsource-variable/inter/wght.css";
import "@fontsource/cantarell/400.css";
import "@fontsource/cantarell/700.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/700.css";
import "@fontsource/shantell-sans/400.css";
import "@fontsource/shantell-sans/700.css";
import "./index.css";

import * as ReactDOM from "react-dom/client";
import { Routes } from "#/routes/routes";

import { EverythingProvider } from "./everything-provider";

Sentry.init({
  dsn: "https://ead38a7c6f062497130ffe0e316681df@o4511707787821056.ingest.de.sentry.io/4511707795750992",
});

const app = document.getElementById("root")!;
const root = ReactDOM.createRoot(app);
root.render(
  <EverythingProvider>
    <Routes />
  </EverythingProvider>,
);
