// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based tests for the pure cell-color resolver and phase bucketer.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { cellColor, phaseBucket, PHASE_KEYS, PHASE_COLORS } from "../cellColor";
import { CATEGORY_COLORS, CATEGORY_KEYS, type Element } from "../../data/element";
import { temperatureColor, MISSING_VALUE_COLOR } from "../temperatureGradient";

// Element arbitrary: varies the fields the resolver reads (category, phase,
// melt, boil) and fills the rest with plausible fixed values. phase mixes the
// three known dataset strings with arbitrary strings so the unknown bucket is
// exercised; melt/boil are nullable to exercise the missing-value path.
const element = (
  phaseArb: fc.Arbitrary<string> = fc.oneof(
    fc.constantFrom("Solid", "Liquid", "Gas"),
    fc.string(),
  ),
): fc.Arbitrary<Element> =>
  fc.record({
    category: fc.constantFrom(...CATEGORY_KEYS),
    phase: phaseArb,
    melt: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: null }),
    boil: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: null }),
  }).map((v) => ({
    atomicNumber: 1,
    symbol: "X",
    name: "X",
    atomicMass: 1,
    category: v.category,
    group: null,
    period: 1,
    xpos: 1,
    ypos: 1,
    electronConfiguration: "",
    electronConfigurationSemantic: "",
    shells: [],
    phase: v.phase,
    block: "s",
    electronAffinity: null,
    density: null,
    densityUnit: null,
    boil: v.boil,
    melt: v.melt,
    appearance: null,
    discoveredBy: null,
    namedBy: null,
  }));

// Feature: element-color-schemes, Property 3: Category scheme resolves to the
// category color — cellColor("category", el) === CATEGORY_COLORS[el.category]
// for every category including "unknown".
describe("cellColor — category scheme", () => {
  it("resolves to the element's category color", () => {
    fc.assert(
      fc.property(element(), (el) => {
        expect(cellColor("category", el)).toBe(CATEGORY_COLORS[el.category]);
      }),
    );
  });
});

// Feature: element-color-schemes, Property 4: Phase bucketing is total and maps
// known values — phaseBucket returns a PHASE_KEYS member; Solid/Liquid/Gas map
// to solid/liquid/gas, anything else to unknown; the phase resolver equals
// PHASE_COLORS[phaseBucket(element.phase)].
describe("cellColor — phase scheme", () => {
  it("phaseBucket is total and maps the known values", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constantFrom("Solid", "Liquid", "Gas"), fc.string()),
        (s) => {
          const bucket = phaseBucket(s);
          expect(PHASE_KEYS).toContain(bucket);
          // Prototype-free map: a generated phase like "toString" must not
          // pick up Object.prototype members as a false expected value.
          const known: Record<string, string> = Object.assign(
            Object.create(null),
            { Solid: "solid", Liquid: "liquid", Gas: "gas" },
          );
          expect(bucket).toBe(known[s] ?? "unknown");
        },
      ),
    );
  });

  it("resolves to the bucketed phase color", () => {
    fc.assert(
      fc.property(element(), (el) => {
        expect(cellColor("phase", el)).toBe(PHASE_COLORS[phaseBucket(el.phase)]);
      }),
    );
  });
});

// Feature: element-color-schemes, Property 5: Gradient schemes apply the
// gradient or the missing-value color — for both gradient schemes the resolver
// is MISSING_VALUE_COLOR iff the value is null, else temperatureColor(value).
describe("cellColor — gradient schemes", () => {
  it("applies the missing-value color for null values, else the gradient", () => {
    fc.assert(
      fc.property(
        element(),
        fc.constantFrom("melting-point" as const, "boiling-point" as const),
        (el, scheme) => {
          const value = scheme === "melting-point" ? el.melt : el.boil;
          const expected =
            value === null ? MISSING_VALUE_COLOR : temperatureColor(value);
          expect(cellColor(scheme, el)).toBe(expected);
        },
      ),
    );
  });
});
