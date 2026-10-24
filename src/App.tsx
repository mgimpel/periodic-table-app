// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import "@mantine/core/styles.css";
import { useRef } from "react";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { AppLayout } from "./components/AppLayout";
import { createAppColorSchemeManager } from "./lib/colorSchemeManager";

// Thin root: sets up Mantine (CSS + provider + persistent color-scheme manager)
// and composes the feature component. The manager owns persistence (Req 5.1-5.3)
// but can't hold React state, so a failed save (Req 5.4) is routed to AppLayout,
// which owns the inline notice: App keeps a ref to the handler AppLayout
// registers, and the manager's onSaveError fires it.
function App() {
  const saveErrorHandlerRef = useRef<() => void>(null);
  // Create the manager once (not per render) so its subscription identity is
  // stable across re-renders.
  const colorSchemeManagerRef = useRef<ReturnType<
    typeof createAppColorSchemeManager
  > | null>(null);
  if (colorSchemeManagerRef.current === null) {
    colorSchemeManagerRef.current = createAppColorSchemeManager(() =>
      saveErrorHandlerRef.current?.(),
    );
  }

  return (
    <>
      <ColorSchemeScript defaultColorScheme="auto" />
      <MantineProvider
        defaultColorScheme="auto"
        colorSchemeManager={colorSchemeManagerRef.current}
      >
        <AppLayout
          registerSaveErrorHandler={(handler) => {
            saveErrorHandlerRef.current = handler;
          }}
        />
      </MantineProvider>
    </>
  );
}

export default App;
