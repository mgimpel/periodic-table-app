// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based tests for the shared temperature gradient.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  temperatureColor,
  TEMPERATURE_GRADIENT_STOPS,
  TEMPERATURE_MAX,
  electronegativityColor,
  ELECTRONEGATIVITY_GRADIENT_STOPS,
  ELECTRONEGATIVITY_MIN,
  ELECTRONEGATIVITY_MAX,
} from "../gradient";

/** Parse "rgb(r, g, b)" into its three channels, or null if malformed. */
function parseRgb(s: string): [number, number, number] | null {
  const m = /^rgb\((\d+), (\d+), (\d+)\)$/.exec(s);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

// Exact anchor colors, from the four GRADIENT_STOPS (blue→white→orange→red).
const TEMPERATURE_ANCHORS: ReadonlyArray<readonly [number, string]> = [
  [0, "rgb(33, 102, 172)"],
  [373, "rgb(247, 247, 247)"],
  [2273, "rgb(253, 174, 97)"],
  [TEMPERATURE_MAX, "rgb(178, 24, 43)"],
];

describe("temperatureColor", () => {
  // Feature: element-color-schemes, Property 6: Temperature gradient is
  // anchored, clamped, deterministic, and total.
  // Validates: Requirements 4.1, 5.1

  it("returns the exact stop color at each anchor (0 / 373 / 2273 / DATASET_MAX)", () => {
    for (const [k, color] of TEMPERATURE_ANCHORS) expect(temperatureColor(k)).toBe(color);
    // Guard the anchors against the source of truth so a stop edit is caught.
    for (let i = 0; i < TEMPERATURE_GRADIENT_STOPS.length; i++) {
      const { x, rgb } = TEMPERATURE_GRADIENT_STOPS[i];
      expect(temperatureColor(x)).toBe(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
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
          expect(temperatureColor(TEMPERATURE_MAX + d)).toBe("rgb(178, 24, 43)");
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

// Property-based tests for the electronegativity gradient.

// Exact endpoint colors, from the two EN_STOPS (green low → purple high).
const ELECTRONEGATIVITY_MIN_COLOR = "rgb(102, 189, 99)";
const ELECTRONEGATIVITY_MAX_COLOR = "rgb(118, 42, 131)";

describe("electronegativityColor", () => {
  // Feature: element-color-schemes, Property 7: Electronegativity gradient is
  // anchored, clamped, degenerate-safe, deterministic, and total.
  // Validates: Requirements 6.1, 6.3

  // electronegativityColor no longer has a degenerate (min === max) guard; the
  // zero-width stop-set clamp is exercised directly against interpolateStops in
  // electronegativityGradient.check.ts. Here we assert the stop colors as the
  // source of truth and exercise the real function everywhere else.
  it("has the expected green→purple endpoint stop colors", () => {
    expect(ELECTRONEGATIVITY_MIN).toBeLessThan(ELECTRONEGATIVITY_MAX);
    expect(`rgb(${ELECTRONEGATIVITY_GRADIENT_STOPS[0].rgb.join(", ")})`).toBe(ELECTRONEGATIVITY_MIN_COLOR);
    expect(`rgb(${ELECTRONEGATIVITY_GRADIENT_STOPS[1].rgb.join(", ")})`).toBe(ELECTRONEGATIVITY_MAX_COLOR);
  });

  it("returns the exact endpoint color at DATASET_MIN_EN (min) and DATASET_MAX_EN (max)", () => {
    expect(electronegativityColor(ELECTRONEGATIVITY_MIN)).toBe(ELECTRONEGATIVITY_MIN_COLOR);
    expect(electronegativityColor(ELECTRONEGATIVITY_MAX)).toBe(ELECTRONEGATIVITY_MAX_COLOR);
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
          expect(electronegativityColor(ELECTRONEGATIVITY_MIN - d)).toBe(ELECTRONEGATIVITY_MIN_COLOR);
          // At/above the max endpoint stays the max (purple) color.
          expect(electronegativityColor(ELECTRONEGATIVITY_MAX + d)).toBe(ELECTRONEGATIVITY_MAX_COLOR);
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
