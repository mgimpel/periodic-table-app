// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import classes from "./PeriodicTable.module.css";

// Non-element labels overlaid on the table grid, rendered as direct grid items
// of .grid so they inherit the table's fit-scale transform. Three kinds:
//   - group labels:  CAS group notation (I A ... VIII A) above each column.
//   - period labels: period numbers (1-7) down the leftmost column.
//   - series labels: lanthanide/actinide ranges (57-71, 89-103) in the empty
//                    period-6/7 column-3 cells.
// All three are universal notation, so none are translated.
//
// Grid mapping (see PeriodicTable.module.css): grid column 1 is the period-label
// column and grid row 1 is the group-label row, so an element column N sits on
// grid column N + 1 and a period N sits on grid row N + 1. Every label below is
// stored in grid coordinates.

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
//   group 1, 18      -> period 1 (H / He)          -> row 1
//   group 2, 13-17   -> period 2 (Li.. / B..)      -> row 2
//   groups 3-12      -> period 4 (Sc.., d-block)   -> row 4
// Every target cell is empty, so a label never overlaps an element. Written as
// [CAS group (1-18), row, text]; +1 maps the group onto its grid column.
const GROUP_LABELS: readonly GridLabel[] = (
  [
    [1, 1, "I A"],
    [2, 2, "II A"],
    [3, 4, "III B"],
    [4, 4, "IV B"],
    [5, 4, "V B"],
    [6, 4, "VI B"],
    [7, 4, "VII B"],
    [8, 4, "┌─"],
    [9, 4, "VIII B"],
    [10, 4, "─┐"],
    [11, 4, "I B"],
    [12, 4, "II B"],
    [13, 2, "III A"],
    [14, 2, "IV A"],
    [15, 2, "V A"],
    [16, 2, "VI A"],
    [17, 2, "VII A"],
    [18, 1, "VIII A"],
  ] as const
).map(([group, row, text]) => ({ col: group + 1, row, text }));

// --- Period labels ----------------------------------------------------------

// Period N sits on grid row N + 1 in grid column 1 (the label column). The
// lanthanide/actinide f-block rows belong to periods 6 and 7, already labelled
// on their main rows, so they get no separate label.
const PERIOD_LABELS: readonly GridLabel[] = Array.from({ length: 7 }, (_unused, i) => ({
  col: 1,
  row: i + 2,
  text: String(i + 1),
}));

// --- Series labels ----------------------------------------------------------

// Period 6 column 3 (between Barium and Hafnium) and period 7 column 3 (between
// Radium and Rutherfordium) hold no single element — the f-block elements live
// on the two detached rows below. Each empty cell carries the atomic-number
// range of its series instead.
const SERIES_LABELS: readonly GridLabel[] = [
  { col: 4, row: 7, text: "57-71" }, // lanthanides, period 6 column 3
  { col: 4, row: 8, text: "89-103" }, // actinides, period 7 column 3
];

const LABEL_SETS = [
  { labels: GROUP_LABELS, className: classes.groupLabel },
  { labels: PERIOD_LABELS, className: classes.periodLabel },
  { labels: SERIES_LABELS, className: classes.seriesLabel },
];

// All non-element grid labels: group, period and series.
export function TableLabels() {
  return LABEL_SETS.flatMap(({ labels, className }) =>
    labels.map(({ col, row, text }) => (
      <span
        key={`${col}-${row}`}
        className={className}
        style={{ gridColumnStart: col, gridRowStart: row }}
      >
        {text}
      </span>
    )),
  );
}
