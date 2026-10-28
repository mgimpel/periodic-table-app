// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Property-based tests for CategoryLegend: the legend's entries are derived
// from the fixed category set, so the rendered output must mirror the en
// ui.json category.* labels and CATEGORY_COLORS exactly. CSS Modules return
// undefined class names under jsdom, so entries are located by their accessible
// role/name and the swatch color is asserted on the inline style rather than by class.

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import fc from "fast-check";
// Initialise the shared i18next default instance so category labels resolve to
// the English ui.json resources rather than raw keys.
import "../../i18n";
import { CategoryLegend } from "../CategoryLegend";
import { PeriodicTable } from "../PeriodicTable";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../../data/element";
import { ELEMENTS } from "../../data/elements";
import enUi from "../../locales/en/ui.json";

afterEach(cleanup);

const label = (c: string) => enUi.category[c as keyof typeof enUi.category];

// Browsers normalize style.backgroundColor to rgb(); jsdom keeps whatever
// string was assigned. Normalize both sides by round-tripping the value
// through a DOM element's style so the comparison is robust either way.
function normalizeColor(color: string): string {
  const el = document.createElement("span");
  el.style.backgroundColor = color;
  return el.style.backgroundColor;
}

describe("CategoryLegend property 1: entry set matches the category keys", () => {
  // Feature: in-grid-category-legend, Property 1: Entry set matches the category keys with correct swatch and label
  // Validates: Requirements 1.2, 1.3, 3.1
  it("renders exactly one entry per category key with the correct swatch color and visible label", () => {
    fc.assert(
      fc.property(
        // Vary the order/subset of keys we assert against while always
        // rendering the full legend. The subset drives which keys we check,
        // never what the component renders.
        fc.shuffledSubarray(CATEGORY_KEYS, {
          minLength: CATEGORY_KEYS.length,
        }),
        (keys) => {
          render(
            <MantineProvider>
              <CategoryLegend />
            </MantineProvider>,
          );

          const legend = screen.getByRole("group", {
            name: "Element category legend",
          });

          // Direct entry children of the legend container: one per category,
          // ten total, no extras or omissions. Query the DOM children directly
          // (each entry carries a non-empty aria-label) rather than a tree-wide
          // accessible-name scan.
          const entries = Array.from(legend.children) as HTMLElement[];
          expect(entries).toHaveLength(CATEGORY_KEYS.length);
          for (const entry of entries) {
            expect(entry.getAttribute("aria-label")).toBeTruthy();
          }

          for (const category of keys) {
            const name = label(category);

            // Exactly one entry carries this category's accessible name.
            const matching = entries.filter(
              (e) => e.getAttribute("aria-label") === name,
            );
            expect(matching).toHaveLength(1);
            const entry = matching[0];

            // Swatch color equals CATEGORY_COLORS[category].
            const swatch = entry.querySelector(
              "span[style]",
            ) as HTMLElement | null;
            expect(swatch).not.toBeNull();
            expect(normalizeColor(swatch!.style.backgroundColor)).toBe(
              normalizeColor(CATEGORY_COLORS[category]),
            );

            // The visible label text is always present.
            expect(within(entry).getByText(name)).toBeInTheDocument();
          }

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("CategoryLegend property 2: every entry always shows its swatch and label", () => {
  // Feature: in-grid-category-legend, Property 2: Every entry always shows its swatch and label
  // Validates: Requirements 3.1, 3.2, 3.4
  it("always shows both the swatch and the visible label for every entry, with no entry dropping its label", () => {
    fc.assert(
      // The legend has no mode input, so vary the assertion over the category
      // key set (shuffled subarrays) to confirm the invariant holds for every
      // entry rather than over a symbolOnly boolean.
      fc.property(
        fc.shuffledSubarray(CATEGORY_KEYS, {
          minLength: CATEGORY_KEYS.length,
        }),
        (keys) => {
          render(
            <MantineProvider>
              <CategoryLegend />
            </MantineProvider>,
          );

          const legend = screen.getByRole("group", {
            name: "Element category legend",
          });

          // Read entry children directly (avoid tree-wide accessible-name scans).
          const entries = Array.from(legend.children) as HTMLElement[];
          expect(entries).toHaveLength(CATEGORY_KEYS.length);

          for (const entry of entries) {
            // The swatch (a span carrying the inline backgroundColor) is present.
            const swatch = entry.querySelector(
              "span[style]",
            ) as HTMLElement | null;
            expect(swatch).not.toBeNull();

            // With the real category data every label is non-empty, so the
            // entry's accessible name equals the visible label it must show.
            const labelText = entry.getAttribute("aria-label") as string;
            expect(within(entry).getByText(labelText)).toBeInTheDocument();
          }

          // The varied key order drives nothing structural; it only confirms
          // the invariant is phrased over the whole category set.
          void keys;

          cleanup();
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("CategoryLegend: every entry has a non-empty accessible name", () => {
  // Validates: Requirements 4.2, 4.4
  it("renders a non-empty accessible name per entry that conveys the category label", () => {
    render(
      <MantineProvider>
        <CategoryLegend />
      </MantineProvider>,
    );
    const legend = screen.getByRole("group", {
      name: "Element category legend",
    });
    const names = (Array.from(legend.children) as HTMLElement[]).map((e) =>
      e.getAttribute("aria-label"),
    );

    // Every real-data entry has a non-empty name equal to its label.
    expect(names).toHaveLength(CATEGORY_KEYS.length);
    for (const name of names) {
      expect(name).toBeTruthy();
    }
    const expected = CATEGORY_KEYS.map(label);
    expect(names).toEqual(expected);
  });
});

// --- Structural / geometry tests (task 5.1) --------------------------------
// These render the FULL PeriodicTable so the legend sits in the real grid, and
// verify the facts jsdom can't measure as pixels: the legend is a descendant of
// the transformed grid (so it inherits --fit-scale) and it exposes the expected
// accessible name. ResizeObserver/matchMedia come from src/test-setup.ts.
describe("CategoryLegend in-grid structure and geometry", () => {
  // Validates: Requirements 1.1, 1.4, 1.6, 2.1, 2.2, 2.3, 4.1, 4.4, 5.3

  function renderTable() {
    return render(
      <MantineProvider>
        <PeriodicTable />
      </MantineProvider>,
    );
  }

  it("renders the legend as a descendant of the transformed grid (the --fit-scale element)", () => {
    const { container } = renderTable();

    // The grid is the element carrying the --fit-scale custom property (set by
    // useFitScale and applied as a transform). The legend living inside it is
    // what makes the legend inherit the fit scale for free (Req 2.1).
    const grid = container.querySelector<HTMLElement>("[style*='--fit-scale']");
    expect(grid).not.toBeNull();

    const legend = screen.getByRole("group", {
      name: "Element category legend",
    });
    expect(grid!.contains(legend)).toBe(true);
    // And it really is a descendant, not the grid itself.
    expect(legend).not.toBe(grid);
  });

  it("exposes the accessible name 'Element category legend'", () => {
    renderTable();
    expect(
      screen.getByRole("group", { name: "Element category legend" }),
    ).toBeInTheDocument();
  });
});

// --- Empty-region dataset assertion (task 5.3) -----------------------------
// The legend is placed at grid-column 3 / span 10 (columns 3..12) and
// grid-row 1 / span 3 (rows 1..3). This proves that region of the dataset is
// genuinely empty, so the legend displaces no element cell.
describe("CategoryLegend empty-region dataset", () => {
  // Validates: Requirements 1.4, 1.5, 2.2
  it("has no element occupying the legend's grid region (columns 3-12, rows 1-3)", () => {
    const occupants = ELEMENTS.filter(
      (e) => e.xpos >= 3 && e.xpos <= 12 && e.ypos >= 1 && e.ypos <= 3,
    );
    expect(occupants).toHaveLength(0);
  });
});
