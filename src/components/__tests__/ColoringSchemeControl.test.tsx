// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for ColoringSchemeControl against a stateful harness, the
// same shape AppLayout uses. Expected labels are read from the en ui.json so
// the assertions track the localized strings, not hardcoded copy.

import { useState } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import "../../i18n";
import { ColoringSchemeControl } from "../ColoringSchemeControl";
import {
  COLORING_SCHEME_OPTIONS,
  type ColoringSchemeOption,
} from "../../lib/coloringScheme";
import enUi from "../../locales/en/ui.json";

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

const radioByValue = (value: string) =>
  screen.getByDisplayValue(value) as HTMLInputElement;

describe("ColoringSchemeControl", () => {
  it("renders exactly the four options with localized labels, in order (Req 1.1, 7.1)", () => {
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios.map((r) => r.value)).toEqual([...COLORING_SCHEME_OPTIONS]);
    for (const option of COLORING_SCHEME_OPTIONS) {
      expect(
        screen.getByRole("radio", { name: enUi.coloringScheme[option] }),
      ).toBeInTheDocument();
    }
  });

  it("exposes an accessible name from the locale (Req 1.6, 7.1)", () => {
    render(<Harness />);
    expect(
      screen.getByRole("radiogroup", { name: enUi.coloringScheme.label }),
    ).toBeInTheDocument();
  });

  it("reflects the value prop as the selected option (Req 1.4)", () => {
    render(<Harness initial="phase" />);
    expect(radioByValue("phase").checked).toBe(true);
    expect(radioByValue("category").checked).toBe(false);
  });

  it("calls onChange with the normalized option when another is selected (Req 1.4)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(
      screen.getByRole("radio", { name: enUi.coloringScheme["boiling-point"] }),
    );
    expect(radioByValue("boiling-point").checked).toBe(true);
  });
});
