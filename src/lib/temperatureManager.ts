// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// localStorage persistence for the temperature unit (mirrors
// languageManager.ts): read-back with validation, and a write that never throws
// but signals failure so the UI can show a non-blocking notice.
//
// ponytail: three managers (color scheme, language, temperature) now duplicate
// this small read/persist pair on purpose. Upgrade path: extract a
// src/lib/storage.ts helper if a fourth preference arrives.

import {
  normalizeStoredTemperature,
  type TemperatureOption,
} from "./temperature";

const STORAGE_KEY = "app-temperature-unit";

/**
 * Reads the persisted TemperatureOption through
 * {@link normalizeStoredTemperature}. A missing, unreadable, or invalid value
 * resolves to "kelvin".
 */
export function readStoredTemperature(): TemperatureOption {
  try {
    return normalizeStoredTemperature(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return normalizeStoredTemperature(undefined);
  }
}

/**
 * Persists the chosen TemperatureOption. Never throws: a failure (private
 * mode / quota) is caught and `onSaveError` fires. The session keeps the
 * chosen option regardless.
 */
export function persistTemperature(
  option: TemperatureOption,
  onSaveError?: (error: unknown) => void,
): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, option);
  } catch (error) {
    onSaveError?.(error);
  }
}
