// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the pure user-agent OS classifier (no test
// framework). Run via `pnpm check` (or
// `pnpm exec vite-node src/lib/platform.check.ts`). Throws on the first failed
// assertion, so any runner exits non-zero on failure. detectPlatform is the
// single source of truth; the mobile/desktop split (isMobilePlatform) is just
// "result is android or ios", so classifying each UA correctly here covers it.

import assert from "node:assert/strict";
import { detectPlatform } from "./platform";

// --- detectPlatform ---------------------------------------------------------

const UA = {
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
  linux: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36",
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
  ipadClassic: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
};

assert(detectPlatform(UA.windows, 0) === "windows", "Windows UA → windows");
assert(detectPlatform(UA.mac, 0) === "macos", "non-touch Macintosh UA → macos");
assert(detectPlatform(UA.linux, 0) === "linux", "Linux UA → linux");

// Android reports "Linux" in its UA, so it must be matched before linux.
assert(detectPlatform(UA.android, 5) === "android", "Android UA → android");

assert(detectPlatform(UA.iphone, 5) === "ios", "iPhone UA → ios");
assert(detectPlatform(UA.ipadClassic, 5) === "ios", "classic iPad UA → ios");

// iPadOS 13+ masquerades as "Macintosh"; touch points disambiguate it from a
// real Mac, so the same UA string splits on maxTouchPoints.
assert(detectPlatform(UA.mac, 5) === "ios", "touch Macintosh UA (iPadOS) → ios");
assert(detectPlatform(UA.mac, 0) === "macos", "non-touch Macintosh UA → macos");

// Unknown / non-browser env → unknown (safe default).
assert(detectPlatform("", 0) === "unknown", "empty UA → unknown");
assert(
  detectPlatform("SomeRandomCrawler/1.0", 0) === "unknown",
  "unrecognized UA → unknown",
);

console.log("ok: detectPlatform self-check passed");
