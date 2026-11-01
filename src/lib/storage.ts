// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Shared localStorage read/persist pair for user preferences. Extracted once a
// fourth preference (color scheme, language, temperature, coloring scheme)
// arrived and the per-manager duplication paid off. Each manager still owns its
// storage key and normalizer; the try/catch read-back and the never-throw write
// that signals failure live here once.
//
// ponytail: no generic preference store or hook — just the two functions the
// managers share. Upgrade path (retry / alternative storage) is not needed by
// the product.

/**
 * Reads the value at `key` and runs it through `normalize`, which must be total
 * (it maps a missing/invalid raw value to the preference's default). A blocked
 * or throwing store resolves via `normalize(undefined)`, so the caller always
 * gets a valid option.
 */
export function readPref<T>(
  key: string,
  normalize: (raw: unknown) => T,
): T {
  try {
    return normalize(window.localStorage.getItem(key));
  } catch {
    return normalize(undefined);
  }
}

/**
 * Persists `value` at `key`. Never throws: a failure (private mode / quota) is
 * caught and `onSaveError` fires so the UI can surface a non-blocking notice.
 * The session keeps the chosen value regardless.
 */
export function persistPref(
  key: string,
  value: string,
  onSaveError?: (error: unknown) => void,
): void {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    onSaveError?.(error);
  }
}