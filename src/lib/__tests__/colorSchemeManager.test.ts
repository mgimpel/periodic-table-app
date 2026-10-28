// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Unit tests for the theme persistence helpers and the read-only Mantine
// manager. Covers: persist (5.1), read-back (5.2), invalid/unreadable value
// normalization to auto (5.3), and the save-failure signal (5.4).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createAppColorSchemeManager,
  persistTheme,
  readStoredTheme,
} from "../colorSchemeManager";
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

describe("persistTheme", () => {
  // Validates: Requirements 5.1
  it("persists the selected theme under the expected key", () => {
    persistTheme("dark");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  // Validates: Requirements 5.4
  it("invokes onSaveError and does not throw when persisting fails", () => {
    const failure = new Error("quota exceeded");
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw failure;
    });
    const onSaveError = vi.fn();

    expect(() => persistTheme("dark", onSaveError)).not.toThrow();
    expect(onSaveError).toHaveBeenCalledTimes(1);
    expect(onSaveError).toHaveBeenCalledWith(failure);
  });
});

describe("readStoredTheme", () => {
  // Validates: Requirements 5.2
  it("reads back a valid stored value", () => {
    window.localStorage.setItem(STORAGE_KEY, "dark");
    expect(readStoredTheme()).toBe("dark");
  });

  // Validates: Requirements 5.3
  it("resolves a present-but-invalid stored value to auto", () => {
    window.localStorage.setItem(STORAGE_KEY, "chartreuse");
    expect(readStoredTheme()).toBe(DEFAULT_THEME);
  });

  // Validates: Requirements 5.3
  it("resolves an unreadable store to auto", () => {
    vi.spyOn(window.localStorage.__proto__, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readStoredTheme()).toBe("auto");
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
