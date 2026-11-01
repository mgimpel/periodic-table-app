// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property test for the coloring-scheme persistence manager: persist → read
// round-trips every option (6.1, 6.2). The read-failure fallback (6.4) and the
// non-throwing write-failure signal (6.5) delegate to storage.ts and are
// covered by storage.check.ts.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import {
  persistColoringScheme,
  readStoredColoringScheme,
} from "../coloringSchemeManager";
import { COLORING_SCHEME_OPTIONS } from "../coloringScheme";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("persistColoringScheme / readStoredColoringScheme", () => {
  // Feature: element-color-schemes, Property 7: Persist → read round-trips the option
  // Validates: Requirements 6.1, 6.2
  it("round-trips every valid option through localStorage", () => {
    fc.assert(
      fc.property(fc.constantFrom(...COLORING_SCHEME_OPTIONS), (option) => {
        // Clear between runs so a prior value can't mask a read-back bug.
        window.localStorage.clear();
        persistColoringScheme(option);
        expect(readStoredColoringScheme()).toBe(option);
      }),
    );
  });
});
