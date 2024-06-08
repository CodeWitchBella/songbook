import "inter-ui/inter.css";
import "./index.css";

import * as ReactDOM from "react-dom/client";
import { Routes } from "routes/routes";

import { EverythingProvider } from "./everything-provider";

const app = document.getElementById("root")!;
const root = ReactDOM.createRoot(app);
root.render(
  <EverythingProvider>
    <Routes />
  </EverythingProvider>,
);
