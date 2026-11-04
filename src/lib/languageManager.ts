// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// localStorage persistence for the language preference. Delegates the read-back
// and never-throw write to the shared src/lib/storage.ts helper; this module
// owns only the storage key and the language normalizer. readStoredLanguage
// re-reads storage each call, the only state source the control needs.

import { normalizeStoredLanguage, type LanguageOption } from "./language";
import { persistPref, readPref } from "./storage";

const LANGUAGE_STORAGE_KEY = "app-language-option";

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