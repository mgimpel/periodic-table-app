// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the coloring-scheme helpers (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/coloringScheme.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import assert from "node:assert/strict";
import {
  COLORING_SCHEME_OPTIONS,
  normalizeStoredColoringScheme,
} from "./coloringScheme";

// Valid options pass through unchanged.
for (const opt of COLORING_SCHEME_OPTIONS) {
  assert.equal(normalizeStoredColoringScheme(opt), opt);
}

// Invalid / missing values fall back to "category".
for (const bad of ["", "colour", null, undefined, 42, {}]) {
  assert.equal(normalizeStoredColoringScheme(bad), "category", String(bad));
}

console.log("ok: coloringScheme self-check passed");
