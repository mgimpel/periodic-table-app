// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Unit test for useFitScale: a mocked ResizeObserver plus stubbed DOM
// measurements let us assert that a viewport-size change triggers a debounced
// recompute (Req 2.3). The scaling math itself is covered by fitScale.test.ts;
// here we only verify the measure/schedule wiring.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createRef, type RefObject } from "react";
import { useFitScale } from "../useFitScale";

// --- Mock ResizeObserver ---------------------------------------------------
// jsdom has no ResizeObserver. We install a mock that records the callback so
// the test can fire it on demand (jsdom never emits real resize events).
let observerCallback: ResizeObserverCallback | undefined;

class MockResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    observerCallback = cb;
  }
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

/**
 * Fire the captured ResizeObserver callback as the browser would on resize.
 * The hook's handler ignores the callback arguments (it re-measures the DOM),
 * so empty entries and a stub observer are sufficient.
 */
function triggerResize() {
  observerCallback?.([], {} as ResizeObserver);
}

// --- DOM measurement stubs -------------------------------------------------
// In jsdom clientWidth/scrollWidth etc. are always 0 and not writable by plain
// assignment. We back each element with a mutable size object and define the
// four measured properties as getters, so changing the object changes what the
// hook measures on its next read.

type SizeBox = { w: number; h: number };

function makeViewport(box: SizeBox): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "clientWidth", { get: () => box.w });
  Object.defineProperty(el, "clientHeight", { get: () => box.h });
  return el;
}

function makeGrid(box: SizeBox): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "scrollWidth", { get: () => box.w });
  Object.defineProperty(el, "scrollHeight", { get: () => box.h });
  return el;
}

describe("useFitScale", () => {
  beforeEach(() => {
    observerCallback = undefined;
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    observerCallback = undefined;
  });

  function renderFit(viewportBox: SizeBox, gridBox: SizeBox) {
    const viewportRef = createRef<HTMLElement>() as RefObject<HTMLElement>;
    const gridRef = createRef<HTMLElement>() as RefObject<HTMLElement>;
    // Refs must be populated before the hook's effect runs so it can measure.
    viewportRef.current = makeViewport(viewportBox);
    gridRef.current = makeGrid(gridBox);
    const view = renderHook(() => useFitScale(viewportRef, gridRef));
    return { ...view, viewportBox, gridBox };
  }

  it("measures initial scale synchronously on mount (no scrolling needed when it fits)", () => {
    // Grid fits exactly inside the viewport -> scale 1.
    const { result } = renderFit({ w: 1000, h: 800 }, { w: 1000, h: 800 });
    expect(result.current.scale).toBe(1);
  });

  it("computes a fit scale below 1 when the grid is larger than the viewport", () => {
    // Viewport is half the grid in both dimensions -> scale 0.5.
    const { result } = renderFit({ w: 500, h: 400 }, { w: 1000, h: 800 });
    expect(result.current.scale).toBe(0.5);
  });

  it("recomputes the scale when the viewport shrinks and the ResizeObserver fires", () => {
    // Start fitting exactly (scale 1), then shrink the viewport to half.
    const { result, viewportBox } = renderFit({ w: 1000, h: 800 }, { w: 1000, h: 800 });
    expect(result.current.scale).toBe(1);

    // A real viewport change: the observed element reports a new size.
    viewportBox.w = 500;
    viewportBox.h = 400;

    // The callback is debounced, so nothing changes until the timer elapses.
    act(() => {
      triggerResize();
    });
    // Before the debounce window elapses the scale is unchanged.
    expect(result.current.scale).toBe(1);

    // Advance past the 150 ms debounce -> recompute runs.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.scale).toBe(0.5);
  });

  it("debounces: only the final size after rapid resizes is applied", () => {
    const { result, viewportBox } = renderFit({ w: 1000, h: 800 }, { w: 1000, h: 800 });

    // Three rapid resizes within one debounce window; only the last should win.
    viewportBox.w = 800;
    viewportBox.h = 640;
    act(() => triggerResize());

    viewportBox.w = 250;
    viewportBox.h = 200;
    act(() => triggerResize());

    viewportBox.w = 500;
    viewportBox.h = 400;
    act(() => triggerResize());

    // Still the initial scale until the (reset) debounce timer fires once.
    expect(result.current.scale).toBe(1);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    // 500/1000 = 0.5 from the final size, not the intermediate 0.8 or 0.25.
    expect(result.current.scale).toBe(0.5);
  });
});
