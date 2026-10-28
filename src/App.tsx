// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import "@mantine/core/styles.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { AppLayout } from "./components/AppLayout";
import { createAppColorSchemeManager } from "./lib/colorSchemeManager";

// Created once at module scope so its subscription identity is stable. It only
// reads the validated stored theme; ThemeControl persists and reports failures.
const colorSchemeManager = createAppColorSchemeManager();

// Thin root: sets up Mantine (CSS + provider + color-scheme manager) and
// composes the feature component.
function App() {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider
        defaultColorScheme="auto"
        colorSchemeManager={colorSchemeManager}
      >
        <AppLayout />
      </MantineProvider>
    </>
  );
}

export default App;
