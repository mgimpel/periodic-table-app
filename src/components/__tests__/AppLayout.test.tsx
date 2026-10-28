// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component/integration tests for AppLayout: activating the Settings_Button
// opens the panel (3.1); re-activating never spawns a second panel (3.4);
// opening settings leaves PeriodicTable mounted and keeps a selected element
// (3.8); and a failed theme or language save surfaces the dismissable inline
// Alert while the choice still applies (5.4).
//
// The test-setup matchMedia polyfill defaults matches:false, so every
// useMediaQuery("(min-width: 48em)") is false and both SettingsPanel and
// ElementDetail render their mobile Drawer. `env="test"` disables Mantine
// transitions so open/close is synchronous and deterministic.

import { describe, it, expect, afterEach, vi } from "vitest";
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
// Initialise the shared i18next default instance so the header, save-error
// Alert, and cell labels resolve to the English resources instead of raw keys.
import i18n from "../../i18n";
import { AppLayout } from "../AppLayout";
import { createAppColorSchemeManager } from "../../lib/colorSchemeManager";
import { formatTemperature } from "../../lib/temperature";
import { getElementByNumber } from "../../data/elements";
import enUi from "../../locales/en/ui.json";

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  // Mantine's color-scheme state lives on <html> and in storage, and i18next is
  // a shared singleton; reset all three.
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-mantine-color-scheme");
  await i18n.changeLanguage("en");
});

function renderLayout() {
  return render(
    <MantineProvider
      env="test"
      defaultColorScheme="auto"
      colorSchemeManager={createAppColorSchemeManager()}
    >
      <AppLayout />
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

  // Both controls share one save-failure path: a throwing setItem keeps the
  // choice for the session and surfaces the dismissable inline Alert (5.4).
  // Options are located by their language-neutral value, and the Alert strings
  // via i18n.t, because the language case switches the UI to French.
  it("updates the open element detail live when the temperature unit changes", async () => {
    const user = userEvent.setup();
    const hydrogen = getElementByNumber(1)!;
    renderLayout();

    await user.click(hydrogenCell()!);
    const detail = await screen.findByRole("dialog");
    await user.click(
      within(detail).getByRole("tab", { name: enUi.detail.tab.physical }),
    );
    expect(
      within(detail).getByText(formatTemperature(hydrogen.melt, "kelvin")),
    ).toBeInTheDocument();

    act(() => settingsButton().click());
    await screen.findByText(enUi.settings.title);
    await user.click(screen.getByDisplayValue("celsius"));

    expect(
      within(detail).getByText(formatTemperature(hydrogen.melt, "celsius")),
    ).toBeInTheDocument();
    expect(
      within(detail).getByText(formatTemperature(hydrogen.boil, "celsius")),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("app-temperature-unit")).toBe("celsius");
  });

  it.each([
    ["theme", "dark"],
    ["language", "fr"],
    ["temperature", "celsius"],
  ])(
    "surfaces and dismisses the save-error Alert when the %s save fails (5.4)",
    async (kind, value) => {
      const user = userEvent.setup();
      vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
        throw new Error("blocked");
      });
      renderLayout();
      await user.click(settingsButton());
      await screen.findByRole("dialog");

      const option = () => screen.getByDisplayValue(value) as HTMLInputElement;
      await user.click(option());

      // The choice still applies for the session.
      expect(option().checked).toBe(true);
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(i18n.t(`ui:saveError.${kind}.title`));

      await user.click(
        within(alert).getByRole("button", { name: i18n.t("ui:common.dismiss") }),
      );
      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );
    },
  );
});
