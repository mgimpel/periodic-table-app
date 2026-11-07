// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for SettingsPanel: it renders the three Theme_Options (4.1);
// the panel dismisses via Escape and via an overlay click (3.5-3.7); and
// keyboard focus returns to the trigger button once the panel closes (6.9).
//
// The test-setup matchMedia polyfill defaults matches:false, so
// useMediaQuery("(min-width: 48em)") is false and SettingsPanel renders the
// mobile Drawer. `env="test"` disables Mantine transitions so open/close is
// synchronous and deterministic.

import { useRef, useState } from "react";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
// Initialise the shared i18next default instance so the panel title, close
// label, and the theme/language controls resolve to the English resources.
import { I18nextProvider } from "react-i18next";
import i18n from "../../i18n";
import "../../i18n";
import { SettingsPanel } from "../SettingsPanel";
import { ThemeControl } from "../SettingsPanel";
import { LanguageControl } from "../SettingsPanel";
import { TemperatureControl } from "../SettingsPanel";
import enElements from "../../locales/en/elements.json";
import esElements from "../../locales/es/elements.json";
import deElements from "../../locales/de/elements.json";
import enUi from "../../locales/en/ui.json";
import esUi from "../../locales/es/ui.json";
import deUi from "../../locales/de/ui.json";
import { createAppColorSchemeManager } from "../../App";
import { ElementCell } from "../ElementCell";
import { ElementDetail } from "../ElementDetail";
import { getElementByNumber } from "../../data/elements";
import { LANGUAGE_OPTIONS } from "../../lib/language";
import { readStoredTemperature } from "../../lib/persistenceManager";

// The i18next instance is a shared singleton; reset storage and locale around
// every test so each starts from a known English baseline and no test leaks a
// non-English locale into a sibling (design review NIT 1).
beforeEach(async () => {
  window.localStorage.clear();
  await i18n.changeLanguage("en");
});

afterEach(async () => {
  cleanup();
  // Mantine's color-scheme state lives on <html> and in storage; reset both so
  // the "defaults to auto with nothing stored" assertion is honest per test.
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-mantine-color-scheme");
  await i18n.changeLanguage("en");
  vi.restoreAllMocks();
});

// --------------------------------------------------------
// Settings Panel
// --------------------------------------------------------

// Controlled harness: a real trigger button holds the returnFocusRef and owns
// the `opened` state, so onClose actually closes the panel and the focus-return
// assertion exercises the real dismiss path.
function Harness() {
  const [opened, setOpened] = useState(false);
  const [unit, setUnit] = useState<TemperatureOption>("kelvin");
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <MantineProvider env="test" defaultColorScheme="auto">
      <button ref={triggerRef} onClick={() => setOpened(true)}>
        Open settings
      </button>
      <SettingsPanel
        opened={opened}
        onClose={() => setOpened(false)}
        returnFocusRef={triggerRef}
        temperatureUnit={unit}
        onTemperatureUnitChange={setUnit}
      />
    </MantineProvider>
  );
}

const openPanel = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Open settings" }));
  // The dialog title confirms the panel is mounted and open.
  await screen.findByText("Settings");
};

