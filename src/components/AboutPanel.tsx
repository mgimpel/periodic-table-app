// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { Anchor, Group, Stack, Text, Title } from "@mantine/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";
import { AppLogo } from "./Asset";
import { ResponsiveOverlay } from "./ResponsiveOverlay";
// Single-source the version from package.json rather than a duplicated literal.
// resolveJsonModule is enabled (tsconfig.json), so the JSON import type-checks;
// only the `version` field is referenced, so bundlers tree-shake the rest.
import pkg from "../../package.json";

const REPO_URL = "https://github.com/mgimpel/periodic-table-app";
// Link straight to the license text so the "BSD 3-Clause License" link lands on
// the actual terms rather than the repo home.
const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

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

  // In the Tauri webview a plain anchor would navigate the app window away from
  // the UI, so hand the URL to the OS default browser instead. href/target/rel
  // stay as the fallback for browser-only dev (pnpm dev), where the plugin's
  // invoke has no backend and openUrl rejects — let the native anchor proceed.
  const openExternally =
    (url: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      void openUrl(url).catch(() => {
        window.open(url, "_blank", "noreferrer");
      });
    };

  return (
    <ResponsiveOverlay
      opened={opened}
      onClose={handleClose}
      title={t("about.title")}
    >
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap">
          <AppLogo size={40} decorative />
          <Title order={2} size="h4">
            {t("app.title")}
          </Title>
        </Group>
        <Stack gap={2}>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm">{t("about.version", { version: pkg.version })}</Text>
            <Text size="sm">{"-"}</Text>
            {__BUILD_INFO__ && (
              <Text size="sm" c="dimmed">
                {t("about.buildDetails", {
                  commit: __BUILD_INFO__.commit,
                  date: __BUILD_INFO__.date,
                })}
              </Text>
            )}
          </Group>
          <Text size="sm">{t("about.copyright")}</Text>
          <Text size="sm">
            {t("about.licensePrefix")}{" "}
            <Anchor
              href={LICENSE_URL}
              target="_blank"
              rel="noreferrer"
              onClick={openExternally(LICENSE_URL)}
            >
              {t("about.license")}
            </Anchor>
          </Text>
          <Text size="sm">
            {t("about.homepage")}{" "}
            <Anchor
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              onClick={openExternally(REPO_URL)}
            >
              {REPO_URL}
            </Anchor>
          </Text>
        </Stack>
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
