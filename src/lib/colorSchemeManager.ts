// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Thin wrapper over Mantine's localStorage color-scheme manager. It adds two
// things the built-in manager does not: a user-facing signal when persisting
// fails (Req 5.4) and validation of a present-but-invalid stored value so it
// resolves to Same_As_Device (Req 5.3). Everything else delegates unchanged
// (Req 5.1 persist, Req 5.2 read-back).

import {
  localStorageColorSchemeManager,
  type MantineColorSchemeManager,
} from "@mantine/core";
import { normalizeStoredTheme } from "./theme";

// The localStorage key Mantine's localStorageColorSchemeManager uses by
// default (@mantine/core 9.7.3). We read/write it directly on the get/set
// paths so we can see the raw stored value (Req 5.3) and observe a write
// failure (Req 5.4) — Mantine's own get/set hide both.
const STORAGE_KEY = "mantine-color-scheme-value";

/**
 * Builds a {@link MantineColorSchemeManager} backed by `localStorage`.
 *
 * - `get` runs the raw stored value through {@link normalizeStoredTheme},
 *   so a missing, unreadable, or garbage value resolves to `auto` (Req 5.3).
 * - `set` never throws: a persistence failure (private mode / quota) is caught,
 *   the in-memory scheme stays applied, and `onSaveError` fires so the UI can
 *   tell the user the preference was not saved (Req 5.4).
 * - `subscribe`/`unsubscribe`/`clear` delegate directly.
 *
 * @param onSaveError Invoked with the caught error when `set` fails to persist.
 */
export function createAppColorSchemeManager(
  onSaveError?: (error: unknown) => void,
): MantineColorSchemeManager {
  const delegate = localStorageColorSchemeManager();

  return {
    // Read the raw stored value ourselves and normalize it: Mantine's get
    // pre-validates and would return defaultValue for a garbage value, so the
    // junk would never reach normalizeStoredTheme (Req 5.3). An unreadable
    // store falls back to the caller's defaultValue, which normalizes too.
    get: (defaultValue) => {
      try {
        return normalizeStoredTheme(window.localStorage.getItem(STORAGE_KEY));
      } catch {
        return normalizeStoredTheme(defaultValue);
      }
    },
    // Write ourselves so we can observe a setItem throw: Mantine's set catches
    // it and only console.warns, so onSaveError would never fire. Never throw —
    // the session continues with the in-memory scheme (Req 5.4).
    // ponytail: on write failure the preference is simply not persisted this
    // session; upgrade path is retry/alternative storage, which the product
    // does not need.
    set: (value) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, value);
      } catch (error) {
        onSaveError?.(error);
      }
    },
    subscribe: delegate.subscribe,
    unsubscribe: delegate.unsubscribe,
    clear: delegate.clear,
  };
}
