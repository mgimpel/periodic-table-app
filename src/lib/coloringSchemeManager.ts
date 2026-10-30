// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// localStorage persistence for the coloring scheme (mirrors
// temperatureManager.ts): read-back with validation, and a write that never
// throws but signals failure so the UI can show a non-blocking notice.
//
// ponytail: this is the fourth near-identical read/persist pair (color scheme,
// language, temperature, coloring scheme). Upgrade path: extract a
// src/lib/storage.ts helper now that a fourth preference has arrived.

import {
  DEFAULT_COLORING_SCHEME,
  normalizeStoredColoringScheme,
  type ColoringSchemeOption,
} from "./coloringScheme";

const STORAGE_KEY = "app-coloring-scheme";

/**
 * Reads the persisted ColoringSchemeOption through
 * {@link normalizeStoredColoringScheme}. A missing, unreadable, or invalid
 * value resolves to {@link DEFAULT_COLORING_SCHEME}.
 */
export function readStoredColoringScheme(): ColoringSchemeOption {
  try {
    return normalizeStoredColoringScheme(
      window.localStorage.getItem(STORAGE_KEY),
    );
  } catch {
    return DEFAULT_COLORING_SCHEME;
  }
}

/**
 * Persists the chosen ColoringSchemeOption. Never throws: a failure (private
 * mode / quota) is caught and `onSaveError` fires. The session keeps the
 * chosen option regardless.
 */
export function persistColoringScheme(
  option: ColoringSchemeOption,
  onSaveError?: (error: unknown) => void,
): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, option);
  } catch (error) {
    onSaveError?.(error);
  }
}
