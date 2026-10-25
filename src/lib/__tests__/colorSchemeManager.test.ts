// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Unit tests for createAppColorSchemeManager — the thin wrapper over Mantine's
// localStorageColorSchemeManager. Covers: persist (5.1), read-back (5.2),
// invalid-value normalization to auto (5.3), and the save-failure signal (5.4).

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createAppColorSchemeManager } from "../colorSchemeManager";
import { DEFAULT_THEME } from "../theme";

// The localStorage key Mantine's manager uses by default (confirmed against the
// installed @mantine/core: color-scheme-managers/local-storage-manager).
const STORAGE_KEY = "mantine-color-scheme-value";

describe("createAppColorSchemeManager", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  // Validates: Requirements 5.1
  it("persists the selected scheme to localStorage under the expected key", () => {
    const manager = createAppColorSchemeManager();

    manager.set("dark");

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  // Validates: Requirements 5.2
  it("reads back a valid stored value", () => {
    window.localStorage.setItem(STORAGE_KEY, "dark");
    const manager = createAppColorSchemeManager();

    // defaultValue is ignored because a valid value is stored.
    expect(manager.get("auto")).toBe("dark");
  });

  // Validates: Requirements 5.3
  it("resolves a present-but-invalid stored value to auto via normalizeStoredTheme", () => {
    // A tampered/garbage value that is not one of the three options.
    window.localStorage.setItem(STORAGE_KEY, "chartreuse");
    const manager = createAppColorSchemeManager();

    // Even if the caller offers a non-default fallback, an invalid stored value
    // normalizes to Same_As_Device rather than passing the junk through.
    expect(manager.get("light")).toBe(DEFAULT_THEME);
    expect(manager.get("light")).toBe("auto");
  });

  // Validates: Requirements 5.4
  it("invokes onSaveError and does not throw when persisting fails", () => {
    const failure = new Error("quota exceeded");
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw failure;
    });
    const onSaveError = vi.fn();
    const manager = createAppColorSchemeManager(onSaveError);

    // The session must continue (no throw) and the failure must be signalled.
    expect(() => manager.set("dark")).not.toThrow();
    expect(onSaveError).toHaveBeenCalledTimes(1);
    expect(onSaveError).toHaveBeenCalledWith(failure);
  });
});
