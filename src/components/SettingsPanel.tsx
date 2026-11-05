// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { Input, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { ThemeControl } from "./ThemeControl";
import { LanguageControl } from "./LanguageControl";
import { TemperatureControl } from "./TemperatureControl";
import { ResponsiveOverlay } from "./ResponsiveOverlay";
import type { TemperatureOption } from "../lib/temperature";

/** Which preference failed to persist; selects the save-error notice strings. */
export type SaveErrorKind = "theme" | "language" | "temperature";

interface SettingsPanelProps {
  opened: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  // Fired with the failing preference when a control's persist fails, so
  // AppLayout can surface its non-blocking save-error notice.
  onSaveError?: (kind: SaveErrorKind) => void;
  // The temperature unit is owned by AppLayout because ElementDetail reads it.
  temperatureUnit: TemperatureOption;
  onTemperatureUnitChange: (unit: TemperatureOption) => void;
}

// Settings overlay, shown in the shared ResponsiveOverlay (Drawer on mobile,
// Modal on desktop). Returns focus to the settings trigger on close. Mantine
// restores focus to the previously-focused
// element by default, which is the trigger button; `returnFocusRef` is applied
// explicitly so focus lands there even if focus moved while the panel was open.
//
// Each setting gets a visible title via Input.Wrapper, reusing the control's
// own `*.label` i18n string so the title and the control's accessible name stay
// in sync. Input.Wrapper associates the label with the field for assistive tech.
export function SettingsPanel({
  opened,
  onClose,
  returnFocusRef,
  onSaveError,
  temperatureUnit,
  onTemperatureUnitChange,
}: SettingsPanelProps) {
  const { t } = useTranslation("ui");

  const handleClose = () => {
    onClose();
    returnFocusRef.current?.focus();
  };

  return (
    <ResponsiveOverlay
      opened={opened}
      onClose={handleClose}
      title={t("settings.title")}
    >
      <Stack gap="lg">
        <Input.Wrapper label={t("theme.label")}>
          <ThemeControl onSaveError={() => onSaveError?.("theme")} />
        </Input.Wrapper>
        <Input.Wrapper label={t("language.label")}>
          <LanguageControl onSaveError={() => onSaveError?.("language")} />
        </Input.Wrapper>
        <Input.Wrapper label={t("temperature.label")}>
          <TemperatureControl
            value={temperatureUnit}
            onChange={onTemperatureUnitChange}
            onSaveError={() => onSaveError?.("temperature")}
          />
        </Input.Wrapper>
      </Stack>
    </ResponsiveOverlay>
  );
}