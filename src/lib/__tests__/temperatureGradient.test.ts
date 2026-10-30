// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based tests for the shared temperature gradient.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  temperatureColor,
  GRADIENT_STOPS,
  DATASET_MAX,
} from "../temperatureGradient";

/** Parse "rgb(r, g, b)" into its three channels, or null if malformed. */
function parseRgb(s: string): [number, number, number] | null {
  const m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(s);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

// Exact anchor colors, from the four GRADIENT_STOPS (blue→white→orange→red).
const ANCHORS: ReadonlyArray<readonly [number, string]> = [
  [0, "rgb(33, 102, 172)"],
  [373, "rgb(247, 247, 247)"],
  [1273, "rgb(253, 174, 97)"],
  [DATASET_MAX, "rgb(178, 24, 43)"],
];

describe("temperatureColor", () => {
  // Feature: element-color-schemes, Property 6: Temperature gradient is
  // anchored, clamped, deterministic, and total.
  // Validates: Requirements 4.1, 5.1

  it("returns the exact stop color at each anchor (0 / 373 / 1273 / DATASET_MAX)", () => {
    for (const [k, color] of ANCHORS) expect(temperatureColor(k)).toBe(color);
    // Guard the anchors against the source of truth so a stop edit is caught.
    for (let i = 0; i < GRADIENT_STOPS.length; i++) {
      const { k, rgb } = GRADIENT_STOPS[i];
      expect(temperatureColor(k)).toBe(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
    }
  });

  it("is total: any finite input yields rgb(r,g,b) with integer channels in [0,255]", () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (k) => {
          const parsed = parseRgb(temperatureColor(k));
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

  it("clamps: values <= 0 are blue and values >= DATASET_MAX are red", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: Number.MAX_VALUE, noNaN: true }),
        (d) => {
          // Below/at the blue endpoint.
          expect(temperatureColor(-d)).toBe("rgb(33, 102, 172)");
          // At/above the red endpoint.
          expect(temperatureColor(DATASET_MAX + d)).toBe("rgb(178, 24, 43)");
        },
      ),
    );
  });

  it("is deterministic: equal inputs produce equal outputs", () => {
    fc.assert(
      fc.property(
        fc.double({ noNaN: true, noDefaultInfinity: true }),
        (k) => {
          expect(temperatureColor(k)).toBe(temperatureColor(k));
        },
      ),
    );
  });
});