describe("SettingsPanel", () => {
  // Validates: Requirements 3.5, 3.6, 3.7, 4.1, 6.9

  it("renders the three theme options when open (4.1)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openPanel(user);

    // The panel now also hosts the LanguageControl, so scope the theme-option
    // assertion to the Color theme radiogroup rather than the whole tree.
    const themeGroup = screen.getByRole("radiogroup", { name: "Color theme" });
    const radios = within(themeGroup).getAllByRole("radio") as HTMLInputElement[];
    expect(radios).toHaveLength(3);
    expect(
      within(themeGroup).getByRole("radio", { name: "Light" }),
    ).toBeInTheDocument();
    expect(
      within(themeGroup).getByRole("radio", { name: "Dark" }),
    ).toBeInTheDocument();
    expect(
      within(themeGroup).getByRole("radio", { name: "Same as device" }),
    ).toBeInTheDocument();
  });

  it("renders the temperature unit control with its three options", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await openPanel(user);

    const group = screen.getByRole("radiogroup", {
      name: enUi.temperature.label,
    });
    const radios = within(group).getAllByRole("radio") as HTMLInputElement[];
    expect(radios.map((r) => r.value)).toEqual([
      "kelvin",
      "celsius",
      "fahrenheit",
    ]);
    for (const label of [
      enUi.temperature.kelvin,
      enUi.temperature.celsius,
      enUi.temperature.fahrenheit,
    ]) {
      expect(within(group).getByRole("radio", { name: label })).toBeInTheDocument();
    }
  });

  it("closes and returns focus to the trigger when Escape is pressed (3.5, 3.7, 6.9)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Open settings" });
    await openPanel(user);

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByText("Settings")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("closes and returns focus to the trigger when the overlay is clicked (3.6, 6.9)", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Open settings" });
    await openPanel(user);

    // Mantine renders a clickable overlay element behind the panel; clicking it
    // outside the panel content dismisses the Drawer.
    const overlay = container.querySelector(
      ".mantine-Drawer-overlay, .mantine-Modal-overlay",
    );
    expect(overlay).not.toBeNull();
    await user.click(overlay as Element);

    await waitFor(() =>
      expect(screen.queryByText("Settings")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("closes and returns focus when the close button is activated (3.5, 6.9)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("button", { name: "Open settings" });
    await openPanel(user);

    // SettingsPanel keeps the overlay's built-in close button.
    expect(
      document.querySelector(".mantine-Modal-close, .mantine-Drawer-close"),
    ).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() =>
      expect(screen.queryByText("Settings")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });
});

// --------------------------------------------------------
// Theme Control
// --------------------------------------------------------

// Component tests for ThemeControl: the three theme options, the single
// selected-state (defaulting to "auto" with nothing stored), and that both
// pointer and keyboard selection drive Mantine's applied color scheme, which
// surfaces as the `data-mantine-color-scheme` attribute on <html>.

const THEME_STORAGE_KEY = "mantine-color-scheme-value";

// Mirrors the app's MantineProvider (defaultColorScheme="auto" + the app's
// manager). With nothing in storage, the control should reflect "auto".
function renderControl(onSaveError?: (error: unknown) => void) {
  return render(
    <MantineProvider
      defaultColorScheme="auto"
      colorSchemeManager={createAppColorSchemeManager()}
    >
      <ThemeControl onSaveError={onSaveError} />
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

  it("exposes an accessible name", () => {
    renderControl();
    expect(
      screen.getByRole("radiogroup", { name: "Color theme" }),
    ).toBeInTheDocument();
  });

  it("persists the selected theme", async () => {
    const user = userEvent.setup();
    renderControl();
    await user.click(radio("Dark"));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("falls back to Same as device for an invalid stored value", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "chartreuse");
    renderControl();
    expect(radio("Same as device").checked).toBe(true);
  });

  it("does not break selection and fires onSaveError when localStorage.setItem throws", async () => {
    const user = userEvent.setup();
    const onSaveError = vi.fn();
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderControl(onSaveError);

    await user.click(radio("Dark"));

    // Selection still applies for the session despite the failed persist.
    expect(radio("Dark").checked).toBe(true);
    await waitFor(() => expect(appliedScheme()).toBe("dark"));
    expect(onSaveError).toHaveBeenCalledTimes(1);
  });
});

describe("createAppColorSchemeManager", () => {
  it("get returns the validated stored value, ignoring the caller's default", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(createAppColorSchemeManager().get("light")).toBe("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "chartreuse");
    expect(createAppColorSchemeManager().get("light")).toBe("auto");
  });

  it("set does not write (ThemeControl persists via persistTheme)", () => {
    createAppColorSchemeManager().set("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });
});

// --------------------------------------------------------
// Language Control
// --------------------------------------------------------

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

const LANGUAGE_STORAGE_KEY = "app-language-option";

const hydrogen = getElementByNumber(1)!;

function renderLanguageControl(onSaveError?: (error: unknown) => void) {
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
function renderLanguageControlWithCell() {
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
    renderLanguageControl();

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
      expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(locale);
      await waitFor(() =>
        expect(screen.getByText(ui.settings.title)).toBeInTheDocument(),
      );
      expect(screen.getByText(elements.name["1"])).toBeInTheDocument();
      expect(screen.getByText("H")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    },
  );

  it("exposes an accessible name", () => {
    renderLanguageControl();
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
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fr");

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
    renderLanguageControlWithCell();

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
    const { unmount } = renderLanguageControl();

    await selectLanguage(user, "fr");
    await waitFor(() => expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fr"));

    unmount();
    cleanup();

    renderLanguageControl();
    // Re-seeded from readStoredLanguage(): still French, not reset to System default.
    expect(currentOption()).toBe("fr");
  });

  it("selecting System default persists 'system'", async () => {
    const user = userEvent.setup();
    renderLanguageControl();

    await selectLanguage(user, "fr");
    await waitFor(() => expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("fr"));

    await selectLanguage(user, "system");
    await waitFor(() =>
      expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("system"),
    );
    expect(currentOption()).toBe("system");
  });

  it("falls back to System default for an invalid stored value", () => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "klingon");
    renderLanguageControl();
    expect(currentOption()).toBe("system");
  });

  it("does not break selection and fires onSaveError when localStorage.setItem throws", async () => {
    const user = userEvent.setup();
    const onSaveError = vi.fn();
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    renderLanguageControl(onSaveError);
    await selectLanguage(user, "fr");

    // Selection still applies for the session despite the failed persist.
    await waitFor(() => expect(i18n.language).toBe("fr"));
    expect(currentOption()).toBe("fr");
    expect(onSaveError).toHaveBeenCalledTimes(1);
  });
});

// --------------------------------------------------------
// Temperature Control
// --------------------------------------------------------

// Component tests for TemperatureControl against real localStorage, through a
// stateful harness seeded from readStoredTemperature (as AppLayout does).

const TEMPERATURE_STORAGE_KEY = "app-temperature-unit";

function TemperatureHarness({ onSaveError }: { onSaveError?: (e: unknown) => void }) {
  const [unit, setUnit] = useState<TemperatureOption>(readStoredTemperature);
  return (
    <MantineProvider env="test">
      <TemperatureControl value={unit} onChange={setUnit} onSaveError={onSaveError} />
    </MantineProvider>
  );
}

const radioByValue = (value: string) =>
  screen.getByDisplayValue(value) as HTMLInputElement;

describe("TemperatureControl", () => {
  it("renders Kelvin / Celsius / Fahrenheit in order, defaulting to Kelvin", () => {
    render(<TemperatureHarness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios.map((r) => r.value)).toEqual(["kelvin", "celsius", "fahrenheit"]);
    expect(screen.getByRole("radio", { name: enUi.temperature.kelvin })).toBeChecked();
    expect(screen.getByRole("radio", { name: enUi.temperature.celsius })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: enUi.temperature.fahrenheit })).toBeInTheDocument();
  });

  it("exposes an accessible name", () => {
    render(<TemperatureHarness />);
    expect(
      screen.getByRole("radiogroup", { name: enUi.temperature.label }),
    ).toBeInTheDocument();
  });

  it("applies and persists a clicked choice", async () => {
    const user = userEvent.setup();
    render(<TemperatureHarness />);
    await user.click(screen.getByRole("radio", { name: enUi.temperature.celsius }));
    expect(radioByValue("celsius").checked).toBe(true);
    expect(window.localStorage.getItem(TEMPERATURE_STORAGE_KEY)).toBe("celsius");
  });

  it("supports keyboard (arrow) selection", async () => {
    const user = userEvent.setup();
    render(<TemperatureHarness />);
    radioByValue("kelvin").focus();
    await user.keyboard("{ArrowRight}");
    expect(radioByValue("celsius").checked).toBe(true);
    await waitFor(() =>
      expect(window.localStorage.getItem(TEMPERATURE_STORAGE_KEY)).toBe("celsius"),
    );
  });

  it("seeds from a valid stored value", () => {
    window.localStorage.setItem(TEMPERATURE_STORAGE_KEY, "fahrenheit");
    render(<TemperatureHarness />);
    expect(radioByValue("fahrenheit").checked).toBe(true);
  });

  it("falls back to Kelvin for an invalid stored value", () => {
    window.localStorage.setItem(TEMPERATURE_STORAGE_KEY, "rankine");
    render(<TemperatureHarness />);
    expect(radioByValue("kelvin").checked).toBe(true);
  });

  it("keeps the choice and fires onSaveError when localStorage.setItem throws", async () => {
    const user = userEvent.setup();
    const onSaveError = vi.fn();
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<TemperatureHarness onSaveError={onSaveError} />);
    await user.click(radioByValue("fahrenheit"));
    expect(radioByValue("fahrenheit").checked).toBe(true);
    expect(onSaveError).toHaveBeenCalledTimes(1);
  });
});
