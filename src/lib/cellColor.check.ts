// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the cell-color resolver (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/cellColor.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import assert from "node:assert/strict";
import { cellColor, phaseBucket, PHASE_COLORS } from "./cellColor";
import { MISSING_VALUE_COLOR, temperatureColor } from "./temperatureGradient";
import { CATEGORY_COLORS } from "../data/element";
import { ELEMENTS } from "../data/elements";

// phaseBucket: known dataset values map to their lowercase bucket.
assert.equal(phaseBucket("Solid"), "solid");
assert.equal(phaseBucket("Liquid"), "liquid");
assert.equal(phaseBucket("Gas"), "gas");

// phaseBucket: absent/empty/unrecognized values fall back to "unknown".
for (const bad of ["", "plasma", "SOLID?", "unknown"]) {
  assert.equal(phaseBucket(bad), "unknown", bad);
}

// Resolver, category scheme: every element (incl. unknown category) resolves to
// its fixed category color.
for (const element of ELEMENTS) {
  assert.equal(
    cellColor("category", element),
    CATEGORY_COLORS[element.category],
    element.name,
  );
}

// Resolver, phase scheme: every element resolves to its bucket's phase color.
for (const element of ELEMENTS) {
  assert.equal(
    cellColor("phase", element),
    PHASE_COLORS[phaseBucket(element.phase)],
    element.name,
  );
}

// Resolver, gradient schemes: MISSING_VALUE_COLOR exactly when the value is
// null, else the gradient color for that Kelvin value. Checked against real
// elements so both the null and non-null branches are exercised.
const withNullMelt = ELEMENTS.find((e) => e.melt === null);
const withMelt = ELEMENTS.find((e) => e.melt !== null);
const withNullBoil = ELEMENTS.find((e) => e.boil === null);
const withBoil = ELEMENTS.find((e) => e.boil !== null);
assert.ok(withNullMelt && withMelt, "dataset must have null and non-null melt");
assert.ok(withNullBoil && withBoil, "dataset must have null and non-null boil");

assert.equal(cellColor("melting-point", withNullMelt), MISSING_VALUE_COLOR);
assert.equal(
  cellColor("melting-point", withMelt),
  temperatureColor(withMelt.melt as number),
);
assert.equal(cellColor("boiling-point", withNullBoil), MISSING_VALUE_COLOR);
assert.equal(
  cellColor("boiling-point", withBoil),
  temperatureColor(withBoil.boil as number),
);

console.log("ok: cellColor self-check passed");
