// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Focused test for the orientation notice: it shows on mobile when the
// landscape lock can't be applied, and auto-dismisses when the device rotates.
// Forces the mobile path by mocking the platform module; jsdom has no
// screen.orientation.lock, which is the real "missing API" fallback (the
// selection-flow test deliberately runs the desktop path, where the notice
// never shows).

import { describe, it, expect, afterEach, vi } from "vitest";
import {
  render,
  screen,
  cleanup,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
// Initialise the shared i18next default instance so the orientation notice
// resolves to its English resource text instead of raw keys.
import "../../i18n";

vi.mock("../../lib/platform", () => ({ isMobilePlatform: () => true }));

import { PeriodicTable } from "../PeriodicTable";

afterEach(cleanup);

function renderTable() {
  return render(
    <MantineProvider>
      <PeriodicTable />
    </MantineProvider>,
  );
}

describe("PeriodicTable orientation notice", () => {
  // Validates: Requirement 1.5 (fallback notice) + auto-dismiss on rotation.

  it("shows the notice when the landscape lock can't be applied", async () => {
    renderTable();
    expect(
      await screen.findByText("Rotate for a wider view"),
    ).toBeInTheDocument();
  });

  it("has a labelled 'Dismiss' close button that hides the notice", async () => {
    renderTable();
    fireEvent.click(await screen.findByRole("button", { name: "Dismiss" }));

    await waitFor(() =>
      expect(
        screen.queryByText("Rotate for a wider view"),
      ).not.toBeInTheDocument(),
    );
  });

  it("auto-dismisses the notice when the device rotates", async () => {
    renderTable();
    expect(
      await screen.findByText("Rotate for a wider view"),
    ).toBeInTheDocument();

    // Simulate a rotation via the legacy window event the component listens for.
    window.dispatchEvent(new Event("orientationchange"));

    await waitFor(() =>
      expect(
        screen.queryByText("Rotate for a wider view"),
      ).not.toBeInTheDocument(),
    );
  });
});
