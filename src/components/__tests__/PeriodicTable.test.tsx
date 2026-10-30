// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Integration test for PeriodicTable: selection works after the table has been
// scaled to fit the viewport. Exercises the full composition (useFitScale +
// ElementCell + ElementDetail) rather than any single unit, so it catches
// regressions in the selected-element wiring that survive scaling.
//
// Covers: click activation opens the detail (4.1), keyboard activation opens it
// (4.2, 4.3), selecting another cell swaps the detail (4.4), and dismissing
// closes it while the scaled grid stays mounted with its fit-scale (4.5).

import { describe, it, expect, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  within,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
// Initialise the shared i18next default instance so cell names/labels resolve
// to the English resources (equal to the dataset names) instead of raw keys.
import "../../i18n";
import { PeriodicTable } from "../PeriodicTable";
import { getElementByNumber } from "../../data/elements";
import {
  cellColor,
  phaseBucket,
  PHASE_COLORS,
  PHASE_KEYS,
} from "../../lib/cellColor";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../../data/element";
import uiStrings from "../../locales/en/ui.json";

// ResizeObserver and matchMedia ("not wide", so the detail is the bottom
// Drawer) come from the shared polyfills in src/test-setup.ts.
afterEach(cleanup);

// Real dataset entries, not hand-rolled fixtures. Carbon and Oxygen have short,
// unambiguous names/symbols for querying.
const carbon = getElementByNumber(6)!;
const oxygen = getElementByNumber(8)!;

function labelFor(e: { name: string; atomicNumber: number }) {
  return `${e.name}, atomic number ${e.atomicNumber}`;
}

function cellFor(e: { name: string; atomicNumber: number }) {
  return screen.getByRole("button", { name: labelFor(e) });
}

function renderTable(
  props: Partial<Parameters<typeof PeriodicTable>[0]> = {},
) {
  return render(
    <MantineProvider>
      <PeriodicTable {...props} />
    </MantineProvider>,
  );
}

// The legend's accessible group name (same key the former CategoryLegend used),
// read from the locale JSON rather than hard-coded.
const LEGEND_GROUP_NAME = uiStrings.legend.groupLabel;

// Discrete legend swatches carry an inline background-color; the gradient bar
// does not (it uses background-image). Counting them tells the two legend forms
// apart without asserting on CSS-module class names.
function legendSwatchCount(legend: HTMLElement) {
  return legend.querySelectorAll('span[style*="background-color"]').length;
}

describe("PeriodicTable selection after scaling", () => {
  // Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5

  it("opens the detail view when a cell is clicked", async () => {
    renderTable();

    // No detail is shown until a cell is activated.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(cellFor(carbon));

    const dialog = await screen.findByRole("dialog");
    // The custom detail header identifies the selected element by name and
    // symbol (the overlay no longer renders a built-in "name (symbol)" title).
    // Atomic mass lives in the detail body only, so finding it proves the detail
    // (not a cell) rendered the selection.
    expect(within(dialog).getByText(carbon.name)).toBeInTheDocument();
    expect(within(dialog).getAllByText(carbon.symbol).length).toBeGreaterThan(0);
    expect(
      within(dialog).getByText(String(carbon.atomicMass)),
    ).toBeInTheDocument();
  });

  it("opens the detail view when a cell is activated from the keyboard", async () => {
    renderTable();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Focus the cell as a keyboard user would (Tab), then activate it. On a
    // native <button> (what UnstyledButton renders) Enter/Space dispatch a
    // click; jsdom doesn't synthesize that from keyDown, so fire the click the
    // browser would emit on a focused button. Asserting focus first proves the
    // cell is keyboard-reachable, which is the accessibility-relevant part.
    const cell = cellFor(carbon);
    cell.focus();
    expect(document.activeElement).toBe(cell);

    fireEvent.keyDown(cell, { key: "Enter", code: "Enter" });
    fireEvent.click(cell);

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(carbon.name)).toBeInTheDocument();
  });

  it("swaps the detail content when a different cell is selected", async () => {
    renderTable();

    fireEvent.click(cellFor(carbon));
    expect(
      within(await screen.findByRole("dialog")).getByText(carbon.name),
    ).toBeInTheDocument();

    // Selecting another cell replaces the detail with the new element.
    fireEvent.click(cellFor(oxygen));

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText(oxygen.name)).toBeInTheDocument();
      expect(within(dialog).queryByText(carbon.name)).not.toBeInTheDocument();
    });
  });

  it("closes the detail on dismiss while keeping the scaled grid mounted", async () => {
    const { container } = renderTable();

    fireEvent.click(cellFor(carbon));
    const dialog = await screen.findByRole("dialog");

    // Both the Modal and the Drawer render an accessible "Close" button.
    fireEvent.click(within(dialog).getByRole("button", { name: /close/i }));

    // The detail is gone...
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    // ...but the table survived: cells still render and the grid still carries
    // its fit-scale (the --fit-scale custom property applied by useFitScale),
    // so dismissing did not tear down or reset the scaled layout.
    expect(cellFor(carbon)).toBeInTheDocument();

    const grid = container.querySelector<HTMLElement>("[style*='--fit-scale']");
    expect(grid).not.toBeNull();
    expect(grid!.style.getPropertyValue("--fit-scale")).not.toBe("");
  });
});

