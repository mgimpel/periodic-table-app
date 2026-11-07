// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import classes from "./PeriodicTable.module.css";

// CAS group labels (I A, II A, ... VIII A) for the 18 table columns, and the
// grid cell each one occupies. The notation is identical across languages, so
// it is not translated.
//
// Each label sits directly above the first element of its column. The topmost
// element differs by column, so the grid row the label occupies does too.
// Element rows are period + 1 (grid row 1 is the group-label row; see
// PeriodicTable.module.css), so the label row is the first element's period:
//   col 1, 18      -> period 1 (H / He)          -> row 1
//   col 2, 13-17   -> period 2 (Li.. / B..)      -> row 2
//   cols 3-12      -> period 4 (Sc.., d-block)   -> row 4
// Every target cell is empty, so a label never overlaps an element.
interface GroupLabel {
  /** Grid column (1-based, 1-18). */
  col: number;
  /** Grid row the label occupies (directly above the column's first element). */
  row: number;
  /** CAS group notation, e.g. "I A". */
  text: string;
}

const GROUP_LABELS: readonly GroupLabel[] = [
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
// the grid cell directly above the first element of its column (see
// src/lib/groupLabels.ts for the placement and PeriodicTable.module.css for the
// row model). Rendered as direct grid items so they inherit the table's
// fit-scale transform.
export function GroupLabels() {
  return (
    <>
      {GROUP_LABELS.map(({ col, row, text }) => (
        <span
          key={col}
          className={classes.groupLabel}
          // +1: grid column 1 is the period-label column, so group column N
          // sits on grid column N+1 (see PeriodicTable.module.css).
          style={{ gridColumnStart: col + 1, gridRowStart: row }}
        >
          {text}
        </span>
      ))}
    </>
  );
}
