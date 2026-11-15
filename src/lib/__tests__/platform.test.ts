// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Covers the one branch the pure-classifier self-check (platform.check.ts)
// can't reach: currentPlatform() preferring the native @tauri-apps/plugin-os
// platform() value, and falling back to the UA heuristic when that call throws
// (the real non-Tauri behaviour). The native binding is faked through the
// global the plugin itself reads (see setNativePlatform), so both paths run the
// real plugin code under jsdom, where the binding is otherwise absent.

import { describe, it, expect, afterEach } from "vitest";
import { currentPlatform } from "../platform";
import { setNativePlatform } from "../../test-utils";

afterEach(() => {
  setNativePlatform(undefined);
});

describe("currentPlatform native-preference / UA-fallback wiring", () => {
  it("prefers the native platform() value over the user-agent", () => {
    // jsdom's UA is not Windows, so a "windows" result can only come from the
    // native call winning.
    setNativePlatform("windows");

    expect(currentPlatform()).toBe("windows");
  });

  it("maps every Platform-union OS value straight through", () => {
    for (const os of ["windows", "macos", "linux", "android", "ios"] as const) {
      setNativePlatform(os);

      expect(currentPlatform()).toBe(os);
    }
  });

  it("falls back to the UA classifier when platform() throws (non-Tauri)", () => {
    setNativePlatform(undefined);

    // jsdom reports a non-mobile desktop UA → not android/ios. The exact value
    // depends on the env UA; the point is it resolves via detectPlatform
    // rather than throwing.
    expect(["windows", "macos", "linux", "unknown"]).toContain(currentPlatform());
  });
});
