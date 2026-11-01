// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Pure cell-color resolver for the periodic table. Holds all per-scheme
// branching so ElementCell and SchemeLegend stay thin: phase/origin bucketers
// that classify the dataset's raw strings, a spectral-colour helper, and a
// single cellColor(scheme, element) resolver that returns the CSS background
// color for the active coloring scheme (category, phase, melting-point,
// boiling-point, electronegativity, origin, spectral-colour).

import { CATEGORY_COLORS, type Element } from "../data/element";
import type { ColoringSchemeOption } from "./coloringScheme";
import { electronegativityColor } from "./electronegativityGradient";
import { MISSING_VALUE_COLOR } from "./gradient";
import { temperatureColor } from "./temperatureGradient";

/** The four phase buckets, in legend display order. */
export const PHASE_KEYS = ["solid", "liquid", "gas", "unknown"] as const;

export type PhaseKey = (typeof PHASE_KEYS)[number];

/**
 * Fixed CSS colors for the phase scheme, chosen for readability against dark
 * cell text (unknown reuses the neutral grey also used for the unknown category
 * and the missing-value gradient sentinel).
 */
export const PHASE_COLORS: Record<PhaseKey, string> = {
  solid: "#90caf9",
  liquid: "#80cbc4",
  gas: "#ffcc80",
  unknown: MISSING_VALUE_COLOR,
};

/**
 * Total classifier for the dataset's raw phase string: "Solid"/"Liquid"/"Gas"
 * map to their lowercase bucket; anything else (absent, empty, or unrecognized)
 * buckets to "unknown".
 */
export function phaseBucket(phase: string): PhaseKey {
  const key = phase.toLowerCase();
  return (PHASE_KEYS as readonly string[]).includes(key)
    ? (key as PhaseKey)
    : "unknown";
}

/** The four origin buckets, in legend display order. */
export const ORIGIN_KEYS = [
  "primordial",
  "from-decay",
  "synthetic",
  "unknown",
] as const;

export type OriginKey = (typeof ORIGIN_KEYS)[number];

/**
 * Fixed, mutually distinct CSS colors for the origin scheme, readable against
 * dark cell text (unknown reuses the neutral grey shared with the unknown
 * phase/category and the missing-value gradient sentinel).
 */
export const ORIGIN_COLORS: Record<OriginKey, string> = {
  primordial: "#a5d6a7",
  "from-decay": "#ce93d8",
  synthetic: "#ef9a9a",
  unknown: MISSING_VALUE_COLOR,
};

/**
 * Total classifier for the dataset's raw origin string: "primordial",
 * "from decay" (space), and "synthetic" map to their bucket; anything else
 * (absent, empty, or unrecognized) buckets to "unknown".
 */
export function originBucket(raw: string): OriginKey {
  switch (raw.toLowerCase()) {
    case "primordial":
      return "primordial";
    case "from decay":
      return "from-decay";
    case "synthetic":
      return "synthetic";
    default:
      return "unknown";
  }
}

/**
 * Resolve a cell color from a raw spectral-colour value: a valid 6-digit hex
 * string (no `#`) becomes `"#" + raw`; `null` or any malformed value falls back
 * to the neutral missing-value color.
 */
export function spectralCellColor(raw: string | null): string {
  return raw !== null && /^[0-9a-fA-F]{6}$/.test(raw)
    ? `#${raw}`
    : MISSING_VALUE_COLOR;
}

/**
 * Resolve the cell background color for `element` under the active `scheme`:
 *   category          → CATEGORY_COLORS[element.category]
 *   phase             → PHASE_COLORS[phaseBucket(element.phase)]
 *   melting-point     → MISSING_VALUE_COLOR when melt is null, else gradient
 *   boiling-point     → MISSING_VALUE_COLOR when boil is null, else gradient
 *   electronegativity → MISSING_VALUE_COLOR when null, else gradient color
 *   origin            → ORIGIN_COLORS[originBucket(element.origin)]
 *   spectral-colour   → spectralCellColor(element.spectralColour)
 */
export function cellColor(
  scheme: ColoringSchemeOption,
  element: Element,
): string {
  switch (scheme) {
    case "phase":
      return PHASE_COLORS[phaseBucket(element.phase)];
    case "melting-point":
      return element.melt === null
        ? MISSING_VALUE_COLOR
        : temperatureColor(element.melt);
    case "boiling-point":
      return element.boil === null
        ? MISSING_VALUE_COLOR
        : temperatureColor(element.boil);
    case "electronegativity":
      return element.electronegativity === null
        ? MISSING_VALUE_COLOR
        : electronegativityColor(element.electronegativity);
    case "origin":
      return ORIGIN_COLORS[originBucket(element.origin)];
    case "spectral-colour":
      return spectralCellColor(element.spectralColour);
    case "category":
      return CATEGORY_COLORS[element.category];
  }
}
