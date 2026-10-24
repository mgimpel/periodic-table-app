// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Unit tests for ElementCell: full-content vs symbol-only rendering, with the
// key invariant that the accessible name is identical in both modes.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { ElementCell } from "./ElementCell";
import { getElementByNumber } from "../data/elements";

afterEach(cleanup);

// Carbon: short symbol/name and a plain atomic number, so assertions on the
// rendered text are unambiguous. Pulled from the real dataset rather than a
// hand-rolled fixture.
const carbon = getElementByNumber(6)!;
const expectedLabel = `${carbon.name}, atomic number ${carbon.atomicNumber}`;

// Mantine components (UnstyledButton/Text) read theme context from a provider.
function renderCell(props: Partial<Parameters<typeof ElementCell>[0]> = {}) {
  const onSelect = props.onSelect ?? vi.fn();
  render(
    <MantineProvider>
      <ElementCell element={carbon} onSelect={onSelect} symbolOnly={props.symbolOnly} />
    </MantineProvider>,
  );
  return { onSelect };
}

describe("ElementCell", () => {
  // Validates: Requirements 2.5, 2.6

  it("renders symbol, atomic number, and name in full mode", () => {
    renderCell();
    expect(screen.getByText(carbon.symbol)).toBeInTheDocument();
    expect(screen.getByText(String(carbon.atomicNumber))).toBeInTheDocument();
    expect(screen.getByText(carbon.name)).toBeInTheDocument();
  });

  it("renders only the symbol in symbol-only mode (omits number and name)", () => {
    renderCell({ symbolOnly: true });
    expect(screen.getByText(carbon.symbol)).toBeInTheDocument();
    expect(screen.queryByText(String(carbon.atomicNumber))).not.toBeInTheDocument();
    expect(screen.queryByText(carbon.name)).not.toBeInTheDocument();
  });

  it("keeps the aria-label identical across both modes", () => {
    renderCell();
    const full = screen.getByRole("button").getAttribute("aria-label");
    cleanup();

    renderCell({ symbolOnly: true });
    const symbolOnly = screen.getByRole("button").getAttribute("aria-label");

    expect(full).toBe(expectedLabel);
    expect(symbolOnly).toBe(expectedLabel);
    expect(full).toBe(symbolOnly);
  });

  it("fires onSelect with the element when clicked", () => {
    const { onSelect } = renderCell();
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(carbon);
  });
});
