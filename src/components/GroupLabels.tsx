// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { GROUP_LABELS } from "../lib/groupLabels";
import classes from "./PeriodicTable.module.css";

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
          style={{ gridColumnStart: col, gridRowStart: row }}
        >
          {text}
        </span>
      ))}
    </>
  );
}
