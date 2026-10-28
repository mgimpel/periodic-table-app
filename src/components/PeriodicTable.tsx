// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { useRef, useState } from "react";
import { Alert, Box, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { ELEMENTS, type Element } from "../data/elements";
import { ElementCell } from "./ElementCell";
import { CategoryLegend } from "./CategoryLegend";
import { ElementDetail } from "./ElementDetail";
import { useFitScale } from "../hooks/useFitScale";
import { useOrientationLock } from "../hooks/useOrientationLock";
import classes from "./PeriodicTable.module.css";

// Owns the selected-element state and composes the legend, the fit-to-viewport
// grid, and the detail view. The dataset's xpos/ypos already place every
// element in the correct cell, so cells just read those coordinates.
//
// Layout: the grid wrapper keeps its natural, legible cell sizes so its
// scrollWidth/scrollHeight report the true unscaled size. useFitScale measures
// that against the viewport wrapper and returns a scale (<= 1) that we apply as
// a CSS transform, so the whole table shrinks to fit. symbolOnly drops the
// number/name when cells get too small to read.
export function PeriodicTable() {
  const { t } = useTranslation("ui");
  const [selected, setSelected] = useState<Element | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { scale, symbolOnly } = useFitScale(viewportRef, gridRef);
  const { showNotice, dismissNotice } = useOrientationLock();

  // Fill the parent table region (AppLayout's flex:1 child) as a full-height
  // flex column so .viewport's flex:1 expands to the space below the header.
  // That makes useFitScale's measured clientHeight already exclude the header
  // height — no pixel constant to keep in sync (see design: Vertical layout).
  return (
    <Stack gap="md" p="md" h="100%" mih={0}>
      {showNotice && (
        <Alert
          color="yellow"
          variant="light"
          withCloseButton
          closeButtonLabel={t("common.dismiss")}
          onClose={dismissNotice}
          title={t("orientation.title")}
        >
          {t("orientation.body")}
        </Alert>
      )}

      <Box className={classes.viewport} ref={viewportRef}>
        <Box
          className={classes.grid}
          ref={gridRef}
          style={{ "--fit-scale": scale } as React.CSSProperties}
        >
          <CategoryLegend />
          {ELEMENTS.map((element) => (
            <ElementCell
              key={element.atomicNumber}
              element={element}
              onSelect={setSelected}
              symbolOnly={symbolOnly}
            />
          ))}
        </Box>
      </Box>

      <ElementDetail element={selected} onClose={() => setSelected(null)} />
    </Stack>
  );
}
