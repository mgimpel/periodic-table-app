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

// Register jest-dom matchers (toBeInTheDocument, ...) for vitest. There is no
// shared test setup file in this project, so each test file that uses these
// matchers pulls them in directly. No new dependency — jest-dom is already a
// devDependency.
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  within,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { PeriodicTable } from "./PeriodicTable";
import { getElementByNumber } from "../data/elements";

// --- Environment stubs -----------------------------------------------------
// jsdom has no ResizeObserver; useFitScale constructs one on mount and would
// throw without it. Minimal mock (same shape as the useFitScale unit test): we
// only need construction + observe/disconnect to be no-ops, because this test
// asserts on selection behavior, not on resize-driven recomputes.
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

// Mantine's ElementDetail calls useMediaQuery, which reads matchMedia. jsdom
// doesn't implement it. Stub it to a stable "not wide" result so the detail
// renders the bottom Drawer (the mobile-first default) deterministically. Both
// the Drawer and the Modal branch render the same title/body and a "Close"
// button, so the assertions below hold either way.
function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  stubMatchMedia(false);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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

function renderTable() {
  return render(
    <MantineProvider>
      <PeriodicTable />
    </MantineProvider>,
  );
}

describe("PeriodicTable selection after scaling", () => {
  // Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5

  it("opens the detail view when a cell is clicked", async () => {
    renderTable();

    // No detail is shown until a cell is activated.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(cellFor(carbon));

    const dialog = await screen.findByRole("dialog");
    // Dialog title + body identify the selected element. Atomic mass lives in
    // the detail body only, so finding it proves the detail (not a cell)
    // rendered the selection.
    expect(
      within(dialog).getByText(`${carbon.name} (${carbon.symbol})`),
    ).toBeInTheDocument();
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
    expect(
      within(dialog).getByText(`${carbon.name} (${carbon.symbol})`),
    ).toBeInTheDocument();
  });

  it("swaps the detail content when a different cell is selected", async () => {
    renderTable();

    fireEvent.click(cellFor(carbon));
    expect(
      within(await screen.findByRole("dialog")).getByText(
        `${carbon.name} (${carbon.symbol})`,
      ),
    ).toBeInTheDocument();

    // Selecting another cell replaces the detail with the new element.
    fireEvent.click(cellFor(oxygen));

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(
        within(dialog).getByText(`${oxygen.name} (${oxygen.symbol})`),
      ).toBeInTheDocument();
      expect(
        within(dialog).queryByText(`${carbon.name} (${carbon.symbol})`),
      ).not.toBeInTheDocument();
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
