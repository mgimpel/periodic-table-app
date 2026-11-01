// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { useTranslation } from "react-i18next";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../data/element";
import {
  ORIGIN_COLORS,
  ORIGIN_KEYS,
  PHASE_COLORS,
  PHASE_KEYS,
} from "../lib/cellColor";
import type { ColoringSchemeOption } from "../lib/coloringScheme";
import {
  DATASET_MAX_EN,
  DATASET_MIN_EN,
  EN_STOPS,
} from "../lib/electronegativityGradient";
import type { Stop } from "../lib/gradient";
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
// behavior exactly, and phase / origin discrete legends, melting-point /
// boiling-point / electronegativity gradients, and the spectral-colour
// explanatory legend are added.
export function SchemeLegend({
  scheme,
  temperatureUnit,
}: {
  scheme: ColoringSchemeOption;
  temperatureUnit: TemperatureOption;
}) {
  const { t } = useTranslation("ui");

  // New schemes have no dedicated legend.*Title key; reuse their control label
  // (coloringScheme.<scheme>) rather than adding parity-sensitive title keys.
  const schemeTitle =
    scheme === "category"
      ? t("legend.categoryTitle")
      : scheme === "phase"
      ? t("legend.phaseTitle")
      : scheme === "melting-point"
      ? t("legend.meltingPointTitle")
      : scheme === "boiling-point"
      ? t("legend.boilingPointTitle")
      : t(`coloringScheme.${scheme}`);

  if (scheme === "melting-point" || scheme === "boiling-point") {
    return (
      <GradientLegend
        title={schemeTitle}
        groupLabel={t("legend.groupLabel")}
        stops={GRADIENT_STOPS}
        // Temperature endpoints: raw 0 K and DATASET_MAX, formatted in the
        // active unit. With first.x === 0 the generic positioning formula below
        // reduces to (x / DATASET_MAX) * 100%, matching the per-cell colors.
        minLabel={formatTemperature(0, temperatureUnit)}
        maxLabel={formatTemperature(DATASET_MAX, temperatureUnit)}
      />
    );
  }

  if (scheme === "electronegativity") {
    return (
      <GradientLegend
        title={schemeTitle}
        groupLabel={t("legend.groupLabel")}
        stops={EN_STOPS}
        // Electronegativity is a unitless Pauling value: show the raw dataset
        // min/max numbers, unaffected by the temperature unit.
        minLabel={String(DATASET_MIN_EN)}
        maxLabel={String(DATASET_MAX_EN)}
      />
    );
  }

  if (scheme === "spectral-colour") {
    // Each cell shows its own element's spectral colour, so there is no finite
    // key to swatch and no single gradient: just explain what the colors mean.
    return (
      <div
        className={classes.legend}
        role="group"
        aria-label={t("legend.groupLabel")}
      >
        <h3 className={classes.legendTitle}>{schemeTitle}</h3>
        <p className={gradientClasses.description}>
          {t("schemeLegend.spectral.description")}
        </p>
      </div>
    );
  }

  // Discrete legend: category over CATEGORY_KEYS, phase over PHASE_KEYS,
  // origin over ORIGIN_KEYS.
  const entries =
    scheme === "phase"
      ? PHASE_KEYS.map((key) => ({
          key,
          color: PHASE_COLORS[key],
          label: t(`phase.${key}`),
        }))
      : scheme === "origin"
      ? ORIGIN_KEYS.map((key) => ({
          key,
          color: ORIGIN_COLORS[key],
          label: t(`origin.${key}`),
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

/**
 * Gradient-bar legend shared by the melting-point, boiling-point and
 * electronegativity schemes. Each stop is positioned generically at
 * ((x - first.x) / (last.x - first.x)) * 100% so the visual bar matches the
 * per-cell interpolation for any axis (for temperature, first.x === 0 so this
 * reduces to (x / DATASET_MAX) * 100%). Endpoint labels are pre-formatted by
 * the caller (unit-formatted temperatures, or raw electronegativity numbers).
 */
function GradientLegend({
  title,
  groupLabel,
  stops,
  minLabel,
  maxLabel,
}: {
  title: string;
  groupLabel: string;
  stops: readonly Stop[];
  minLabel: string;
  maxLabel: string;
}) {
  const first = stops[0];
  const last = stops[stops.length - 1];
  const span = last.x - first.x;
  return (
    <div className={classes.legend} role="group" aria-label={groupLabel}>
      <h3 className={classes.legendTitle}>{title}</h3>
      <div className={gradientClasses.gradient}>
        <div
          className={gradientClasses.gradientBar}
          style={{
            backgroundImage: `linear-gradient(to right, ${stops
              .map(
                (stop) =>
                  `rgb(${stop.rgb[0]}, ${stop.rgb[1]}, ${stop.rgb[2]}) ${
                    ((stop.x - first.x) / span) * 100
                  }%`,
              )
              .join(", ")})`,
          }}
        />
        <div className={gradientClasses.gradientLabels}>
          <span className={gradientClasses.gradientLabel}>{minLabel}</span>
          <span className={gradientClasses.gradientLabel}>{maxLabel}</span>
        </div>
      </div>
    </div>
  );
}
