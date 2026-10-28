// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { SegmentedControl } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  normalizeStoredTemperature,
  TEMPERATURE_OPTIONS,
  type TemperatureOption,
} from "../lib/temperature";
import { persistTemperature } from "../lib/temperatureManager";

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
