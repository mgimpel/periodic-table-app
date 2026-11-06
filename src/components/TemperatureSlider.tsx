// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { Slider } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
  TEMPERATURE_MAX,
  TEMPERATURE_GRADIENT_STOPS,
  linearGradientCss,
} from "../lib/gradient";
import { clampSelectedTemperature } from "../lib/cellColor";
import { formatTemperature, type TemperatureOption } from "../lib/temperature";
import classes from "./TemperatureSlider.module.css";

interface TemperatureSliderProps {
  // Selected_Temperature in Kelvin; the slider steps/stores in Kelvin.
  valueK: number;
  // Receives a clamped Kelvin value.
  onChange: (kelvin: number) => void;
  // Only affects display (thumb/bound labels), never the stored Kelvin.
  unit: TemperatureOption;
}

// The blue->white->orange->red temperature gradient painted along the slider
// track, so the track itself reads as the Kelvin scale the thumb selects on.
// It matches the per-cell colors and the melting/boiling-point legend bars:
// the same TEMPERATURE_GRADIENT_STOPS, positioned at (k / TEMPERATURE_MAX) via
// linearGradientCss (first stop x === 0).
const TRACK_GRADIENT = linearGradientCss(TEMPERATURE_GRADIENT_STOPS);

// Thin wrapper over Mantine Slider, controlled by AppLayout via the phase
// SchemeLegend. Kelvin internally (min 0, max TEMPERATURE_MAX, step 1),
// unit-aware display. Arrow-key stepping (+-1 K, clamped) is Mantine's built-in
// step handling.
//
// The track is decorated with the temperature color gradient. Mantine paints
// the track's fill in a ::before pseudo-element, which inline styles can't
// reach, so the gradient travels as the --track-gradient custom property (set
// inline on the track) and is consumed by the .track::before rule in the CSS
// module. The filled "bar" segment is made transparent so the full gradient
// stays visible on both sides of the thumb. size="lg" gives the gradient a
// legible height.
export function TemperatureSlider({
  valueK,
  onChange,
  unit,
}: TemperatureSliderProps) {
  const { t } = useTranslation("ui");

  return (
    <Slider
      size="lg"
      min={0}
      max={TEMPERATURE_MAX}
      step={1}
      value={valueK}
      onChange={(k) => onChange(clampSelectedTemperature(k))}
      aria-label={t("temperatureSlider.label")}
      label={(k) => formatTemperature(k, unit)}
      marks={[
        { value: 0, label: formatTemperature(0, unit) },
        { value: TEMPERATURE_MAX, label: formatTemperature(TEMPERATURE_MAX, unit) },
      ]}
      classNames={{ track: classes.track }}
      styles={{
        track: { "--track-gradient": TRACK_GRADIENT } as React.CSSProperties,
        bar: { backgroundColor: "transparent" },
      }}
    />
  );
}
