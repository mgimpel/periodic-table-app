// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Tests for SchemeLegend: the legend's form follows the active coloring scheme.
// The two discrete schemes (category, phase) render one labeled swatch per key
// in canonical order; the two gradient schemes (melting-point, boiling-point)
// render the temperature-gradient bar with endpoint labels in the active unit.
//
// CSS Modules return hashed/undefined class names under jsdom, so entries and
// the gradient bar are located by accessible role/name, visible text, and
// inline style (backgroundColor / backgroundImage) rather than by class name.
// Expected labels are read from the en ui.json resources, never duplicated.

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import fc from "fast-check";
// Initialise the shared i18next default instance so scheme labels resolve to
// the English ui.json resources rather than raw keys.
import "../../i18n";
import { SchemeLegend } from "../SchemeLegend";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../../data/element";
import { PHASE_COLORS, PHASE_KEYS } from "../../lib/cellColor";
import {
  TEMPERATURE_OPTIONS,
  formatTemperature,
} from "../../lib/temperature";
import { DATASET_MAX } from "../../lib/temperatureGradient";
import enUi from "../../locales/en/ui.json";

afterEach(cleanup);

const groupName = enUi.legend.groupLabel;
const categoryLabel = (k: string) =>
  enUi.category[k as keyof typeof enUi.category];
const phaseLabel = (k: string) => enUi.phase[k as keyof typeof enUi.phase];

// Browsers normalize style.backgroundColor to rgb(); jsdom keeps whatever
// string was assigned. Normalize both sides by round-tripping the value
// through a DOM element's style so the comparison is robust either way.
function normalizeColor(color: string): string {
  const el = document.createElement("span");
  el.style.backgroundColor = color;
  return el.style.backgroundColor;
}

function renderLegend(
  scheme: Parameters<typeof SchemeLegend>[0]["scheme"],
  unit: Parameters<typeof SchemeLegend>[0]["temperatureUnit"] = "kelvin",
) {
  return render(
    <MantineProvider>
      <SchemeLegend scheme={scheme} temperatureUnit={unit} />
    </MantineProvider>,
  );
}

// --- Discrete legends: category -------------------------------------------
// Req 1.3 (legend reflects the scheme), 2.3 (one swatch per category in
// canonical CATEGORY_KEYS order), 2.4 (localized label, not the raw key).
describe("SchemeLegend category scheme (discrete)", () => {
  // Validates: Requirements 1.3, 2.3, 2.4, 7.2
  it("renders one group with the accessible name from ui.json", () => {
    renderLegend("category");
    expect(screen.getByRole("group", { name: groupName })).toBeInTheDocument();
  });

  it("renders exactly one swatch per category in canonical order with the localized label and CATEGORY_COLORS swatch", () => {
    renderLegend("category");
    const legend = screen.getByRole("group", { name: groupName });
    // The group's first child is the <h3> title; entries are the labeled rows.
    const entries = Array.from(
      legend.querySelectorAll<HTMLElement>(":scope > [aria-label]"),
    );

    // One entry per category key, no extras or omissions.
    expect(entries).toHaveLength(CATEGORY_KEYS.length);

    // Accessible names appear in the canonical CATEGORY_KEYS order.
    expect(entries.map((e) => e.getAttribute("aria-label"))).toEqual(
      CATEGORY_KEYS.map(categoryLabel),
    );

    // Each entry shows its swatch (CATEGORY_COLORS color) and visible label.
    entries.forEach((entry, i) => {
      const key = CATEGORY_KEYS[i];
      const swatch = entry.querySelector("span[style]") as HTMLElement | null;
      expect(swatch).not.toBeNull();
      expect(normalizeColor(swatch!.style.backgroundColor)).toBe(
        normalizeColor(CATEGORY_COLORS[key]),
      );
      expect(within(entry).getByText(categoryLabel(key))).toBeInTheDocument();
    });
  });
});

