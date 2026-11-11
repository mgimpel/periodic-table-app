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
import raw2 from "./periodic-table-wikipedia.json";
import addendum from "./periodic-table-addendum.json";
import type { Element, ElementCategory } from "./element";
import { CATEGORY_KEYS } from "./element";

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

// Extended dataset (periodic-table-wikipedia.json): element records identified by
// number and symbol. Only the fields we merge are typed.
interface RawElementWikipedia {
  number: number;
  symbol: string;
  "Electro-negativity"?: string;
  Origin?: string;
}

interface RawDatasetWikipedia {
  elements: RawElementWikipedia[];
}

interface RawElementAddendum {
  number: number;
  symbol: string;
  "Spectral colour": string;
}

interface RawDatasetAddendum {
  elements: RawElementAddendum[];
}

// Build the Z→entry lookup once at module load.
// ponytail: O(1) per-element merge, no second typed model. Ceiling: assumes the
// source datasets agree on element identifiers; missing entries use the
// null/"" fallbacks below (graceful degrade, no throw).
const extendedByZ = new Map<number, RawElementWikipedia>(
  (raw2 as unknown as RawDatasetWikipedia).elements.map((e) => [e.number, e]),
);

const spectralColourByElement = new Map<string, string>(
  (addendum as unknown as RawDatasetAddendum).elements.map((e) => [
    `${e.number}:${e.symbol}`,
    e["Spectral colour"],
  ]),
);

/** Parse the en-dash-placeholder electronegativity string into a number or null. */
function parseElectronegativity(value: string | undefined): number | null {
  if (value === undefined || value === "–") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Merge the three extended fields for a given atomic number, with fallbacks. */
function extendedFields(
  z: number,
  symbol: string,
): Pick<Element, "electronegativity" | "origin" | "spectralColour"> {
  const ext = extendedByZ.get(z);
  return {
    electronegativity: parseElectronegativity(ext?.["Electro-negativity"]),
    origin: ext?.Origin ?? "",
    spectralColour: spectralColourByElement.get(`${z}:${symbol}`) ?? null,
  };
}

/** Map a raw source category string onto the fixed `ElementCategory` union. */
function normalizeCategory(rawCategory: string): ElementCategory {
  const c = rawCategory.toLowerCase().trim();
  if (c.startsWith("unknown")) return "unknown";
  if (c.includes("nonmetal")) return "reactive-nonmetal"; // diatomic + polyatomic nonmetals
  const hyphenated = c.replace(/\s+/g, "-");
  if ((CATEGORY_KEYS as readonly string[]).includes(hyphenated)) return hyphenated as ElementCategory;
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
    ...extendedFields(entry.number, entry.symbol),
  };
}

export const ELEMENTS: Element[] = (raw.elements as unknown as RawElement[])
  .filter((e) => e.number <= 118)
  .map(adapt)
  .sort((a, b) => a.atomicNumber - b.atomicNumber);

export function getElementByNumber(n: number): Element | undefined {
  return ELEMENTS.find((e) => e.atomicNumber === n);
}
