import * as Sentry from "@sentry/react";
import "inter-ui/inter.css";
import "./index.css";

import * as ReactDOM from "react-dom/client";
import { Routes } from "routes/routes";

import { EverythingProvider } from "./everything-provider";

Sentry.init({
  dsn: "https://5f156148cd78093fb3416b2df2a5c553@o136476.ingest.us.sentry.io/4508608240615424",
});

const app = document.getElementById("root")!;
const root = ReactDOM.createRoot(app);
root.render(
  <EverythingProvider>
    <Routes />
  </EverythingProvider>,
);
