// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CATEGORY_COLORS, type ElementCategory } from "../data/element";
import {
  BLOCK_COLORS,
  BLOCK_KEYS,
  DEFAULT_SELECTED_TEMPERATURE_K,
  ORIGIN_COLORS,
  ORIGIN_KEYS,
  PHASE_COLORS,
  PHASE_KEYS,
  RADIOACTIVE_COLORS,
  RADIOACTIVE_KEYS,
} from "../lib/cellColor";
import type { ColoringSchemeOption } from "../lib/coloringScheme";
import {
  linearGradientCss,
  type Stop,
  TEMPERATURE_MAX,
  TEMPERATURE_GRADIENT_STOPS,
  ELECTRONEGATIVITY_MAX,
  ELECTRONEGATIVITY_MIN,
  ELECTRONEGATIVITY_GRADIENT_STOPS,
} from "../lib/gradient";
import {
  formatTemperature,
  type TemperatureOption,
} from "../lib/temperature";
import { TemperatureSlider } from "./TemperatureSlider";
import classes from "./SchemeLegend.module.css";

// Legend-only display order for the category swatches. Distinct from
// CATEGORY_KEYS (the canonical set/order that derives ElementCategory): the
// legend arranges categories for readability, not in the data's order. Typed as
// readonly ElementCategory[] so tsc flags a typo or missing/stray category.
export const CATEGORY_LEGEND_ORDER: readonly ElementCategory[] = [
  "alkali-metal",
  "metalloid",
  "lanthanide",
  "alkaline-earth-metal",
  "reactive-nonmetal",
  "actinide",
  "transition-metal",
  "noble-gas",
  "unknown",
  "post-transition-metal",
];

// Every element has a known origin, so the "unknown" bucket is omitted.
export const ORIGIN_LEGEND_ORDER = ORIGIN_KEYS.filter(
  (key) => key !== "unknown",
);

// Every element has a known block, so the "unknown" bucket is omitted.
export const BLOCK_LEGEND_ORDER = BLOCK_KEYS.filter(
  (key) => key !== "unknown",
);

// Schemes with a non-discrete legend (gradient bar or explanatory note).
type NonDiscreteScheme =
  | "melting-point"
  | "boiling-point"
  | "electronegativity"
  | "spectral-colour";

interface DiscreteLegend {
  keys: readonly string[];
  colors: Record<string, string>;
  fourColumns?: boolean;
}

// The discrete schemes draw one swatch per key: their i18n label prefix
// equals the scheme name (t(`category.${key}`), t(`phase.${key}`), ...).
// Typed over every remaining scheme, so a new ColoringSchemeOption fails tsc
// until it gets an entry here or a branch in SchemeLegend.
const DISCRETE: Record<Exclude<ColoringSchemeOption, NonDiscreteScheme>, DiscreteLegend> = {
  category: { keys: CATEGORY_LEGEND_ORDER, colors: CATEGORY_COLORS },
  phase: { keys: PHASE_KEYS, colors: PHASE_COLORS, fourColumns: true },
  origin: { keys: ORIGIN_LEGEND_ORDER, colors: ORIGIN_COLORS },
  block: { keys: BLOCK_LEGEND_ORDER, colors: BLOCK_COLORS, fourColumns: true },
  radioactive: { keys: RADIOACTIVE_KEYS, colors: RADIOACTIVE_COLORS },
};

// Schemes with a dedicated legend title; every other scheme reuses its control
// label (coloringScheme.<scheme>) rather than adding parity-sensitive keys.
const TITLE_KEYS: Partial<Record<ColoringSchemeOption, string>> = {
  category: "legend.categoryTitle",
  phase: "legend.phaseTitle",
  "melting-point": "legend.meltingPointTitle",
  "boiling-point": "legend.boilingPointTitle",
};

// The repeated legend frame: a labelled group with the scheme title and the
// scheme-specific body (discrete swatches, gradient bar, or the spectral note).
function LegendFrame({
  title,
  groupLabel,
  className,
  children,
}: {
  title: string;
  groupLabel: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={className ? `${classes.legend} ${className}` : classes.legend}
      role="group"
      aria-label={groupLabel}
    >
      <h3 className={classes.legendTitle}>{title}</h3>
      {children}
    </div>
  );
}

