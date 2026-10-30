// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based tests for the coloring-scheme normalizer.

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  normalizeStoredColoringScheme,
  DEFAULT_COLORING_SCHEME,
  COLORING_SCHEME_OPTIONS,
  type ColoringSchemeOption,
} from "../coloringScheme";

describe("normalizeStoredColoringScheme", () => {
  // Feature: element-color-schemes, Property 1: Normalizer is total and defaults safely
  it("is total: always a valid option, non-options default to the category scheme", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom<unknown>(...COLORING_SCHEME_OPTIONS),
          fc.anything(),
        ),
        (raw) => {
          const result = normalizeStoredColoringScheme(raw);
          expect(COLORING_SCHEME_OPTIONS).toContain(result);
          expect(result).toBe(
            COLORING_SCHEME_OPTIONS.includes(raw as ColoringSchemeOption)
              ? raw
              : DEFAULT_COLORING_SCHEME,
          );
        },
      ),
    );
  });

  // Feature: element-color-schemes, Property 2: Valid options normalize to themselves (idempotence)
  it("passes valid options through unchanged and is idempotent", () => {
    fc.assert(
      fc.property(fc.constantFrom(...COLORING_SCHEME_OPTIONS), (option) => {
        const once = normalizeStoredColoringScheme(option);
        expect(once).toBe(option);
        expect(normalizeStoredColoringScheme(once)).toBe(once);
      }),
    );
  });
});
