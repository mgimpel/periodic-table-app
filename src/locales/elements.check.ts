// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the locale resources (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/locales/elements.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.
//
// Guards two invariants (the single enforcement point for both):
//   (1) en/elements.json equals the dataset — every name.<n> matches ELEMENTS
//       and every summary.<n> is a present non-empty string, with no stray keys.
//   (2) CATEGORY_KEYS contains exactly the keys of CATEGORY_COLORS.

import assert from "node:assert/strict";
import { ELEMENTS } from "../data/elements";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../data/element";
import enElements from "./en/elements.json";

const names = enElements.name as Record<string, string>;
const summaries = enElements.summary as Record<string, string>;

// (1) Every element's name/summary resource matches the dataset.
for (const e of ELEMENTS) {
  const key = String(e.atomicNumber);
  assert(
    names[key] === e.name,
    `en name.${key} should equal "${e.name}", got "${names[key]}"`,
  );
  const summary = summaries[key];
  assert(
    typeof summary === "string" && summary.length > 0,
    `en summary.${key} should be a present non-empty string`,
  );
}

// No stray keys in either map (exactly the 118 atomic numbers).
const expectedKeys = new Set(ELEMENTS.map((e) => String(e.atomicNumber)));
for (const map of [names, summaries]) {
  const keys = Object.keys(map);
  assert(
    keys.length === expectedKeys.size,
    `expected ${expectedKeys.size} keys, got ${keys.length}`,
  );
  for (const k of keys) {
    assert(expectedKeys.has(k), `stray key "${k}" in en/elements.json`);
  }
}

// (2) CATEGORY_KEYS has exactly the keys of CATEGORY_COLORS.
const colorKeys = Object.keys(CATEGORY_COLORS);
assert(
  CATEGORY_KEYS.length === colorKeys.length,
  `CATEGORY_KEYS has ${CATEGORY_KEYS.length} entries, CATEGORY_COLORS has ${colorKeys.length}`,
);
const categorySet = new Set<string>(CATEGORY_KEYS);
assert(
  categorySet.size === CATEGORY_KEYS.length,
  "CATEGORY_KEYS contains duplicates",
);
for (const k of colorKeys) {
  assert(categorySet.has(k), `CATEGORY_KEYS missing category "${k}"`);
}

console.log(
  `ok: ${ELEMENTS.length} element resources validated, ${CATEGORY_KEYS.length} categories in sync`,
);
