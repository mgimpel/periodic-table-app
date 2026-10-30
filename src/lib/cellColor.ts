// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Pure cell-color resolver for the periodic table. Holds all per-scheme
// branching so ElementCell and SchemeLegend stay thin: a phase bucketer that
// classifies the dataset's raw phase string, and a single cellColor(scheme,
// element) resolver that returns the CSS background color for the active
// coloring scheme (category, phase, melting-point, boiling-point).

import { CATEGORY_COLORS, type Element } from "../data/element";
import type { ColoringSchemeOption } from "./coloringScheme";
import { MISSING_VALUE_COLOR, temperatureColor } from "./temperatureGradient";

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
  unknown: "#cfd8dc",
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

/**
 * Resolve the cell background color for `element` under the active `scheme`:
 *   category      → CATEGORY_COLORS[element.category]
 *   phase         → PHASE_COLORS[phaseBucket(element.phase)]
 *   melting-point → MISSING_VALUE_COLOR when melt is null, else gradient color
 *   boiling-point → MISSING_VALUE_COLOR when boil is null, else gradient color
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
    case "category":
      return CATEGORY_COLORS[element.category];
  }
}
