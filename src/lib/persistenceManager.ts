// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Shared localStorage read/persist pair for the persisted user preferences
// (theme, language, temperature). The coloring scheme is session-only and has
// no pair here.
//
// ponytail: no generic preference store or hook — just the two functions the
// preferences share. Upgrade path (retry / alternative storage) is not needed
// by the product.

import { normalizeStoredTheme, type ThemeOption } from "./theme";
import { normalizeStoredLanguage, type LanguageOption } from "./language";
import { normalizeStoredTemperature, type TemperatureOption } from "./temperature";

const THEME_STORAGE_KEY = "mantine-color-scheme-value";
const LANGUAGE_STORAGE_KEY = "app-language-option";
const TEMPERATURE_STORAGE_KEY = "app-temperature-unit";

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

// Each preference below owns only its storage key and normalizer; the read-back
// and never-throw write are readPref/persistPref above.
//
// Theme: THEME_STORAGE_KEY is the key Mantine's localStorageColorSchemeManager
// (and ColorSchemeScript) uses by default, so the pre-hydration script and
// cross-tab subscribe still see our writes. The read-only Mantine manager that
// reads it is createAppColorSchemeManager in src/App.tsx.

/**
 * Reads the persisted ThemeOption and runs it through
 * {@link normalizeStoredTheme}. A missing, unreadable (blocked storage), or
 * invalid value resolves to "auto".
 */
export function readStoredTheme(): ThemeOption {
  return readPref(THEME_STORAGE_KEY, normalizeStoredTheme);
}

/**
 * Persists the chosen ThemeOption. Never throws: a failure (private mode /
 * quota) is caught and `onSaveError` fires so the UI can tell the user the
 * preference was not saved. The session keeps the chosen option regardless.
 */
export function persistTheme(
  option: ThemeOption,
  onSaveError?: (error: unknown) => void,
): void {
  persistPref(THEME_STORAGE_KEY, option, onSaveError);
}

// Language: readStoredLanguage re-reads storage on each call, the only state
// source LanguageControl needs.

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