// Scheme-aware color key rendered as a grid item placed in the table's empty
// top-center region (see .legend in SchemeLegend.module.css), so it scales
// with the table via the grid's transform. The legend always shows swatches and
// labels (or, for the gradient schemes, the bar and endpoint labels): because
// it lives inside the transformed grid, its text shrinks and grows uniformly
// with the table rather than being dropped when cells fall back to symbol-only,
// so the key stays legible at every scale.
//
// The legend adapts to the active scheme: category, phase, origin, block and
// radioactive schemes render discrete swatches with labels; melting-point,
// boiling-point and electronegativity render a gradient bar with endpoint
// labels; spectral-colour renders an explanatory note (each cell already shows
// its own element's spectral colour). The phase legend also hosts the
// temperature slider that drives the phase-at-temperature coloring.
export function SchemeLegend({
  scheme,
  temperatureUnit,
  // Defaults let callers that do not drive the phase slider (non-phase
  // schemes, isolated tests) still render.
  selectedTempK = DEFAULT_SELECTED_TEMPERATURE_K,
  onSelectedTempChange = () => {},
}: {
  scheme: ColoringSchemeOption;
  temperatureUnit: TemperatureOption;
  selectedTempK?: number;
  onSelectedTempChange?: (kelvin: number) => void;
}) {
  const { t } = useTranslation("ui");

  const schemeTitle = t(TITLE_KEYS[scheme] ?? `coloringScheme.${scheme}`);
  const groupLabel = t("legend.groupLabel");

  if (scheme === "melting-point" || scheme === "boiling-point") {
    return (
      <GradientLegend
        title={schemeTitle}
        groupLabel={groupLabel}
        stops={TEMPERATURE_GRADIENT_STOPS}
        // Temperature endpoints: raw 0 K and TEMPERATURE_MAX, formatted in the
        // active unit. With first.x === 0 the generic positioning formula below
        // reduces to (x / TEMPERATURE_MAX) * 100%, matching the per-cell colors.
        minLabel={formatTemperature(0, temperatureUnit)}
        maxLabel={formatTemperature(TEMPERATURE_MAX, temperatureUnit)}
      />
    );
  }

  if (scheme === "electronegativity") {
    return (
      <GradientLegend
        title={schemeTitle}
        groupLabel={groupLabel}
        stops={ELECTRONEGATIVITY_GRADIENT_STOPS}
        // Electronegativity is a unitless Pauling value: show the raw dataset
        // min/max numbers, unaffected by the temperature unit.
        minLabel={String(ELECTRONEGATIVITY_MIN)}
        maxLabel={String(ELECTRONEGATIVITY_MAX)}
      />
    );
  }

  if (scheme === "spectral-colour") {
    // Each cell shows its own element's spectral colour, so there is no finite
    // key to swatch and no single gradient: just explain what the colors mean.
    return (
      <LegendFrame title={schemeTitle} groupLabel={groupLabel}>
        <p className={classes.description}>
          {t("schemeLegend.spectral.description")}
        </p>
      </LegendFrame>
    );
  }

  // Discrete legend: one swatch per key. The early returns above narrow
  // `scheme` to the discrete schemes, so the lookup needs no cast.
  const { keys, colors, fourColumns } = DISCRETE[scheme];

  return (
    <LegendFrame
      title={schemeTitle}
      groupLabel={groupLabel}
      className={fourColumns ? classes.fourColumnLegend : undefined}
    >
      {keys.map((key) => {
        const label = t(`${scheme}.${key}`);
        return (
          <div
            key={key}
            className={classes.legendEntry}
            // Fall back to the raw key so the accessible name is never empty.
            aria-label={label || key}
          >
            <span
              className={classes.legendSwatch}
              style={{ backgroundColor: colors[key] }}
            />
            <span className={classes.legendLabel}>{label}</span>
          </div>
        );
      })}
      {scheme === "phase" && (
        <div className={classes.sliderRow}>
          <TemperatureSlider
            valueK={selectedTempK}
            onChange={onSelectedTempChange}
            unit={temperatureUnit}
          />
          <p className={classes.readout}>
            {t("temperatureSlider.legendReadout", {
              temp: formatTemperature(selectedTempK, temperatureUnit, { whole: true }),
            })}
          </p>
        </div>
      )}
    </LegendFrame>
  );
}

/**
 * Gradient-bar legend shared by the melting-point, boiling-point and
 * electronegativity schemes. Each stop is positioned generically at
 * ((x - first.x) / (last.x - first.x)) * 100% so the visual bar matches the
 * per-cell interpolation for any axis (for temperature, first.x === 0 so this
 * reduces to (x / TEMPERATURE_MAX) * 100%). Endpoint labels are pre-formatted by
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
  return (
    <LegendFrame title={title} groupLabel={groupLabel}>
      <div className={classes.gradient}>
        <div
          className={classes.gradientBar}
          style={{ backgroundImage: linearGradientCss(stops) }}
        />
        <div className={classes.gradientLabels}>
          <span className={classes.gradientLabel}>{minLabel}</span>
          <span className={classes.gradientLabel}>{maxLabel}</span>
        </div>
      </div>
    </LegendFrame>
  );
}
