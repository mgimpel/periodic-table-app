// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Element data adapter.
//
// Element data Source: Bowserinator/Periodic-Table-JSON (PeriodicTableJSON.json),
// https://github.com/Bowserinator/Periodic-Table-JSON
// Licensed under Creative Commons Attribution-ShareAlike 3.0 Unported (CC-BY-SA 3.0).
// The unmodified dataset and its license are vendored alongside this file as
// periodic-table.json and periodic-table.LICENSE.txt. This adapter normalizes the
// raw entries into the typed `Element` model.
//
// The source ships 119 entries (it includes the hypothetical element 119, Uue).
// We expose exactly the 118 confirmed elements, so entries above 118 are dropped.

import raw from "./periodic-table.json";
import type { Element, ElementCategory } from "./element";
import { CATEGORY_COLORS } from "./element";

export type { Element } from "./element";

interface RawElement {
  number: number;
  symbol: string;
  name: string;
  atomic_mass: number;
  category: string;
  group: number | null;
  period: number;
  xpos: number;
  ypos: number;
  electron_configuration: string;
  electron_configuration_semantic: string;
  electron_affinity: number | null;
  shells: number[];
  phase: string;
  block: string;
  density: number | null;
  density_unit: string | null;
  boil: number | null;
  melt: number | null;
  summary: string;
  appearance: string | null;
  discovered_by: string | null;
  named_by: string | null;
}

/** Map a raw source category string onto the fixed `ElementCategory` union. */
function normalizeCategory(rawCategory: string): ElementCategory {
  const c = rawCategory.toLowerCase().trim();
  if (c.startsWith("unknown")) return "unknown";
  if (c.includes("nonmetal")) return "reactive-nonmetal"; // diatomic + polyatomic nonmetals
  const hyphenated = c.replace(/\s+/g, "-");
  if (hyphenated in CATEGORY_COLORS) return hyphenated as ElementCategory;
  return "unknown";
}

function adapt(entry: RawElement): Element {
  return {
    atomicNumber: entry.number,
    symbol: entry.symbol,
    name: entry.name,
    atomicMass: entry.atomic_mass,
    category: normalizeCategory(entry.category),
    group: entry.group ?? null,
    period: entry.period,
    xpos: entry.xpos,
    ypos: entry.ypos,
    electronConfiguration: entry.electron_configuration,
    electronConfigurationSemantic: entry.electron_configuration_semantic,
    electronAffinity: entry.electron_affinity ?? null,
    shells: entry.shells,
    phase: entry.phase,
    block: entry.block,
    density: entry.density ?? null,
    densityUnit: entry.density_unit ?? null,
    boil: entry.boil ?? null,
    melt: entry.melt ?? null,
    appearance: entry.appearance ?? null,
    discoveredBy: entry.discovered_by ?? null,
    namedBy: entry.named_by ?? null,
  };
}

export const ELEMENTS: Element[] = (raw.elements as unknown as RawElement[])
  .filter((e) => e.number <= 118)
  .map(adapt)
  .sort((a, b) => a.atomicNumber - b.atomicNumber);

export function getElementByNumber(n: number): Element | undefined {
  return ELEMENTS.find((e) => e.atomicNumber === n);
}
