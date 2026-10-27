// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based + example tests for the pure language core.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  normalizeStoredLanguage,
  resolveLanguage,
  DEFAULT_LANGUAGE,
  type LanguageOption,
} from "../language";
import { SUPPORTED_LOCALES, type SupportedLocale } from "../../locales";

const LANGUAGE_OPTIONS: LanguageOption[] = [
  "system",
  ...SUPPORTED_LOCALES,
];

/**
 * Inputs spanning everything storage (or a tampered store) could hand us:
 * the valid options, arbitrary strings (which may coincidentally equal an
 * option), and non-string junk (null/undefined/numbers/objects/arrays).
 */
const storedValue = () =>
  fc.oneof(
    fc.constantFrom<unknown>(...LANGUAGE_OPTIONS),
    fc.string(),
    fc.constantFrom<unknown>(null, undefined),
    fc.integer(),
    fc.double(),
    fc.boolean(),
    fc.object(),
    fc.array(fc.anything()),
  );

describe("normalizeStoredLanguage: total and safe", () => {
  it("always yields a valid LanguageOption, equal to the input iff the input is one", () => {
    fc.assert(
      fc.property(storedValue(), (raw) => {
        const result = normalizeStoredLanguage(raw);

        // Output is always one of the valid options (total + safe).
        expect(LANGUAGE_OPTIONS).toContain(result);

        const isValidOption = LANGUAGE_OPTIONS.includes(raw as LanguageOption);
        if (isValidOption) {
          expect(result).toBe(raw);
        } else {
          expect(result).toBe(DEFAULT_LANGUAGE);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe("resolveLanguage: always a supported locale", () => {
  it("returns a SupportedLocale for any option and any navigator list", () => {
    const anyNavigator = fc.array(
      fc.oneof(fc.string(), fc.constantFrom<unknown>(null, undefined, 42)),
    );
    fc.assert(
      fc.property(
        fc.constantFrom<LanguageOption>(...LANGUAGE_OPTIONS),
        anyNavigator,
        (option, langs) => {
          const result = resolveLanguage(option, langs as string[]);
          expect(SUPPORTED_LOCALES).toContain(result);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("an explicit locale option always returns itself", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SupportedLocale>(...SUPPORTED_LOCALES),
        fc.array(fc.string()),
        (locale, langs) => {
          expect(resolveLanguage(locale, langs)).toBe(locale);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("system resolves to the first supported primary subtag, else en", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (langs) => {
        const expected =
          langs
            .filter((l) => typeof l === "string" && l.length > 0)
            .map((l) => l.toLowerCase().split("-")[0])
            .find((p) => (SUPPORTED_LOCALES as string[]).includes(p)) ?? "en";
        expect(resolveLanguage("system", langs)).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it("example cases: empty, unsupported, region subtag, mixed case, junk", () => {
    expect(resolveLanguage("system", [])).toBe("en");
    expect(resolveLanguage("system", ["de", "es"])).toBe("en");
    expect(resolveLanguage("system", ["fr-CA", "en"])).toBe("fr");
    expect(resolveLanguage("system", ["FR"])).toBe("fr");
    // Non-string / empty junk entries are filtered safely.
    expect(
      resolveLanguage("system", ["", null as unknown as string, "fr"]),
    ).toBe("fr");
  });
});
