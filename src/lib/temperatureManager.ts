// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// localStorage persistence for the temperature unit. Delegates the read-back
// and never-throw write to the shared src/lib/storage.ts helper; this module
// owns only the storage key and the unit normalizer.

import {
  normalizeStoredTemperature,
  type TemperatureOption,
} from "./temperature";
import { persistPref, readPref } from "./storage";

const STORAGE_KEY = "app-temperature-unit";

/**
 * Reads the persisted TemperatureOption through
 * {@link normalizeStoredTemperature}. A missing, unreadable, or invalid value
 * resolves to "kelvin".
 */
export function readStoredTemperature(): TemperatureOption {
  return readPref(STORAGE_KEY, normalizeStoredTemperature);
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
  persistPref(STORAGE_KEY, option, onSaveError);
}