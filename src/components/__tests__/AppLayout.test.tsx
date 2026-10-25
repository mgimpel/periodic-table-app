// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component/integration tests for AppLayout: activating the Settings_Button
// opens the panel (3.1); re-activating never spawns a second panel (3.4);
// opening settings leaves PeriodicTable mounted and keeps a selected element
// (3.8); and firing the registered save-error handler surfaces the dismissable
// inline Alert (5.4).
//
// The test-setup matchMedia polyfill defaults matches:false, so every
// useMediaQuery("(min-width: 48em)") is false and both SettingsPanel and
// ElementDetail render their mobile Drawer. `env="test"` disables Mantine
// transitions so open/close is synchronous and deterministic.

import { describe, it, expect, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  act,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { AppLayout } from "../AppLayout";

afterEach(() => {
  cleanup();
  // Mantine's color-scheme state lives on <html> and in storage; reset both.
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-mantine-color-scheme");
});

function renderLayout(
  registerSaveErrorHandler?: (handler: () => void) => void,
) {
  return render(
    <MantineProvider env="test" defaultColorScheme="auto">
      <AppLayout registerSaveErrorHandler={registerSaveErrorHandler} />
    </MantineProvider>,
  );
}

const settingsButton = () =>
  screen.getByRole("button", { name: "Open settings" });

// A stable, always-present PeriodicTable cell: Hydrogen is atomic number 1.
const hydrogenCell = () =>
  screen.queryByRole("button", { name: "Hydrogen, atomic number 1" });

describe("AppLayout", () => {
  // Validates: Requirements 3.1, 3.4, 3.8, 5.4

  it("opens the settings panel when the Settings_Button is activated (3.1)", async () => {
    const user = userEvent.setup();
    renderLayout();

    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    await user.click(settingsButton());

    expect(await screen.findByText("Settings")).toBeInTheDocument();
  });

  it("never spawns a second panel when the button is re-activated (3.4)", async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.click(settingsButton());
    await screen.findByText("Settings");

    // A single `opened` boolean plus an idempotent open() means the panel is a
    // singleton: re-activating the trigger (via its onClick handler, since the
    // overlay now covers the button for a real pointer) must not add a second
    // instance. Exactly one dialog with exactly one "Settings" title proves it.
    act(() => settingsButton().click());

    expect(screen.getAllByText("Settings")).toHaveLength(1);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("keeps PeriodicTable mounted and the selected element when settings opens (3.8)", async () => {
    const user = userEvent.setup();
    renderLayout();

    // PeriodicTable is present before opening settings.
    expect(hydrogenCell()).toBeInTheDocument();

    // Select an element; its detail Drawer opens with the element name in the
    // custom header (the overlay no longer uses a built-in "name (symbol)" title).
    await user.click(hydrogenCell()!);
    const detail = await screen.findByRole("dialog");
    expect(within(detail).getByText("Hydrogen")).toBeInTheDocument();

    // Open settings. The detail Drawer renders behind SettingsPanel, so the
    // trigger is covered for a real pointer — invoke its handler directly.
    act(() => settingsButton().click());
    await screen.findByText("Settings");

    // PeriodicTable is still mounted and the element is still selected.
    expect(hydrogenCell()).toBeInTheDocument();
    expect(within(detail).getByText("Hydrogen")).toBeInTheDocument();
  });

  it("surfaces and dismisses the inline save-error Alert (5.4)", async () => {
    const user = userEvent.setup();
    let saveErrorHandler: (() => void) | undefined;
    renderLayout((handler) => {
      saveErrorHandler = handler;
    });

    // AppLayout registers its stable handler in a useEffect.
    expect(saveErrorHandler).toBeDefined();
    expect(
      screen.queryByText("Theme preference couldn't be saved"),
    ).not.toBeInTheDocument();

    // Firing the handler is a state update → wrap in act.
    act(() => saveErrorHandler!());
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Theme preference couldn't be saved");

    // The Alert is dismissable: its withCloseButton renders the close button
    // (accessible name "Dismiss" via closeButtonLabel) inside the alert region.
    const { getByRole } = within(alert);
    await user.click(getByRole("button", { name: "Dismiss" }));
    await waitFor(() =>
      expect(
        screen.queryByText("Theme preference couldn't be saved"),
      ).not.toBeInTheDocument(),
    );
  });
});
