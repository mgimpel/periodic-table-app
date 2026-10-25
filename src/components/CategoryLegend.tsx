// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  type ElementCategory,
} from "../data/element";
import classes from "./PeriodicTable.module.css";

interface CategoryLegendProps {
  /** When true, show swatches only and drop the label text (mirrors ElementCell). */
  symbolOnly?: boolean;
}

// Category color key rendered as a grid item placed in the table's empty
// top-center region (see .legend in PeriodicTable.module.css), so it scales
// with the table via the grid's transform. In symbolOnly mode the label text
// is dropped but each entry keeps its accessible name.
export function CategoryLegend({ symbolOnly = false }: CategoryLegendProps) {
  const categories = Object.keys(CATEGORY_LABELS) as ElementCategory[];
  return (
    <div
      className={classes.legend}
      role="group"
      aria-label="Element category legend"
    >
      {categories.map((category) => {
        const label = CATEGORY_LABELS[category];
        // Fall back to the raw key so the accessible name is never empty (Req 4.3).
        const accessibleName = label || category;
        return (
          <div
            key={category}
            className={classes.legendEntry}
            aria-label={accessibleName}
          >
            <span
              className={classes.legendSwatch}
              style={{ backgroundColor: CATEGORY_COLORS[category] }}
            />
            {!symbolOnly && (
              <span className={classes.legendLabel}>{label}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
