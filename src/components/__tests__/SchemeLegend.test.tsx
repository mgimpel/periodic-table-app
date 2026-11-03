// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Tests for SchemeLegend: the legend's form follows the active coloring scheme.
// The three discrete schemes (category, phase, origin) render one labeled
// swatch per key in canonical order; the gradient schemes (melting-point,
// boiling-point, electronegativity) render a gradient bar with endpoint labels;
// the spectral-colour scheme renders an explanatory note with no swatches.
//
// CSS Modules return hashed/undefined class names under jsdom, so entries and
// the gradient bar are located by accessible role/name, visible text, and
// inline style (backgroundColor / backgroundImage) rather than by class name.
// Expected labels are read from the en ui.json resources, never duplicated.

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
// Initialise the shared i18next default instance so scheme labels resolve to
// the English ui.json resources rather than raw keys.
import "../../i18n";
import { SchemeLegend } from "../SchemeLegend";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../../data/element";
import {
  ORIGIN_COLORS,
  ORIGIN_KEYS,
  PHASE_COLORS,
  PHASE_KEYS,
} from "../../lib/cellColor";
import {
  TEMPERATURE_OPTIONS,
  formatTemperature,
  type TemperatureOption,
} from "../../lib/temperature";
import {
  TEMPERATURE_MAX,
  ELECTRONEGATIVITY_MAX,
  ELECTRONEGATIVITY_MIN,
} from "../../lib/gradient";
import enUi from "../../locales/en/ui.json";

afterEach(cleanup);

type Scheme = Parameters<typeof SchemeLegend>[0]["scheme"];

const groupName = enUi.legend.groupLabel;
const spectralDescription = enUi.schemeLegend.spectral.description;

// Browsers normalize style.backgroundColor to rgb(); jsdom keeps whatever
// string was assigned. Normalize both sides by round-tripping the value
// through a DOM element's style so the comparison is robust either way.
function normalizeColor(color: string): string {
  const el = document.createElement("span");
  el.style.backgroundColor = color;
  return el.style.backgroundColor;
}

function renderLegend(
  scheme: Scheme,
  unit: TemperatureOption = "kelvin",
) {
  return render(
    <MantineProvider>
      <SchemeLegend scheme={scheme} temperatureUnit={unit} />
    </MantineProvider>,
  );
}

// The gradient bar is located structurally: a descendant carrying an inline
// linear-gradient background image (set from the scheme's GRADIENT_STOPS /
// EN_STOPS), not by CSS source text or class name.
function gradientBars(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[style]")).filter(
    (el) => el.style.backgroundImage.includes("linear-gradient"),
  );
}

// --- Discrete legends: category / phase / origin --------------------------
// One labeled swatch per key, in the scheme's canonical key order, with the
// localized label (not the raw key) and the scheme's color for that key.
//   Req 1.3 (legend reflects the scheme), 2.3/3.3/7.3 (one swatch per key in
//   canonical order), 2.4/3.4/7.4 (localized label, not the raw key).
const label = (group: Record<string, string>, k: string) =>
  group[k as keyof typeof group] as string;

const DISCRETE_SCHEMES: ReadonlyArray<
  [Scheme, readonly string[], Record<string, string>, Record<string, string>]
> = [
  ["category", CATEGORY_KEYS, CATEGORY_COLORS, enUi.category],
  ["phase", PHASE_KEYS, PHASE_COLORS, enUi.phase],
  ["origin", ORIGIN_KEYS, ORIGIN_COLORS, enUi.origin],
];

describe("SchemeLegend discrete schemes", () => {
  // Validates: Requirements 1.3, 2.3, 2.4, 3.3, 3.4, 7.2, 7.3, 7.4
  it.each(DISCRETE_SCHEMES)(
    "%s renders one group with the accessible name from ui.json",
    (scheme) => {
      renderLegend(scheme);
      expect(
        screen.getByRole("group", { name: groupName }),
      ).toBeInTheDocument();
    },
  );

  it.each(DISCRETE_SCHEMES)(
    "%s renders exactly one swatch per key in canonical order with the localized label and scheme color",
    (scheme, keys, colors, labels) => {
      renderLegend(scheme);
      const legend = screen.getByRole("group", { name: groupName });
      // The group's first child is the <h3> title; entries are the labeled rows.
      const entries = Array.from(
        legend.querySelectorAll<HTMLElement>(":scope > [aria-label]"),
      );

      // One entry per key, no extras or omissions, in canonical order.
      expect(entries).toHaveLength(keys.length);
      expect(entries.map((e) => e.getAttribute("aria-label"))).toEqual(
        keys.map((k) => label(labels, k)),
      );

      // Each entry shows its swatch (scheme color) and visible localized label.
      entries.forEach((entry, i) => {
        const key = keys[i];
        const swatch = entry.querySelector("span[style]") as HTMLElement | null;
        expect(swatch).not.toBeNull();
        expect(normalizeColor(swatch!.style.backgroundColor)).toBe(
          normalizeColor(colors[key]),
        );
        expect(
          within(entry).getByText(label(labels, key)),
        ).toBeInTheDocument();
      });
    },
  );
});

