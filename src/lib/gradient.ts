// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Shared piecewise-linear RGB gradient used by the element coloring schemes.
// A scheme supplies its own ascending stops (temperature in Kelvin,
// electronegativity, ...) and asks for the color at a given position; the
// interpolation, clamping, rounding and formatting live here once.

import { ELEMENTS } from "../data/elements";

/** Neutral grey for cells with a null value under a gradient scheme. */
export const MISSING_VALUE_COLOR = "#cfd8dc";

/** One interpolation stop: color `rgb` at position `x` on the scheme's scale. */
export interface Stop {
  x: number;
  rgb: [number, number, number];
}

/**
 * Build the CSS `linear-gradient(to right, …)` string for a set of `stops`,
 * each positioned at ((x - first.x) / (last.x - first.x)) * 100% so the visual
 * bar matches the per-cell interpolation above. Reuses the private `rgb()`
 * formatter so the swatch bar and the cell colors share one color syntax.
 */
export function linearGradientCss(stops: readonly Stop[]): string {
  const first = stops[0];
  const last = stops[stops.length - 1];
  const span = last.x - first.x;
  return `linear-gradient(to right, ${stops
    .map(
      (stop) => `${rgb(stop.rgb)} ${((stop.x - first.x) / span) * 100}%`,
    )
    .join(", ")})`;
}

/**
 * Map `x` to a color via piecewise-linear RGB interpolation between adjacent
 * `stops` (ordered ascending by `x`). Clamped: below the first stop yields its
 * color, above the last stop yields its color. Always returns a valid
 * "rgb(r, g, b)" string with integer channels in [0, 255]. Deterministic.
 */
export function interpolateStops(stops: readonly Stop[], x: number): string {
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (x <= first.x) return rgb(first.rgb);
  if (x >= last.x) return rgb(last.rgb);

  for (let i = 1; i < stops.length; i++) {
    const hi = stops[i];
    if (x <= hi.x) {
      const lo = stops[i - 1];
      // hi.x > lo.x here: x > first.x on the first pass, and callers order
      // stops strictly ascending, so this denominator is never zero.
      const t = (x - lo.x) / (hi.x - lo.x);
      return rgb([
        Math.round(lo.rgb[0] + (hi.rgb[0] - lo.rgb[0]) * t),
        Math.round(lo.rgb[1] + (hi.rgb[1] - lo.rgb[1]) * t),
        Math.round(lo.rgb[2] + (hi.rgb[2] - lo.rgb[2]) * t),
      ]);
    }
  }
  // Unreachable: x < last.x is handled by the loop. Kept total for safety.
  return rgb(last.rgb);
}

function rgb(channels: readonly number[]): string {
  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
}

// Shared temperature gradient for the melting-point and boiling-point coloring
// schemes. One fixed blue→white→orange→red mapping from an absolute Kelvin
// temperature to a color, so the same Kelvin value maps to the same color in
// both schemes. Colors are computed in Kelvin (the dataset's native unit); the
// display unit affects only the gradient legend's endpoint labels, not colors.

/**
 * The red endpoint: the largest value among every element's melting AND boiling
 * point. Derived once from the dataset so the red endpoint is identical in both
 * gradient legends and stays correct if the dataset changes.
 */
export const TEMPERATURE_MAX: number = Math.max(
  ...ELEMENTS.flatMap((e) => [e.melt, e.boil]).filter(
    (v): v is number => v !== null,
  ),
);

/**
 * Fixed interpolation stops on the absolute Kelvin scale, in ascending order.
 * RGB chosen for readability against dark cell text in both color schemes.
 */
export const TEMPERATURE_GRADIENT_STOPS: readonly Stop[] = [
  { x: 0, rgb: [33, 102, 172] }, // blue
  { x: 373, rgb: [247, 247, 247] }, // white
  { x: 1273, rgb: [253, 174, 97] }, // orange
  { x: TEMPERATURE_MAX, rgb: [178, 24, 43] }, // red
];

/**
 * Map an absolute temperature in Kelvin to a cell color via piecewise-linear
 * RGB interpolation between adjacent GRADIENT_STOPS. Clamped: k <= 0 yields the
 * blue endpoint, k >= DATASET_MAX yields the red endpoint. Always returns a
 * valid "rgb(r, g, b)" string with integer channels.
 */
export function temperatureColor(kelvin: number): string {
  return interpolateStops(TEMPERATURE_GRADIENT_STOPS, kelvin);
}

// Electronegativity coloring scheme. A fixed two-stop gradient from the
// dataset's smallest to largest Pauling electronegativity, in a green→purple
// range chosen to be readable and visually distinct from the temperature
// schemes' blue→white→orange→red palette.

const ELECTRONEGATIVITY_VALUES: readonly number[] = ELEMENTS.map(
  (e) => e.electronegativity,
).filter((v): v is number => v !== null);

/** Smallest Pauling electronegativity in the dataset (gradient min endpoint). */
export const ELECTRONEGATIVITY_MIN: number = Math.min(...ELECTRONEGATIVITY_VALUES);

/** Largest Pauling electronegativity in the dataset (gradient max endpoint). */
export const ELECTRONEGATIVITY_MAX: number = Math.max(...ELECTRONEGATIVITY_VALUES);

/**
 * Two interpolation stops on the electronegativity scale, ascending.
 * Green at the low end, purple at the high end — distinct from the temperature
 * palette and readable against dark cell text in both color schemes.
 */
export const ELECTRONEGATIVITY_GRADIENT_STOPS: readonly Stop[] = [
  { x: ELECTRONEGATIVITY_MIN, rgb: [102, 189, 99] }, // green
  { x: ELECTRONEGATIVITY_MAX, rgb: [118, 42, 131] }, // purple
];

/**
 * Map a Pauling electronegativity to a cell color via piecewise-linear RGB
 * interpolation between EN_STOPS. Clamped at both endpoints. Always returns a
 * valid "rgb(r, g, b)" string with integer channels.
 */
export function electronegativityColor(value: number): string {
  return interpolateStops(ELECTRONEGATIVITY_GRADIENT_STOPS, value);
}
