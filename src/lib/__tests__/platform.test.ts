// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Covers the one branch the pure-classifier self-check (platform.check.ts)
// can't reach: currentPlatform() preferring the native @tauri-apps/plugin-os
// platform() value, and falling back to the UA heuristic when that call throws
// (the real non-Tauri behaviour). The plugin module is mocked so both paths
// are exercisable under jsdom, where the native binding is absent.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { platform } from "@tauri-apps/plugin-os";

vi.mock("@tauri-apps/plugin-os", () => ({ platform: vi.fn() }));

const mockPlatform = vi.mocked(platform);

async function loadCurrentPlatform() {
  vi.resetModules();
  return (await import("../platform")).currentPlatform;
}

describe("currentPlatform native-preference / UA-fallback wiring", () => {
  beforeEach(() => {
    mockPlatform.mockReset();
  });

  it("prefers the native platform() value over the user-agent", async () => {
    // jsdom's UA is not Windows, so a "windows" result can only come from the
    // native call winning.
    mockPlatform.mockReturnValue("windows");
    const currentPlatform = await loadCurrentPlatform();
    expect(currentPlatform()).toBe("windows");
  });

  it("maps every Platform-union OS value straight through", async () => {
    const currentPlatform = await loadCurrentPlatform();
    for (const os of ["windows", "macos", "linux", "android", "ios"] as const) {
      mockPlatform.mockReturnValue(os);
      expect(currentPlatform()).toBe(os);
    }
  });

  it("falls back to the UA classifier when platform() throws (non-Tauri)", async () => {
    mockPlatform.mockImplementation(() => {
      throw new Error("no native binding");
    });
    const currentPlatform = await loadCurrentPlatform();
    // jsdom reports a non-mobile desktop UA → not android/ios. The exact value
    // depends on the env UA; the point is it resolves via detectPlatform
    // rather than throwing.
    expect(["windows", "macos", "linux", "unknown"]).toContain(currentPlatform());
  });
});
