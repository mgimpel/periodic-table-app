// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component + integration tests for LanguageControl. These run against the real
// bootstrapped i18next instance (src/i18n.ts) wrapped in I18nextProvider, so a
// language change exercises react-i18next's live re-render across the whole tree
// — the control, a visible chrome string, and a rendered element name — rather
// than being asserted by assumption.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import { LanguageControl } from "../LanguageControl";
import { SettingsPanel } from "../SettingsPanel";
import { ElementCell } from "../ElementCell";
import { ElementDetail } from "../ElementDetail";
import { getElementByNumber } from "../../data/elements";
import enElements from "../../locales/en/elements.json";
import enUi from "../../locales/en/ui.json";
import esUi from "../../locales/es/ui.json";
import esElements from "../../locales/es/elements.json";
import deUi from "../../locales/de/ui.json";
import deElements from "../../locales/de/elements.json";

const STORAGE_KEY = "app-language-option";

const hydrogen = getElementByNumber(1)!;

// The i18next instance is a shared singleton; reset storage and locale around
// every test so each starts from a known English baseline and no test leaks a
// French locale into a sibling (design review NIT 1).
beforeEach(async () => {
  window.localStorage.clear();
  await i18n.changeLanguage("en");
});

afterEach(async () => {
  cleanup();
  window.localStorage.clear();
  await i18n.changeLanguage("en");
  vi.restoreAllMocks();
});

// Locate a SegmentedControl option by its language-neutral `value` attribute
// (system|en|fr|es|de) rather than its translated label, so assertions survive a
// live language switch that changes the visible radio labels.
const radioByValue = (value: string) =>
  screen.getByDisplayValue(value) as HTMLInputElement;

function renderControl(onSaveError?: (error: unknown) => void) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MantineProvider>
        <LanguageControl onSaveError={onSaveError} />
      </MantineProvider>
    </I18nextProvider>,
  );
}

// Renders the control alongside a real ElementCell so the element-name flip has
// a concrete subject in the same re-render tree.
function renderControlWithCell() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MantineProvider>
        <LanguageControl />
        <ElementCell
          element={hydrogen}
          onSelect={vi.fn()}
          color="rgb(1, 2, 3)"
        />
      </MantineProvider>
    </I18nextProvider>,
  );
}

const radio = (label: string) =>
  screen.getByRole("radio", { name: label }) as HTMLInputElement;

