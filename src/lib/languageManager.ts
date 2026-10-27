// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// localStorage persistence for the language preference (mirrors
// colorSchemeManager.ts): read-back with validation, and a write that never
// throws but signals failure so the UI can show a non-blocking notice. No
// module-level mutable state — readStoredLanguage re-reads storage each call,
// which is the only state source the control needs.

import { normalizeStoredLanguage, type LanguageOption } from "./language";

const STORAGE_KEY = "app-language-option";

/**
 * Reads the persisted LanguageOption and runs it through
 * {@link normalizeStoredLanguage}. A missing, unreadable (blocked storage), or
 * invalid value resolves to "system".
 */
export function readStoredLanguage(): LanguageOption {
  try {
    return normalizeStoredLanguage(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return normalizeStoredLanguage(undefined);
  }
}

/**
 * Persists the chosen LanguageOption. Never throws: a failure (private mode /
 * quota) is caught and `onSaveError` fires so the UI can tell the user the
 * preference was not saved. The session keeps the chosen option regardless.
 *
 * ponytail: on write failure the preference is simply not persisted this
 * session; upgrade path is retry/alternative storage, which the product does
 * not need.
 */
export function persistLanguage(
  option: LanguageOption,
  onSaveError?: (error: unknown) => void,
): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, option);
  } catch (error) {
    onSaveError?.(error);
  }
}
