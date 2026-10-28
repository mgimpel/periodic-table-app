// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Focused test for the orientation notice: it shows on mobile when the
// landscape lock was attempted but denied, and auto-dismisses when the device
// rotates. Forces the mobile + lock-failed path by mocking the platform and
// orientation-lock modules (the selection-flow test deliberately runs the
// desktop path, where the notice never shows).

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
vi.mock("../../hooks/useOrientationLock", () => ({
  // Lock attempted but denied -> the notice should render.
  useOrientationLock: () => ({ attempted: true, locked: false }),
}));

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

  it("shows the notice when the landscape lock was attempted but denied", () => {
    renderTable();
    expect(screen.getByText("Rotate for a wider view")).toBeInTheDocument();
  });

  it("has a labelled 'Dismiss' close button that hides the notice", async () => {
    renderTable();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));

    await waitFor(() =>
      expect(
        screen.queryByText("Rotate for a wider view"),
      ).not.toBeInTheDocument(),
    );
  });

  it("auto-dismisses the notice when the device rotates", async () => {
    renderTable();
    expect(screen.getByText("Rotate for a wider view")).toBeInTheDocument();

    // Simulate a rotation via the legacy window event the component listens for.
    window.dispatchEvent(new Event("orientationchange"));

    await waitFor(() =>
      expect(
        screen.queryByText("Rotate for a wider view"),
      ).not.toBeInTheDocument(),
    );
  });
});
