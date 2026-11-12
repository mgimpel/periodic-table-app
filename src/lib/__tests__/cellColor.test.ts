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
  phaseAtTemperature,
  clampSelectedTemperature,
  PHASE_KEYS,
  PHASE_COLORS,
  originBucket,
  ORIGIN_KEYS,
  ORIGIN_COLORS,
  spectralCellColor,
  radioactiveBucket,
  RADIOACTIVE_KEYS,
  RADIOACTIVE_COLORS,
} from "../cellColor";
import { CATEGORY_COLORS, CATEGORY_KEYS, type Element } from "../../data/element";
import {
  MISSING_VALUE_COLOR,
  temperatureColor,
  electronegativityColor,
  TEMPERATURE_MAX,
} from "../gradient";

// Element arbitrary: varies the fields the resolver reads (category, phase,
// melt, boil, electronegativity, origin, spectralColour, isRadioactive) and
// fills the rest with plausible fixed values. phase/origin mix known dataset
// strings with arbitrary strings so unknown buckets are exercised; gradient
// fields are nullable to exercise the missing-value path.
const element = (
  phaseArb: fc.Arbitrary<string> = fc.oneof(
    fc.constantFrom("Solid", "Liquid", "Gas"),
    fc.string(),
  ),
  electronegativityArb: fc.Arbitrary<number | null> = fc.constant(null),
  originArb: fc.Arbitrary<string> = fc.constant(""),
  spectralColourArb: fc.Arbitrary<string | null> = fc.constant(null),
  isRadioactiveArb: fc.Arbitrary<boolean> = fc.boolean(),
): fc.Arbitrary<Element> =>
  fc.record({
    category: fc.constantFrom(...CATEGORY_KEYS),
    phase: phaseArb,
    melt: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: null }),
    boil: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: null }),
    phaseMelt: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: null }),
    phaseBoil: fc.option(fc.double({ min: 0, max: 10000, noNaN: true }), { nil: null }),
    electronegativity: electronegativityArb,
    origin: originArb,
    spectralColour: spectralColourArb,
    isRadioactive: isRadioactiveArb,
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
    phaseMelt: v.phaseMelt,
    phaseBoil: v.phaseBoil,
    appearance: null,
    discoveredBy: null,
    namedBy: null,
    electronegativity: v.electronegativity,
    origin: v.origin,
    spectralColour: v.spectralColour,
    isRadioactive: v.isRadioactive,
  }));

describe("cellColor — radioactive scheme", () => {
  it("maps the boolean to the matching bucket and color", () => {
    const cases = [
      [false, "stable"],
      [true, "radioactive"],
    ] as const;

    for (const [isRadioactive, key] of cases) {
      expect(RADIOACTIVE_KEYS).toContain(key);
      expect(radioactiveBucket(isRadioactive)).toBe(key);
      fc.assert(
        fc.property(
          element(
            fc.string(),
            fc.constant(null),
            fc.constant(""),
            fc.constant(null),
            fc.constant(isRadioactive),
          ),
          (el) => {
            expect(cellColor("radioactive", el)).toBe(RADIOACTIVE_COLORS[key]);
          },
        ),
      );
    }
  });
});

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

// ---------------------------------------------------------------------------
// phase-at-temperature-coloring: property tests for the temperature-driven
// phase core (phaseAtTemperature / cellColor phase branch / clampSelectedTemperature).
// ---------------------------------------------------------------------------

// A single melt/boil generator that spans every "knownness" and ordering case
// the classifier must handle: null, 0, negatives, NaN, ±Infinity, ordinary
// positives, and both melt<boil and melt>=boil once combined on an element.
const meltBoilValue: fc.Arbitrary<number | null> = fc.oneof(
  fc.constant(null),
  fc.constant(0),
  fc.constant(Number.NaN),
  fc.constant(Number.POSITIVE_INFINITY),
  fc.constant(Number.NEGATIVE_INFINITY),
  fc.double({ min: -1000, max: -0.0001, noNaN: true }), // negatives
  fc.double({ min: 0.0001, max: 10000, noNaN: true }), // ordinary positives
);

