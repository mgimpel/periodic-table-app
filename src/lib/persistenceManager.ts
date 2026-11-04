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

import { normalizeStoredTheme, type ThemeOption } from "./theme";
import { normalizeStoredLanguage, type LanguageOption } from "./language";
import { normalizeStoredTemperature, type TemperatureOption } from "./temperature";
import { normalizeStoredColoringScheme, type ColoringSchemeOption } from "./coloringScheme";

const THEME_STORAGE_KEY = "mantine-color-scheme-value";
const LANGUAGE_STORAGE_KEY = "app-language-option";
const TEMPERATURE_STORAGE_KEY = "app-temperature-unit";
const COLORING_SCHEME_STORAGE_KEY = "app-coloring-scheme";

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

// localStorage persistence for the theme preference. The read-back and
// never-throw write delegate to the shared src/lib/storage.ts helper; this
// module additionally owns a read-only Mantine color-scheme manager so
// MantineProvider starts from the validated stored value. ThemeControl persists
// explicitly via persistTheme.

// The localStorage key Mantine's localStorageColorSchemeManager (and
// ColorSchemeScript) uses by default (@mantine/core 9.7.3). Keeping it means
// the pre-hydration script and cross-tab subscribe still see our writes.

/**
 * Reads the persisted ThemeOption and runs it through
 * {@link normalizeStoredTheme}. A missing, unreadable (blocked storage), or
 * invalid value resolves to "auto" (Req 5.3).
 */
export function readStoredTheme(): ThemeOption {
  return readPref(THEME_STORAGE_KEY, normalizeStoredTheme);
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
  persistPref(THEME_STORAGE_KEY, option, onSaveError);
}

// localStorage persistence for the language preference. Delegates the read-back
// and never-throw write to the shared src/lib/storage.ts helper; this module
// owns only the storage key and the language normalizer. readStoredLanguage
// re-reads storage each call, the only state source the control needs.

/**
 * Reads the persisted LanguageOption and runs it through
 * {@link normalizeStoredLanguage}. A missing, unreadable (blocked storage), or
 * invalid value resolves to "system".
 */
export function readStoredLanguage(): LanguageOption {
  return readPref(LANGUAGE_STORAGE_KEY, normalizeStoredLanguage);
}

/**
 * Persists the chosen LanguageOption. Never throws: a failure (private mode /
 * quota) is caught and `onSaveError` fires so the UI can tell the user the
 * preference was not saved. The session keeps the chosen option regardless.
 */
export function persistLanguage(
  option: LanguageOption,
  onSaveError?: (error: unknown) => void,
): void {
  persistPref(LANGUAGE_STORAGE_KEY, option, onSaveError);
}

// localStorage persistence for the temperature unit. Delegates the read-back
// and never-throw write to the shared src/lib/storage.ts helper; this module
// owns only the storage key and the unit normalizer.

/**
 * Reads the persisted TemperatureOption through
 * {@link normalizeStoredTemperature}. A missing, unreadable, or invalid value
 * resolves to "kelvin".
 */
export function readStoredTemperature(): TemperatureOption {
  return readPref(TEMPERATURE_STORAGE_KEY, normalizeStoredTemperature);
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
  persistPref(TEMPERATURE_STORAGE_KEY, option, onSaveError);
}

// localStorage persistence for the coloring scheme. Delegates the read-back and
// never-throw write to the shared src/lib/storage.ts helper; this module owns
// only the storage key and the scheme normalizer.

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
