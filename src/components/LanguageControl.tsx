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
  // Fired when persisting the choice fails, so the caller can show a
  // non-blocking save-error notice.
  onSaveError?: (error: unknown) => void;
}

// Language picker: "System default" first, then one option per
// SUPPORTED_LOCALES entry, so a new locale appears automatically. The state
// source is local React state seeded from the validated stored value, because
// i18n.language only holds the resolved locale and can't represent "system".
// Persistence and failure signalling are explicit here, the same as ThemeControl.
export function LanguageControl({ onSaveError }: LanguageControlProps) {
  const { t, i18n } = useTranslation("ui");
  const [option, setOption] = useState<LanguageOption>(readStoredLanguage);

  const data = ["system", ...SUPPORTED_LOCALES].map((o) => ({
    value: o,
    label: t(`language.${o}`),
  }));

  const onChange = (v: string) => {
    const opt = normalizeStoredLanguage(v);
    setOption(opt); // applies for the session even if the save fails
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
