// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based tests for the electronegativity gradient.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  electronegativityColor,
  EN_STOPS,
  DATASET_MIN_EN,
  DATASET_MAX_EN,
} from "../electronegativityGradient";

/** Parse "rgb(r, g, b)" into its three channels, or null if malformed. */
function parseRgb(s: string): [number, number, number] | null {
  const m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(s);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

// Exact endpoint colors, from the two EN_STOPS (green low → purple high).
const MIN_COLOR = "rgb(102, 189, 99)";
const MAX_COLOR = "rgb(118, 42, 131)";

describe("electronegativityColor", () => {
  // Feature: element-color-schemes, Property 7: Electronegativity gradient is
  // anchored, clamped, degenerate-safe, deterministic, and total.
  // Validates: Requirements 6.1, 6.3

  // electronegativityColor no longer has a degenerate (min === max) guard; the
  // zero-width stop-set clamp is exercised directly against interpolateStops in
  // electronegativityGradient.check.ts. Here we assert the stop colors as the
  // source of truth and exercise the real function everywhere else.
  it("has the expected green→purple endpoint stop colors", () => {
    expect(DATASET_MIN_EN).toBeLessThan(DATASET_MAX_EN);
    expect(`rgb(${EN_STOPS[0].rgb.join(", ")})`).toBe(MIN_COLOR);
    expect(`rgb(${EN_STOPS[1].rgb.join(", ")})`).toBe(MAX_COLOR);
  });

  it("returns the exact endpoint color at DATASET_MIN_EN (min) and DATASET_MAX_EN (max)", () => {
    expect(electronegativityColor(DATASET_MIN_EN)).toBe(MIN_COLOR);
    expect(electronegativityColor(DATASET_MAX_EN)).toBe(MAX_COLOR);
  });

  it("is total: any finite input yields rgb(r,g,b) with integer channels in [0,255]", () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (v) => {
          const parsed = parseRgb(electronegativityColor(v));
          expect(parsed).not.toBeNull();
          for (const ch of parsed!) {
            expect(Number.isInteger(ch)).toBe(true);
            expect(ch).toBeGreaterThanOrEqual(0);
            expect(ch).toBeLessThanOrEqual(255);
          }
        },
      ),
    );
  });

  it("clamps: values < DATASET_MIN_EN are the min color and values > DATASET_MAX_EN are the max color", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: Number.MAX_VALUE, noNaN: true }),
        (d) => {
          // At/below the min endpoint stays the min (green) color.
          expect(electronegativityColor(DATASET_MIN_EN - d)).toBe(MIN_COLOR);
          // At/above the max endpoint stays the max (purple) color.
          expect(electronegativityColor(DATASET_MAX_EN + d)).toBe(MAX_COLOR);
        },
      ),
    );
  });

  it("is deterministic: equal inputs produce equal outputs", () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (v) => {
          expect(electronegativityColor(v)).toBe(electronegativityColor(v));
        },
      ),
    );
  });
});
