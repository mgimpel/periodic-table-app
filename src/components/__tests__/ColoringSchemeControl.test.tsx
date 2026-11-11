// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for ColoringSchemeControl, now a compact Mantine Select used
// in the header. Expected labels are read from the en ui.json so the
// assertions track the localized strings, not hardcoded copy.

import { useState } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import "../../i18n";
import { ColoringSchemeControl } from "../ColoringSchemeControl";
import {
  COLORING_SCHEME_OPTIONS,
  type ColoringSchemeOption,
} from "../../lib/coloringScheme";
import enUi from "../../locales/ui.en.json";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function Harness({ initial }: { initial?: ColoringSchemeOption }) {
  const [scheme, setScheme] = useState<ColoringSchemeOption>(initial ?? "category");
  return (
    <MantineProvider env="test">
      <ColoringSchemeControl value={scheme} onChange={setScheme} />
    </MantineProvider>
  );
}

// The Select's input carries the aria-label and is the combobox trigger.
const select = () =>
  screen.getByRole("combobox", {
    name: enUi.coloringScheme.label,
  }) as HTMLInputElement;

describe("ColoringSchemeControl", () => {
  it("exposes an accessible name from the locale and shows the current value", () => {
    render(<Harness initial="phase" />);
    expect(select()).toBeInTheDocument();
    expect(select().value).toBe(enUi.coloringScheme.phase);
  });

  it("renders all eight options with localized labels when opened", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(COLORING_SCHEME_OPTIONS).toHaveLength(8);

    await user.click(select());
    const listbox = await screen.findByRole("listbox");
    for (const option of COLORING_SCHEME_OPTIONS) {
      expect(
        within(listbox).getByRole("option", {
          name: enUi.coloringScheme[option],
        }),
      ).toBeInTheDocument();
    }
  });

  it("calls onChange with the selected option (Req 1.4)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(select());
    const listbox = await screen.findByRole("listbox");
    await user.click(
      within(listbox).getByRole("option", {
        name: enUi.coloringScheme["boiling-point"],
      }),
    );
    expect(select().value).toBe(enUi.coloringScheme["boiling-point"]);
  });
});
