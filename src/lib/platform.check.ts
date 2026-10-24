// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the mobile-platform UA classifier (no test
// framework). Run with a TS runner (e.g.
// `pnpm exec vite-node src/lib/platform.check.ts`). Throws on the first failed
// assertion, so any runner exits non-zero on failure.

import { isMobileUserAgent } from "./platform";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

// Android phone → mobile.
assert(
  isMobileUserAgent("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36", 5),
  "Android UA should be mobile",
);

// iPhone → mobile.
assert(
  isMobileUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15", 5),
  "iPhone UA should be mobile",
);

// Classic iPad UA → mobile.
assert(
  isMobileUserAgent("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15", 5),
  "iPad UA should be mobile",
);

// iPadOS 13+ masquerading as Macintosh, but with touch points → mobile.
assert(
  isMobileUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15", 5),
  "touch-enabled Macintosh UA (iPadOS) should be mobile",
);

// Real desktop Mac (no touch points) → NOT mobile.
assert(
  !isMobileUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15", 0),
  "non-touch Macintosh UA should be desktop",
);

// Desktop Windows → NOT mobile.
assert(
  !isMobileUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", 0),
  "Windows UA should be desktop",
);

// Desktop Linux → NOT mobile.
assert(
  !isMobileUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36", 0),
  "Linux UA should be desktop",
);

// Empty UA (unknown/non-browser env) → NOT mobile (safe desktop default).
assert(!isMobileUserAgent("", 0), "empty UA should default to desktop");

console.log("ok: isMobileUserAgent self-check passed");
