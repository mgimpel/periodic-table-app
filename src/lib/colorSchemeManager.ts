// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// localStorage persistence for the theme preference. The read-back and
// never-throw write delegate to the shared src/lib/storage.ts helper; this
// module additionally owns a read-only Mantine color-scheme manager so
// MantineProvider starts from the validated stored value. ThemeControl persists
// explicitly via persistTheme.

import {
  localStorageColorSchemeManager,
  type MantineColorSchemeManager,
} from "@mantine/core";
import { normalizeStoredTheme, type ThemeOption } from "./theme";
import { persistPref, readPref } from "./storage";

// The localStorage key Mantine's localStorageColorSchemeManager (and
// ColorSchemeScript) uses by default (@mantine/core 9.7.3). Keeping it means
// the pre-hydration script and cross-tab subscribe still see our writes.
const STORAGE_KEY = "mantine-color-scheme-value";

/**
 * Reads the persisted ThemeOption and runs it through
 * {@link normalizeStoredTheme}. A missing, unreadable (blocked storage), or
 * invalid value resolves to "auto" (Req 5.3).
 */
export function readStoredTheme(): ThemeOption {
  return readPref(STORAGE_KEY, normalizeStoredTheme);
}

/**
 * Persists the chosen ThemeOption. Never throws: a failure (private mode /
 * quota) is caught and `onSaveError` fires so the UI can tell the user the
 * preference was not saved. The session keeps the chosen option regardless
 * (Req 5.4).
 */
export function persistTheme(
  option: ThemeOption,
  onSaveError?: (error: unknown) => void,
): void {
  persistPref(STORAGE_KEY, option, onSaveError);
}

/**
 * Builds a {@link MantineColorSchemeManager} whose `get` returns the validated
 * stored theme (Req 5.2, 5.3). `set` is a no-op: ThemeControl persists via
 * {@link persistTheme} so it can surface a failure, and Mantine only calls
 * `set` from `setColorScheme` (already applied in memory) or `subscribe` (a
 * cross-tab storage event, value already stored). `subscribe`/`unsubscribe`/
 * `clear` delegate directly.
 *
 * ponytail: the no-op `set` relies on Mantine 9.7.3 only calling `set` from
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