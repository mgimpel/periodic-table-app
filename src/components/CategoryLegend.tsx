// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { useTranslation } from "react-i18next";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../data/element";
import classes from "./PeriodicTable.module.css";

// Category color key rendered as a grid item placed in the table's empty
// top-center region (see .legend in PeriodicTable.module.css), so it scales
// with the table via the grid's transform. The legend always shows both the
// swatch and the label: because it lives inside the transformed grid, its text
// shrinks and grows uniformly with the table rather than being dropped when
// cells fall back to symbol-only, so the key stays legible at every scale.
export function CategoryLegend() {
  const { t } = useTranslation("ui");
  return (
    <div
      className={classes.legend}
      role="group"
      aria-label={t("legend.groupLabel")}
    >
      {CATEGORY_KEYS.map((category) => {
        const label = t(`category.${category}`);
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
            <span className={classes.legendLabel}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
