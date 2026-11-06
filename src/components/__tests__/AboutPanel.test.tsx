// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for AboutPanel: it renders its title, copyright, license and
// the single-sourced version when opened, and returns focus to the trigger on
// close. Expected strings are read from the locale JSON (not hardcoded) and the
// version is sourced from package.json so it can't rot.

import { createRef } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
// Initialise the shared i18next instance so useTranslation resolves English.
import "../../i18n";
import { AboutPanel } from "../AboutPanel";
import enUi from "../../locales/en/ui.json";
import pkg from "../../../package.json";

// Stub the Tauri opener bindings: in jsdom there's no backend, and we want to
// assert the anchor click hands the URL to the opener plugin (openUrl) rather
// than letting the webview navigate.
const openUrlMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock("@tauri-apps/plugin-opener", () => ({ openUrl: openUrlMock }));

afterEach(() => {
  cleanup();
  openUrlMock.mockClear();
});

function renderAbout(props: Partial<Parameters<typeof AboutPanel>[0]> = {}) {
  const opened = props.opened ?? true;
  const onClose = props.onClose ?? vi.fn();
  const returnFocusRef =
    props.returnFocusRef ?? createRef<HTMLButtonElement>();
  render(
    <MantineProvider env="test">
      <AboutPanel opened={opened} onClose={onClose} returnFocusRef={returnFocusRef} />
    </MantineProvider>,
  );
  return { onClose, returnFocusRef };
}

describe("AboutPanel", () => {
  it("renders title, copyright and license when opened", () => {
    renderAbout();
    expect(
      screen.getByRole("heading", { name: enUi.about.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(enUi.about.copyright)).toBeInTheDocument();
    expect(screen.getByText(enUi.about.license)).toBeInTheDocument();
    // thanksBody is multi-line (rendered with white-space: pre-line); Testing
    // Library's default matcher collapses the node's whitespace, so match the
    // expected string under the same normalization rather than its raw \n form.
    const normalizedThanks = enUi.about.thanksBody.replace(/\s+/g, " ").trim();
    expect(screen.getByText(normalizedThanks)).toBeInTheDocument();
  });

  it("shows the version single-sourced from package.json", () => {
    renderAbout();
    const expected = enUi.about.version.replace("{{version}}", pkg.version);
    expect(screen.getByText(expected)).toBeInTheDocument();
    // The rendered string interpolates package.json's version; both read the
    // same source, so this confirms the wiring rather than guarding a literal.
    expect(expected).toContain(pkg.version);
  });

  it("opens links in the external browser instead of navigating the app", async () => {
    const user = userEvent.setup();
    renderAbout();
    const licenseLink = screen.getByRole("link", { name: enUi.about.license });
    await user.click(licenseLink);
    expect(openUrlMock).toHaveBeenCalledTimes(1);
    // Opens the same URL the anchor points at, rather than letting the webview
    // navigate to it.
    expect(openUrlMock).toHaveBeenCalledWith(licenseLink.getAttribute("href"));
  });

  it("does not render content when closed", () => {
    renderAbout({ opened: false });
    expect(
      screen.queryByRole("heading", { name: enUi.about.title }),
    ).not.toBeInTheDocument();
  });

  it("returns focus to the trigger on close", async () => {
    const user = userEvent.setup();
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    const returnFocusRef = { current: trigger };
    const onClose = vi.fn();
    renderAbout({ onClose, returnFocusRef });
    await user.click(screen.getByRole("button", { name: enUi.common.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
