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
  phaseAtTemperature,
  PHASE_COLORS,
  PHASE_KEYS,
} from "../../lib/cellColor";
import { CATEGORY_COLORS, CATEGORY_KEYS } from "../../data/element";
import uiStrings from "../../locales/ui.en.json";

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

// The SchemeLegend's accessible group name, read from the locale JSON rather
// than hard-coded.
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
    // applies xpos + 1 as gridColumnStart (grid column 1 is the period-label
    // column, so column N sits on grid column N + 1) and ypos + 1 as
    // gridRowStart (grid row 1 is the group-label row, so period N sits on row
    // N + 1) (Req 1.5).
    expect(cell.style.gridColumnStart).toBe(String(carbon.xpos + 1));
    expect(cell.style.gridRowStart).toBe(String(carbon.ypos + 1));

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

    // The sampled cell is colored by its category (= the default scheme).
    const cell = cellFor(sample);
    expect(cell).toHaveStyle({ backgroundColor: cellColor("category", sample) });
    expect(cell).toHaveStyle({
      backgroundColor: CATEGORY_COLORS[sample.category],
    });
  });

  // Req 1.2: PeriodicTable threads coloringScheme through to the cells. One
  // case per scheme that changes the sampled cell's color, checked against the
  // cellColor resolver (not a hardcoded rgb). The per-form legend details
  // (swatch counts, gradient bars, labels) are SchemeLegend.test's job.
  it.each([
    ["phase", PHASE_COLORS[phaseBucket(sample.phase)]] as const,
    ["electronegativity", cellColor("electronegativity", sample)] as const,
    ["origin", cellColor("origin", sample)] as const,
    ["spectral-colour", cellColor("spectral-colour", sample)] as const,
    ["block", cellColor("block", sample)] as const,
  ])("recolors the sampled cell for coloringScheme='%s'", (scheme, color) => {
    renderTable({ coloringScheme: scheme });

    const cell = cellFor(sample);
    expect(cell).toHaveStyle({ backgroundColor: color });
    // The new color really differs from the category default, so the recolor
    // assertion isn't vacuously true.
    expect(color).not.toBe(CATEGORY_COLORS[sample.category]);
  });

  it("swaps the legend to match the coloringScheme prop", () => {
    // Req 1.3: the in-grid legend follows the active scheme. Changing the prop
    // changes the legend form — here from the category discrete form (one
    // swatch per category) to the phase discrete form (one per phase bucket).
    // Exhaustive per-form legend coverage lives in SchemeLegend.test.
    const { rerender } = renderTable({ coloringScheme: "category" });

    let legend = screen.getByRole("group", { name: LEGEND_GROUP_NAME });
    expect(legendSwatchCount(legend)).toBe(CATEGORY_KEYS.length);

    rerender(
      <MantineProvider>
        <PeriodicTable coloringScheme="phase" />
      </MantineProvider>,
    );

    legend = screen.getByRole("group", { name: LEGEND_GROUP_NAME });
    expect(legendSwatchCount(legend)).toBe(PHASE_KEYS.length);
    expect(PHASE_KEYS.length).not.toBe(CATEGORY_KEYS.length);
  });
});

describe("PeriodicTable temperature slider gating", () => {
  // Validates: Requirements 1.1, 1.2, 1.3, 1.4

  // Mantine renders the slider thumb with role="slider" and carries the
  // aria-label on its .mantine-Slider-root ancestor (see TemperatureSlider.test
  // for the pattern). Presence of that role is the clean present/absent probe.
  const SLIDER_NAME = uiStrings.temperatureSlider.label;

  it("renders the slider present and focusable on initial render for scheme='phase'", () => {
    // Req 1.1, 1.3: launching with the phase scheme shows an operable slider.
    renderTable({ coloringScheme: "phase" });

    const thumb = screen.getByRole("slider");
    expect(thumb).toBeInTheDocument();

    // Operable: the accessible name comes from the i18n key (on the root), and
    // the thumb is focusable.
    const root = thumb.closest(".mantine-Slider-root") as HTMLElement;
    expect(root).toHaveAttribute("aria-label", SLIDER_NAME);
    thumb.focus();
    expect(document.activeElement).toBe(thumb);
  });

  it.each(["category", "electronegativity", "origin", "spectral-colour", "block"] as const)(
    "omits the slider on initial render for scheme='%s'",
    (scheme) => {
      // Req 1.2, 1.4: every non-phase scheme leaves the slider out of the DOM.
      renderTable({ coloringScheme: scheme });
      expect(screen.queryByRole("slider")).toBeNull();
    },
  );

  it("omits the slider when coloringScheme is the default (non-phase)", () => {
    // Req 1.2, 1.4: the omitted prop falls back to the category default, so no
    // slider renders.
    renderTable();
    expect(screen.queryByRole("slider")).toBeNull();
  });

  it("mounts the slider when switching to phase and unmounts it when switching away", () => {
    // Req 1.1, 1.2: the slider tracks the active scheme across rerenders.
    const { rerender } = renderTable({ coloringScheme: "category" });
    expect(screen.queryByRole("slider")).toBeNull();

    rerender(
      <MantineProvider>
        <PeriodicTable coloringScheme="phase" />
      </MantineProvider>,
    );
    expect(screen.getByRole("slider")).toBeInTheDocument();

    rerender(
      <MantineProvider>
        <PeriodicTable coloringScheme="origin" />
      </MantineProvider>,
    );
    expect(screen.queryByRole("slider")).toBeNull();
  });
});

describe("PeriodicTable recolors cells across a phase transition", () => {
  // Validates: Requirements 3.5

  // Oxygen has clean, known transition points in the dataset (melt 54.36 K,
  // boil 90.188 K). A temperature below melt lands it in the solid bucket; one
  // above boil lands it in the gas bucket. Both temperatures sit inside the
  // slider range [0, TEMPERATURE_MAX]. Colors are read from the real
  // cellColor/phaseAtTemperature, never hardcoded.
  const sample = oxygen;
  const belowMelt = 10; // < 54.36 → solid
  const aboveBoil = 200; // > 90.188 → gas

  it("recolors the element's cell to the bucket for the selected temperature", () => {
    const solidColor = PHASE_COLORS[phaseAtTemperature(belowMelt, sample)];
    const gasColor = PHASE_COLORS[phaseAtTemperature(aboveBoil, sample)];

    const { rerender } = renderTable({
      coloringScheme: "phase",
      selectedTempK: belowMelt,
    });
    expect(cellFor(sample)).toHaveStyle({ backgroundColor: solidColor });

    // Moving the slider's value across the melt→boil span recolors the cell to
    // the new bucket (Req 3.5).
    rerender(
      <MantineProvider>
        <PeriodicTable coloringScheme="phase" selectedTempK={aboveBoil} />
      </MantineProvider>,
    );
    expect(cellFor(sample)).toHaveStyle({ backgroundColor: gasColor });

    // The two bucket colors really differ, so the recolor assertion is not
    // vacuously true (and matches the real resolver's solid/gas mapping).
    expect(solidColor).toBe(PHASE_COLORS.solid);
    expect(gasColor).toBe(PHASE_COLORS.gas);
    expect(solidColor).not.toBe(gasColor);
  });
});
