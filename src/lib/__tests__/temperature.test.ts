// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based tests for the temperature helpers.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  convertKelvin,
  formatTemperature,
  normalizeStoredTemperature,
  DEFAULT_TEMPERATURE,
  TEMPERATURE_OPTIONS,
  TEMPERATURE_SYMBOLS,
  type TemperatureOption,
} from "../temperature";

const kelvin = () => fc.double({ min: 0, max: 10000, noNaN: true });
const unit = () => fc.constantFrom(...TEMPERATURE_OPTIONS);

describe("normalizeStoredTemperature", () => {
  it("is total: always a valid option, passing through iff the input is one", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constantFrom<unknown>(...TEMPERATURE_OPTIONS), fc.anything()),
        (raw) => {
          const result = normalizeStoredTemperature(raw);
          expect(TEMPERATURE_OPTIONS).toContain(result);
          expect(result).toBe(
            TEMPERATURE_OPTIONS.includes(raw as TemperatureOption)
              ? raw
              : DEFAULT_TEMPERATURE,
          );
        },
      ),
    );
  });
});

describe("convertKelvin", () => {
  it("keeps Kelvin unchanged and agrees between Celsius and Fahrenheit", () => {
    fc.assert(
      fc.property(kelvin(), (k) => {
        expect(convertKelvin(k, "kelvin")).toBe(k);
        const c = convertKelvin(k, "celsius");
        expect(c + 273.15).toBeCloseTo(k, 9);
        expect((c * 9) / 5 + 32).toBeCloseTo(convertKelvin(k, "fahrenheit"), 9);
      }),
    );
  });

  it("is strictly increasing in every unit", () => {
    fc.assert(
      fc.property(kelvin(), kelvin(), unit(), (a, b, u) => {
        // Doubles closer than float precision at ~460 collapse to one value.
        fc.pre(b - a > 1e-9);
        expect(convertKelvin(a, u)).toBeLessThan(convertKelvin(b, u));
      }),
    );
  });

  it("maps the freezing and boiling points of water", () => {
    expect(convertKelvin(273.15, "celsius")).toBeCloseTo(0, 9);
    expect(convertKelvin(273.15, "fahrenheit")).toBeCloseTo(32, 9);
    expect(convertKelvin(373.15, "celsius")).toBeCloseTo(100, 9);
    expect(convertKelvin(373.15, "fahrenheit")).toBeCloseTo(212, 9);
  });
});

describe("formatTemperature", () => {
  it("ends with the unit symbol and has at most 2 decimals, no trailing zero", () => {
    fc.assert(
      fc.property(kelvin(), unit(), (k, u) => {
        const s = formatTemperature(k, u);
        const suffix = ` ${TEMPERATURE_SYMBOLS[u]}`;
        expect(s.endsWith(suffix)).toBe(true);
        expect(s.slice(0, -suffix.length)).toMatch(/^-?\d+(\.\d?[1-9])?$/);
      }),
    );
  });

  it("formats the known water points exactly", () => {
    expect(formatTemperature(273.15, "celsius")).toBe("0 °C");
    expect(formatTemperature(273.15, "fahrenheit")).toBe("32 °F");
    expect(formatTemperature(373.15, "celsius")).toBe("100 °C");
    expect(formatTemperature(373.15, "fahrenheit")).toBe("212 °F");
  });

  it("renders the placeholder for unknown values", () => {
    for (const u of TEMPERATURE_OPTIONS) expect(formatTemperature(null, u)).toBe("—");
  });
});
