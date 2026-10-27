// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for ThemeControl: the three theme options, the single
// selected-state (defaulting to "auto" with nothing stored), and that both
// pointer and keyboard selection drive Mantine's applied color scheme, which
// surfaces as the `data-mantine-color-scheme` attribute on <html>.

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
// Initialise the shared i18next default instance so useTranslation resolves
// against the English resources (which equal the former literals) rather than
// returning raw keys.
import "../../i18n";
import { ThemeControl } from "../ThemeControl";

afterEach(() => {
  cleanup();
  // Mantine's color-scheme state lives on <html> and in storage; reset both so
  // the "defaults to auto with nothing stored" assertion is honest per test.
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-mantine-color-scheme");
});

// defaultColorScheme="auto" mirrors the app's MantineProvider. With nothing in
// storage, the control should reflect "auto" (Same as device).
function renderControl() {
  return render(
    <MantineProvider defaultColorScheme="auto">
      <ThemeControl />
    </MantineProvider>,
  );
}

// Mantine SegmentedControl renders each option as a native radio input whose
// accessible name is the visible label; exactly one is checked at a time.
const radio = (label: string) =>
  screen.getByRole("radio", { name: label }) as HTMLInputElement;

const appliedScheme = () =>
  document.documentElement.getAttribute("data-mantine-color-scheme");

describe("ThemeControl", () => {
  // Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 6.5, 6.6

  it("renders exactly three options with exactly one selected, defaulting to auto", () => {
    renderControl();

    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(3);
    expect(screen.getByRole("radio", { name: "Light" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Dark" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Same as device" })).toBeInTheDocument();

    const checked = radios.filter((r) => r.checked);
    expect(checked).toHaveLength(1);
    expect(radio("Same as device").checked).toBe(true);
  });

  it("applies light mode when Light is selected via click", async () => {
    const user = userEvent.setup();
    renderControl();

    await user.click(radio("Light"));

    expect(radio("Light").checked).toBe(true);
    await waitFor(() => expect(appliedScheme()).toBe("light"));
  });

  it("applies dark mode when Dark is selected via click", async () => {
    const user = userEvent.setup();
    renderControl();

    await user.click(radio("Dark"));

    expect(radio("Dark").checked).toBe(true);
    await waitFor(() => expect(appliedScheme()).toBe("dark"));
  });

  it("selects an option via keyboard (focus + arrow) and applies it", async () => {
    const user = userEvent.setup();
    renderControl();

    // Focus the first option, then arrow-navigate to the next; native radio
    // group semantics move selection and fire change, which drives Mantine.
    radio("Light").focus();
    await user.keyboard("{ArrowRight}");

    expect(radio("Dark").checked).toBe(true);
    await waitFor(() => expect(appliedScheme()).toBe("dark"));
  });

  it("selects a focused option via keyboard (Space) and applies it", async () => {
    const user = userEvent.setup();
    renderControl();

    radio("Light").focus();
    await user.keyboard(" ");

    expect(radio("Light").checked).toBe(true);
    await waitFor(() => expect(appliedScheme()).toBe("light"));
  });
});
