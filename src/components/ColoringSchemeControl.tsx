// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { Select } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  COLORING_SCHEME_OPTIONS,
  normalizeStoredColoringScheme,
  type ColoringSchemeOption,
} from "../lib/coloringScheme";
import { persistColoringScheme } from "../lib/persistenceManager";

interface ColoringSchemeControlProps {
  value: ColoringSchemeOption;
  onChange: (option: ColoringSchemeOption) => void;
  // Fired when persisting the choice fails, so the caller can show a
  // non-blocking save-error notice.
  onSaveError?: (error: unknown) => void;
}

// Coloring-scheme picker, rendered as a compact Select so it fits the header
// bar (seven options are too wide for a SegmentedControl). Controlled, like
// TemperatureControl: AppLayout owns the value because PeriodicTable reads it
// to color cells and render the legend. Persistence and failure signalling are
// explicit here, the same as the other preference controls. Non-clearable /
// non-searchable so it stays a plain dropdown and always has a value.
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

  const handleChange = (v: string | null) => {
    // allowDeselect={false} keeps v non-null, but normalize guards anyway.
    const opt = normalizeStoredColoringScheme(v);
    onChange(opt); // applies for the session even if the save fails
    persistColoringScheme(opt, onSaveError); // never throws; fires onSaveError on failure
  };

  return (
    <Select
      value={value}
      onChange={handleChange}
      data={data}
      aria-label={t("coloringScheme.label")}
      allowDeselect={false}
      searchable={false}
      comboboxProps={{ withinPortal: true }}
      // Compact fixed width keeps the centered header title truncating rather
      // than overflowing on narrow mobile widths (mobile-first).
      w={160}
    />
  );
}
