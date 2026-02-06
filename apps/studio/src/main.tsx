import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";

import { AppProvider } from "./contexts/AppProvider";
import { mountStudioAPI } from "./lib/studio-api";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProvider />
  </React.StrictMode>,
);

mountStudioAPI();
