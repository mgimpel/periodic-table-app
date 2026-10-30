// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the temperature gradient (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/temperatureGradient.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import assert from "node:assert/strict";
import { DATASET_MAX, temperatureColor } from "./temperatureGradient";

// Exact colors at the four interpolation anchors.
assert.equal(temperatureColor(0), "rgb(33, 102, 172)"); // blue
assert.equal(temperatureColor(273), "rgb(247, 247, 247)"); // white
assert.equal(temperatureColor(1000), "rgb(253, 174, 97)"); // orange
assert.equal(temperatureColor(DATASET_MAX), "rgb(178, 24, 43)"); // red

// Clamped below the first stop → blue, above the last stop → red.
assert.equal(temperatureColor(-100), "rgb(33, 102, 172)");
assert.equal(temperatureColor(DATASET_MAX + 100), "rgb(178, 24, 43)");

// Output is always an "rgb(r, g, b)" string with integer channels in [0, 255].
for (const k of [-100, 0, 136.5, 273, 636.5, 1000, DATASET_MAX, DATASET_MAX + 100]) {
  const out = temperatureColor(k);
  const match = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(out);
  assert.ok(match, `not rgb(...) format: ${out} (k=${k})`);
  for (const ch of match.slice(1)) {
    const n = Number(ch);
    assert.ok(Number.isInteger(n) && n >= 0 && n <= 255, `channel ${ch} out of range (k=${k})`);
  }
}

console.log("ok: temperatureGradient self-check passed");
