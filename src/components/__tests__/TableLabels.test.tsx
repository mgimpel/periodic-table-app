// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// TableLabels renders the group, period and series labels as grid items. Pins a
// few known placements and checks that no label lands on an element's cell.

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TableLabels } from "../TableLabels";
import { ELEMENTS } from "../../data/elements";

afterEach(cleanup);

const placement = (el: HTMLElement) => [el.style.gridColumnStart, el.style.gridRowStart];

describe("TableLabels", () => {
  it("places group, period and series labels in their grid cells", () => {
    render(<TableLabels />);
    expect(placement(screen.getByText("I A"))).toEqual(["2", "1"]);
    expect(placement(screen.getByText("III B"))).toEqual(["4", "4"]);
    expect(placement(screen.getByText("VIII A"))).toEqual(["19", "1"]);
    expect(placement(screen.getByText("1"))).toEqual(["1", "2"]);
    expect(placement(screen.getByText("7"))).toEqual(["1", "8"]);
    expect(placement(screen.getByText("57-71"))).toEqual(["4", "7"]);
    expect(placement(screen.getByText("89-103"))).toEqual(["4", "8"]);
  });

  it("never overlaps an element cell", () => {
    const { container } = render(<TableLabels />);
    // Element cells sit at (xpos + 1, ypos + 1), as ElementCell places them.
    const elementCells = new Set(ELEMENTS.map((e) => `${e.xpos + 1},${e.ypos + 1}`));
    const labels = [...container.querySelectorAll<HTMLElement>("span")];
    expect(labels).toHaveLength(18 + 7 + 2);
    for (const label of labels) {
      expect(elementCells.has(placement(label).join(",")), label.textContent ?? "").toBe(false);
    }
  });
});
