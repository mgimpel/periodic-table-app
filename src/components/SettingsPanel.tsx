// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { Drawer, Modal } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { ThemeControl } from "./ThemeControl";

interface SettingsPanelProps {
  opened: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
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
}: SettingsPanelProps) {
  const isWide = useMediaQuery("(min-width: 48em)");

  const handleClose = () => {
    onClose();
    returnFocusRef.current?.focus();
  };

  if (isWide) {
    return (
      <Modal
        opened={opened}
        onClose={handleClose}
        title="Settings"
        centered
        size="lg"
        closeButtonProps={{ "aria-label": "Close" }}
      >
        <ThemeControl />
      </Modal>
    );
  }

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      title="Settings"
      position="bottom"
      size="80%"
      closeButtonProps={{ "aria-label": "Close" }}
    >
      <ThemeControl />
    </Drawer>
  );
}
