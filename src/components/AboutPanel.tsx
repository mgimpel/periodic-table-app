// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { Anchor, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { ResponsiveOverlay } from "./ResponsiveOverlay";
// Single-source the version from package.json rather than a duplicated literal.
// resolveJsonModule is enabled (tsconfig.json), so the JSON import type-checks;
// only the `version` field is referenced, so bundlers tree-shake the rest.
import pkg from "../../package.json";

const REPO_URL = "https://github.com/mgimpel/periodic-table-app";

interface AboutPanelProps {
  opened: boolean;
  onClose: () => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}

// About overlay, shown in the shared ResponsiveOverlay (Drawer on mobile, Modal
// on desktop). Modeled on SettingsPanel: ResponsiveOverlay supplies the single
// labelled close button and the accessible name (the title). Returns focus to
// the logo trigger on close, mirroring SettingsPanel's handleClose.
export function AboutPanel({ opened, onClose, returnFocusRef }: AboutPanelProps) {
  const { t } = useTranslation("ui");

  const handleClose = () => {
    onClose();
    returnFocusRef.current?.focus();
  };

  return (
    <ResponsiveOverlay
      opened={opened}
      onClose={handleClose}
      title={t("about.title")}
    >
      <Stack gap="md">
        <Text>{t("about.version", { version: pkg.version })}</Text>
        <Text>{t("about.copyright")}</Text>
        <Anchor href={REPO_URL} target="_blank" rel="noreferrer">
          {t("about.license")}
        </Anchor>
        <Stack gap="xs">
          <Title order={2} size="h5">
            {t("about.thanksHeading")}
          </Title>
          <Text size="sm">{t("about.thanksBody")}</Text>
        </Stack>
      </Stack>
    </ResponsiveOverlay>
  );
}
