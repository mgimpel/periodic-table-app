// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { persistTheme, readStoredTheme } from "../persistenceManager";
import { DEFAULT_THEME } from "../theme";

// The localStorage key Mantine's manager and ColorSchemeScript use by default.
const THEME_STORAGE_KEY = "mantine-color-scheme-value";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

// Unit tests for the theme persistence helpers and the read-only Mantine
// manager. Covers: persist → read round-trip over the expected key (5.1, 5.2)
// and invalid-value normalization to auto (5.3). The throwing read/write
// paths delegate to storage.ts and are covered by storage.check.ts.

describe("persistTheme / readStoredTheme", () => {
  // Validates: Requirements 5.1, 5.2
  it("round-trips the selected theme through the expected key", () => {
    persistTheme("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(readStoredTheme()).toBe("dark");
  });
});

describe("readStoredTheme", () => {
  // Validates: Requirements 5.3
  it("resolves a present-but-invalid stored value to auto", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "chartreuse");
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
  });
});
