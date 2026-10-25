// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based tests for computeFitScale.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  computeFitScale,
  NATURAL_CELL_PX,
  LEGIBILITY_MIN_CELL_PX,
  type Size,
} from "../fitScale";

/**
 * Positive, finite, bounded dimension. Values stay in [1, 1e6] so computeFitScale's
 * safeDim clamp is a no-op (every value is already a valid positive dimension) and
 * the generated size is exactly what the scale is checked against. The wide range
 * exercises extreme aspect ratios (e.g. 1 x 1e6) and tiny/huge viewports.
 */
const dim = () =>
  fc.double({ min: 1, max: 1e6, noNaN: true, noDefaultInfinity: true });

const size = () => fc.record({ width: dim(), height: dim() });

describe("computeFitScale property 1: scaled table fits within the viewport", () => {
  // Feature: responsive-table-layout, Property 1
  // Validates: Requirements 2.1, 2.2, 2.4, 3.2, 3.3
  it("keeps natural * scale within the viewport in both dimensions", () => {
    fc.assert(
      fc.property(size(), size(), (natural, viewport) => {
        const { scale } = computeFitScale(natural, viewport);

        // Floating-point scaling can overshoot the exact bound by a rounding
        // step; allow a small epsilon relative to the viewport so the property
        // isn't flaky while still catching real fit violations.
        const epsW = viewport.width * 1e-9;
        const epsH = viewport.height * 1e-9;

        expect(natural.width * scale).toBeLessThanOrEqual(viewport.width + epsW);
        expect(natural.height * scale).toBeLessThanOrEqual(viewport.height + epsH);
      }),
      { numRuns: 100 },
    );
  });
});
describe("computeFitScale property 2: scale never upscales", () => {
  // Feature: responsive-table-layout, Property 2
  // Validates: Requirements 2.1, 2.4
  it("keeps scale within (0, 1] for any positive sizes", () => {
    fc.assert(
      fc.property(size(), size(), (natural, viewport) => {
        const { scale } = computeFitScale(natural, viewport);

        expect(scale).toBeGreaterThan(0);
        expect(scale).toBeLessThanOrEqual(1);
      }),
      { numRuns: 100 },
    );
  });
});

describe("computeFitScale property 3: fit uses the full available space in the binding dimension", () => {
  // Feature: responsive-table-layout, Property 3
  // Validates: Requirements 2.1, 2.4, 3.3
  it("meets one viewport edge exactly when the natural size does not fit at scale 1", () => {
    fc.assert(
      fc.property(size(), size(), (natural, viewport) => {
        const ratio = Math.min(
          viewport.width / natural.width,
          viewport.height / natural.height,
        );
        // Only exercise the "does not fit at scale 1" input space.
        fc.pre(ratio < 1);

        const { scale } = computeFitScale(natural, viewport);

        // The binding dimension's ratio is met exactly (within fp tolerance).
        expect(scale).toBeCloseTo(ratio, 9);
      }),
      { numRuns: 100 },
    );
  });
});

describe("computeFitScale property 4: symbol-only mode engages exactly at the legibility threshold", () => {
  // Feature: responsive-table-layout, Property 4
  // Validates: Requirements 2.5, 2.6
  it("sets symbolOnly iff the scaled natural cell is below the legibility threshold", () => {
    fc.assert(
      fc.property(size(), size(), (natural, viewport) => {
        const { scale, symbolOnly } = computeFitScale(natural, viewport);

        expect(symbolOnly).toBe(
          NATURAL_CELL_PX * scale < LEGIBILITY_MIN_CELL_PX,
        );
      }),
      { numRuns: 100 },
    );
  });
});

describe("computeFitScale example cases", () => {
  // Validates: Requirements 2.1, 2.4, 2.5, 2.6

  it("returns scale 1 when the natural size exactly fits the viewport", () => {
    const { scale } = computeFitScale(
      { width: 800, height: 600 },
      { width: 800, height: 600 },
    );
    expect(scale).toBe(1);
  });

  it("returns scale 0.5 when the viewport is half the natural size", () => {
    const { scale } = computeFitScale(
      { width: 800, height: 600 },
      { width: 400, height: 300 },
    );
    expect(scale).toBe(0.5);
  });

  it("is width-bound when the width ratio is the smaller of the two", () => {
    // width ratio 0.25, height ratio 0.5 -> width binds.
    const { scale } = computeFitScale(
      { width: 1000, height: 1000 },
      { width: 250, height: 500 },
    );
    expect(scale).toBe(0.25);
  });

  it("is height-bound when the height ratio is the smaller of the two", () => {
    // width ratio 0.5, height ratio 0.2 -> height binds.
    const { scale } = computeFitScale(
      { width: 1000, height: 1000 },
      { width: 500, height: 200 },
    );
    expect(scale).toBe(0.2);
  });

  describe("symbolOnly threshold boundary", () => {
    // symbolOnly iff naturalCellPx * scale < legibilityMinCellPx.
    // Use overrides whose boundary lands on a binary-exact scale (0.5), so the
    // "exactly at the threshold" case is genuinely exact rather than relying on
    // 40/56 round-tripping through a multiply. natural == naturalCellPx makes the
    // width ratio equal the scale, so the viewport width sets the scaled cell size.
    const naturalCellPx = 100;
    const legibilityMinCellPx = 50; // boundary scale = 50/100 = 0.5 (exact)

    // Scaled cell = naturalCellPx * (viewportWidth / naturalCellPx) = viewportWidth.
    const symbolOnlyAtViewportWidth = (viewportWidth: number) =>
      computeFitScale(
        { width: naturalCellPx, height: naturalCellPx },
        { width: viewportWidth, height: naturalCellPx },
        { naturalCellPx, legibilityMinCellPx },
      ).symbolOnly;

    it("is full-content just above the threshold", () => {
      expect(symbolOnlyAtViewportWidth(51)).toBe(false);
    });

    it("is full-content exactly at the threshold (strict <)", () => {
      // Scaled cell == legibilityMinCellPx, which is NOT below it.
      expect(symbolOnlyAtViewportWidth(50)).toBe(false);
    });

    it("is symbol-only just below the threshold", () => {
      expect(symbolOnlyAtViewportWidth(49)).toBe(true);
    });
  });

  it("guards zero/missing dimensions, keeping scale finite in (0, 1]", () => {
    const cases: Array<[Size, Size]> = [
      [{ width: 0, height: 600 }, { width: 800, height: 600 }],
      [{ width: 800, height: 600 }, { width: 0, height: 0 }],
      [{ width: -10, height: 600 }, { width: 800, height: 600 }],
      [{ width: NaN, height: 600 }, { width: 800, height: 600 }],
      // Missing dimensions entirely (cast through unknown to model bad input).
      [{} as unknown as Size, {} as unknown as Size],
    ];
    for (const [natural, viewport] of cases) {
      const { scale } = computeFitScale(natural, viewport);
      expect(Number.isFinite(scale)).toBe(true);
      expect(scale).toBeGreaterThan(0);
      expect(scale).toBeLessThanOrEqual(1);
    }
  });
});
