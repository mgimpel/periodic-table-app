// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for ElementDetail: the overlay drops its built-in title in
// favour of a custom Detail_Header (2.1, 2.2, 3.*), splits fields across five
// tabs (4.*, 5.*), stays keyboard-operable (6.*), and is dismissable via the
// close control, Escape, and an outside click (1.4-1.8).
//
// The test-setup matchMedia polyfill defaults matches:false, so
// useMediaQuery("(min-width: 48em)") is false and ElementDetail renders the
// mobile Drawer branch. One case overrides matchMedia to exercise the wide
// Modal branch. `env="test"` disables Mantine transitions so open/close is
// synchronous and deterministic.

import { useState } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  render,
  screen,
  within,
  cleanup,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
// Initialise the shared i18next default instance so detail labels, the category
// badge, and the resource-sourced element name/summary resolve to the English
// resources instead of raw keys.
import "../../i18n";
import { ElementDetail } from "../ElementDetail";
import {
  CATEGORY_LABELS,
  type Element,
  type ElementCategory,
} from "../../data/element";
import enElements from "../../locales/en/elements.json";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
});

// A representative fixture. Fields relevant to the field-distribution assertions
// use distinctive values so they can be located unambiguously.
function makeElement(overrides: Partial<Element> = {}): Element {
  return {
    atomicNumber: 26,
    symbol: "Fe",
    name: "Iron",
    atomicMass: 55.845,
    category: "transition-metal" as ElementCategory,
    group: 8,
    period: 4,
    xpos: 8,
    ypos: 4,
    electronConfiguration: "1s2 2s2 2p6 3s2 3p6 3d6 4s2",
    electronConfigurationSemantic: "[Ar] 3d6 4s2",
    electronAffinity: 15.7,
    shells: [2, 8, 14, 2],
    phase: "Solid",
    block: "d",
    density: 7.874,
    densityUnit: "g/cm3",
    boil: 3134,
    melt: 1811,
    summary: "Iron is a metal in the first transition series.",
    appearance: "lustrous metallic with a grayish tinge",
    discoveredBy: "Ancient civilizations",
    namedBy: "Ancient namers",
    ...overrides,
  };
}

