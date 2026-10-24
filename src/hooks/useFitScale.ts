// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Wires the pure computeFitScale to live DOM measurements: reads the viewport's
// client size and the grid's natural (unscaled) size, then recomputes on
// ResizeObserver callbacks and orientationchange, debounced to the 200 ms
// recompute budget (Req 2.3). All scaling math lives in computeFitScale — this
// hook only measures and schedules.

import { useEffect, useState, type RefObject } from "react";
import { computeFitScale, type FitResult } from "../lib/fitScale";

/** Debounce window for recomputes; must stay within the 200 ms budget (Req 2.3). */
const RECOMPUTE_DEBOUNCE_MS = 150;

export function useFitScale(
  viewportRef: RefObject<HTMLElement | null>,
  gridRef: RefObject<HTMLElement | null>,
): FitResult {
  const [fit, setFit] = useState<FitResult>({ scale: 1, symbolOnly: false });

  useEffect(() => {
    const viewport = viewportRef.current;
    const grid = gridRef.current;
    if (!viewport || !grid) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    const measure = () => {
      // Natural (unscaled) grid size: scrollWidth/scrollHeight ignore the CSS
      // transform scale applied to the wrapper, so they report true layout size.
      const natural = { width: grid.scrollWidth, height: grid.scrollHeight };
      const view = { width: viewport.clientWidth, height: viewport.clientHeight };
      const next = computeFitScale(natural, view);
      // Only update when something actually changed, to avoid render churn.
      setFit((prev) =>
        prev.scale === next.scale && prev.symbolOnly === next.symbolOnly ? prev : next,
      );
    };

    const scheduleMeasure = () => {
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(measure, RECOMPUTE_DEBOUNCE_MS);
    };

    // Initial measurement once the refs are mounted.
    measure();

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(viewport);
    observer.observe(grid);
    window.addEventListener("orientationchange", scheduleMeasure);

    return () => {
      if (timer !== undefined) clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("orientationchange", scheduleMeasure);
    };
  }, [viewportRef, gridRef]);

  return fit;
}
