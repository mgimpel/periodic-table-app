// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the pure language core (no test framework).
// Run with a TS runner (e.g. `pnpm exec vite-node src/lib/language.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import { normalizeStoredLanguage, resolveLanguage } from "./language";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

// Valid options pass through unchanged.
for (const opt of ["system", "en", "fr"] as const) {
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
  resolveLanguage("system", ["de"]) === "en",
  "system with unsupported [de] should fall back to en",
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
