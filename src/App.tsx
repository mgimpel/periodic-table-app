// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import "@mantine/core/styles.css";
import {
  MantineProvider,
  ColorSchemeScript,
  localStorageColorSchemeManager,
  type MantineColorSchemeManager,
} from "@mantine/core";
import { AppLayout } from "./components/AppLayout";
import { readStoredTheme } from "./lib/persistenceManager";

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

/**
 * Builds a {@link MantineColorSchemeManager} whose `get` returns the validated
 * stored theme. `set` is a no-op: ThemeControl persists via
 * {@link persistTheme} so it can surface a failure, and Mantine only calls
 * `set` from `setColorScheme` (already applied in memory) or `subscribe` (a
 * cross-tab storage event, value already stored). `subscribe`/`unsubscribe`/
 * `clear` delegate directly.
 *
 * ponytail: the no-op `set` relies on Mantine 9.8.0 only calling `set` from
 * `setColorScheme`/`subscribe`; re-verify on a Mantine upgrade.
 */
export function createAppColorSchemeManager(): MantineColorSchemeManager {
  const delegate = localStorageColorSchemeManager();

  return {
    get: () => readStoredTheme(),
    set: () => {},
    subscribe: delegate.subscribe,
    unsubscribe: delegate.unsubscribe,
    clear: delegate.clear,
  };
}

export default App;
