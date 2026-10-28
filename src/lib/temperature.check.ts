// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the temperature helpers (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/temperature.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import assert from "node:assert/strict";
import {
  formatTemperature,
  normalizeStoredTemperature,
  TEMPERATURE_OPTIONS,
} from "./temperature";

// Valid options pass through unchanged.
for (const opt of TEMPERATURE_OPTIONS) {
  assert.equal(normalizeStoredTemperature(opt), opt);
}

// Invalid / missing values fall back to "kelvin".
for (const bad of ["", "rankine", null, undefined, 42]) {
  assert.equal(normalizeStoredTemperature(bad), "kelvin", String(bad));
}

// Unknown values keep the "—" placeholder in every unit.
for (const opt of TEMPERATURE_OPTIONS) {
  assert.equal(formatTemperature(null, opt), "—");
}

// Known points.
assert.equal(formatTemperature(1811, "kelvin"), "1811 K");
assert.equal(formatTemperature(1811, "celsius"), "1537.85 °C");
assert.equal(formatTemperature(1811, "fahrenheit"), "2800.13 °F");
assert.equal(formatTemperature(273.15, "celsius"), "0 °C");
assert.equal(formatTemperature(273.15, "fahrenheit"), "32 °F");
assert.equal(formatTemperature(373.15, "celsius"), "100 °C");
assert.equal(formatTemperature(373.15, "fahrenheit"), "212 °F");
assert.equal(formatTemperature(0, "fahrenheit"), "-459.67 °F");
assert.equal(formatTemperature(20.271, "kelvin"), "20.27 K");

console.log("ok: temperature self-check passed");
