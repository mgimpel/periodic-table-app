// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import classes from "./PeriodicTable.module.css";

// Non-element labels overlaid on the table grid, rendered as direct grid items
// of .grid so they inherit the table's fit-scale transform. Three kinds:
//   - GroupLabels:  CAS group notation (I A ... VIII A) above each column.
//   - PeriodLabels: period numbers (1-7) down the leftmost column.
//   - SeriesLabels: lanthanide/actinide ranges (57-71, 89-103) in the empty
//                   period-6/7 column-3 cells.
// All three are universal notation, so none are translated.
//
// Grid mapping (see PeriodicTable.module.css): grid column 1 is the period-label
// column and grid row 1 is the group-label row, so an element column N sits on
// grid column N + 1 and a period N sits on grid row N + 1.

interface GridLabel {
  /** 1-based grid column. */
  col: number;
  /** 1-based grid row. */
  row: number;
  /** Label text. */
  text: string;
}

// --- CAS group labels -------------------------------------------------------

// Each label sits directly above the first element of its column. The topmost
// element differs by column, so the grid row the label occupies does too.
// Element rows are period + 1 (grid row 1 is the group-label row), so the label
// row is the first element's period:
//   col 1, 18      -> period 1 (H / He)          -> row 1
//   col 2, 13-17   -> period 2 (Li.. / B..)      -> row 2
//   cols 3-12      -> period 4 (Sc.., d-block)   -> row 4
// Every target cell is empty, so a label never overlaps an element. The `col`
// here is the CAS group column (1-18); +1 at render time maps it to the grid.
const GROUP_LABELS: readonly GridLabel[] = [
  { col: 1, row: 1, text: "I A" },
  { col: 2, row: 2, text: "II A" },
  { col: 3, row: 4, text: "III B" },
  { col: 4, row: 4, text: "IV B" },
  { col: 5, row: 4, text: "V B" },
  { col: 6, row: 4, text: "VI B" },
  { col: 7, row: 4, text: "VII B" },
  { col: 8, row: 4, text: "┌─" },
  { col: 9, row: 4, text: "VIII B" },
  { col: 10, row: 4, text: "─┐" },
  { col: 11, row: 4, text: "I B" },
  { col: 12, row: 4, text: "II B" },
  { col: 13, row: 2, text: "III A" },
  { col: 14, row: 2, text: "IV A" },
  { col: 15, row: 2, text: "V A" },
  { col: 16, row: 2, text: "VI A" },
  { col: 17, row: 2, text: "VII A" },
  { col: 18, row: 1, text: "VIII A" },
];

// CAS group labels (I A, II A, ... VIII A), one per table column, each placed in
// the grid cell directly above the first element of its column.
export function GroupLabels() {
  return (
    <>
      {GROUP_LABELS.map(({ col, row, text }) => (
        <span
          key={col}
          className={classes.groupLabel}
          // +1: grid column 1 is the period-label column, so group column N
          // sits on grid column N + 1.
          style={{ gridColumnStart: col + 1, gridRowStart: row }}
        >
          {text}
        </span>
      ))}
    </>
  );
}

// --- Period labels ----------------------------------------------------------

/** Grid column reserved for the period labels (leftmost). */
const PERIOD_LABEL_COL = 1;

// Period numbers (1-7) occupy grid column 1 (the prepended label column); period
// N sits on grid row N + 1 (grid row 1 is the group-label row). The lanthanide/
// actinide f-block rows belong to periods 6 and 7, already labelled on their
// main rows, so they get no separate label.
const PERIOD_LABELS: readonly GridLabel[] = Array.from(
  { length: 7 },
  (_unused, i) => {
    const period = i + 1;
    return { col: PERIOD_LABEL_COL, row: period + 1, text: String(period) };
  },
);

// Period numbers (1-7) down the left side of the table, one per main row, each
// placed in the leftmost label column.
export function PeriodLabels() {
  return (
    <>
      {PERIOD_LABELS.map(({ col, row, text }) => (
        <span
          key={row}
          className={classes.periodLabel}
          style={{ gridColumnStart: col, gridRowStart: row }}
        >
          {text}
        </span>
      ))}
    </>
  );
}

// --- Series labels ----------------------------------------------------------

// In the main table, period 6 column 3 (between Barium and Hafnium) and period 7
// column 3 (between Radium and Rutherfordium) hold no single element — the
// f-block elements live on the two detached rows below. Each empty cell carries
// the atomic-number range of its series instead. `col`/`row` are already grid
// coordinates: period 6 column 3 -> col 4, row 7; period 7 column 3 -> col 4,
// row 8.
const SERIES_LABELS: readonly GridLabel[] = [
  { col: 4, row: 7, text: "57-71" }, // lanthanides, period 6 column 3
  { col: 4, row: 8, text: "89-103" }, // actinides, period 7 column 3
];

// Series-range placeholders (57-71, 89-103) in the empty period-6/7 column-3
// cells.
export function SeriesLabels() {
  return (
    <>
      {SERIES_LABELS.map(({ col, row, text }) => (
        <span
          key={text}
          className={classes.seriesLabel}
          style={{ gridColumnStart: col, gridRowStart: row }}
        >
          {text}
        </span>
      ))}
    </>
  );
}