// --- Gradient legends: melting-point / boiling-point ----------------------
// Req 4.3/5.3: a gradient bar is present for both temperature gradient schemes,
// with endpoint labels. Req 4.4/5.4 (Property 8): the endpoint labels follow
// the active temperature unit — formatTemperature(0, u) and
// formatTemperature(DATASET_MAX, u) — across every unit and both schemes.
// The former fast-check property (numRuns: 100) spanned a domain of only
// 3 units x 2 schemes = 6 cases, so it is enumerated directly here.
const TEMP_GRADIENT_SCHEMES = ["melting-point", "boiling-point"] as const;
const UNIT_SCHEME_CASES: ReadonlyArray<[TemperatureOption, Scheme]> =
  TEMPERATURE_OPTIONS.flatMap((unit) =>
    TEMP_GRADIENT_SCHEMES.map((scheme) => [unit, scheme] as [TemperatureOption, Scheme]),
  );

describe("SchemeLegend temperature gradient schemes", () => {
  // Feature: element-color-schemes, Property 8: Gradient legend endpoint labels follow the active unit
  // Validates: Requirements 1.3, 4.3, 4.4, 5.3, 5.4, 7.2
  it.each(UNIT_SCHEME_CASES)(
    "renders the gradient bar and the two endpoint labels in %s for the %s scheme",
    (unit, scheme) => {
      const { container } = renderLegend(scheme, unit);
      const legend = screen.getByRole("group", { name: groupName });

      // Exactly one gradient bar, inside the legend group.
      const bars = gradientBars(container);
      expect(bars).toHaveLength(1);
      expect(legend.contains(bars[0])).toBe(true);

      // No discrete swatches in a gradient legend.
      expect(
        legend.querySelector("span[style*='background-color']"),
      ).toBeNull();

      // Endpoint labels: min at 0 K and max at DATASET_MAX, in the active unit.
      expect(
        within(legend).getByText(formatTemperature(0, unit)),
      ).toBeInTheDocument();
      expect(
        within(legend).getByText(formatTemperature(TEMPERATURE_MAX, unit)),
      ).toBeInTheDocument();
    },
  );
});

// --- Gradient legend: electronegativity -----------------------------------
// Req 6.4: the electronegativity legend renders the gradient bar, but its
// endpoint labels are the raw dataset DATASET_MIN_EN / DATASET_MAX_EN numbers
// (a unitless Pauling scale), unaffected by the active temperature unit.
describe("SchemeLegend electronegativity scheme (gradient)", () => {
  // Validates: Requirements 6.4
  it("renders the gradient bar with raw DATASET_MIN_EN / DATASET_MAX_EN endpoint labels", () => {
    const { container } = renderLegend("electronegativity", "kelvin");
    const legend = screen.getByRole("group", { name: groupName });

    const bars = gradientBars(container);
    expect(bars).toHaveLength(1);
    expect(legend.contains(bars[0])).toBe(true);

    // Endpoint labels are the raw numbers, not formatTemperature output.
    expect(
      within(legend).getByText(String(ELECTRONEGATIVITY_MIN)),
    ).toBeInTheDocument();
    expect(
      within(legend).getByText(String(ELECTRONEGATIVITY_MAX)),
    ).toBeInTheDocument();
  });

  it("keeps the EN endpoint labels identical across different temperature units", () => {
    // Render under kelvin, capture the labels, then render under celsius: the
    // unitless EN numbers must be unaffected by the active temperature unit.
    renderLegend("electronegativity", "kelvin");
    const kelvinLegend = screen.getByRole("group", { name: groupName });
    expect(
      within(kelvinLegend).getByText(String(ELECTRONEGATIVITY_MIN)),
    ).toBeInTheDocument();
    expect(
      within(kelvinLegend).getByText(String(ELECTRONEGATIVITY_MAX)),
    ).toBeInTheDocument();
    cleanup();

    renderLegend("electronegativity", "celsius");
    const celsiusLegend = screen.getByRole("group", { name: groupName });
    expect(
      within(celsiusLegend).getByText(String(ELECTRONEGATIVITY_MIN)),
    ).toBeInTheDocument();
    expect(
      within(celsiusLegend).getByText(String(ELECTRONEGATIVITY_MAX)),
    ).toBeInTheDocument();
  });
});

// --- Explanatory legend: spectral-colour ----------------------------------
// Req 8.4 (the localized description text is present), 8.5 (no swatches: each
// cell shows its own spectral colour, so there is no finite key to swatch).
describe("SchemeLegend spectral-colour scheme (explanatory)", () => {
  // Validates: Requirements 8.4, 8.5
  it("renders the localized description text and no swatches", () => {
    const { container } = renderLegend("spectral-colour");
    const legend = screen.getByRole("group", { name: groupName });

    // The localized explanation from en ui.json is present.
    expect(
      within(legend).getByText(spectralDescription),
    ).toBeInTheDocument();

    // No discrete swatch entries and no gradient bar.
    expect(legend.querySelector(":scope > [aria-label]")).toBeNull();
    expect(
      legend.querySelector("span[style*='background-color']"),
    ).toBeNull();
    expect(gradientBars(container)).toHaveLength(0);
  });
});
