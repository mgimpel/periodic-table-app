// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Unit tests for the theme persistence helpers and the read-only Mantine
// manager. Covers: persist → read round-trip over the expected key (5.1, 5.2)
// and invalid-value normalization to auto (5.3). The throwing read/write
// paths delegate to storage.ts and are covered by storage.check.ts.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createAppColorSchemeManager,
  persistTheme,
  readStoredTheme,
} from "../themeManager";
import { DEFAULT_THEME } from "../theme";

// The localStorage key Mantine's manager and ColorSchemeScript use by default.
const STORAGE_KEY = "mantine-color-scheme-value";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("persistTheme / readStoredTheme", () => {
  // Validates: Requirements 5.1, 5.2
  it("round-trips the selected theme through the expected key", () => {
    persistTheme("dark");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(readStoredTheme()).toBe("dark");
  });
});

describe("readStoredTheme", () => {
  // Validates: Requirements 5.3
  it("resolves a present-but-invalid stored value to auto", () => {
    window.localStorage.setItem(STORAGE_KEY, "chartreuse");
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
  });
});

describe("createAppColorSchemeManager", () => {
  it("get returns the validated stored value, ignoring the caller's default", () => {
    window.localStorage.setItem(STORAGE_KEY, "dark");
    expect(createAppColorSchemeManager().get("light")).toBe("dark");
    window.localStorage.setItem(STORAGE_KEY, "chartreuse");
    expect(createAppColorSchemeManager().get("light")).toBe("auto");
  });

  it("set does not write (ThemeControl persists via persistTheme)", () => {
    createAppColorSchemeManager().set("dark");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
