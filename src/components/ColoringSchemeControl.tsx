// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { SegmentedControl } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  COLORING_SCHEME_OPTIONS,
  normalizeStoredColoringScheme,
  type ColoringSchemeOption,
} from "../lib/coloringScheme";
import { persistColoringScheme } from "../lib/coloringSchemeManager";

interface ColoringSchemeControlProps {
  value: ColoringSchemeOption;
  onChange: (option: ColoringSchemeOption) => void;
  // Fired when persisting the choice fails, so the caller can show a
  // non-blocking save-error notice.
  onSaveError?: (error: unknown) => void;
}

// Category / phase / melting-point / boiling-point picker. Controlled, like
// TemperatureControl: AppLayout owns the value because PeriodicTable reads it
// to color cells and render the legend. Persistence and failure signalling are
// explicit here, the same as the other settings controls.
export function ColoringSchemeControl({
  value,
  onChange,
  onSaveError,
}: ColoringSchemeControlProps) {
  const { t } = useTranslation("ui");

  const data = COLORING_SCHEME_OPTIONS.map((o) => ({
    value: o,
    label: t(`coloringScheme.${o}`),
  }));

  const handleChange = (v: string) => {
    const opt = normalizeStoredColoringScheme(v);
    onChange(opt); // applies for the session even if the save fails
    persistColoringScheme(opt, onSaveError); // never throws; fires onSaveError on failure
  };

  return (
    <SegmentedControl
      value={value}
      onChange={handleChange}
      data={data}
      aria-label={t("coloringScheme.label")}
      fullWidth
    />
  );
}
