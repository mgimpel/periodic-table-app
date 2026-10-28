// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Pure temperature helper (mirrors theme.ts). Owns the set of valid unit
// options, the safe fallback used when the persisted preference is missing or
// invalid, and the Kelvin → unit conversion/formatting used by ElementDetail.
// The dataset stores melting/boiling points in Kelvin.

/** The three user-selectable temperature units, in display order. */
export const TEMPERATURE_OPTIONS = ["kelvin", "celsius", "fahrenheit"] as const;

export type TemperatureOption = (typeof TEMPERATURE_OPTIONS)[number];

/** Fallback when no valid stored preference exists — the dataset's native unit. */
export const DEFAULT_TEMPERATURE: TemperatureOption = "kelvin";

/** Language-neutral unit symbols shown after the value. */
export const TEMPERATURE_SYMBOLS: Record<TemperatureOption, string> = {
  kelvin: "K",
  celsius: "°C",
  fahrenheit: "°F",
};

/**
 * Total, safe normalizer for a persisted unit value: returns `raw` when it is
 * one of the three valid options, otherwise `DEFAULT_TEMPERATURE`.
 */
export function normalizeStoredTemperature(raw: unknown): TemperatureOption {
  return (TEMPERATURE_OPTIONS as readonly unknown[]).includes(raw)
    ? (raw as TemperatureOption)
    : DEFAULT_TEMPERATURE;
}

/** Convert a Kelvin value to `unit` (unrounded). */
export function convertKelvin(k: number, unit: TemperatureOption): number {
  if (unit === "celsius") return k - 273.15;
  if (unit === "fahrenheit") return (k * 9) / 5 - 459.67;
  return k;
}

/**
 * Format a nullable Kelvin value in `unit`: at most 2 decimals, trailing zeros
 * trimmed, "—" when unknown (same placeholder as ElementDetail's `fmt`).
 *
 * ponytail: plain JS number string ("." decimal, no grouping), matching how
 * ElementDetail's `fmt` renders every other numeric field. Upgrade path is to
 * switch `fmt` and this to Intl.NumberFormat(i18n.language) together.
 */
export function formatTemperature(
  k: number | null,
  unit: TemperatureOption,
): string {
  if (k === null) return "—";
  // toFixed(2) drops float noise; Number() trims trailing zeros; `${-0}` is "0".
  const value = Number(convertKelvin(k, unit).toFixed(2));
  return `${value} ${TEMPERATURE_SYMBOLS[unit]}`;
}
