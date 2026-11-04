// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// localStorage persistence for the coloring scheme. Delegates the read-back and
// never-throw write to the shared src/lib/storage.ts helper; this module owns
// only the storage key and the scheme normalizer.

import {
  normalizeStoredColoringScheme,
  type ColoringSchemeOption,
} from "./coloringScheme";
import { persistPref, readPref } from "./storage";

const COLORING_SCHEME_STORAGE_KEY = "app-coloring-scheme";

/**
 * Reads the persisted ColoringSchemeOption through
 * {@link normalizeStoredColoringScheme}. A missing, unreadable, or invalid
 * value resolves to the default scheme.
 */
export function readStoredColoringScheme(): ColoringSchemeOption {
  return readPref(COLORING_SCHEME_STORAGE_KEY, normalizeStoredColoringScheme);
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
  persistPref(COLORING_SCHEME_STORAGE_KEY, option, onSaveError);
}