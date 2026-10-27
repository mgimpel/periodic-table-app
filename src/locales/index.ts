// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// THE locale registry — the single source of truth for which locales exist.
//
// ADD A LOCALE: create src/locales/<xx>/ui.json and src/locales/<xx>/elements.json
// (copy the en files and translate; elements.json needs at least all name.* and
// category.*, summaries fall back to English automatically), add one import pair
// below and one entry to `resources`, and add the human language name under
// ui:language.<xx> in each language file. Nothing else — SUPPORTED_LOCALES,
// LanguageOption, the LanguageControl option list, and resolveLanguage's accepted
// set all derive from here. See README.md.

import enUi from "./en/ui.json";
import enElements from "./en/elements.json";
import frUi from "./fr/ui.json";
import frElements from "./fr/elements.json";

export const resources = {
  en: { ui: enUi, elements: enElements },
  fr: { ui: frUi, elements: frElements },
} as const;

export type SupportedLocale = keyof typeof resources; // "en" | "fr"
export const SUPPORTED_LOCALES = Object.keys(resources) as SupportedLocale[];
export const FALLBACK_LOCALE: SupportedLocale = "en";
export const NAMESPACES = ["ui", "elements"] as const;
export const DEFAULT_NAMESPACE = "ui";
