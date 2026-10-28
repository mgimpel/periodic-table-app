// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// i18next bootstrap — imported once at app entry (before App renders) so the
// first paint is already in the resolved language. Synchronous init with
// bundled resources means no Suspense is needed.

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources, FALLBACK_LOCALE, DEFAULT_NAMESPACE, NAMESPACES } from "./locales";
import { readStoredLanguage } from "./lib/languageManager";
import { resolveLanguage, navigatorLanguages } from "./lib/language";

// The persisted LanguageOption resolved against the device languages via the
// one shared navigator reader (no inlined navigator.languages read here).
const lng = resolveLanguage(readStoredLanguage(), navigatorLanguages());

void i18n.use(initReactI18next).init({
  resources,
  lng,
  fallbackLng: FALLBACK_LOCALE, // per-string English fallback (e.g. fr summaries)
  defaultNS: DEFAULT_NAMESPACE, // "ui"
  ns: NAMESPACES,
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false, // missing key -> fallback string, never null
});

// Keep <html lang> matching the active locale (a11y). Set on init and on every
// change so assistive tech pronounces the right language.
const syncHtmlLang = (lang: string) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
};
syncHtmlLang(i18n.language);
i18n.on("languageChanged", syncHtmlLang);

export default i18n;
