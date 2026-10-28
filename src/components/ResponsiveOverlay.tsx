// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { Drawer, Modal } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";

interface ResponsiveOverlayProps {
  opened: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
}

// The app's mobile-first overlay: a bottom-anchored Drawer on small screens, a
// centered Modal from the `sm` breakpoint (48em) up. Both are dismissable via a
// labelled close button, overlay click and Esc. The breakpoint lives only here.
export function ResponsiveOverlay({
  opened,
  onClose,
  title,
  children,
}: ResponsiveOverlayProps) {
  const { t } = useTranslation("ui");
  const isWide = useMediaQuery("(min-width: 48em)");
  const common = {
    opened,
    onClose,
    title,
    closeButtonProps: { "aria-label": t("common.close") },
  };

  return isWide ? (
    <Modal {...common} centered size="lg">
      {children}
    </Modal>
  ) : (
    <Drawer {...common} position="bottom" size="80%">
      {children}
    </Drawer>
  );
}
