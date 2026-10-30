// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { useTranslation } from "react-i18next";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../data/element";
import { PHASE_COLORS, PHASE_KEYS } from "../lib/cellColor";
import type { ColoringSchemeOption } from "../lib/coloringScheme";
import {
  formatTemperature,
  type TemperatureOption,
} from "../lib/temperature";
import {
  DATASET_MAX,
  GRADIENT_STOPS,
} from "../lib/temperatureGradient";
import gradientClasses from "./SchemeLegend.module.css";
import classes from "./PeriodicTable.module.css";

// Scheme-aware color key rendered as a grid item placed in the table's empty
// top-center region (see .legend in PeriodicTable.module.css), so it scales
// with the table via the grid's transform. The legend always shows swatches and
// labels (or, for the gradient schemes, the bar and endpoint labels): because
// it lives inside the transformed grid, its text shrinks and grows uniformly
// with the table rather than being dropped when cells fall back to symbol-only,
// so the key stays legible at every scale.
//
// This generalizes the former CategoryLegend: the category branch preserves its
// behavior exactly, and phase / melting-point / boiling-point are added.
export function SchemeLegend({
  scheme,
  temperatureUnit,
}: {
  scheme: ColoringSchemeOption;
  temperatureUnit: TemperatureOption;
}) {
  const { t } = useTranslation("ui");

  const schemeTitle =
    scheme === "category"
      ? t("legend.categoryTitle")
      : scheme === "phase"
      ? t("legend.phaseTitle")
      : scheme === "melting-point"
      ? t("legend.meltingPointTitle")
      : t("legend.boilingPointTitle");

  if (scheme === "melting-point" || scheme === "boiling-point") {
    return (
      <div
        className={classes.legend}
        role="group"
        aria-label={t("legend.groupLabel")}
      >
        <h3 className={classes.legendTitle}>{schemeTitle}</h3>
        <div className={gradientClasses.gradient}>
          <div
            className={gradientClasses.gradientBar}
            // Position each stop at (k / DATASET_MAX) * 100% so the visual bar
            // matches the per-cell colors from temperatureColor.
            style={{
              backgroundImage: `linear-gradient(to right, ${GRADIENT_STOPS.map(
                (stop) =>
                  `rgb(${stop.rgb[0]}, ${stop.rgb[1]}, ${stop.rgb[2]}) ${
                    (stop.k / DATASET_MAX) * 100
                  }%`,
              ).join(", ")})`,
            }}
          />
          <div className={gradientClasses.gradientLabels}>
            <span className={gradientClasses.gradientLabel}>
              {formatTemperature(0, temperatureUnit)}
            </span>
            <span className={gradientClasses.gradientLabel}>
              {formatTemperature(DATASET_MAX, temperatureUnit)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Discrete legend: category over CATEGORY_KEYS, phase over PHASE_KEYS.
  const entries =
    scheme === "phase"
      ? PHASE_KEYS.map((key) => ({
          key,
          color: PHASE_COLORS[key],
          label: t(`phase.${key}`),
        }))
      : CATEGORY_KEYS.map((key) => ({
          key,
          color: CATEGORY_COLORS[key],
          label: t(`category.${key}`),
        }));

  return (
    <div
      className={classes.legend}
      role="group"
      aria-label={t("legend.groupLabel")}
    >
      <h3 className={classes.legendTitle}>{schemeTitle}</h3>
      {entries.map(({ key, color, label }) => (
        <div
          key={key}
          className={classes.legendEntry}
          // Fall back to the raw key so the accessible name is never empty.
          aria-label={label || key}
        >
          <span
            className={classes.legendSwatch}
            style={{ backgroundColor: color }}
          />
          <span className={classes.legendLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}
