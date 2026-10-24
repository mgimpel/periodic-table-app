// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Pure theme helper. Owns the set of valid theme options and the safe
// fallback used when the persisted preference is missing or unreadable
// (Req 5.3: an absent, unreadable, or invalid stored value renders as
// Same_As_Device).

/** The three user-selectable theme options; "auto" follows the device. */
export type ThemeOption = "light" | "dark" | "auto";

/** Fallback when no valid stored preference exists — Same_As_Device. */
export const DEFAULT_THEME: ThemeOption = "auto";

/**
 * Total, safe normalizer for a persisted theme value: returns `raw` when it is
 * one of the three valid options, otherwise `DEFAULT_THEME`. Accepts `unknown`
 * so callers can pass whatever came out of storage without pre-checking.
 */
export function normalizeStoredTheme(raw: unknown): ThemeOption {
  return raw === "light" || raw === "dark" || raw === "auto" ? raw : DEFAULT_THEME;
}