// --- Discrete legends: phase ----------------------------------------------
// Req 3.3 (exactly four swatches, one per phase value in fixed PHASE_KEYS
// order), 3.4 (localized label, not the raw dataset value).
describe("SchemeLegend phase scheme (discrete)", () => {
  // Validates: Requirements 1.3, 3.3, 3.4, 7.2
  it("renders one group with the accessible name from ui.json", () => {
    renderLegend("phase");
    expect(screen.getByRole("group", { name: groupName })).toBeInTheDocument();
  });

  it("renders exactly four swatches in fixed PHASE_KEYS order with the localized label and PHASE_COLORS swatch", () => {
    renderLegend("phase");
    const legend = screen.getByRole("group", { name: groupName });
    // The group's first child is the <h3> title; entries are the labeled rows.
    const entries = Array.from(
      legend.querySelectorAll<HTMLElement>(":scope > [aria-label]"),
    );

    // Exactly four: solid, liquid, gas, unknown.
    expect(entries).toHaveLength(PHASE_KEYS.length);
    expect(PHASE_KEYS).toHaveLength(4);

    // Accessible names appear in the fixed PHASE_KEYS order.
    expect(entries.map((e) => e.getAttribute("aria-label"))).toEqual(
      PHASE_KEYS.map(phaseLabel),
    );

    entries.forEach((entry, i) => {
      const key = PHASE_KEYS[i];
      const swatch = entry.querySelector("span[style]") as HTMLElement | null;
      expect(swatch).not.toBeNull();
      expect(normalizeColor(swatch!.style.backgroundColor)).toBe(
        normalizeColor(PHASE_COLORS[key]),
      );
      expect(within(entry).getByText(phaseLabel(key))).toBeInTheDocument();
    });
  });
});

// --- Gradient legends: melting-point / boiling-point ----------------------
// Req 4.3 / 5.3: a gradient bar is present for both gradient schemes, with
// endpoint labels. The bar is located by its inline background-image (the
// blue->white->orange->red linear-gradient), a structural fact — not a CSS
// source-text assertion.
const GRADIENT_SCHEMES = ["melting-point", "boiling-point"] as const;

describe("SchemeLegend gradient schemes", () => {
  // Validates: Requirements 1.3, 4.3, 5.3, 7.2
  it.each(GRADIENT_SCHEMES)(
    "renders the gradient bar and two endpoint labels for the %s scheme",
    (scheme) => {
      const { container } = renderLegend(scheme, "kelvin");

      // One legend group with the accessible name from ui.json.
      const legend = screen.getByRole("group", { name: groupName });

      // The gradient bar: a descendant carrying an inline linear-gradient
      // background image (set from GRADIENT_STOPS). Located structurally.
      const bars = Array.from(
        container.querySelectorAll<HTMLElement>("[style]"),
      ).filter((el) =>
        el.style.backgroundImage.includes("linear-gradient"),
      );
      expect(bars).toHaveLength(1);
      expect(legend.contains(bars[0])).toBe(true);

      // No discrete swatches in a gradient legend.
      expect(
        legend.querySelector("span[style*='background-color']"),
      ).toBeNull();

      // Exactly two endpoint labels: min at 0 K, max at DATASET_MAX.
      expect(
        within(legend).getByText(formatTemperature(0, "kelvin")),
      ).toBeInTheDocument();
      expect(
        within(legend).getByText(formatTemperature(DATASET_MAX, "kelvin")),
      ).toBeInTheDocument();
    },
  );
});

// --- Property 8 -----------------------------------------------------------
describe("SchemeLegend property 8: gradient endpoint labels follow the active unit", () => {
  // Feature: element-color-schemes, Property 8: Gradient legend endpoint labels follow the active unit
  // Validates: Requirements 4.4, 5.4, 7.2
  it("labels the gradient endpoints with formatTemperature(0, u) and formatTemperature(DATASET_MAX, u) for every unit and both gradient schemes", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TEMPERATURE_OPTIONS),
        fc.constantFrom(...GRADIENT_SCHEMES),
        (unit, scheme) => {
          renderLegend(scheme, unit);
          const legend = screen.getByRole("group", { name: groupName });

          const minLabel = formatTemperature(0, unit);
          const maxLabel = formatTemperature(DATASET_MAX, unit);

          expect(within(legend).getByText(minLabel)).toBeInTheDocument();
          expect(within(legend).getByText(maxLabel)).toBeInTheDocument();

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});
