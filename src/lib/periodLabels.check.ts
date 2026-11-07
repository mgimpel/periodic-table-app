// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Self-check for the period-label placement. Runs via `pnpm check`.
//
// The hand-derived logic is "label for period N sits on grid row N + 1, in the
// leftmost label column". We verify there is exactly one label per main period
// present in the dataset, in row order, each in the label column, and that the
// row matches the element row mapping (ypos + 1) for that period.

import assert from "node:assert/strict";
import { PERIOD_LABELS, PERIOD_LABEL_COL } from "./periodLabels";
import { ELEMENTS } from "../data/elements";

// The seven main periods, in order 1..7.
assert.equal(PERIOD_LABELS.length, 7, "expected 7 period labels (one per main period)");
PERIOD_LABELS.forEach((label, i) => {
  const period = i + 1;
  assert.equal(label.col, PERIOD_LABEL_COL, `period ${period} label not in the label column`);
  assert.equal(label.text, String(period), `label ${i} text should be "${period}"`);

  // Row must match the element row mapping (ypos + 1) for an element whose main
  // row is this period. Use a p-block element so f-block ypos quirks don't apply.
  const sample = ELEMENTS.find((e) => e.period === period && e.ypos === period);
  assert.ok(sample, `no main-row element found for period ${period}`);
  assert.equal(
    label.row,
    sample.ypos + 1,
    `period ${period}: label row ${label.row} should be ypos+1 (${sample.ypos + 1})`,
  );
});

console.log("ok: period labels self-check passed");
