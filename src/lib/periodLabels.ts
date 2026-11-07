// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Period numbers (1-7) for the seven main table rows, placed in a thin column
// to the left of the table. The numbers are universal, so they are not
// translated.
//
// The grid prepends a period-label column, so element/group-label columns are
// shifted right by one (element gridColumnStart is xpos + 1); the period labels
// occupy grid column 1. Rows follow the same mapping the elements use: period N
// sits on grid row N + 1 (grid row 1 is the group-label row; see
// PeriodicTable.module.css). The lanthanide/actinide f-block rows belong to
// periods 6 and 7, which are already labelled on their main rows, so they get
// no separate label.
export interface PeriodLabel {
  /** Grid column the label occupies (always 1, the prepended label column). */
  col: number;
  /** Grid row the label occupies (period + 1). */
  row: number;
  /** Period number as display text, e.g. "1". */
  text: string;
}

/** Grid column reserved for the period labels (leftmost). */
export const PERIOD_LABEL_COL = 1;

export const PERIOD_LABELS: readonly PeriodLabel[] = Array.from(
  { length: 7 },
  (_unused, i) => {
    const period = i + 1;
    return { col: PERIOD_LABEL_COL, row: period + 1, text: String(period) };
  },
);
