// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Self-check for the CAS group-label placement table. Runs via `pnpm check`.
//
// The one piece of hand-derived logic here is "each label sits directly above
// the first element of its column". We verify that against the real dataset:
// for every column, the label's row must equal the lowest period among the
// elements in that column (grid row N+1 is period N, so "above" = that period's
// number). If the table or the dataset drifts, this fails.

import assert from "node:assert/strict";
import { GROUP_LABELS } from "./groupLabels";
import { ELEMENTS } from "../data/elements";

// Exactly 18 columns, one label each, in column order 1..18.
assert.equal(GROUP_LABELS.length, 18, "expected 18 group labels (one per column)");
GROUP_LABELS.forEach((label, i) => {
  assert.equal(label.col, i + 1, `labels must be in column order; index ${i} has col ${label.col}`);
  assert.ok(label.text.trim().length > 0, `label for column ${label.col} is empty`);
});

// For each column, the label row must match the lowest period of the elements
// actually in that column (xpos). This is the "directly above the first
// element" rule, checked against the real data rather than restated.
for (const { col, row } of GROUP_LABELS) {
  const periods = ELEMENTS.filter((e) => e.xpos === col).map((e) => e.period);
  assert.ok(periods.length > 0, `no element found in column ${col}`);
  const firstPeriod = Math.min(...periods);
  assert.equal(
    row,
    firstPeriod,
    `column ${col}: label row ${row} should be the first element's period ${firstPeriod}`,
  );
}

console.log("groupLabels.check.ts OK");
