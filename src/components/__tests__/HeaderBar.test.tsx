// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for HeaderBar: the logo's accessible name, the title as an
// h1, and the Settings_Button's accessible name, activation (pointer +
// keyboard), and touch-target sizing.

import { createRef } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
// Initialise the shared i18next default instance so useTranslation resolves to
// the English resources (equal to the former literals) instead of raw keys.
import "../../i18n";
import { HeaderBar } from "../HeaderBar";

afterEach(cleanup);

// Mantine components (Group/Title/ActionIcon) read theme context from a provider.
function renderHeader(
  props: Partial<Parameters<typeof HeaderBar>[0]> = {},
) {
  const onOpenSettings = props.onOpenSettings ?? vi.fn();
  const settingsButtonRef =
    props.settingsButtonRef ?? createRef<HTMLButtonElement>();
  render(
    <MantineProvider>
      <HeaderBar
        onOpenSettings={onOpenSettings}
        settingsButtonRef={settingsButtonRef}
      />
    </MantineProvider>,
  );
  return { onOpenSettings, settingsButtonRef };
}

describe("HeaderBar", () => {
  it("exposes the logo's accessible name identifying the app", () => {
    // Validates: Requirements 6.2
    renderHeader();
    // The logo alt now reuses the ui:app.title string (design §2.4 inventory:
    // "Periodic Table App" -> app.title), so its accessible name matches the title.
    expect(
      screen.getByRole("img", { name: "Periodic Table of Elements" }),
    ).toBeInTheDocument();
  });

  it("renders the title as the single h1 document heading", () => {
    // Validates: Requirements 6.2 (one correct document heading)
    renderHeader();
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Periodic Table of Elements");
  });

  it("exposes the Settings_Button with the 'Open settings' accessible name", () => {
    // Validates: Requirements 6.1
    renderHeader();
    expect(
      screen.getByRole("button", { name: "Open settings" }),
    ).toBeInTheDocument();
  });

  it("calls onOpenSettings when the Settings_Button is clicked", async () => {
    // Validates: Requirements 3.1, 6.4
    const user = userEvent.setup();
    const { onOpenSettings } = renderHeader();
    await user.click(screen.getByRole("button", { name: "Open settings" }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenSettings when the Settings_Button is activated with Enter", async () => {
    // Validates: Requirements 6.4
    const user = userEvent.setup();
    const { onOpenSettings } = renderHeader();
    screen.getByRole("button", { name: "Open settings" }).focus();
    await user.keyboard("{Enter}");
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenSettings when the Settings_Button is activated with Space", async () => {
    // Validates: Requirements 6.4
    const user = userEvent.setup();
    const { onOpenSettings } = renderHeader();
    screen.getByRole("button", { name: "Open settings" }).focus();
    await user.keyboard("{ }");
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("wires the provided ref to the Settings_Button for focus return", () => {
    // Validates: Requirements 6.4 (keyboard focus target) / 6.9 support
    const settingsButtonRef = createRef<HTMLButtonElement>();
    renderHeader({ settingsButtonRef });
    expect(settingsButtonRef.current).toBe(
      screen.getByRole("button", { name: "Open settings" }),
    );
  });

  it("sizes the Settings_Button touch target to at least 32x32 CSS pixels", () => {
    // Validates: Requirements 1.8, 6.3
    // jsdom does no layout, so assert the sizing driver Mantine emits from
    // size={"é}: the ActionIcon's --ai-size CSS variable, which backs both
    // width and height, resolves to 2rem (= 32px at the default 16px root).
    renderHeader();
    const button = screen.getByRole("button", { name: "Open settings" });
    const sizeVar = button.style.getPropertyValue("--ai-size");
    expect(sizeVar).toContain("2rem");
  });
});
