// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { HeaderBar } from "./HeaderBar";
import { PeriodicTable } from "./PeriodicTable";
import { SettingsPanel } from "./SettingsPanel";
import classes from "./AppLayout.module.css";

interface AppLayoutProps {
  // App.tsx creates the color-scheme manager (for MantineProvider) before this
  // component renders, so it can't hold the save-error state itself. Instead we
  // own that state here and hand App a stable setter via this registration prop,
  // which it routes into the manager's onSaveError (Req 5.4). Optional so the
  // layout renders standalone (e.g. in tests) without the manager wiring.
  registerSaveErrorHandler?: (handler: () => void) => void;
}

// Owns the Settings_Panel open/close state and the full-height flex column
// layout (Req 1.1, 2.1), keeping App.tsx a thin composition. The single
// `opened` boolean plus an idempotent open() means re-activating the button
// while open never spawns a second panel (Req 3.4); the panel is a sibling
// overlay that never unmounts PeriodicTable, so the selected element and scroll
// position survive opening settings (Req 3.8). settingsButtonRef lets the panel
// return focus to the trigger on close (Req 6.9).
export function AppLayout({ registerSaveErrorHandler }: AppLayoutProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [saveError, setSaveError] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  // Stable handler so App can route the manager's onSaveError here. A failed
  // theme save is non-blocking: the session keeps the selected scheme and we
  // just surface a dismissable inline notice (Req 5.4).
  const handleSaveError = useCallback(() => setSaveError(true), []);

  useEffect(() => {
    registerSaveErrorHandler?.(handleSaveError);
  }, [registerSaveErrorHandler, handleSaveError]);

  return (
    <div className={classes.root}>
      <HeaderBar onOpenSettings={open} settingsButtonRef={settingsButtonRef} />

      {saveError && (
        <Alert
          color="yellow"
          variant="light"
          withCloseButton
          closeButtonLabel="Dismiss"
          onClose={() => setSaveError(false)}
          title="Theme preference couldn't be saved"
        >
          Your theme choice applies for now but couldn't be saved, so it may not
          be remembered next time.
        </Alert>
      )}

      <div className={classes.tableRegion}>
        <PeriodicTable />
      </div>

      <SettingsPanel
        opened={opened}
        onClose={close}
        returnFocusRef={settingsButtonRef}
      />
    </div>
  );
}
