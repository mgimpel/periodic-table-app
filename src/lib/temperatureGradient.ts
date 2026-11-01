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
import { type Stop, interpolateStops } from "./gradient";

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

/**
 * Fixed interpolation stops on the absolute Kelvin scale, in ascending order.
 * RGB chosen for readability against dark cell text in both color schemes.
 */
export const GRADIENT_STOPS: readonly Stop[] = [
  { x: 0, rgb: [33, 102, 172] }, // blue
  { x: 373, rgb: [247, 247, 247] }, // white
  { x: 1273, rgb: [253, 174, 97] }, // orange
  { x: DATASET_MAX, rgb: [178, 24, 43] }, // red
];

/**
 * Map an absolute temperature in Kelvin to a cell color via piecewise-linear
 * RGB interpolation between adjacent GRADIENT_STOPS. Clamped: k <= 0 yields the
 * blue endpoint, k >= DATASET_MAX yields the red endpoint. Always returns a
 * valid "rgb(r, g, b)" string with integer channels.
 */
export function temperatureColor(kelvin: number): string {
  return interpolateStops(GRADIENT_STOPS, kelvin);
}
