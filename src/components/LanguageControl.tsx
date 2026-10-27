// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { useState } from "react";
import { SegmentedControl } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LOCALES } from "../locales";
import {
  navigatorLanguages,
  normalizeStoredLanguage,
  resolveLanguage,
  type LanguageOption,
} from "../lib/language";
import { persistLanguage, readStoredLanguage } from "../lib/languageManager";

interface LanguageControlProps {
  // Threaded down from AppLayout via SettingsPanel so a failed persist surfaces
  // the same non-blocking save-error notice as the theme path.
  onSaveError?: (error: unknown) => void;
}

// Language picker: "System default" first, then each supported locale, built
// generically from SUPPORTED_LOCALES so a new locale appears automatically. The
// selected LanguageOption is React state seeded from the persisted value —
// i18n.language only ever holds the resolved "en"/"fr" and cannot represent the
// "system" sentinel, so the option (which persistence owns) is the tracked
// source of truth. Seeding from readStoredLanguage() keeps a remount drift-free.
export function LanguageControl({ onSaveError }: LanguageControlProps) {
  const { t, i18n } = useTranslation("ui");
  const [option, setOption] = useState<LanguageOption>(readStoredLanguage());

  const data = [
    { value: "system", label: t("language.system") },
    ...SUPPORTED_LOCALES.map((l) => ({ value: l, label: t(`language.${l}`) })),
  ];

  const onChange = (v: string) => {
    const opt = normalizeStoredLanguage(v);
    setOption(opt); // guaranteed re-render / selected radio, no reliance on i18next repaint
    void i18n.changeLanguage(resolveLanguage(opt, navigatorLanguages()));
    persistLanguage(opt, onSaveError); // never throws; fires onSaveError on failure
  };

  return (
    <SegmentedControl
      value={option}
      onChange={onChange}
      data={data}
      aria-label={t("language.label")}
      fullWidth
    />
  );
}
