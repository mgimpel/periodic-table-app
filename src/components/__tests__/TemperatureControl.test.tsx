// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for TemperatureControl against real localStorage, through a
// stateful harness seeded from readStoredTemperature (as AppLayout does).

import { useState } from "react";
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import "../../i18n";
import { TemperatureControl } from "../TemperatureControl";
import type { TemperatureOption } from "../../lib/temperature";
import { readStoredTemperature } from "../../lib/temperatureManager";
import enUi from "../../locales/en/ui.json";

const STORAGE_KEY = "app-temperature-unit";

beforeEach(() => window.localStorage.clear());

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

function Harness({ onSaveError }: { onSaveError?: (e: unknown) => void }) {
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
    render(<Harness />);
    const radios = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(radios.map((r) => r.value)).toEqual(["kelvin", "celsius", "fahrenheit"]);
    expect(screen.getByRole("radio", { name: enUi.temperature.kelvin })).toBeChecked();
    expect(screen.getByRole("radio", { name: enUi.temperature.celsius })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: enUi.temperature.fahrenheit })).toBeInTheDocument();
  });

  it("exposes an accessible name", () => {
    render(<Harness />);
    expect(
      screen.getByRole("radiogroup", { name: enUi.temperature.label }),
    ).toBeInTheDocument();
  });

  it("applies and persists a clicked choice", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("radio", { name: enUi.temperature.celsius }));
    expect(radioByValue("celsius").checked).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("celsius");
  });

  it("supports keyboard (arrow) selection", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    radioByValue("kelvin").focus();
    await user.keyboard("{ArrowRight}");
    expect(radioByValue("celsius").checked).toBe(true);
    await waitFor(() =>
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("celsius"),
    );
  });

  it("seeds from a valid stored value", () => {
    window.localStorage.setItem(STORAGE_KEY, "fahrenheit");
    render(<Harness />);
    expect(radioByValue("fahrenheit").checked).toBe(true);
  });

  it("falls back to Kelvin for an invalid stored value", () => {
    window.localStorage.setItem(STORAGE_KEY, "rankine");
    render(<Harness />);
    expect(radioByValue("kelvin").checked).toBe(true);
  });

  it("keeps the choice and fires onSaveError when localStorage.setItem throws", async () => {
    const user = userEvent.setup();
    const onSaveError = vi.fn();
    vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<Harness onSaveError={onSaveError} />);
    await user.click(radioByValue("fahrenheit"));
    expect(radioByValue("fahrenheit").checked).toBe(true);
    expect(onSaveError).toHaveBeenCalledTimes(1);
  });
});
