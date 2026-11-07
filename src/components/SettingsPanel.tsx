// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { Input, Stack, Select, SegmentedControl, useMantineColorScheme } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ResponsiveOverlay } from "./ResponsiveOverlay";
import { THEME_OPTIONS, normalizeStoredTheme } from "../lib/theme";
import {
  normalizeStoredTemperature,
  TEMPERATURE_OPTIONS,
  type TemperatureOption,
} from "../lib/temperature";
import {
  LANGUAGE_OPTIONS,
  navigatorLanguages,
  normalizeStoredLanguage,
  resolveLanguage,
  type LanguageOption,
} from "../lib/language";
import { persistTheme, persistTemperature, persistLanguage, readStoredLanguage } from "../lib/persistenceManager";

// --------------------------------------------------------
// SettingsPanel
// --------------------------------------------------------

/** Which preference failed to persist; selects the save-error notice strings. */
export type SaveErrorKind = "theme" | "language" | "temperature";

interface SettingsPanelProps {
  opened: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  // Fired with the failing preference when a control's persist fails, so
  // AppLayout can surface its non-blocking save-error notice.
  onSaveError?: (kind: SaveErrorKind) => void;
  // The temperature unit is owned by AppLayout because ElementDetail reads it.
  temperatureUnit: TemperatureOption;
  onTemperatureUnitChange: (unit: TemperatureOption) => void;
}

// Settings overlay, shown in the shared ResponsiveOverlay (Drawer on mobile,
// Modal on desktop). Returns focus to the settings trigger on close. Mantine
// restores focus to the previously-focused
// element by default, which is the trigger button; `returnFocusRef` is applied
// explicitly so focus lands there even if focus moved while the panel was open.
//
// Each setting gets a visible title via Input.Wrapper, reusing the control's
// own `*.label` i18n string so the title and the control's accessible name stay
// in sync. Input.Wrapper associates the label with the field for assistive tech.
export function SettingsPanel({
  opened,
  onClose,
  returnFocusRef,
  onSaveError,
  temperatureUnit,
  onTemperatureUnitChange,
}: SettingsPanelProps) {
  const { t } = useTranslation("ui");
  const handleClose = () => {
    onClose();
    returnFocusRef.current?.focus();
  };

  return (
    <ResponsiveOverlay
      opened={opened}
      onClose={handleClose}
      title={t("settings.title")}
    >
      <Stack gap="lg">
        <Input.Wrapper label={t("theme.label")}>
          <ThemeControl onSaveError={() => onSaveError?.("theme")} />
        </Input.Wrapper>
        <Input.Wrapper label={t("language.label")}>
          <LanguageControl onSaveError={() => onSaveError?.("language")} />
        </Input.Wrapper>
        <Input.Wrapper label={t("temperature.label")}>
          <TemperatureControl
            value={temperatureUnit}
            onChange={onTemperatureUnitChange}
            onSaveError={() => onSaveError?.("temperature")}
          />
        </Input.Wrapper>
      </Stack>
    </ResponsiveOverlay>
  );
}

// --------------------------------------------------------
// ThemeControl
// --------------------------------------------------------

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

// --------------------------------------------------------
// Language Control
// --------------------------------------------------------

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
// Rendered as a Select (dropdown) so all options fit a narrow mobile drawer
// regardless of their translated length. Non-clearable / non-searchable so it
// stays a plain dropdown and always has a value.
export function LanguageControl({ onSaveError }: LanguageControlProps) {
  const { t, i18n } = useTranslation("ui");
  const [option, setOption] = useState<LanguageOption>(readStoredLanguage);
  const data = LANGUAGE_OPTIONS.map((o) => ({
    value: o,
    label: t(`language.${o}`),
  }));
  const onChange = (v: string | null) => {
    // allowDeselect={false} keeps v non-null, but normalize guards anyway.
    const opt = normalizeStoredLanguage(v);
    setOption(opt); // applies for the session even if the save fails
    void i18n.changeLanguage(resolveLanguage(opt, navigatorLanguages()));
    persistLanguage(opt, onSaveError); // never throws; fires onSaveError on failure
  };

  return (
    <Select
      value={option}
      onChange={onChange}
      data={data}
      aria-label={t("language.label")}
      allowDeselect={false}
      searchable={false}
      comboboxProps={{ withinPortal: true }}
    />
  );
}

// --------------------------------------------------------
// Temperature Control
// --------------------------------------------------------

interface TemperatureControlProps {
  value: TemperatureOption;
  onChange: (option: TemperatureOption) => void;
  // Fired when persisting the choice fails, so the caller can show a
  // non-blocking save-error notice.
  onSaveError?: (error: unknown) => void;
}

// Kelvin / Celsius / Fahrenheit picker. Controlled, unlike ThemeControl and
// LanguageControl: AppLayout owns the value because ElementDetail reads it too.
// Persistence and failure signalling are explicit here, the same as the others.
export function TemperatureControl({
  value,
  onChange,
  onSaveError,
}: TemperatureControlProps) {
  const { t } = useTranslation("ui");
  const data = TEMPERATURE_OPTIONS.map((o) => ({
    value: o,
    label: t(`temperature.${o}`),
  }));
  const handleChange = (v: string) => {
    const opt = normalizeStoredTemperature(v);
    onChange(opt); // applies for the session even if the save fails
    persistTemperature(opt, onSaveError); // never throws; fires onSaveError on failure
  };

  return (
    <SegmentedControl
      value={value}
      onChange={handleChange}
      data={data}
      aria-label={t("temperature.label")}
      fullWidth
    />
  );
}
