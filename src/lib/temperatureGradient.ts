// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Shared temperature gradient for the melting-point and boiling-point coloring
// schemes. One fixed blue→white→orange→red mapping from an absolute Kelvin
// temperature to a color, so the same Kelvin value maps to the same color in
// both schemes. Colors are computed in Kelvin (the dataset's native unit); the
// display unit affects only the gradient legend's endpoint labels, not colors.

import { ELEMENTS } from "../data/elements";

/**
 * The red endpoint: the largest value among every element's melting AND boiling
 * point. Derived once from the dataset so the red endpoint is identical in both
 * gradient legends and stays correct if the dataset changes.
 */
export const DATASET_MAX: number = Math.max(
  ...ELEMENTS.flatMap((e) => [e.melt, e.boil]).filter(
    (v): v is number => v !== null,
  ),
);

/** Neutral grey for cells with a null value under a gradient scheme. */
export const MISSING_VALUE_COLOR = "#cfd8dc";

/**
 * Fixed interpolation stops on the absolute Kelvin scale, in ascending order.
 * RGB chosen for readability against dark cell text in both color schemes.
 */
export const GRADIENT_STOPS = [
  { k: 0, rgb: [33, 102, 172] }, // blue
  { k: 273, rgb: [247, 247, 247] }, // white
  { k: 1000, rgb: [253, 174, 97] }, // orange
  { k: DATASET_MAX, rgb: [178, 24, 43] }, // red
] as const;

/**
 * Map an absolute temperature in Kelvin to a cell color via piecewise-linear
 * RGB interpolation between adjacent GRADIENT_STOPS. Clamped: k <= 0 yields the
 * blue endpoint, k >= DATASET_MAX yields the red endpoint. Always returns a
 * valid "rgb(r, g, b)" string with integer channels.
 */
export function temperatureColor(kelvin: number): string {
  const first = GRADIENT_STOPS[0];
  const last = GRADIENT_STOPS[GRADIENT_STOPS.length - 1];
  if (kelvin <= first.k) return rgb(first.rgb);
  if (kelvin >= last.k) return rgb(last.rgb);

  for (let i = 1; i < GRADIENT_STOPS.length; i++) {
    const hi = GRADIENT_STOPS[i];
    if (kelvin <= hi.k) {
      const lo = GRADIENT_STOPS[i - 1];
      // hi.k > lo.k here: kelvin > first.k on the first pass, and each later
      // stop is strictly greater than the previous (273 < 1000 < DATASET_MAX).
      const t = (kelvin - lo.k) / (hi.k - lo.k);
      return rgb([
        Math.round(lo.rgb[0] + (hi.rgb[0] - lo.rgb[0]) * t),
        Math.round(lo.rgb[1] + (hi.rgb[1] - lo.rgb[1]) * t),
        Math.round(lo.rgb[2] + (hi.rgb[2] - lo.rgb[2]) * t),
      ]);
    }
  }
  // Unreachable: kelvin < last.k is handled by the loop. Kept total for safety.
  return rgb(last.rgb);
}

function rgb(channels: readonly number[]): string {
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}
