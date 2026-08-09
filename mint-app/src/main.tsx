import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CDPReactProvider } from "@coinbase/cdp-react";
import { cdpConfig } from "./config";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CDPReactProvider config={cdpConfig}>
      <App />
    </CDPReactProvider>
  </StrictMode>,
);
