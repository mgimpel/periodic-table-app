// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { SegmentedControl, useMantineColorScheme } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { THEME_OPTIONS, normalizeStoredTheme } from "../lib/theme";
import { persistTheme } from "../lib/colorSchemeManager";

interface ThemeControlProps {
  // Fired when persisting the choice fails, so the caller can show a
  // non-blocking save-error notice.
  onSaveError?: (error: unknown) => void;
}

// Theme picker: one option per THEME_OPTIONS entry. Mantine's color-scheme
// context is the state source (it represents "auto" natively, seeded from the
// validated stored value by the app's manager). Persistence and failure
// signalling are explicit here, the same as LanguageControl.
export function ThemeControl({ onSaveError }: ThemeControlProps) {
  const { t } = useTranslation("ui");
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const data = THEME_OPTIONS.map((o) => ({ value: o, label: t(`theme.${o}`) }));

  const onChange = (v: string) => {
    const opt = normalizeStoredTheme(v);
    setColorScheme(opt); // applies for the session even if the save fails
    persistTheme(opt, onSaveError); // never throws; fires onSaveError on failure
  };

  return (
    <SegmentedControl
      value={colorScheme}
      onChange={onChange}
      data={data}
      aria-label={t("theme.label")}
      fullWidth
    />
  );
}
