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
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
// Initialise the shared i18next default instance so the panel title, close
// label, and the theme/language controls resolve to the English resources.
import "../../i18n";
import { SettingsPanel } from "../SettingsPanel";

afterEach(() => {
  cleanup();
  // Mantine's color-scheme state lives on <html> and in storage; reset both.
  window.localStorage.clear();
  document.documentElement.removeAttribute("data-mantine-color-scheme");
});

// Controlled harness: a real trigger button holds the returnFocusRef and owns
// the `opened` state, so onClose actually closes the panel and the focus-return
// assertion exercises the real dismiss path.
function Harness() {
  const [opened, setOpened] = useState(false);
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
