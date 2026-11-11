// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// THE locale registry — the single source of truth for which locales exist.
//
// ADD A LOCALE: create src/locales/ui.<xx>.json and src/locales/periodic-table.<xx>.json
// (copy the en files and translate). periodic-table.<xx>.json mirrors the source
// dataset (src/data/periodic-table.json) — an `elements` array of
// { number, symbol, name, appearance, summary } — but carries only the three
// translatable fields' values; name/appearance/summary fall back to English
// per-key automatically. Category labels live in ui.json. Then add one import
// pair below, one entry to `resources`, and the human language name under
// ui:language.<xx> in each ui.json. Nothing else: SUPPORTED_LOCALES,
// SupportedLocale, the LanguageControl option list, and resolveLanguage's
// accepted set all derive from `resources`. See README.md.

import enUi from "./ui.en.json";
import enPeriodicTable from "./periodic-table.en.json";
import frUi from "./ui.fr.json";
import frPeriodicTable from "./periodic-table.fr.json";
import esUi from "./ui.es.json";
import esPeriodicTable from "./periodic-table.es.json";
import deUi from "./ui.de.json";
import dePeriodicTable from "./periodic-table.de.json";
import itUi from "./ui.it.json";
import itPeriodicTable from "./periodic-table.it.json";
import ptUi from "./ui.pt.json";
import ptPeriodicTable from "./periodic-table.pt.json";

// Locale entries may omit English-fallback fields such as appearance/summary.
interface LocaleElement {
  number: number;
  name: string;
  appearance?: string | null;
  summary?: string;
}
interface PeriodicTableLocale {
  elements: LocaleElement[];
}

// The `periodicTable` i18next namespace is a keyed resource (name/appearance/
// summary maps keyed by atomic number), so t(`periodicTable:name.<n>`) resolves
// a single element's field. The locale files ship an array (mirroring the
// dataset) for readability and diff-friendliness; this adapter keys it. Entries
// above 118 (the source's hypothetical element 119) are dropped to match the
// 118 elements the app exposes. Missing/null fields fall back to English.
function toNamespace(locale: PeriodicTableLocale) {
  const name: Record<string, string> = {};
  const appearance: Record<string, string> = {};
  const summary: Record<string, string> = {};
  for (const e of locale.elements) {
    if (e.number > 118) continue;
    const key = String(e.number);
    name[key] = e.name;
    if (e.summary !== undefined) summary[key] = e.summary;
    if (e.appearance !== undefined && e.appearance !== null) {
      appearance[key] = e.appearance;
    }
  }
  return { name, appearance, summary };
}

export const resources = {
  en: { ui: enUi, periodicTable: toNamespace(enPeriodicTable) },
  fr: { ui: frUi, periodicTable: toNamespace(frPeriodicTable) },
  es: { ui: esUi, periodicTable: toNamespace(esPeriodicTable) },
  de: { ui: deUi, periodicTable: toNamespace(dePeriodicTable) },
  it: { ui: itUi, periodicTable: toNamespace(itPeriodicTable) },
  pt: { ui: ptUi, periodicTable: toNamespace(ptPeriodicTable) },
} as const;

export type SupportedLocale = keyof typeof resources; // "en" | "fr" | "es" | "de" | "it" | "pt"
export const SUPPORTED_LOCALES = Object.keys(resources) as SupportedLocale[];
export const FALLBACK_LOCALE: SupportedLocale = "en";
export const NAMESPACES = ["ui", "periodicTable"] as const;
export const DEFAULT_NAMESPACE = "ui";
