// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Shared piecewise-linear RGB gradient used by the element coloring schemes.
// A scheme supplies its own ascending stops (temperature in Kelvin,
// electronegativity, ...) and asks for the color at a given position; the
// interpolation, clamping, rounding and formatting live here once.

/** Neutral grey for cells with a null value under a gradient scheme. */
export const MISSING_VALUE_COLOR = "#cfd8dc";

/** One interpolation stop: color `rgb` at position `x` on the scheme's scale. */
export interface Stop {
  x: number;
  rgb: [number, number, number];
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
