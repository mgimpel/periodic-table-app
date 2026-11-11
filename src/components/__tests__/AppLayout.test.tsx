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
import { createAppColorSchemeManager } from "../../App";
import { formatTemperature } from "../../lib/temperature";
import { getElementByNumber } from "../../data/elements";
import { cellColor, PHASE_KEYS } from "../../lib/cellColor";
import { CATEGORY_COLORS } from "../../data/element";
import enUi from "../../locales/ui.en.json";
import frUi from "../../locales/ui.fr.json";

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

  // These controls share one save-failure path: a throwing setItem keeps the
  // choice for the session and surfaces the dismissable inline Alert (5.4).
  // Theme and temperature are SegmentedControls (hidden radios keyed by their
  // language-neutral value, so getByDisplayValue finds them); language is a
  // Select whose combobox shows the translated label, so it's driven by
  // opening the listbox and picking the option. The Alert strings are read via
  // i18n.t because the language case switches the UI to French.
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

      if (kind === "language") {
        // LanguageControl is a Select: open the combobox (named in English,
        // the current locale) and pick the option by its English label, then
        // confirm the combobox reflects the choice — which also switches the
        // UI to French, so the displayed label is now the French one.
        const key = value as keyof typeof enUi.language;
        const combobox = screen.getByRole("combobox", {
          name: enUi.language.label,
        }) as HTMLInputElement;
        await user.click(combobox);
        await user.click(
          within(await screen.findByRole("listbox")).getByRole("option", {
            name: enUi.language[key],
          }),
        );
        expect(combobox.value).toBe(frUi.language[key]);
      } else {
        // Theme and temperature are SegmentedControls: a hidden radio carries
        // the language-neutral value, so select it and confirm it's checked.
        const option = () =>
          screen.getByDisplayValue(value) as HTMLInputElement;
        await user.click(option());
        expect(option().checked).toBe(true);
      }

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

  // The coloring scheme is intentionally session-only: a value left in storage
  // from a prior session is ignored and startup always uses the default
  // (category) scheme. Oxygen (Gas) is a clean discriminator — its phase color
  // differs from its category color — so a category-colored startup is
  // observable on one cell even with "phase" seeded in storage.
  it("ignores any stored coloring scheme and starts from the category default", () => {
    const oxygen = getElementByNumber(8)!;
    expect(cellColor("phase", oxygen)).not.toBe(
      CATEGORY_COLORS[oxygen.category],
    );

    // Seed a non-default scheme the way an older build would have persisted it.
    window.localStorage.setItem("app-coloring-scheme", "phase");
    renderLayout();

    // The legend shows the ten category swatches (not the four phase ones),
    // proving the seeded value did not drive startup.
    const legend = screen.getByRole("group", {
      name: enUi.legend.groupLabel,
    });
    const swatches = legend.querySelectorAll('span[style*="background-color"]');
    expect(swatches).not.toHaveLength(PHASE_KEYS.length);

    // And a sampled cell is colored by its category, not the stored phase scheme.
    const oxygenCell = screen.getByRole("button", {
      name: "Oxygen, atomic number 8",
    });
    expect(oxygenCell).toHaveStyle({
      backgroundColor: CATEGORY_COLORS[oxygen.category],
    });
  });

  // Choosing a scheme in the header applies it for the session (the table
  // recolors and the legend swaps form). It is not persisted, so there is no
  // save step and no save-error path to exercise.
  it("applies the chosen coloring scheme for the session", async () => {
    const user = userEvent.setup();
    const oxygen = getElementByNumber(8)!;
    // Default (category) at startup; select Phase in the header dropdown.
    renderLayout();

    const oxygenCell = () =>
      screen.getByRole("button", { name: "Oxygen, atomic number 8" });
    expect(oxygenCell()).toHaveStyle({
      backgroundColor: cellColor("category", oxygen),
    });

    // The coloring-scheme dropdown lives in the header. Open it and pick Phase.
    const schemeSelect = screen.getByRole("combobox", {
      name: enUi.coloringScheme.label,
    }) as HTMLInputElement;
    await user.click(schemeSelect);
    await user.click(
      within(await screen.findByRole("listbox")).getByRole("option", {
        name: enUi.coloringScheme.phase,
      }),
    );

    // The cell recolors to the phase color and the legend swaps form.
    expect(schemeSelect.value).toBe(enUi.coloringScheme.phase);
    expect(oxygenCell()).toHaveStyle({
      backgroundColor: cellColor("phase", oxygen),
    });
    const legend = screen.getByRole("group", {
      name: enUi.legend.groupLabel,
    });
    expect(
      legend.querySelectorAll('span[style*="background-color"]'),
    ).toHaveLength(PHASE_KEYS.length);

    // Nothing was written to storage for the scheme.
    expect(window.localStorage.getItem("app-coloring-scheme")).toBeNull();
  });
});

