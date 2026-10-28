// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the pure language core (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/language.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import assert from "node:assert/strict";
import { normalizeStoredLanguage, resolveLanguage } from "./language";

// Valid options pass through unchanged.
for (const opt of ["system", "en", "fr", "es", "de"] as const) {
  const r = normalizeStoredLanguage(opt);
  assert(r === opt, `valid option ${opt} should pass through, got ${r}`);
}

// Invalid / missing values fall back to "system".
for (const bad of ["", "blue", null, undefined, 42]) {
  const r = normalizeStoredLanguage(bad);
  assert(
    r === "system",
    `invalid input ${String(bad)} should fall back to system, got ${r}`,
  );
}

// resolveLanguage: system resolution and explicit identity.
assert(
  resolveLanguage("system", ["fr-FR", "en"]) === "fr",
  "system with [fr-FR, en] should resolve to fr",
);
assert(
  resolveLanguage("system", ["ja"]) === "en",
  "system with unsupported [ja] should fall back to en",
);
assert(
  resolveLanguage("system", ["es-MX"]) === "es",
  "system with [es-MX] should resolve to es",
);
assert(
  resolveLanguage("system", ["de-AT", "en"]) === "de",
  "system with [de-AT, en] should resolve to de",
);
assert(
  resolveLanguage("system", ["ja", "DE-CH", "fr"]) === "de",
  "system with [ja, DE-CH, fr] should resolve to the first supported (de)",
);
assert(
  resolveLanguage("system", []) === "en",
  "system with empty list should fall back to en",
);
assert(
  resolveLanguage("fr", ["en"]) === "fr",
  "explicit fr should resolve to fr regardless of navigator",
);

console.log("ok: language self-check passed");
