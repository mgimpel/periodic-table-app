// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { PERIOD_LABELS } from "../lib/periodLabels";
import classes from "./PeriodicTable.module.css";

// Period numbers (1-7) down the left side of the table, one per main row, each
// placed in the leftmost label column (see src/lib/periodLabels.ts for the
// placement and PeriodicTable.module.css for the column model). Rendered as
// direct grid items so they inherit the table's fit-scale transform.
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
