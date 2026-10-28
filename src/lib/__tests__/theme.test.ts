// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based tests for normalizeStoredTheme.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  normalizeStoredTheme,
  DEFAULT_THEME,
  THEME_OPTIONS,
  type ThemeOption,
} from "../theme";

/**
 * Inputs spanning everything storage (or a tampered store) could hand us:
 * the three valid options, arbitrary strings (which may coincidentally equal
 * an option), and non-string junk (null/undefined/numbers/objects/arrays).
 */
const storedValue = () =>
  fc.oneof(
    fc.constantFrom<unknown>(...THEME_OPTIONS),
    fc.string(),
    fc.constantFrom<unknown>(null, undefined),
    fc.integer(),
    fc.double(),
    fc.boolean(),
    fc.object(),
    fc.array(fc.anything()),
  );

describe("normalizeStoredTheme property 1: stored-theme normalization is total and safe", () => {
  // Feature: app-header-and-theme-settings, Property 1: Stored-theme normalization is total and safe
  // Validates: Requirements 5.3
  it("always yields a valid ThemeOption, passing through iff the input is one of the three options", () => {
    fc.assert(
      fc.property(storedValue(), (raw) => {
        const result = normalizeStoredTheme(raw);

        // Output is always one of the three valid options (total + safe).
        expect(THEME_OPTIONS).toContain(result);

        const isValidOption = THEME_OPTIONS.includes(raw as ThemeOption);
        if (isValidOption) {
          // Equals the input iff the input is itself a valid option.
          expect(result).toBe(raw);
        } else {
          // Otherwise falls back to DEFAULT_THEME.
          expect(result).toBe(DEFAULT_THEME);
        }
      }),
      { numRuns: 100 },
    );
  });
});
