// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Pure fit-to-viewport scaling geometry. No DOM, no React — this is the unit
// under property-based test. The scaling logic lives in computeFitScale below.

export interface Size {
  width: number;   // logical px, > 0
  height: number;  // logical px, > 0
}

export interface FitResult {
  /** Uniform scale to apply to the table so it fits the viewport. In (0, 1]. */
  scale: number;
  /** True when the scaled full cell would be below the legibility threshold. */
  symbolOnly: boolean;
}

/**
 * Natural cell edge length (logical px) below which the symbol, name, and
 * atomic number can no longer all render legibly, so cells drop to symbol-only.
 */
export const LEGIBILITY_MIN_CELL_PX = 40;

/** Natural cell edge length used to lay out the grid before scaling. */
export const NATURAL_CELL_PX = 56;

/** Clamp a dimension to a safe positive, finite minimum (1 logical px). */
function safeDim(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

/**
 * Compute the fit-to-viewport scale. Never upscales past 1 (keeps the table
 * from ballooning on large desktop windows); always fits both dimensions.
 */
export function computeFitScale(
  natural: Size,
  viewport: Size,
  opts?: { naturalCellPx?: number; legibilityMinCellPx?: number },
): FitResult {
  const naturalCellPx = opts?.naturalCellPx ?? NATURAL_CELL_PX;
  const legibilityMinCellPx = opts?.legibilityMinCellPx ?? LEGIBILITY_MIN_CELL_PX;

  const nw = safeDim(natural.width);
  const nh = safeDim(natural.height);
  const vw = safeDim(viewport.width);
  const vh = safeDim(viewport.height);

  // Fit both dimensions, never upscale past 1. Inputs are clamped positive and
  // finite, so the result is always a finite number in (0, 1].
  const scale = Math.min(vw / nw, vh / nh, 1);

  const symbolOnly = naturalCellPx * scale < legibilityMinCellPx;

  return { scale, symbolOnly };
}
