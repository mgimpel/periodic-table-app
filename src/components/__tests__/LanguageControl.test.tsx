// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component + integration tests for LanguageControl. These run against the real
// bootstrapped i18next instance (src/i18n.ts) wrapped in I18nextProvider, so a
// language change exercises react-i18next's live re-render across the whole tree
// — the control, a visible chrome string, and a rendered element name — rather
// than being asserted by assumption.
//
// LanguageControl is a Mantine Select (dropdown): the combobox input shows the
// current localized label; opening it reveals a listbox whose options carry a
// language-neutral `value` attribute (system|en|fr|es|de) and a translated
// label. Because selecting a non-English option flips the whole app (including
// the control's own aria-label and the visible labels) to that locale, the
// helpers locate the combobox and its options by language-neutral means — the
// combobox is the sole one on screen, the current option by the Select's hidden
// input value, and each option by its `value` attribute — so assertions survive
// the live switch. This mirrors the old SegmentedControl test, which located
// radios by `value` for the same reason.

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import { LanguageControl } from "../LanguageControl";
import { SettingsPanel } from "../SettingsPanel";
import { ElementCell } from "../ElementCell";
import { ElementDetail } from "../ElementDetail";
import { getElementByNumber } from "../../data/elements";
import { LANGUAGE_OPTIONS } from "../../lib/language";
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
// non-English locale into a sibling (design review NIT 1).
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

function renderControl(onSaveError?: (error: unknown) => void) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MantineProvider env="test">
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
      <MantineProvider env="test">
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

// The sole combobox on screen, located without a name so the lookup survives a
// live locale flip of the aria-label.
const select = () => screen.getByRole("combobox") as HTMLInputElement;

// The current LanguageOption, read from the Select's language-neutral hidden
// input rather than the translated visible value.
const currentOption = () =>
  (document.querySelector('input[type="hidden"]') as HTMLInputElement).value;

// Open the dropdown and click the option whose language-neutral `value`
// attribute matches, so the click target is stable across locales.
const selectLanguage = async (
  user: ReturnType<typeof userEvent.setup>,
  value: LanguageOption,
) => {
  await user.click(select());
  const listbox = await screen.findByRole("listbox");
  const option = listbox.querySelector(
    `[role="option"][value="${value}"]`,
  ) as HTMLElement;
  await user.click(option);
};

type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];

describe("LanguageControl", () => {
  it("renders System default then every locale in order, defaulting to System default", async () => {
    const user = userEvent.setup();
    renderControl();

    // Current value shows System default by default.
    expect(currentOption()).toBe("system");
    expect(select().value).toBe(enUi.language.system);

    await user.click(select());
    const listbox = await screen.findByRole("listbox");
    const options = Array.from(
      listbox.querySelectorAll('[role="option"]'),
    ) as HTMLElement[];
    // Order matters: System default first, then the registered locales.
    expect(options.map((o) => o.getAttribute("value"))).toEqual([
      ...LANGUAGE_OPTIONS,
    ]);
    // Labels are the translated strings (English baseline here).
    expect(options.map((o) => o.textContent)).toEqual(
      LANGUAGE_OPTIONS.map((v) => enUi.language[v]),
    );
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
          <MantineProvider env="test">
            <SettingsPanel
              opened
              onClose={noop}
              returnFocusRef={settingsRef}
              temperatureUnit="kelvin"
              onTemperatureUnitChange={noop}
            />
            <ElementCell
              element={hydrogen}
              onSelect={vi.fn()}
              color="rgb(1, 2, 3)"
            />
          </MantineProvider>
        </I18nextProvider>,
      );

      await selectLanguage(user, locale);

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

  it("exposes an accessible name", () => {
    renderControl();
    // From the English baseline the combobox carries the localized label.
    expect(
      screen.getByRole("combobox", { name: enUi.language.label }),
    ).toBeInTheDocument();
  });

  it("selecting French flips a chrome string and an element name live, keeping symbol and number", async () => {
    const user = userEvent.setup();
    const noop = vi.fn();
    const settingsRef = { current: null } as React.RefObject<HTMLButtonElement | null>;
    // SettingsPanel already hosts a LanguageControl; drive the switch through it
    // (no extra standalone control) so there is a single language Select to open.
    render(
      <I18nextProvider i18n={i18n}>
        <MantineProvider env="test">
          <SettingsPanel
            opened
            onClose={noop}
            returnFocusRef={settingsRef}
            temperatureUnit="kelvin"
            onTemperatureUnitChange={noop}
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

    await selectLanguage(user, "fr");

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
    await selectLanguage(user, "fr");
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
        <MantineProvider env="test">
          <LanguageControl />
          <ElementDetail element={hydrogen} onClose={vi.fn()} />
        </MantineProvider>
      </I18nextProvider>,
    );

    // The English summary from the dataset is shown up front (Description tab is
    // rendered in the panel; the summary Text is always present).
    expect(screen.getByText(enElements.summary["1"])).toBeInTheDocument();

    await selectLanguage(user, "fr");
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

    await selectLanguage(user, "fr");
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toBe("fr"));

    unmount();
    cleanup();

    renderControl();
    // Re-seeded from readStoredLanguage(): still French, not reset to System default.
    expect(currentOption()).toBe("fr");
  });

  it("selecting System default persists 'system'", async () => {
    const user = userEvent.setup();
    renderControl();

    await selectLanguage(user, "fr");
    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toBe("fr"));

    await selectLanguage(user, "system");
    await waitFor(() =>
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("system"),
    );
    expect(currentOption()).toBe("system");
  });

  it("falls back to System default for an invalid stored value", () => {
    window.localStorage.setItem(STORAGE_KEY, "klingon");
    renderControl();
    expect(currentOption()).toBe("system");
  });

  it("does not break selection and fires onSaveError when localStorage.setItem throws", async () => {
    const user = userEvent.setup();
    const onSaveError = vi.fn();
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    renderControl(onSaveError);
    await selectLanguage(user, "fr");

    // Selection still applies for the session despite the failed persist.
    await waitFor(() => expect(i18n.language).toBe("fr"));
    expect(currentOption()).toBe("fr");
    expect(onSaveError).toHaveBeenCalledTimes(1);
  });
});