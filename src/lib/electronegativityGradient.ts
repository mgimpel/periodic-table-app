// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Electronegativity coloring scheme. A fixed two-stop gradient from the
// dataset's smallest to largest Pauling electronegativity, in a green→purple
// range chosen to be readable and visually distinct from the temperature
// schemes' blue→white→orange→red palette.

import { ELEMENTS } from "../data/elements";
import { type Stop, interpolateStops } from "./gradient";

const EN_VALUES: readonly number[] = ELEMENTS.map(
  (e) => e.electronegativity,
).filter((v): v is number => v !== null);

/** Smallest Pauling electronegativity in the dataset (gradient min endpoint). */
export const DATASET_MIN_EN: number = Math.min(...EN_VALUES);

/** Largest Pauling electronegativity in the dataset (gradient max endpoint). */
export const DATASET_MAX_EN: number = Math.max(...EN_VALUES);

/**
 * Two interpolation stops on the electronegativity scale, ascending.
 * Green at the low end, purple at the high end — distinct from the temperature
 * palette and readable against dark cell text in both color schemes.
 */
export const EN_STOPS: readonly Stop[] = [
  { x: DATASET_MIN_EN, rgb: [102, 189, 99] }, // green
  { x: DATASET_MAX_EN, rgb: [118, 42, 131] }, // purple
];

/**
 * Map a Pauling electronegativity to a cell color via piecewise-linear RGB
 * interpolation between EN_STOPS. Clamped at both endpoints. Always returns a
 * valid "rgb(r, g, b)" string with integer channels.
 */
export function electronegativityColor(value: number): string {
  return interpolateStops(EN_STOPS, value);
}