// Element arbitrary for the phase-at-temperature core: melt and boil each draw
// from meltBoilValue independently, so the full matrix of null / 0 / negative /
// non-finite / ordered / inverted combinations is exercised. All other fields
// are irrelevant to phaseAtTemperature and fixed by the base element() helper.
const phaseElement = (): fc.Arbitrary<Element> =>
  fc
    .record({ phaseMelt: meltBoilValue, phaseBoil: meltBoilValue })
    .chain(({ phaseMelt, phaseBoil }) =>
      element().map((el) => ({ ...el, phaseMelt, phaseBoil })),
    );

// Finite temperatures across and beyond the slider range, including edges.
const finiteTempK: fc.Arbitrary<number> = fc.oneof(
  fc.double({ min: -1000, max: 20000, noNaN: true }),
  fc.constantFrom(0, TEMPERATURE_MAX, 273.15, 373.15, 298.15),
);

// A known, finite, positive melt/boil value (for consistent-data properties).
const knownTempK: fc.Arbitrary<number> = fc.double({
  min: 0.0001,
  max: 10000,
  noNaN: true,
});

// An element whose melt/boil are both known and consistent (melt < boil).
const consistentElement = (): fc.Arbitrary<Element> =>
  fc
    .tuple(knownTempK, knownTempK)
    .filter(([a, b]) => a !== b)
    .chain(([a, b]) => {
      const phaseMelt = Math.min(a, b);
      const phaseBoil = Math.max(a, b);
      return element().map((el) => ({ ...el, phaseMelt, phaseBoil }));
    });

// True when the melt/boil value counts as "known" per Requirement 4.1:
// present, finite, and strictly above absolute zero.
const isKnown = (v: number | null): v is number =>
  v !== null && Number.isFinite(v) && v > 0;

