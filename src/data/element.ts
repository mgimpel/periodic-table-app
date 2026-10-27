// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Typed element model and category system for the periodic table.
// Categories are a fixed union used for color-coding cells and building the legend.

export type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth-metal"
  | "transition-metal"
  | "post-transition-metal"
  | "metalloid"
  | "reactive-nonmetal"
  | "noble-gas"
  | "lanthanide"
  | "actinide"
  | "unknown";

export interface Element {
  atomicNumber: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: ElementCategory;
  /** 1–18 for main-group/d-block elements; null when the source leaves it unset (f-block). */
  group: number | null;
  period: number;
  /** Grid column (1–18); already encodes the group-2 → group-13 gap. */
  xpos: number;
  /** Grid row (1–10); rows 8/9 hold the lanthanide/actinide f-block series. */
  ypos: number;
  electronConfiguration: string;
  electronConfigurationSemantic: string;
  shells: number[];
  phase: string;
  block: string;
  /** Electron affinity in kJ/mol; null when the source leaves it unset. */
  electronAffinity: number | null;
  density: number | null;
  /** Unit string for `density` (e.g. "g/cm3", "g/L"). */
  densityUnit: string | null;
  /** Boiling point in Kelvin; null when unknown. */
  boil: number | null;
  /** Melting point in Kelvin; null when unknown. */
  melt: number | null;
  summary: string;
  appearance: string | null;
  discoveredBy: string | null;
  namedBy: string | null;
}

// Canonical display order for the ten categories (legend order). Explicit and
// stable: the legend iterates this rather than relying on object key-insertion
// order, and the ui:category.* translation keys are generated from it. Its sync
// with the union (exactly the keys of CATEGORY_COLORS) is guarded by
// src/locales/elements.check.ts.
export const CATEGORY_KEYS: ElementCategory[] = [
  "alkali-metal",
  "alkaline-earth-metal",
  "transition-metal",
  "post-transition-metal",
  "metalloid",
  "reactive-nonmetal",
  "noble-gas",
  "lanthanide",
  "actinide",
  "unknown",
];

export const CATEGORY_LABELS: Record<ElementCategory, string> = {
  "alkali-metal": "Alkali metals",
  "alkaline-earth-metal": "Alkaline earth metals",
  "transition-metal": "Transition metals",
  "post-transition-metal": "Post-transition metals",
  metalloid: "Metalloids",
  "reactive-nonmetal": "Reactive nonmetals",
  "noble-gas": "Noble gases",
  lanthanide: "Lanthanides",
  actinide: "Actinides",
  unknown: "Unknown",
};

// CSS color strings (not Mantine tokens) so cells and swatches can set background
// directly and stay readable against dark text in both color schemes.
export const CATEGORY_COLORS: Record<ElementCategory, string> = {
  "alkali-metal": "#ff8a80",
  "alkaline-earth-metal": "#ffcc80",
  "transition-metal": "#ffe082",
  "post-transition-metal": "#c5e1a5",
  metalloid: "#80cbc4",
  "reactive-nonmetal": "#90caf9",
  "noble-gas": "#b39ddb",
  lanthanide: "#f48fb1",
  actinide: "#ce93d8",
  unknown: "#cfd8dc",
};
