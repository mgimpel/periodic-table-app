// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for computeFitScale (no test framework).
// Run with a TS runner (e.g. `pnpm exec vite-node src/lib/fitScale.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import { computeFitScale } from "./fitScale";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

// Exact fit → scale 1, full cells.
{
  const r = computeFitScale({ width: 100, height: 100 }, { width: 100, height: 100 });
  assert(r.scale === 1, `exact-fit scale should be 1, got ${r.scale}`);
  assert(!r.symbolOnly, "exact-fit should not be symbol-only");
}

// Never upscales: huge viewport caps at 1.
{
  const r = computeFitScale({ width: 100, height: 100 }, { width: 9999, height: 9999 });
  assert(r.scale === 1, `scale must not exceed 1, got ${r.scale}`);
}

// Width-bound vs height-bound: picks the smaller ratio.
{
  const r = computeFitScale({ width: 200, height: 100 }, { width: 100, height: 100 });
  assert(r.scale === 0.5, `width-bound scale should be 0.5, got ${r.scale}`);
  assert(200 * r.scale <= 100 && 100 * r.scale <= 100, "scaled table must fit viewport");
}

// Symbol-only engages strictly below the legibility threshold.
// Use custom cell-px overrides so the threshold math is exact (no float ratio).
// scale = 0.5, naturalCellPx*scale = 20 < 40 → symbol-only.
{
  const r = computeFitScale(
    { width: 80, height: 80 },
    { width: 40, height: 40 },
    { naturalCellPx: 40, legibilityMinCellPx: 40 },
  );
  assert(r.scale === 0.5, `expected scale 0.5, got ${r.scale}`);
  assert(r.symbolOnly, `expected symbol-only below threshold (scaled cell ${40 * r.scale})`);
}

// Exactly at the threshold → full cells (strict inequality).
// scale = 1, naturalCellPx*scale = 40, not < 40 → full cells.
{
  const r = computeFitScale(
    { width: 40, height: 40 },
    { width: 40, height: 40 },
    { naturalCellPx: 40, legibilityMinCellPx: 40 },
  );
  assert(r.scale === 1, `expected scale 1, got ${r.scale}`);
  assert(!r.symbolOnly, `exactly at threshold should not be symbol-only (scaled cell ${40 * r.scale})`);
}

// Overrides are honored (defaults would give a different answer here).
{
  const r = computeFitScale(
    { width: 100, height: 100 },
    { width: 100, height: 100 },
    { naturalCellPx: 30, legibilityMinCellPx: 40 },
  );
  // scale 1, 30 * 1 = 30 < 40 → symbol-only, which the defaults (56) would not give.
  assert(r.symbolOnly, "override naturalCellPx should drive symbol-only");
}

// Invalid/missing dimensions never yield NaN or Infinity; scale stays in (0, 1].
for (const bad of [0, -5, NaN, Infinity, -Infinity]) {
  const r = computeFitScale(
    { width: bad, height: bad },
    { width: bad, height: bad },
  );
  assert(Number.isFinite(r.scale), `scale must be finite for input ${bad}, got ${r.scale}`);
  assert(r.scale > 0 && r.scale <= 1, `scale must be in (0,1] for input ${bad}, got ${r.scale}`);
}

console.log("ok: computeFitScale self-check passed");
