// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { Drawer, Modal, Stack } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { ThemeControl } from "./ThemeControl";
import { LanguageControl } from "./LanguageControl";

/** Which preference failed to persist; selects the save-error notice strings. */
export type SaveErrorKind = "theme" | "language";

interface SettingsPanelProps {
  opened: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  // Fired with the failing preference when a control's persist fails, so
  // AppLayout can surface its non-blocking save-error notice.
  onSaveError?: (kind: SaveErrorKind) => void;
}

// Settings overlay. Mirrors ElementDetail: a centered Modal from the `sm`
// breakpoint up, a bottom-anchored Drawer on small screens. Both are
// dismissable (close button, overlay click, Esc) and return focus to the
// settings trigger on close. Mantine restores focus to the previously-focused
// element by default, which is the trigger button; `returnFocusRef` is applied
// explicitly so focus lands there even if focus moved while the panel was open.
export function SettingsPanel({
  opened,
  onClose,
  returnFocusRef,
  onSaveError,
}: SettingsPanelProps) {
  const { t } = useTranslation("ui");
  const isWide = useMediaQuery("(min-width: 48em)");

  const handleClose = () => {
    onClose();
    returnFocusRef.current?.focus();
  };

  const content = (
    <Stack gap="md">
      <ThemeControl onSaveError={() => onSaveError?.("theme")} />
      <LanguageControl onSaveError={() => onSaveError?.("language")} />
    </Stack>
  );

  if (isWide) {
    return (
      <Modal
        opened={opened}
        onClose={handleClose}
        title={t("settings.title")}
        centered
        size="lg"
        closeButtonProps={{ "aria-label": t("common.close") }}
      >
        {content}
      </Modal>
    );
  }

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      title={t("settings.title")}
      position="bottom"
      size="80%"
      closeButtonProps={{ "aria-label": t("common.close") }}
    >
      {content}
    </Drawer>
  );
}