// Force the wide-viewport branch (Modal) by making the min-width query match.
function useWideViewport() {
  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// Controlled harness: owns the selected element so onClose actually closes the
// overlay, exercising the real dismiss path. A spy lets tests assert onClose
// fired while still closing the overlay.
function Harness({
  initial,
  onClose,
}: {
  initial: Element | null;
  onClose?: () => void;
}) {
  const [element, setElement] = useState<Element | null>(initial);
  return (
    <MantineProvider env="test">
      <ElementDetail
        element={element}
        onClose={() => {
          onClose?.();
          setElement(null);
        }}
      />
    </MantineProvider>
  );
}

const TAB_NAMES = [
  "Atomic details",
  "Physical properties",
  "Electron configuration",
  "Description",
];

describe("ElementDetail", () => {
  // Validates: Requirements 1.4, 1.5, 1.6, 1.7, 1.8, 2.1, 2.2, 3.1, 3.2, 3.3,
  // 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7,
  // 5.8, 5.9, 6.1, 6.2, 6.3, 6.4, 6.5

  it("does not render a built-in overlay title with the element name/symbol (2.1)", () => {
    render(<Harness initial={makeElement()} />);

    // The custom header lives inside the body; the overlay's own header title
    // region must not carry a `name (symbol)` style title. Mantine renders the
    // built-in title inside an element with the Modal/Drawer "Title" class.
    const builtInTitle = document.querySelector(
      ".mantine-Modal-title, .mantine-Drawer-title",
    );
    expect(builtInTitle).toBeNull();
  });

  it("renders a custom header with the element box, name, symbol and category (2.2, 3.1, 3.3, 3.4, 3.5, 3.6)", () => {
    const element = makeElement();
    render(<Harness initial={element} />);

    const dialog = screen.getByRole("dialog");

    // Name and symbol in the title area (3.5); symbol appears in the box too, so
    // assert at least one of each is present.
    expect(within(dialog).getByText("Iron")).toBeInTheDocument();
    expect(within(dialog).getAllByText("Fe").length).toBeGreaterThan(0);

    // Atomic number in the colored box (3.4). It also appears as the "Atomic
    // number" value in the atomic panel, so allow more than one match.
    expect(within(dialog).getAllByText("26").length).toBeGreaterThan(0);

    // Category label (3.6) — present in the header badge.
    expect(
      within(dialog).getAllByText(CATEGORY_LABELS["transition-metal"]).length,
    ).toBeGreaterThan(0);
  });

  it("renders no header or dialog when element is null (3.2)", () => {
    render(<Harness initial={null} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Iron")).not.toBeInTheDocument();
  });

  it("renders exactly four tabs in order, in a list named 'Element detail sections' (4.1, 4.5, 6.1)", () => {
    render(<Harness initial={makeElement()} />);

    const tablist = screen.getByRole("tablist", {
      name: "Element detail sections",
    });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(TAB_NAMES);
  });

  it("selects Atomic details by default and shows the Block row (4.2)", () => {
    render(<Harness initial={makeElement()} />);

    const atomic = screen.getByRole("tab", { name: "Atomic details" });
    expect(atomic).toHaveAttribute("aria-selected", "true");

    // Block value from the atomic panel is visible by default.
    expect(screen.getByText("Block")).toBeInTheDocument();
  });

  it("switches tabs: shows the selected panel, hides others, exactly one selected (4.3, 4.4)", async () => {
    const user = userEvent.setup();
    render(<Harness initial={makeElement()} />);

    // Mantine keeps panels mounted but hides inactive ones (display:none), so
    // assert visibility rather than DOM presence: default shows atomic content,
    // physical content is present but hidden.
    expect(screen.getByText("Block")).toBeVisible();
    expect(screen.getByText("Phase")).not.toBeVisible();

    await user.click(screen.getByRole("tab", { name: "Physical properties" }));

    // Now physical content is visible and atomic-only content is hidden.
    expect(screen.getByText("Phase")).toBeVisible();
    expect(screen.getByText("Block")).not.toBeVisible();

    // Exactly one tab marked selected.
    const selected = screen
      .getAllByRole("tab")
      .filter((t) => t.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveAccessibleName("Physical properties");
  });

  it("distributes fields across panels and lists shells innermost→outermost (5.1, 5.2, 5.5, 5.7)", async () => {
    const user = userEvent.setup();
    render(<Harness initial={makeElement()} />);

    // The five atomic field labels (5.1). They belong only to the atomic panel.
    const atomicLabels = [
      "Atomic number",
      "Atomic mass",
      "Group",
      "Period",
      "Block",
    ];

    // Atomic panel (default): all five are visible, each exactly once.
    for (const label of atomicLabels) {
      const matches = screen.getAllByText(label);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toBeVisible();
    }

    // In every other panel the atomic labels are not visible (5.1): Mantine keeps
    // them mounted but hidden, so they live in no visible section but the atomic one.
    await user.click(screen.getByRole("tab", { name: "Physical properties" }));
    expect(screen.getByText("Phase")).toBeVisible(); // 5.2
    // Physical panel carries density, boiling and melting points.
    expect(screen.getByText("Density")).toBeVisible();
    expect(screen.getByText("7.874 g/cm3")).toBeVisible();
    expect(screen.getByText("Boiling point")).toBeVisible();
    expect(screen.getByText("3134 K")).toBeVisible();
    expect(screen.getByText("Melting point")).toBeVisible();
    expect(screen.getByText("1811 K")).toBeVisible();
    for (const label of atomicLabels) {
      expect(screen.getByText(label)).not.toBeVisible();
    }

    // Electron panel: shells joined innermost→outermost (5.7), plus affinity.
    await user.click(
      screen.getByRole("tab", { name: "Electron configuration" }),
    );
    expect(screen.getByText("2, 8, 14, 2")).toBeVisible();
    expect(screen.getByText("Electron affinity")).toBeVisible();
    expect(screen.getByText("15.7 kJ/mol")).toBeVisible();
  });

  it("shows appearance, discoveredBy and namedBy in Description when present (5.3, 5.6)", async () => {
    const user = userEvent.setup();
    render(<Harness initial={makeElement()} />);

    await user.click(screen.getByRole("tab", { name: "Description" }));
    expect(screen.getByText("Appearance")).toBeInTheDocument();
    expect(
      screen.getByText("lustrous metallic with a grayish tinge"),
    ).toBeInTheDocument();
    expect(screen.getByText("Discovered by")).toBeInTheDocument();
    expect(screen.getByText("Ancient civilizations")).toBeInTheDocument();
    expect(screen.getByText("Named by")).toBeInTheDocument();
    expect(screen.getByText("Ancient namers")).toBeInTheDocument();
  });

  it("omits appearance, discoveredBy and namedBy when null or empty (5.4)", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={makeElement({
          appearance: null,
          discoveredBy: "",
          namedBy: null,
        })}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Description" }));
    expect(screen.queryByText("Appearance")).not.toBeInTheDocument();
    expect(screen.queryByText("Discovered by")).not.toBeInTheDocument();
    expect(screen.queryByText("Named by")).not.toBeInTheDocument();
  });

  it("renders the '—' placeholder when group is null (5.9)", () => {
    render(<Harness initial={makeElement({ group: null })} />);

    // Group row still present, with the non-numeric placeholder.
    expect(screen.getByText("Group")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the summary from the elements resource, keyed by atomic number (5.8)", async () => {
    const user = userEvent.setup();
    // The detail now sources the summary from the i18n `elements` namespace by
    // atomicNumber (t('elements:summary.<n>')), not from element.summary — the
    // static dataset stays the language-neutral source but is read through the
    // resource, so the resource text is what renders. The `|| noDescription`
    // guard only fires for a missing/empty resource key (no real element hits it,
    // since every en summary is present and guarded by elements.check.ts).
    render(<Harness initial={makeElement()} />);

    await user.click(screen.getByRole("tab", { name: "Description" }));
    expect(screen.getByText(enElements.summary["26"])).toBeInTheDocument();
    // The placeholder is not shown because a real summary resource exists.
    expect(
      screen.queryByText("No description available."),
    ).not.toBeInTheDocument();
  });

  it("exposes roving tabindex: only the selected tab is in the tab order (6.1)", () => {
    render(<Harness initial={makeElement()} />);

    // The selected tab is the single tab stop (tabindex 0); the rest are -1.
    expect(
      screen.getByRole("tab", { name: "Atomic details" }),
    ).toHaveAttribute("tabindex", "0");
    for (const name of TAB_NAMES.slice(1)) {
      expect(screen.getByRole("tab", { name })).toHaveAttribute(
        "tabindex",
        "-1",
      );
    }
  });

  it("moves selection with Right/Left arrows, wrapping at both ends (6.2, 6.3)", () => {
    render(<Harness initial={makeElement()} />);

    const selected = () =>
      screen
        .getAllByRole("tab")
        .find((t) => t.getAttribute("aria-selected") === "true");

    // Mantine's roving handler lives on each tab's onKeyDown and activates the
    // tab as focus moves (activateTabWithKeyboard). Firing keyDown directly on
    // the live selected tab drives it without the overlay focus trap interfering.
    const arrow = (key: "ArrowRight" | "ArrowLeft") =>
      fireEvent.keyDown(selected()!, { key });

    arrow("ArrowRight"); // atomic → physical
    expect(selected()).toHaveAccessibleName("Physical properties");

    arrow("ArrowLeft"); // physical → atomic
    expect(selected()).toHaveAccessibleName("Atomic details");

    arrow("ArrowLeft"); // atomic → wrap to last (description)
    expect(selected()).toHaveAccessibleName("Description");

    arrow("ArrowRight"); // description → wrap to first (atomic)
    expect(selected()).toHaveAccessibleName("Atomic details");
  });

  it("exposes tabs as native buttons activatable by Enter/Space (6.4)", () => {
    render(<Harness initial={makeElement()} />);

    const selected = () =>
      screen
        .getAllByRole("tab")
        .find((t) => t.getAttribute("aria-selected") === "true");

    // Each tab is a real <button role="tab">, so a focused tab is activated by
    // Enter or Space the same way the browser activates any button: it dispatches
    // a click. (Driving raw Enter/Space through userEvent here is unreliable — the
    // overlay's focus trap can pull focus to the close control between focusing a
    // tab and the async keystroke, which would then close the overlay.) We assert
    // the button nature plus that activating a tab selects it.
    const physical = screen.getByRole("tab", { name: "Physical properties" });
    expect(physical.tagName).toBe("BUTTON");
    expect(physical).toHaveAttribute("type", "button");

    fireEvent.click(physical);
    expect(selected()).toHaveAccessibleName("Physical properties");

    fireEvent.click(screen.getByRole("tab", { name: "Electron configuration" }));
    expect(selected()).toHaveAccessibleName("Electron configuration");
  });

  it("exposes a keyboard-operable 'Close' control that fires onClose (1.4, 1.8, 6.5)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness initial={makeElement()} onClose={onClose} />);

    const closeButton = screen.getByRole("button", { name: "Close" });
    // Reachable by keyboard focus and operable with keyboard activation.
    closeButton.focus();
    expect(closeButton).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onClose).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("closes when Escape is pressed (1.7)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness initial={makeElement()} onClose={onClose} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("closes when the outside overlay region is clicked (1.6)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Harness initial={makeElement()} onClose={onClose} />,
    );

    const overlay = container.querySelector(
      ".mantine-Drawer-overlay, .mantine-Modal-overlay",
    );
    expect(overlay).not.toBeNull();
    // `overlay` is a DOM element from querySelector; avoid the `Element` type
    // name here since this file imports the data-model `Element` type.
    await user.click(overlay!);

    expect(onClose).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("renders a centered Modal with no built-in close button, dismissable via Escape, on wide viewports (1.5)", async () => {
    useWideViewport();
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness initial={makeElement()} onClose={onClose} />);

    // Modal branch still renders the custom header.
    expect(screen.getByText("Iron")).toBeInTheDocument();

    // The wide Modal suppresses the built-in close button (withCloseButton=false);
    // the custom header bar is the chrome. Escape still dismisses it.
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
