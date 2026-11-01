// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based tests for the pure cell-color resolver and phase bucketer.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  cellColor,
  phaseBucket,
  PHASE_KEYS,
  PHASE_COLORS,
  originBucket,
  ORIGIN_KEYS,
  ORIGIN_COLORS,
  spectralCellColor,
} from "../cellColor";
import { CATEGORY_COLORS, CATEGORY_KEYS, type Element } from "../../data/element";
import { temperatureColor, MISSING_VALUE_COLOR } from "../temperatureGradient";
import { electronegativityColor } from "../electronegativityGradient";

// Element arbitrary: varies the fields the resolver reads (category, phase,
// melt, boil, electronegativity, origin, spectralColour) and fills the rest
// with plausible fixed values. phase/origin mix the known dataset strings with
// arbitrary strings so the unknown buckets are exercised; the gradient fields
// are nullable to exercise the missing-value path.
const element = (
  phaseArb: fc.Arbitrary<string> = fc.oneof(
    fc.constantFrom("Solid", "Liquid", "Gas"),
    fc.string(),
  ),
  electronegativityArb: fc.Arbitrary<number | null> = fc.constant(null),
  originArb: fc.Arbitrary<string> = fc.constant(""),
  spectralColourArb: fc.Arbitrary<string | null> = fc.constant(null),
): fc.Arbitrary<Element> =>
  fc.record({
    category: fc.constantFrom(...CATEGORY_KEYS),
    phase: phaseArb,
    melt: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: null }),
    boil: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: null }),
    electronegativity: electronegativityArb,
    origin: originArb,
    spectralColour: spectralColourArb,
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
    electronegativity: v.electronegativity,
    origin: v.origin,
    spectralColour: v.spectralColour,
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

// Feature: element-color-schemes, Property 8: Electronegativity resolver
// applies the gradient or the missing-value color — cellColor("electronegativity",
// el) is MISSING_VALUE_COLOR iff el.electronegativity is null, else
// electronegativityColor(el.electronegativity).
describe("cellColor — electronegativity scheme", () => {
  it("applies the missing-value color for null, else the EN gradient", () => {
    fc.assert(
      fc.property(
        element(
          fc.string(),
          fc.option(fc.double({ min: 0, max: 5, noNaN: true }), { nil: null }),
        ),
        (el) => {
          const expected =
            el.electronegativity === null
              ? MISSING_VALUE_COLOR
              : electronegativityColor(el.electronegativity);
          expect(cellColor("electronegativity", el)).toBe(expected);
        },
      ),
    );
  });
});

// Feature: element-color-schemes, Property 9: Origin bucketing is total, maps
// known values, and resolves to distinct colors — originBucket returns an
// ORIGIN_KEYS member; the three known strings map to their bucket, anything
// else to "unknown"; the four ORIGIN_COLORS values are pairwise distinct; the
// origin resolver equals ORIGIN_COLORS[originBucket(element.origin)].
describe("cellColor — origin scheme", () => {
  it("has four pairwise-distinct origin colors", () => {
    const values = ORIGIN_KEYS.map((k) => ORIGIN_COLORS[k]);
    expect(new Set(values).size).toBe(ORIGIN_KEYS.length);
  });

  it("originBucket is total and maps the known values", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom("primordial", "from decay", "synthetic"),
          fc.string(),
        ),
        (s) => {
          const bucket = originBucket(s);
          expect(ORIGIN_KEYS).toContain(bucket);
          // Prototype-free map: a generated origin like "toString" must not
          // pick up Object.prototype members as a false expected value.
          const known: Record<string, string> = Object.assign(
            Object.create(null),
            {
              primordial: "primordial",
              "from decay": "from-decay",
              synthetic: "synthetic",
            },
          );
          expect(bucket).toBe(known[s] ?? "unknown");
        },
      ),
    );
  });

  it("resolves to the bucketed origin color", () => {
    fc.assert(
      fc.property(
        element(
          fc.string(),
          fc.constant(null),
          fc.oneof(
            fc.constantFrom("primordial", "from decay", "synthetic"),
            fc.string(),
          ),
        ),
        (el) => {
          expect(cellColor("origin", el)).toBe(
            ORIGIN_COLORS[originBucket(el.origin)],
          );
        },
      ),
    );
  });
});

// Feature: element-color-schemes, Property 10: Spectral resolver maps valid hex
// to its color and everything else to missing — spectralCellColor(raw) is
// "#" + raw for a valid 6-digit hex string and MISSING_VALUE_COLOR for null or
// any malformed value; the spectral resolver equals
// spectralCellColor(element.spectralColour).
describe("cellColor — spectral-colour scheme", () => {
  // Raw spectral values: valid 6-hex strings mixed with null and malformed
  // inputs (wrong length, non-hex chars, a leading "#") so both branches run.
  const hexChar = fc.constantFrom(..."0123456789abcdefABCDEF".split(""));
  const validHex = fc
    .array(hexChar, { minLength: 6, maxLength: 6 })
    .map((cs) => cs.join(""));
  const rawSpectral: fc.Arbitrary<string | null> = fc.oneof(
    validHex,
    fc.constant(null),
    // Wrong length (not exactly 6).
    fc
      .array(hexChar, { minLength: 0, maxLength: 10 })
      .filter((cs) => cs.length !== 6)
      .map((cs) => cs.join("")),
    // Non-hex characters.
    fc.string().filter((s) => !/^[0-9a-fA-F]{6}$/.test(s)),
    // Valid 6-hex but with a leading "#" (so no longer bare 6-hex).
    validHex.map((h) => `#${h}`),
  );

  it("maps valid 6-hex to '#' + raw and everything else to missing", () => {
    fc.assert(
      fc.property(rawSpectral, (raw) => {
        const expected =
          raw !== null && /^[0-9a-fA-F]{6}$/.test(raw)
            ? `#${raw}`
            : MISSING_VALUE_COLOR;
        expect(spectralCellColor(raw)).toBe(expected);
      }),
    );
  });

  it("resolves to spectralCellColor(element.spectralColour)", () => {
    fc.assert(
      fc.property(
        element(fc.string(), fc.constant(null), fc.constant(""), rawSpectral),
        (el) => {
          expect(cellColor("spectral-colour", el)).toBe(
            spectralCellColor(el.spectralColour),
          );
        },
      ),
    );
  });
});