describe("LanguageControl", () => {
  it("renders System default then every locale in order, one selected, defaulting to System default", () => {
    renderControl();

    const values = ["system", "en", "fr", "es", "de"] as const;
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(values.length);
    // Order matters: System default first, then the registered locales.
    expect(radios.map((r) => r.getAttribute("value") ?? "")).toEqual([...values]);
    for (const v of values) {
      expect(radio(enUi.language[v])).toBeInTheDocument();
    }

    const checked = radios.filter((r) => r.checked);
    expect(checked).toHaveLength(1);
    expect(radio(enUi.language.system).checked).toBe(true);
  });

  it.each([
    ["es", esUi, esElements],
    ["de", deUi, deElements],
  ] as const)(
    "selecting %s flips a chrome string and an element name live, keeping symbol and number",
    async (locale, ui, elements) => {
      const user = userEvent.setup();
      const noop = vi.fn();
      const settingsRef = { current: null } as React.RefObject<HTMLButtonElement | null>;
      render(
        <I18nextProvider i18n={i18n}>
          <MantineProvider>
            <SettingsPanel
              opened
              onClose={noop}
              returnFocusRef={settingsRef}
              temperatureUnit="kelvin"
              onTemperatureUnitChange={noop}
              coloringScheme="category"
              onColoringSchemeChange={noop}
            />
            <ElementCell
              element={hydrogen}
              onSelect={vi.fn()}
              color="rgb(1, 2, 3)"
            />
          </MantineProvider>
        </I18nextProvider>,
      );

      await user.click(radioByValue(locale));

      await waitFor(() => expect(i18n.language).toBe(locale));
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe(locale);
      await waitFor(() =>
        expect(screen.getByText(ui.settings.title)).toBeInTheDocument(),
      );
      expect(screen.getByText(elements.name["1"])).toBeInTheDocument();
      expect(screen.getByText("H")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    },
  );

  it("supports vertical keyboard (ArrowDown) selection", async () => {
    const user = userEvent.setup();
    renderControl();

    radioByValue("fr").focus();
    await user.keyboard("{ArrowDown}");

    expect(radioByValue("es").checked).toBe(true);
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toBe("es"));
  });

  it("exposes an accessible name", () => {
    renderControl();
    // SegmentedControl renders a radiogroup carrying the aria-label.
    expect(
      screen.getByRole("radiogroup", { name: "Language" }),
    ).toBeInTheDocument();
  });

  it("selecting French flips a chrome string and an element name live, keeping symbol and number", async () => {
    const user = userEvent.setup();
    const noop = vi.fn();
    const settingsRef = { current: null } as React.RefObject<HTMLButtonElement | null>;
    // SettingsPanel already hosts a LanguageControl; drive the switch through it
    // (no extra standalone control) so there is a single fr radio to click.
    render(
      <I18nextProvider i18n={i18n}>
        <MantineProvider>
          <SettingsPanel
            opened
            onClose={noop}
            returnFocusRef={settingsRef}
            temperatureUnit="kelvin"
            onTemperatureUnitChange={noop}
            coloringScheme="category"
            onColoringSchemeChange={noop}
          />
          <ElementCell
            element={hydrogen}
            onSelect={vi.fn()}
            color="rgb(1, 2, 3)"
          />
        </MantineProvider>
      </I18nextProvider>,
    );

    // English baseline.
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Hydrogen")).toBeInTheDocument();
    expect(screen.getByText("H")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    await user.click(radioByValue("fr"));

    await waitFor(() => expect(i18n.language).toBe("fr"));
    // Persisted the LanguageOption (not the resolved locale).
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("fr");

    // Chrome string flipped.
    await waitFor(() =>
      expect(screen.getByText("Paramètres")).toBeInTheDocument(),
    );
    // Element name flipped, symbol + number unchanged.
    expect(screen.getByText("Hydrogène")).toBeInTheDocument();
    expect(screen.queryByText("Hydrogen")).not.toBeInTheDocument();
    expect(screen.getByText("H")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders the element-name flip on a cell without the panel", async () => {
    const user = userEvent.setup();
    renderControlWithCell();

    expect(screen.getByText("Hydrogen")).toBeInTheDocument();
    await user.click(radioByValue("fr"));
    await waitFor(() =>
      expect(screen.getByText("Hydrogène")).toBeInTheDocument(),
    );
    expect(screen.getByText("H")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("shows the English summary for an element with no French summary", async () => {
    const user = userEvent.setup();
    render(
      <I18nextProvider i18n={i18n}>
        <MantineProvider>
          <LanguageControl />
          <ElementDetail element={hydrogen} onClose={vi.fn()} />
        </MantineProvider>
      </I18nextProvider>,
    );

    // The English summary from the dataset is shown up front (Description tab is
    // rendered in the panel; the summary Text is always present).
    expect(screen.getByText(enElements.summary["1"])).toBeInTheDocument();

    await user.click(radioByValue("fr"));
    await waitFor(() => expect(i18n.language).toBe("fr"));

    // No French summary exists, so i18next falls back to the English string —
    // never blank, never the raw key.
    expect(screen.getByText(enElements.summary["1"])).toBeInTheDocument();
    expect(
      screen.queryByText(`elements:summary.${hydrogen.atomicNumber}`),
    ).not.toBeInTheDocument();
  });

  it("keeps French after unmount + remount (seeded from storage)", async () => {
    const user = userEvent.setup();
    const { unmount } = renderControl();

    await user.click(radioByValue("fr"));
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toBe("fr"));

    unmount();
    cleanup();

    renderControl();
    // Re-seeded from readStoredLanguage(): still French, not reset to System default.
    expect(radioByValue("fr").checked).toBe(true);
  });

  it("selecting System default persists 'system'", async () => {
    const user = userEvent.setup();
    renderControl();

    await user.click(radioByValue("fr"));
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toBe("fr"));

    await user.click(radioByValue("system"));
    await waitFor(() =>
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("system"),
    );
    expect(radioByValue("system").checked).toBe(true);
  });

  it("supports keyboard (arrow) selection", async () => {
    const user = userEvent.setup();
    renderControl();

    radioByValue("system").focus();
    await user.keyboard("{ArrowRight}");

    expect(radioByValue("en").checked).toBe(true);
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toBe("en"));
  });

  it("supports keyboard (Space) selection", async () => {
    const user = userEvent.setup();
    renderControl();

    radioByValue("fr").focus();
    await user.keyboard(" ");

    expect(radioByValue("fr").checked).toBe(true);
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toBe("fr"));
  });

  it("falls back to System default for an invalid stored value", () => {
    window.localStorage.setItem(STORAGE_KEY, "klingon");
    renderControl();
    expect(radioByValue("system").checked).toBe(true);
  });

  it("does not break selection and fires onSaveError when localStorage.setItem throws", async () => {
    const user = userEvent.setup();
    const onSaveError = vi.fn();
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    renderControl(onSaveError);
    await user.click(radioByValue("fr"));

    // Selection still applies for the session despite the failed persist.
    await waitFor(() => expect(i18n.language).toBe("fr"));
    expect(radioByValue("fr").checked).toBe(true);
    expect(onSaveError).toHaveBeenCalledTimes(1);
  });
});
