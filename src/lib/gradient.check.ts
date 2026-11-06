// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the temperature gradient (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/temperatureGradient.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import assert from "node:assert/strict";
import {
  interpolateStops,
  linearGradientCss,
  TEMPERATURE_MAX,
  temperatureColor,
  ELECTRONEGATIVITY_MAX,
  ELECTRONEGATIVITY_MIN,
  ELECTRONEGATIVITY_GRADIENT_STOPS,
  electronegativityColor,
} from "./gradient";

// Exact colors at the four interpolation anchors.
assert.equal(temperatureColor(0), "rgb(33, 102, 172)"); // blue
assert.equal(temperatureColor(373), "rgb(247, 247, 247)"); // white
assert.equal(temperatureColor(2273), "rgb(253, 174, 97)"); // orange
assert.equal(temperatureColor(TEMPERATURE_MAX), "rgb(178, 24, 43)"); // red

// Clamped below the first stop → blue, above the last stop → red.
assert.equal(temperatureColor(-100), "rgb(33, 102, 172)");
assert.equal(temperatureColor(TEMPERATURE_MAX + 100), "rgb(178, 24, 43)");

// Output is always an "rgb(r, g, b)" string with integer channels in [0, 255].
for (const k of [-100, 0, 186.5, 373, 1323, 2273, TEMPERATURE_MAX, TEMPERATURE_MAX + 100]) {
  const out = temperatureColor(k);
  const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(out);
  assert.ok(match, `not rgb(...) format: ${out} (k=${k})`);
  for (const ch of match.slice(1)) {
    const n = Number(ch);
    assert.ok(Number.isInteger(n) && n >= 0 && n <= 255, `channel ${ch} out of range (k=${k})`);
  }
}

// Assert-based self-check for the electronegativity gradient (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/electronegativityGradient.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

// Exact endpoint colors at the two stops (green low, purple high).
assert.equal(electronegativityColor(ELECTRONEGATIVITY_MIN), "rgb(102, 189, 99)"); // green
assert.equal(electronegativityColor(ELECTRONEGATIVITY_MAX), "rgb(118, 42, 131)"); // purple

// Clamped below the min stop → green, above the max stop → purple.
assert.equal(electronegativityColor(ELECTRONEGATIVITY_MIN - 10), "rgb(102, 189, 99)");
assert.equal(electronegativityColor(ELECTRONEGATIVITY_MAX + 10), "rgb(118, 42, 131)");

// electronegativityColor no longer has a collapse guard. Exercise the
// zero-width stop-set clamp directly against interpolateStops: a single-stop
// (min === max) set clamps every input to that one endpoint color.
const degenerate = [{ x: 3, rgb: [118, 42, 131] as [number, number, number] }];
assert.equal(interpolateStops(degenerate, 3), "rgb(118, 42, 131)");
assert.equal(interpolateStops(degenerate, 0), "rgb(118, 42, 131)");
assert.equal(interpolateStops(degenerate, 99), "rgb(118, 42, 131)");

// Output is always an "rgb(r, g, b)" string with integer channels in [0, 255].
const mid = (ELECTRONEGATIVITY_MIN + ELECTRONEGATIVITY_MAX) / 2;
for (const v of [ELECTRONEGATIVITY_MIN - 10, ELECTRONEGATIVITY_MIN, mid, ELECTRONEGATIVITY_MAX, ELECTRONEGATIVITY_MAX + 10]) {
  const out = electronegativityColor(v);
  const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(out);
  assert.ok(match, `not rgb(...) format: ${out} (v=${v})`);
  for (const ch of match.slice(1)) {
    const n = Number(ch);
    assert.ok(Number.isInteger(n) && n >= 0 && n <= 255, `channel ${ch} out of range (v=${v})`);
  }
}

// Sanity: the two EN_STOPS carry the asserted endpoint colors.
assert.deepEqual(ELECTRONEGATIVITY_GRADIENT_STOPS[0].rgb, [102, 189, 99]);
assert.deepEqual(ELECTRONEGATIVITY_GRADIENT_STOPS[ELECTRONEGATIVITY_GRADIENT_STOPS.length - 1].rgb, [118, 42, 131]);

// linearGradientCss builds a `to right` gradient with the green min stop at 0%
// and the purple max stop at 100% (the two EN endpoints).
const enGradient = linearGradientCss(ELECTRONEGATIVITY_GRADIENT_STOPS);
assert.ok(enGradient.startsWith("linear-gradient(to right, "), `bad prefix: ${enGradient}`);
assert.ok(
  enGradient.includes("rgb(102, 189, 99) 0%") && enGradient.includes("rgb(118, 42, 131) 100%"),
  `missing endpoint stops: ${enGradient}`,
);

console.log("ok: gradient self-check passed");