// Integration coverage for the Selected_Temperature that AppLayout owns and
// threads down to PeriodicTable (the slider + legend) and the per-cell color.
// The slider is present only for the phase scheme, so every case first drives
// the header ColoringSchemeControl to "phase" the way the existing
// "applies the chosen coloring scheme" test does. The displayed temperature is
// read from the legend readout ("At <formatted>"), since it tracks
// selectedTempK regardless of the slider thumb's rounding.
describe("AppLayout — Selected_Temperature (phase scheme)", () => {
  // Validates: Requirements 1.5, 1.6, 5.4, 5.5, 7.1, 7.3, 7.4

  const schemeSelect = () =>
    screen.getByRole("combobox", {
      name: enUi.coloringScheme.label,
    }) as HTMLInputElement;

  // Pick a scheme from the header dropdown by its English option label.
  async function chooseScheme(user: ReturnType<typeof userEvent.setup>, label: string) {
    await user.click(schemeSelect());
    await user.click(
      within(await screen.findByRole("listbox")).getByRole("option", {
        name: label,
      }),
    );
  }

  const readout = () => enUi.temperatureSlider.legendReadout;
  // The legend readout text "At <formatted>" for a Kelvin value in a unit.
  const readoutText = (k: number, unit: Parameters<typeof formatTemperature>[1]) =>
    readout().replace("{{temp}}", formatTemperature(k, unit));

  it("defaults to 298.15 K and writes no temperature state to localStorage (7.1)", async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(window.localStorage.__proto__, "setItem");
    renderLayout();

    await chooseScheme(user, enUi.coloringScheme.phase);

    // The legend readout shows the session default, 298.15 K.
    expect(
      screen.getByText(readoutText(298.15, "kelvin")),
    ).toBeInTheDocument();

    // The default Selected_Temperature is session-only: no storage key is
    // written for it. There is deliberately no persistenceManager pair for the
    // slider, so no key mentioning the temperature/slider state should appear
    // (the persisted temperature *unit* key is untouched too, since settings
    // was never opened).
    const writtenKeys = setItem.mock.calls.map((call) => String(call[0]));
    expect(
      writtenKeys.filter((key) => /temp|slider/i.test(key)),
    ).toEqual([]);
  });

  it("restores the adjusted value after switching scheme away and back (1.5, 1.6, 7.3, 7.4)", async () => {
    const user = userEvent.setup();
    renderLayout();

    await chooseScheme(user, enUi.coloringScheme.phase);

    // Move the slider up a few steps via the keyboard and capture the value it
    // now reports through the legend readout (robust to the thumb's rounding).
    const thumb = screen.getByRole("slider");
    thumb.focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");

    // The readout prefix ("At ") is the literal part of the legendReadout
    // template; find the single paragraph that carries it and read its text.
    const prefix = readout().replace("{{temp}}", "");
    const readoutNode = () =>
      within(screen.getByRole("group", { name: enUi.legend.groupLabel })).getByText(
        (content) => content.startsWith(prefix),
      );
    const adjusted = readoutNode().textContent;
    // The value actually moved off the 298.15 K default.
    expect(adjusted).not.toBe(readoutText(298.15, "kelvin"));

    // Switch away from phase: the slider unmounts (retention is in AppLayout).
    await chooseScheme(user, enUi.coloringScheme.category);
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();

    // Switch back to phase: the retained Kelvin value is restored unchanged.
    await chooseScheme(user, enUi.coloringScheme.phase);
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(readoutNode().textContent).toBe(adjusted);
  });

  it("changes the displayed value but not cell buckets when the unit changes (5.4, 5.5)", async () => {
    const user = userEvent.setup();
    const oxygen = getElementByNumber(8)!;
    renderLayout();

    await chooseScheme(user, enUi.coloringScheme.phase);

    // Kelvin: the legend reads the default and Oxygen is colored by its phase
    // bucket at 298.15 K (gas) — the same color the pure resolver computes.
    expect(screen.getByText(readoutText(298.15, "kelvin"))).toBeInTheDocument();
    const oxygenCell = () =>
      screen.getByRole("button", { name: "Oxygen, atomic number 8" });
    const bucketColor = cellColor("phase", oxygen, 298.15);
    expect(oxygenCell()).toHaveStyle({ backgroundColor: bucketColor });

    // Switch the unit to Celsius in settings (a SegmentedControl radio).
    act(() => settingsButton().click());
    await screen.findByText(enUi.settings.title);
    await user.click(screen.getByDisplayValue("celsius"));

    // The displayed temperature follows the unit…
    expect(
      screen.getByText(readoutText(298.15, "celsius")),
    ).toBeInTheDocument();
    // …while the stored Kelvin — and so every cell's phase bucket color — is
    // unchanged (Req 5.5). Same color before and after the unit change.
    expect(oxygenCell()).toHaveStyle({ backgroundColor: bucketColor });
  });
});
