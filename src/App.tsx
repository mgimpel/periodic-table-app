// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import "@mantine/core/styles.css";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { PeriodicTable } from "./components/PeriodicTable";

// Thin root: sets up Mantine (CSS + provider) and composes the feature component.
function App() {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider defaultColorScheme="auto">
        <PeriodicTable />
      </MantineProvider>
    </>
  );
}

export default App;