// Feature: phase-at-temperature-coloring, Property 1: phaseAtTemperature is
// total — returns a PHASE_KEYS member for any finite tempK and any element.
describe("phaseAtTemperature — totality", () => {
  it("returns a PHASE_KEYS member for any finite temperature and any element", () => {
    fc.assert(
      fc.property(finiteTempK, phaseElement(), (tempK, el) => {
        expect(PHASE_KEYS).toContain(phaseAtTemperature(tempK, el));
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: phase-at-temperature-coloring, Property 2: Consistent-data
// classification by region — both known & melt < boil: gas for T >= boil,
// solid for T <= melt, liquid for melt < T < boil (boundaries closed on the
// solid and gas ends).
describe("phaseAtTemperature — consistent-data classification by region", () => {
  it("classifies solid/liquid/gas by the temperature region", () => {
    fc.assert(
      fc.property(finiteTempK, consistentElement(), (tempK, el) => {
        const melt = el.phaseMelt as number;
        const boil = el.phaseBoil as number;
        const bucket = phaseAtTemperature(tempK, el);
        if (tempK >= boil) {
          expect(bucket).toBe("gas");
        } else if (tempK <= melt) {
          expect(bucket).toBe("solid");
        } else {
          expect(bucket).toBe("liquid");
        }
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: phase-at-temperature-coloring, Property 3: Phase is monotonic in
// temperature for consistent data — T1 <= T2 ⇒ phase never moves backward
// under solid < liquid < gas.
describe("phaseAtTemperature — monotonic in temperature", () => {
  const RANK: Record<string, number> = { solid: 0, liquid: 1, gas: 2 };

  it("never moves backward through solid < liquid < gas as temperature rises", () => {
    fc.assert(
      fc.property(
        finiteTempK,
        finiteTempK,
        consistentElement(),
        (a, b, el) => {
          const t1 = Math.min(a, b);
          const t2 = Math.max(a, b);
          const p1 = phaseAtTemperature(t1, el);
          const p2 = phaseAtTemperature(t2, el);
          // Consistent data never yields "unknown", so both ranks are defined.
          expect(RANK[p2]).toBeGreaterThanOrEqual(RANK[p1]);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// Feature: phase-at-temperature-coloring, Property 4: Partial and sublimation
// data classification — both-unknown, melt-only, boil-only, and melt >= boil
// (no liquid region) branches resolve exactly as specified. With both points
// known the boundaries are closed on gas and solid: T>=boil gas, T<=melt solid.
describe("phaseAtTemperature — partial and sublimation data", () => {
  it("resolves each missing/sublimation branch exactly", () => {
    fc.assert(
      fc.property(finiteTempK, phaseElement(), (tempK, el) => {
        const meltKnown = isKnown(el.phaseMelt);
        const boilKnown = isKnown(el.phaseBoil);
        const bucket = phaseAtTemperature(tempK, el);

        if (meltKnown && boilKnown) {
          // Only assert the no-liquid branch here (melt >= boil); the
          // consistent branch is Property 2's job. With no liquid region,
          // T>=boil is gas and everything below is solid — never liquid.
          if ((el.phaseMelt as number) >= (el.phaseBoil as number)) {
            const boil = el.phaseBoil as number;
            expect(bucket).toBe(tempK >= boil ? "gas" : "solid");
          }
        } else if (!meltKnown && !boilKnown) {
          expect(bucket).toBe("unknown");
        } else if (!meltKnown && boilKnown) {
          const boil = el.phaseBoil as number;
          expect(bucket).toBe(tempK >= boil ? "gas" : "unknown");
        } else {
          // meltKnown && !boilKnown: T<=melt solid, else unknown.
          const melt = el.phaseMelt as number;
          expect(bucket).toBe(tempK <= melt ? "solid" : "unknown");
        }
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: phase-at-temperature-coloring, Property 5: Phase resolver maps bucket
// to its PHASE_COLORS color — cellColor("phase", el, T) === PHASE_COLORS[phaseAtTemperature(T, el)].
describe("cellColor — phase branch at a temperature", () => {
  it("equals PHASE_COLORS[phaseAtTemperature(T, el)]", () => {
    fc.assert(
      fc.property(finiteTempK, phaseElement(), (tempK, el) => {
        expect(cellColor("phase", el, tempK)).toBe(
          PHASE_COLORS[phaseAtTemperature(tempK, el)],
        );
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: phase-at-temperature-coloring, Property 6: Phase classification is
// independent of the Temperature_Unit — the bucket is a function of
// (T, phaseMelt, phaseBoil) alone; the unit is never an argument to phaseAtTemperature.
describe("phaseAtTemperature — independent of the temperature unit", () => {
  it("depends only on (T, phaseMelt, phaseBoil), not on any display unit", () => {
    fc.assert(
      fc.property(finiteTempK, phaseElement(), (tempK, el) => {
        // Same Kelvin inputs ⇒ same bucket, regardless of how the value might
        // be displayed. Re-deriving from a clone with identical phaseMelt/phaseBoil
        // must match; varying unrelated display fields must not change the bucket.
        const clone: Element = { ...el };
        expect(phaseAtTemperature(tempK, clone)).toBe(
          phaseAtTemperature(tempK, el),
        );
        // The bucket is determined solely by (T, phaseMelt, phaseBoil): an element
        // with the same phase points but a different raw `phase` string buckets alike.
        const relabeled: Element = { ...el, phase: `${el.phase}-xyz` };
        expect(phaseAtTemperature(tempK, relabeled)).toBe(
          phaseAtTemperature(tempK, el),
        );
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: phase-at-temperature-coloring, Property 7: Requested
// Selected_Temperature is clamped into range — clampSelectedTemperature(k)
// lies in [0, TEMPERATURE_MAX] with the documented edges.
describe("clampSelectedTemperature — clamps into [0, TEMPERATURE_MAX]", () => {
  it("returns 0 below, TEMPERATURE_MAX above, and k within range", () => {
    fc.assert(
      fc.property(
        fc.double({ min: -5000, max: 20000, noNaN: true }),
        (k) => {
          const clamped = clampSelectedTemperature(k);
          expect(clamped).toBeGreaterThanOrEqual(0);
          expect(clamped).toBeLessThanOrEqual(TEMPERATURE_MAX);
          if (k < 0) {
            expect(clamped).toBe(0);
          } else if (k > TEMPERATURE_MAX) {
            expect(clamped).toBe(TEMPERATURE_MAX);
          } else {
            expect(clamped).toBe(k);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
