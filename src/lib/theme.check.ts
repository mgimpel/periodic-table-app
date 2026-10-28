// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for normalizeStoredTheme (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/theme.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import assert from "node:assert/strict";
import { normalizeStoredTheme, THEME_OPTIONS } from "./theme";

// Valid options pass through unchanged.
for (const opt of THEME_OPTIONS) {
  const r = normalizeStoredTheme(opt);
  assert(r === opt, `valid option ${opt} should pass through, got ${r}`);
}

// Invalid / missing values fall back to "auto".
for (const bad of ["", "blue", null, undefined, 42]) {
  const r = normalizeStoredTheme(bad);
  assert(r === "auto", `invalid input ${String(bad)} should fall back to auto, got ${r}`);
}

console.log("ok: normalizeStoredTheme self-check passed");