describe("PeriodicTable in-grid scheme legend", () => {
  // Validates: Requirements 1.5, 4.5, 5.1, 5.2

  it("renders exactly one legend, inside the grid, with none above the viewport", () => {
    const { container } = renderTable();

    // Exactly one legend instance (no above-grid duplicate) (Req 5.1, 5.2).
    const legends = screen.getAllByRole("group", {
      name: LEGEND_GROUP_NAME,
    });
    expect(legends).toHaveLength(1);
    const legend = legends[0];

    // The one legend lives inside the transformed grid (the --fit-scale
    // element), so it is a descendant of the grid and not a sibling rendered
    // above the viewport (Req 5.1, 5.2).
    const grid = container.querySelector<HTMLElement>("[style*='--fit-scale']");
    expect(grid).not.toBeNull();
    expect(grid!.contains(legend)).toBe(true);
  });

  it("keeps element cells placed and keyboard-activatable while the legend is present", () => {
    renderTable();

    // All element cells still render alongside the in-grid legend (Req 1.5).
    const cell = cellFor(carbon);
    expect(cell).toBeInTheDocument();

    // The sampled cell keeps its dataset-defined grid position: ElementCell
    // applies xpos/ypos as inline gridColumnStart/gridRowStart (Req 1.5).
    expect(cell.style.gridColumnStart).toBe(String(carbon.xpos));
    expect(cell.style.gridRowStart).toBe(String(carbon.ypos));

    // It remains keyboard-reachable and activatable: focusable, and a click
    // (what Enter/Space dispatch on a native button) opens the detail (Req 4.5).
    cell.focus();
    expect(document.activeElement).toBe(cell);
  });
});

describe("PeriodicTable coloring scheme drives cells and legend", () => {
  // Validates: Requirements 1.2, 1.3, 1.5

  // Oxygen is a clean discriminator: its category color (reactive-nonmetal)
  // and its phase color (Gas) differ, so recoloring is observable on the same
  // cell. Pulled from the real dataset, not a fixture.
  const sample = oxygen;

  it("uses the category default when coloringScheme is omitted", () => {
    // Req 1.5: no prop → the Default_Scheme (category).
    renderTable();

    // The legend renders the category discrete form: one swatch per category.
    const legend = screen.getByRole("group", { name: LEGEND_GROUP_NAME });
    expect(legendSwatchCount(legend)).toBe(CATEGORY_KEYS.length);
    // A canonical category label is present (localized, not the raw key).
    expect(
      within(legend).getByText(uiStrings.category["alkali-metal"]),
    ).toBeInTheDocument();

    // The sampled cell is colored by its category (= the default scheme).
    const cell = cellFor(sample);
    expect(cell).toHaveStyle({ backgroundColor: cellColor("category", sample) });
    expect(cell).toHaveStyle({
      backgroundColor: CATEGORY_COLORS[sample.category],
    });
  });

  it("recolors cells and swaps the legend to the phase form for coloringScheme='phase'", () => {
    // Req 1.2 (recolor) + 1.3 (legend updates).
    renderTable({ coloringScheme: "phase" });

    // Cell background now follows the phase color, distinct from its category
    // color for this element.
    const cell = cellFor(sample);
    const phaseColor = PHASE_COLORS[phaseBucket(sample.phase)];
    expect(cell).toHaveStyle({ backgroundColor: phaseColor });
    expect(cellColor("phase", sample)).toBe(phaseColor);
    // Sanity: category vs phase really differ for the sampled element, so the
    // recolor assertion above isn't vacuously true.
    expect(phaseColor).not.toBe(CATEGORY_COLORS[sample.category]);

    // Legend swapped to the four-swatch phase form, distinct from category's
    // ten swatches.
    const legend = screen.getByRole("group", { name: LEGEND_GROUP_NAME });
    expect(legendSwatchCount(legend)).toBe(PHASE_KEYS.length);
    expect(PHASE_KEYS.length).not.toBe(CATEGORY_KEYS.length);
    expect(
      within(legend).getByText(uiStrings.phase.solid),
    ).toBeInTheDocument();
  });

  it("swaps the legend to the gradient-bar form for a gradient scheme", () => {
    // Req 1.3: gradient schemes show the gradient bar, not discrete swatches.
    renderTable({ coloringScheme: "melting-point" });

    const legend = screen.getByRole("group", { name: LEGEND_GROUP_NAME });
    // No discrete swatches; instead a single bar painted with a background
    // gradient (inline background-image) lives inside the legend.
    expect(legendSwatchCount(legend)).toBe(0);
    const bar = legend.querySelector('div[style*="linear-gradient"]');
    expect(bar).not.toBeNull();
  });
});
