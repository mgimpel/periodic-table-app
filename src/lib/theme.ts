// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Pure theme helper (mirrors language.ts). Owns the set of valid theme options
// and the safe fallback used when the persisted preference is missing or
// invalid (an absent, unreadable, or invalid stored value renders as "auto",
// i.e. same as device).

/** The three user-selectable theme options, in display order; "auto" follows the device. */
export const THEME_OPTIONS = ["auto", "light", "dark"] as const;

export type ThemeOption = (typeof THEME_OPTIONS)[number];

/** Fallback when no valid stored preference exists — same as device. */
export const DEFAULT_THEME: ThemeOption = "auto";

/**
 * Total, safe normalizer for a persisted theme value: returns `raw` when it is
 * one of the three valid options, otherwise `DEFAULT_THEME`. Accepts `unknown`
 * so callers can pass whatever came out of storage without pre-checking.
 */
export function normalizeStoredTheme(raw: unknown): ThemeOption {
  return (THEME_OPTIONS as readonly unknown[]).includes(raw)
    ? (raw as ThemeOption)
    : DEFAULT_THEME;
}
