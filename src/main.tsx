// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { currentPlatform } from "./lib/platform";
import "./i18n";

// Expose the OS as a data attribute so CSS can make small platform-specific
// tweaks via :global([data-os="…"]) without threading a prop through the
// component tree. Today only the Linux legend-swatch nudge in
// PeriodicTable.module.css uses it. Set once;
// the OS can't change mid-session. Skip "unknown" so the attribute is absent in
// non-Tauri/unrecognized contexts rather than carrying a meaningless value.
const os = currentPlatform();
if (os !== "unknown") {
  document.documentElement.dataset.os = os;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
