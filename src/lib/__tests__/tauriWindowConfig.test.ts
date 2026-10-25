// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Smoke test for the fixed desktop window declared in src-tauri/tauri.conf.json.
// The window must be non-resizable and have equal min/max dimensions so the full
// table always renders at its natural size with no scrollbars.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Vitest runs with the project root as the working directory, so resolve the
// config from there. (Going through `new URL(..., import.meta.url)` +
// `fileURLToPath` fails under Vitest, where `import.meta.url` is not a
// `file:` URL.)
const configPath = resolve(process.cwd(), "src-tauri", "tauri.conf.json");
const config = JSON.parse(readFileSync(configPath, "utf-8"));

describe("tauri.conf.json fixed-window smoke test", () => {
  // Validates: Requirements 3.1, 3.4

  const win = config.app?.windows?.[0];

  it("declares at least one app window", () => {
    expect(win).toBeDefined();
  });

  it("locks width to a fixed value (width === minWidth)", () => {
    expect(win.width).toBe(win.minWidth);
  });

  it("locks height to a fixed value (height === minHeight)", () => {
    expect(win.height).toBe(win.minHeight);
  });

  it("is not resizable", () => {
    expect(win.resizable).toBe(false);
  });
});
