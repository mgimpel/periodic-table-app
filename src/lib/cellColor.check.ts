// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the cell-color resolver (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/cellColor.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import assert from "node:assert/strict";
import {
  cellColor,
  clampSelectedTemperature,
  ORIGIN_COLORS,
  originBucket,
  phaseAtTemperature,
  phaseBucket,
  PHASE_COLORS,
  spectralCellColor,
} from "./cellColor";
import {
  MISSING_VALUE_COLOR,
  temperatureColor,
  electronegativityColor,
  TEMPERATURE_MAX,
} from "./gradient";
import { CATEGORY_COLORS, type Element } from "../data/element";
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

// originBucket: known dataset values map to their bucket.
assert.equal(originBucket("primordial"), "primordial");
assert.equal(originBucket("from decay"), "from-decay");
assert.equal(originBucket("synthetic"), "synthetic");

// originBucket: absent/empty/unrecognized values fall back to "unknown".
for (const bad of ["", "cosmic", "from-decay", "Synthetic?"]) {
  assert.equal(originBucket(bad), "unknown", bad);
}

// The four origin colors are mutually distinct.
assert.equal(new Set(Object.values(ORIGIN_COLORS)).size, 4);

// spectralCellColor: a valid 6-hex (no "#") becomes "#" + raw.
assert.equal(spectralCellColor("ff497e"), "#ff497e");

// spectralCellColor: null and any malformed value fall back to the sentinel.
for (const bad of [null, "fff", "gggggg", "#ff497e"]) {
  assert.equal(spectralCellColor(bad), MISSING_VALUE_COLOR, String(bad));
}

// Resolver, electronegativity scheme: MISSING_VALUE_COLOR when null, else the
// gradient color. Checked against real elements so both branches are exercised.
const withNullEn = ELEMENTS.find((e) => e.electronegativity === null);
const withEn = ELEMENTS.find((e) => e.electronegativity !== null);
assert.ok(withNullEn && withEn, "dataset must have null and non-null en");
assert.equal(cellColor("electronegativity", withNullEn), MISSING_VALUE_COLOR);
assert.equal(
  cellColor("electronegativity", withEn),
  electronegativityColor(withEn.electronegativity as number),
);

// Resolver, origin scheme: every element resolves to its bucket's origin color.
for (const element of ELEMENTS) {
  assert.equal(
    cellColor("origin", element),
    ORIGIN_COLORS[originBucket(element.origin)],
    element.name,
  );
}

// Resolver, spectral-colour scheme: every element resolves to spectralCellColor
// of its raw value (covering both valid-hex and missing-value branches).
for (const element of ELEMENTS) {
  assert.equal(
    cellColor("spectral-colour", element),
    spectralCellColor(element.spectralColour),
    element.name,
  );
}

// phaseAtTemperature: only melt/boil matter, so build a minimal element with the
// two Kelvin values under test (other fields are irrelevant to the classifier).
const el = (melt: number | null, boil: number | null): Element =>
  ({ melt, boil } as Element);

// Consistent (water-like) element across the three temperature regions.
const water = el(273.15, 373.15);
assert.equal(phaseAtTemperature(200, water), "solid"); // below melt
assert.equal(phaseAtTemperature(300, water), "liquid"); // between
assert.equal(phaseAtTemperature(273.15, water), "liquid"); // at melt → liquid
assert.equal(phaseAtTemperature(400, water), "gas"); // above boil
assert.equal(phaseAtTemperature(373.15, water), "gas"); // at boil → gas

// Partial data: melt-only (T<melt solid, else unknown).
assert.equal(phaseAtTemperature(200, el(273.15, null)), "solid");
assert.equal(phaseAtTemperature(300, el(273.15, null)), "unknown");

// Partial data: boil-only (T>=boil gas, else unknown).
assert.equal(phaseAtTemperature(400, el(null, 373.15)), "gas");
assert.equal(phaseAtTemperature(300, el(null, 373.15)), "unknown");

// Both null → unknown.
assert.equal(phaseAtTemperature(300, el(null, null)), "unknown");

// Inconsistent data: melt >= boil → unknown (both equal and inverted).
assert.equal(phaseAtTemperature(300, el(400, 300)), "unknown");
assert.equal(phaseAtTemperature(300, el(300, 300)), "unknown");

// "Unknown" value edges: 0, negative, and non-finite melt/boil are not "known",
// so an element carrying only such values classifies as unknown.
for (const bad of [0, -50, Number.NaN, Number.POSITIVE_INFINITY]) {
  assert.equal(phaseAtTemperature(300, el(bad, bad)), "unknown", String(bad));
}
// A 0/negative/non-finite boil beside a known melt falls back to melt-only rules.
assert.equal(phaseAtTemperature(200, el(273.15, 0)), "solid");
assert.equal(phaseAtTemperature(300, el(273.15, -1)), "unknown");

// clampSelectedTemperature: below 0 → 0; in range → unchanged; above max → max.
assert.equal(clampSelectedTemperature(-10), 0);
assert.equal(clampSelectedTemperature(0), 0);
assert.equal(clampSelectedTemperature(TEMPERATURE_MAX / 2), TEMPERATURE_MAX / 2);
assert.equal(clampSelectedTemperature(TEMPERATURE_MAX), TEMPERATURE_MAX);
assert.equal(clampSelectedTemperature(TEMPERATURE_MAX + 100), TEMPERATURE_MAX);

console.log("ok: cellColor self-check passed");
