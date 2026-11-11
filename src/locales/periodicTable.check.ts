// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the locale resources (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/locales/periodicTable.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.
//
// Guards three invariants (the single enforcement point for all):
//   (1) periodic-table.en.json equals the dataset — each element's symbol/name
//       matches ELEMENTS and every summary is a present non-empty string.
//   (2) The adapted `periodicTable.en` namespace has a name + summary for all
//       118 elements, with no stray keys and no appearance key where the source
//       has none.
//   (3) Every locale in `resources` has exactly en's ui.<xx>.json key set (same
//       {{…}} tokens, non-empty values) and a name for each of the 118 elements.
// (The CATEGORY_KEYS ↔ CATEGORY_COLORS invariant is now enforced at compile time
// by `Record<ElementCategory, string>` in src/data/element.ts.)

import assert from "node:assert/strict";
import { ELEMENTS } from "../data/elements";
import enPeriodicTable from "./periodic-table.en.json";
import { resources } from "./index";

const expectedKeys = new Set(ELEMENTS.map((e) => String(e.atomicNumber)));

// (1) The English locale file is in sync with the dataset. It mirrors the
// source array shape; only elements 1–118 are checked (119 is the source's
// hypothetical entry, dropped by the app).
const enByNumber = new Map(enPeriodicTable.elements.map((e) => [e.number, e]));
for (const e of ELEMENTS) {
  const src = enByNumber.get(e.atomicNumber);
  assert(src !== undefined, `periodic-table.en.json missing element ${e.atomicNumber}`);
  assert(
    src.symbol === e.symbol,
    `periodic-table.en.json symbol.${e.atomicNumber} should equal "${e.symbol}", got "${src.symbol}"`,
  );
  assert(
    src.name === e.name,
    `periodic-table.en.json name.${e.atomicNumber} should equal "${e.name}", got "${src.name}"`,
  );
  assert(
    typeof src.summary === "string" && src.summary.length > 0,
    `periodic-table.en.json summary.${e.atomicNumber} should be a present non-empty string`,
  );
}

// (2) The adapted en namespace: a name + summary for exactly the 118 atomic
// numbers, no strays, and appearance only where the source has a value.
const enNs = resources.en.periodicTable;
for (const field of ["name", "summary"] as const) {
  const keys = Object.keys(enNs[field]);
  assert(
    keys.length === expectedKeys.size,
    `periodicTable.en ${field} has ${keys.length} keys, expected ${expectedKeys.size}`,
  );
  for (const k of keys) {
    assert(expectedKeys.has(k), `stray ${field} key "${k}" in periodicTable.en`);
  }
}
for (const k of Object.keys(enNs.appearance)) {
  assert(expectedKeys.has(k), `stray appearance key "${k}" in periodicTable.en`);
}

// (3) Every registered locale is in parity with en.
const flatKeys = (obj: object, prefix = ""): Map<string, unknown> =>
  new Map(
    Object.entries(obj).flatMap(([k, v]) =>
      v !== null && typeof v === "object"
        ? [...flatKeys(v, `${prefix}${k}.`)]
        : [[`${prefix}${k}`, v] as const],
    ),
  );
const tokens = (s: string) => (s.match(/\{\{\w+\}\}/g) ?? []).sort().join(",");

const enUi = flatKeys(resources.en.ui);
for (const [locale, res] of Object.entries(resources)) {
  // (a) ui leaf keys match en exactly; every value a non-empty string.
  const ui = flatKeys(res.ui);
  const missing = [...enUi.keys()].filter((k) => !ui.has(k));
  const extra = [...ui.keys()].filter((k) => !enUi.has(k));
  assert(missing.length === 0, `ui.${locale}.json missing keys: ${missing.join(", ")}`);
  assert(extra.length === 0, `ui.${locale}.json extra keys: ${extra.join(", ")}`);
  for (const [k, v] of ui) {
    assert(
      typeof v === "string" && v.length > 0,
      `ui.${locale}.json ${k} should be a non-empty string`,
    );
    // (b) interpolation tokens preserved.
    const enValue = enUi.get(k) as string;
    assert(
      tokens(v) === tokens(enValue),
      `ui.${locale}.json ${k} tokens "${tokens(v)}" differ from en "${tokens(enValue)}"`,
    );
  }

  // (c) a name for exactly every element; (d) appearance/summary only for real elements.
  const ns = res.periodicTable;
  const nameKeys = Object.keys(ns.name);
  assert(
    nameKeys.length === expectedKeys.size,
    `periodic-table.${locale}.json has ${nameKeys.length} names, expected ${expectedKeys.size}`,
  );
  for (const k of expectedKeys) {
    const n = ns.name[k as keyof typeof ns.name];
    assert(
      typeof n === "string" && n.length > 0,
      `periodic-table.${locale}.json name.${k} should be a non-empty string`,
    );
  }
  for (const field of ["appearance", "summary"] as const) {
    for (const k of Object.keys(ns[field])) {
      assert(expectedKeys.has(k), `stray ${field} key "${k}" in periodic-table.${locale}.json`);
    }
  }
}

console.log(
  `ok: ${ELEMENTS.length} element resources validated, ${Object.keys(resources).length} locales in parity`,
);
