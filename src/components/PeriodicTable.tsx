// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { useEffect, useRef, useState } from "react";
import { Alert, Box, Stack } from "@mantine/core";
import { ELEMENTS, type Element } from "../data/elements";
import { ElementCell } from "./ElementCell";
import { CategoryLegend } from "./CategoryLegend";
import { ElementDetail } from "./ElementDetail";
import { useFitScale } from "../hooks/useFitScale";
import { useOrientationLock } from "../hooks/useOrientationLock";
import { isMobilePlatform } from "../lib/platform";
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
  const [selected, setSelected] = useState<Element | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { scale, symbolOnly } = useFitScale(viewportRef, gridRef);

  // Orientation lock is mobile-only (Req 1.1); desktop/web follows the OS.
  const mobile = isMobilePlatform();
  const { attempted, locked } = useOrientationLock(mobile);
  const showOrientationNotice = mobile && attempted && !locked && !noticeDismissed;

  // The notice asks the user to rotate; once they do, it has served its
  // purpose, so auto-dismiss it on the next rotation. Only listen while it is
  // showing, so the listener is absent when there is nothing to close.
  // screen.orientation's "change" is the modern signal; window
  // "orientationchange" is the legacy fallback (iOS/older WebViews), so we
  // listen for both.
  useEffect(() => {
    if (!showOrientationNotice) return;
    const dismiss = () => setNoticeDismissed(true);
    const orientation = screen.orientation;
    orientation?.addEventListener?.("change", dismiss);
    window.addEventListener("orientationchange", dismiss);
    return () => {
      orientation?.removeEventListener?.("change", dismiss);
      window.removeEventListener("orientationchange", dismiss);
    };
  }, [showOrientationNotice]);

  // Fill the parent table region (AppLayout's flex:1 child) as a full-height
  // flex column so .viewport's flex:1 expands to the space below the header.
  // That makes useFitScale's measured clientHeight already exclude the header
  // height — no pixel constant to keep in sync (see design: Vertical layout).
  return (
    <Stack gap="md" p="md" h="100%" mih={0}>
      {showOrientationNotice && (
        <Alert
          color="yellow"
          variant="light"
          withCloseButton
          onClose={() => setNoticeDismissed(true)}
          title="Rotate for a wider view"
        >
          This device won't lock to landscape. Rotate it to landscape for a
          larger, easier-to-read table.
        </Alert>
      )}

      <Box className={classes.viewport} ref={viewportRef}>
        <Box
          className={classes.grid}
          ref={gridRef}
          style={{ "--fit-scale": scale } as React.CSSProperties}
        >
          <CategoryLegend symbolOnly={symbolOnly} />
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
