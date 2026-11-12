// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import classes from "./PeriodicTable.module.css";

// Lanthanide/actinide series placeholders. In the main table, period 6 column 3
// (between Barium and Hafnium) and period 7 column 3 (between Radium and
// Rutherfordium) hold no single element — the f-block elements live on the two
// detached rows below. Each empty cell carries the atomic-number range of its
// series instead. The ranges are universal, so they are not translated.
//
// Grid mapping mirrors the elements': column N sits on grid column N + 1 (the
// period-label column is first) and period N sits on grid row N + 1 (the
// group-label row is first). So period 6 column 3 -> col 4, row 7; period 7
// column 3 -> col 4, row 8.
interface SeriesLabel {
  /** Grid column (element column + 1). */
  col: number;
  /** Grid row (period + 1). */
  row: number;
  /** Atomic-number range of the series, e.g. "57-71". */
  text: string;
}

const SERIES_LABELS: readonly SeriesLabel[] = [
  { col: 4, row: 7, text: "57-71" }, // lanthanides, period 6 column 3
  { col: 4, row: 8, text: "89-103" }, // actinides, period 7 column 3
];

// Series-range placeholders (57-71, 89-103) in the empty period-6/7 column-3
// cells. Rendered as direct grid items of .grid so they inherit the table's
// fit-scale transform.
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
