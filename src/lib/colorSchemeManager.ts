// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// localStorage persistence for the theme preference (mirrors
// languageManager.ts): read-back with validation, and a write that never
// throws but signals failure so the UI can show a non-blocking notice. Plus a
// read-only Mantine color-scheme manager so MantineProvider starts from the
// validated stored value; ThemeControl persists explicitly via persistTheme.

import {
  localStorageColorSchemeManager,
  type MantineColorSchemeManager,
} from "@mantine/core";
import { normalizeStoredTheme, type ThemeOption } from "./theme";

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
  try {
    return normalizeStoredTheme(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return normalizeStoredTheme(undefined);
  }
}

/**
 * Persists the chosen ThemeOption. Never throws: a failure (private mode /
 * quota) is caught and `onSaveError` fires so the UI can tell the user the
 * preference was not saved. The session keeps the chosen option regardless
 * (Req 5.4).
 *
 * ponytail: on write failure the preference is simply not persisted this
 * session; upgrade path is retry/alternative storage, which the product does
 * not need.
 */
export function persistTheme(
  option: ThemeOption,
  onSaveError?: (error: unknown) => void,
): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, option);
  } catch (error) {
    onSaveError?.(error);
  }
}

/**
 * Builds a {@link MantineColorSchemeManager} whose `get` returns the validated
 * stored theme (Req 5.2, 5.3). `set` is a no-op: ThemeControl persists via
 * {@link persistTheme} so it can surface a failure, and Mantine only calls
 * `set` from `setColorScheme` (already applied in memory) or `subscribe` (a
 * cross-tab storage event, value already stored). `subscribe`/`unsubscribe`/
 * `clear` delegate directly.
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
