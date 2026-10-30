// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property + failure-path tests for the coloring-scheme persistence manager.
// Covers: persist → read round-trip (6.1, 6.2), read-failure fallback (6.4),
// and the non-throwing write-failure signal (6.5).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fc from "fast-check";
import {
  persistColoringScheme,
  readStoredColoringScheme,
} from "../coloringSchemeManager";
import {
  COLORING_SCHEME_OPTIONS,
  DEFAULT_COLORING_SCHEME,
} from "../coloringScheme";

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

describe("readStoredColoringScheme", () => {
  // Validates: Requirements 6.4
  it("resolves an unreadable store to the default scheme", () => {
    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(
      () => {
        throw new Error("blocked");
      },
    );
    expect(readStoredColoringScheme()).toBe(DEFAULT_COLORING_SCHEME);
  });
});

describe("persistColoringScheme", () => {
  // Validates: Requirements 6.5
  it("invokes onSaveError and does not throw when persisting fails", () => {
    const failure = new Error("quota exceeded");
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(
      () => {
        throw failure;
      },
    );
    const onSaveError = vi.fn();

    expect(() => persistColoringScheme("phase", onSaveError)).not.toThrow();
    expect(onSaveError).toHaveBeenCalledTimes(1);
    expect(onSaveError).toHaveBeenCalledWith(failure);
  });
});
