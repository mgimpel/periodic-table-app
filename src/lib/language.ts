// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Pure language helper (mirrors theme.ts). Owns the LanguageOption type, the
// safe fallback used when the persisted preference is missing/invalid, and the
// device-language resolution. The supported set is sourced from the locale
// registry so adding a locale there automatically widens what this accepts.

import {
  SUPPORTED_LOCALES,
  FALLBACK_LOCALE,
  type SupportedLocale,
} from "../locales";

/** The user-selectable options: "system" follows the device, else a locale. */
export type LanguageOption = "system" | SupportedLocale;

/** Fallback when no valid stored preference exists — follow the device. */
export const DEFAULT_LANGUAGE: LanguageOption = "system";

/**
 * Total, safe normalizer for a persisted language value: returns `raw` when it
 * is "system" or a supported locale, otherwise `DEFAULT_LANGUAGE`. Accepts
 * `unknown` so callers can pass whatever came out of storage without checking.
 */
export function normalizeStoredLanguage(raw: unknown): LanguageOption {
  if (raw === "system") return "system";
  if (typeof raw === "string" && (SUPPORTED_LOCALES as string[]).includes(raw)) {
    return raw as SupportedLocale;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Pure: resolve a LanguageOption to a concrete supported locale. No navigator
 * access — the language list is passed in.
 *
 * - An explicit locale option returns itself.
 * - "system" returns the first list entry whose lowercased primary subtag is a
 *   supported locale (so "fr-FR", "FR", "fr" all match "fr"), else FALLBACK_LOCALE.
 * - An empty/garbage/non-string list falls back to FALLBACK_LOCALE.
 */
export function resolveLanguage(
  option: LanguageOption,
  navigatorLanguages: readonly string[],
): SupportedLocale {
  if (option !== "system") return option;
  for (const lang of navigatorLanguages) {
    if (typeof lang !== "string" || lang.length === 0) continue;
    const primary = lang.toLowerCase().split("-")[0];
    if ((SUPPORTED_LOCALES as string[]).includes(primary)) {
      return primary as SupportedLocale;
    }
  }
  return FALLBACK_LOCALE;
}

/**
 * Impure, single navigator reader — the ONE place that touches navigator for
 * language detection (resolveLanguage stays pure and is passed this list).
 * Prefers navigator.languages (ordered preference list), falls back to
 * [navigator.language], returns [] off-DOM.
 *
 * ponytail: navigator may be absent/unusual (non-browser env, private
 * context); we return [] and let resolveLanguage degrade to English. No full
 * BCP-47 negotiation — primary-subtag match is enough for en/fr. Upgrade path
 * is a richer negotiator if more regional locales are ever added.
 */
export function navigatorLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  const list = navigator.languages;
  if (list && list.length > 0) return list;
  return navigator.language ? [navigator.language] : [];
}
