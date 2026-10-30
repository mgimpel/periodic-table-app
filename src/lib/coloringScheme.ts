// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Pure coloring-scheme helper (mirrors temperature.ts). Owns the set of valid
// scheme options and the safe fallback used when the persisted preference is
// missing or invalid. The scheme decides how each Element_Cell is colored:
// by category, phase, melting point, or boiling point.

/** The four user-selectable coloring schemes, in display order. */
export const COLORING_SCHEME_OPTIONS = [
  "category",
  "phase",
  "melting-point",
  "boiling-point",
] as const;

export type ColoringSchemeOption = (typeof COLORING_SCHEME_OPTIONS)[number];

/** Fallback when no valid stored preference exists — the table's current coloring. */
export const DEFAULT_COLORING_SCHEME: ColoringSchemeOption = "category";

/**
 * Total, safe normalizer for a persisted scheme value: returns `raw` when it is
 * one of the four valid options, otherwise `DEFAULT_COLORING_SCHEME`.
 */
export function normalizeStoredColoringScheme(
  raw: unknown,
): ColoringSchemeOption {
  return (COLORING_SCHEME_OPTIONS as readonly unknown[]).includes(raw)
    ? (raw as ColoringSchemeOption)
    : DEFAULT_COLORING_SCHEME;
}
