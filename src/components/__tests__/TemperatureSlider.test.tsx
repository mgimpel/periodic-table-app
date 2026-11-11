// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Component tests for TemperatureSlider: a thin, controlled Mantine Slider that
// steps/stores in Kelvin (min 0, max TEMPERATURE_MAX, step 1) and displays the
// value and its bounds in the active temperature unit.
//
// The slider is controlled by AppLayout, so a small stateful Harness mirrors
// that ownership (seeded valueK, clamped onChange) and lets arrow-key presses
// move the value. Expected labels are read from the en ui.json resources and
// the lib formatter, never duplicated as literals.
//
// Mantine renders role="slider" on the thumb and carries the aria-label on the
// Slider-root wrapper, so the accessible name is asserted on the root and the
// thumb (value, bounds, arrow stepping) is located by its unnamed slider role.

import { useState } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
// Initialise the shared i18next default instance so the accessible name
// resolves to the English ui.json resource rather than the raw key.
import "../../i18n";
import { TemperatureSlider } from "../TemperatureSlider";
import {
  TEMPERATURE_MAX,
  TEMPERATURE_GRADIENT_STOPS,
  linearGradientCss,
} from "../../lib/gradient";
import {
  formatTemperature,
  type TemperatureOption,
} from "../../lib/temperature";
import enUi from "../../locales/ui.en.json";

afterEach(cleanup);

const sliderName = enUi.temperatureSlider.label;

function Harness({
  initialK,
  unit = "kelvin",
}: {
  initialK: number;
  unit?: TemperatureOption;
}) {
  const [valueK, setValueK] = useState(initialK);
  return (
    <MantineProvider env="test">
      <TemperatureSlider valueK={valueK} onChange={setValueK} unit={unit} />
    </MantineProvider>
  );
}

// The thumb carries role="slider" (and the live aria-value* state); the
// accessible name lives on its Slider-root ancestor.
const getThumb = () => screen.getByRole("slider");
const getRoot = () =>
  getThumb().closest(".mantine-Slider-root") as HTMLElement;

describe("TemperatureSlider", () => {
  // Req 8.1: the accessible name comes from the i18next key, not a literal.
  it("exposes the accessible name from the i18n key", () => {
    render(<Harness initialK={298} />);
    expect(getRoot()).toHaveAttribute("aria-label", sliderName);
  });

  // Req 2.1, 2.2: range bounds and step map to Kelvin 0 / TEMPERATURE_MAX / 1.
  // Mantine exposes min/max/value as aria-value* on the thumb; a single arrow
  // step moving the value by exactly 1 K confirms step=1.
  it("maps min/max to Kelvin 0 and TEMPERATURE_MAX, stepping by 1 K", async () => {
    const user = userEvent.setup();
    render(<Harness initialK={298} />);
    const thumb = getThumb();
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", String(TEMPERATURE_MAX));
    expect(thumb).toHaveAttribute("aria-valuenow", "298");

    thumb.focus();
    await user.keyboard("{ArrowRight}");
    expect(thumb).toHaveAttribute("aria-valuenow", "299");
  });

  // Req 8.6, 5.3: the min/max bound labels equal the lib-formatted bounds in
  // the active unit; shown here in Celsius to prove the unit is applied.
  it("shows bound labels equal to the lib-formatted bounds in the active unit", () => {
    render(<Harness initialK={298} unit="celsius" />);
    expect(
      screen.getByText(formatTemperature(0, "celsius")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatTemperature(TEMPERATURE_MAX, "celsius")),
    ).toBeInTheDocument();
  });

  // Req 8.5, 5.3: the formatted value text (thumb label) equals the
  // lib-formatted current value in the active unit. Mantine mounts the thumb
  // label while the thumb is hovered, so hover it first.
  it("shows the formatted value text for the current value in the active unit", async () => {
    const user = userEvent.setup();
    render(<Harness initialK={300} unit="celsius" />);
    await user.hover(getThumb());
    expect(
      within(getRoot()).getByText(formatTemperature(300, "celsius")),
    ).toBeInTheDocument();
  });

  // Req 8.4: Right/Up arrow increases by 1 K, bounded at the maximum.
  it("increases by 1 K on arrow-right and clamps at the maximum", async () => {
    const user = userEvent.setup();
    render(<Harness initialK={TEMPERATURE_MAX - 1} />);
    const thumb = getThumb();
    thumb.focus();

    await user.keyboard("{ArrowRight}");
    expect(thumb).toHaveAttribute("aria-valuenow", String(TEMPERATURE_MAX));

    // Already at the max: another step must not exceed it.
    await user.keyboard("{ArrowRight}");
    expect(thumb).toHaveAttribute("aria-valuenow", String(TEMPERATURE_MAX));
  });

  // Req 8.3: Left/Down arrow decreases by 1 K, bounded at the minimum (0 K).
  it("decreases by 1 K on arrow-left and clamps at the minimum", async () => {
    const user = userEvent.setup();
    render(<Harness initialK={1} />);
    const thumb = getThumb();
    thumb.focus();

    await user.keyboard("{ArrowLeft}");
    expect(thumb).toHaveAttribute("aria-valuenow", "0");

    // Already at the min: another step must not go below 0.
    await user.keyboard("{ArrowLeft}");
    expect(thumb).toHaveAttribute("aria-valuenow", "0");
  });

  // The track is decorated with the shared temperature color gradient (the same
  // blue->white->orange->red stops the cells and the melting/boiling-point
  // legend bars use). Mantine paints the track fill in a ::before pseudo (which
  // jsdom can't resolve), so the render path is: the gradient is carried as the
  // --track-gradient custom property on the track element and consumed by the
  // .track::before CSS rule. We assert the wired custom property (the bridge the
  // visible gradient depends on) and that the filled bar is transparent so the
  // whole gradient shows. A typo in either would leave the track plain grey —
  // the bug this replaces a prior, render-blind assertion to catch.
  it("wires the temperature gradient onto the track and clears the bar fill", () => {
    render(<Harness initialK={298} />);
    const root = getRoot();
    const track = root.querySelector(".mantine-Slider-track") as HTMLElement;
    const bar = root.querySelector(".mantine-Slider-bar") as HTMLElement;
    expect(track).not.toBeNull();
    expect(bar).not.toBeNull();
    expect(track.style.getPropertyValue("--track-gradient")).toBe(
      linearGradientCss(TEMPERATURE_GRADIENT_STOPS),
    );
    expect(bar.style.backgroundColor).toBe("transparent");
  });
});
