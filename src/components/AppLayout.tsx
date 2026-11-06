// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { useRef, useState } from "react";
import { Alert } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { HeaderBar } from "./HeaderBar";
import { PeriodicTable } from "./PeriodicTable";
import { SettingsPanel, type SaveErrorKind } from "./SettingsPanel";
import { AboutPanel } from "./AboutPanel";
import type { TemperatureOption } from "../lib/temperature";
import {
  DEFAULT_COLORING_SCHEME,
  type ColoringSchemeOption,
} from "../lib/coloringScheme";
import { clampSelectedTemperature } from "../lib/cellColor";
import { readStoredTemperature } from "../lib/persistenceManager";
import classes from "./AppLayout.module.css";

// Owns the Settings_Panel open/close state and the full-height flex column
// layout (Req 1.1, 2.1), keeping App.tsx a thin composition. The single
// `opened` boolean plus an idempotent open() means re-activating the button
// while open never spawns a second panel (Req 3.4); the panel is a sibling
// overlay that never unmounts PeriodicTable, so the selected element and scroll
// position survive opening settings (Req 3.8). settingsButtonRef lets the panel
// return focus to the trigger on close (Req 6.9).
export function AppLayout() {
  const { t } = useTranslation("ui");
  const [opened, { open, close }] = useDisclosure(false);
  // About panel open/close, wired like Settings. Idempotent open() means
  // re-activating the logo while open never spawns a second panel.
  const [aboutOpened, { open: openAbout, close: closeAbout }] =
    useDisclosure(false);
  // Which preference failed to persist, or null for no notice. A single active
  // kind — the latest failure wins, matching the one-Alert UI. A failed save is
  // non-blocking: the session keeps the selected value (Req 5.4).
  const [saveError, setSaveError] = useState<SaveErrorKind | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  // Lets AboutPanel return focus to the logo trigger on close.
  const logoButtonRef = useRef<HTMLButtonElement>(null);
  // Shared by the settings control and the element detail, so it lives here.
  const [temperatureUnit, setTemperatureUnit] =
    useState<TemperatureOption>(readStoredTemperature);
  // Shared by the header control and the periodic table, so it lives here.
  // Not persisted — it resets to the default scheme each session.
  const [coloringScheme, setColoringScheme] =
    useState<ColoringSchemeOption>(DEFAULT_COLORING_SCHEME);
  // Selected_Temperature driving the phase scheme (Req 7.1). Session-only — not
  // persisted, so no persistenceManager pair. Never reset on a scheme change, so
  // switching away from "phase" and back restores the same Kelvin value for free
  // (Req 1.5, 1.6, 7.3, 7.4). Default 298.15 K (Req 2.5, 7.5).
  const [selectedTempK, setSelectedTempK] = useState(298.15);

  return (
    <div className={classes.root}>
      <HeaderBar
        onOpenAbout={openAbout}
        logoButtonRef={logoButtonRef}
        onOpenSettings={open}
        settingsButtonRef={settingsButtonRef}
        coloringScheme={coloringScheme}
        onColoringSchemeChange={setColoringScheme}
      />

      {saveError && (
        <Alert
          color="yellow"
          variant="light"
          withCloseButton
          closeButtonLabel={t("common.dismiss")}
          onClose={() => setSaveError(null)}
          title={t(`saveError.${saveError}.title`)}
        >
          {t(`saveError.${saveError}.body`)}
        </Alert>
      )}

      <div className={classes.tableRegion}>
        <PeriodicTable
          temperatureUnit={temperatureUnit}
          coloringScheme={coloringScheme}
          selectedTempK={selectedTempK}
          onSelectedTempChange={(k) => setSelectedTempK(clampSelectedTemperature(k))}
        />
      </div>

      <SettingsPanel
        opened={opened}
        onClose={close}
        returnFocusRef={settingsButtonRef}
        onSaveError={setSaveError}
        temperatureUnit={temperatureUnit}
        onTemperatureUnitChange={setTemperatureUnit}
      />

      <AboutPanel
        opened={aboutOpened}
        onClose={closeAbout}
        returnFocusRef={logoButtonRef}
      />
    </div>
  );
}
