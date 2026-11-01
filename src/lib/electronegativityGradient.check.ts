// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the electronegativity gradient (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/electronegativityGradient.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import assert from "node:assert/strict";
import {
  DATASET_MAX_EN,
  DATASET_MIN_EN,
  EN_STOPS,
  electronegativityColor,
} from "./electronegativityGradient";
import { interpolateStops } from "./gradient";

// Exact endpoint colors at the two stops (green low, purple high).
assert.equal(electronegativityColor(DATASET_MIN_EN), "rgb(102, 189, 99)"); // green
assert.equal(electronegativityColor(DATASET_MAX_EN), "rgb(118, 42, 131)"); // purple

// Clamped below the min stop → green, above the max stop → purple.
assert.equal(electronegativityColor(DATASET_MIN_EN - 10), "rgb(102, 189, 99)");
assert.equal(electronegativityColor(DATASET_MAX_EN + 10), "rgb(118, 42, 131)");

// Degenerate stop set (min === max): the real dataset has min !== max, so
// electronegativityColor's collapse guard can't be reached with the real
// constants. Exercise the documented clamp behavior directly: a zero-width
// stop set clamps everything to the single endpoint color.
const degenerate = [{ x: 3, rgb: [118, 42, 131] as [number, number, number] }];
assert.equal(interpolateStops(degenerate, 3), "rgb(118, 42, 131)");
assert.equal(interpolateStops(degenerate, 0), "rgb(118, 42, 131)");
assert.equal(interpolateStops(degenerate, 99), "rgb(118, 42, 131)");

// Output is always an "rgb(r, g, b)" string with integer channels in [0, 255].
const mid = (DATASET_MIN_EN + DATASET_MAX_EN) / 2;
for (const v of [DATASET_MIN_EN - 10, DATASET_MIN_EN, mid, DATASET_MAX_EN, DATASET_MAX_EN + 10]) {
  const out = electronegativityColor(v);
  const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(out);
  assert.ok(match, `not rgb(...) format: ${out} (v=${v})`);
  for (const ch of match.slice(1)) {
    const n = Number(ch);
    assert.ok(Number.isInteger(n) && n >= 0 && n <= 255, `channel ${ch} out of range (v=${v})`);
  }
}

// Sanity: the two EN_STOPS carry the asserted endpoint colors.
assert.deepEqual(EN_STOPS[0].rgb, [102, 189, 99]);
assert.deepEqual(EN_STOPS[EN_STOPS.length - 1].rgb, [118, 42, 131]);

console.log("ok: electronegativityGradient self-check passed");
