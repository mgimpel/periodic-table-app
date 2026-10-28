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
  // Which preference failed to persist, or null for no notice. A single active
  // kind — the latest failure wins, matching the one-Alert UI. A failed save is
  // non-blocking: the session keeps the selected value (Req 5.4).
  const [saveError, setSaveError] = useState<SaveErrorKind | null>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={classes.root}>
      <HeaderBar onOpenSettings={open} settingsButtonRef={settingsButtonRef} />

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
        <PeriodicTable />
      </div>

      <SettingsPanel
        opened={opened}
        onClose={close}
        returnFocusRef={settingsButtonRef}
        onSaveError={setSaveError}
      />
    </div>
  );
}
