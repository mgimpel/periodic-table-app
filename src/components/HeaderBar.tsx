// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { ActionIcon, Group, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { AppLogo, GearIcon } from "./Asset";
import { ColoringSchemeControl } from "./ColoringSchemeControl";
import type { ColoringSchemeOption } from "../lib/coloringScheme";
import classes from "./HeaderBar.module.css";

interface HeaderBarProps {
  onOpenAbout: () => void;
  logoButtonRef: React.RefObject<HTMLButtonElement | null>;
  onOpenSettings: () => void;
  settingsButtonRef: React.RefObject<HTMLButtonElement | null>;
  // Coloring-scheme dropdown lives on the right of the header; AppLayout owns
  // the value because PeriodicTable reads it.
  coloringScheme: ColoringSchemeOption;
  onColoringSchemeChange: (option: ColoringSchemeOption) => void;
}

// Thin header bar: Logo left, Title centered (truncating, not wrapping), and on
// the right the coloring-scheme dropdown then the gear Settings_Button (Req
// 1.2-1.5, 1.7, 1.9). The dropdown sits to the LEFT of the gear so the gear
// stays at the far right where users expect it. The Group pins the edges while
// the flex:1 centered Title truncates; the ActionIcon is a >=44x44 touch target
// (Req 1.8, 6.3) and carries the accessible name (Req 6.1). ref lets the
// Settings_Panel return focus here on close (Req 6.9).
export function HeaderBar({
  onOpenAbout,
  logoButtonRef,
  onOpenSettings,
  settingsButtonRef,
  coloringScheme,
  onColoringSchemeChange,
}: HeaderBarProps) {
  const { t } = useTranslation("ui");
  return (
    <Group
      component="header"
      className={classes.header}
      px="sm"
      gap="sm"
      wrap="nowrap"
    >
      {/* The logo opens the About panel. It mirrors the gear ActionIcon
          (variant="subtle", size={32}) for a consistent >=44x44 touch target,
          and the logo is decorative so only the button's aria-label is
          announced (not the app title twice). */}
      <ActionIcon
        ref={logoButtonRef}
        variant="subtle"
        size={32}
        radius="sm"
        aria-label={t("header.openAbout")}
        onClick={onOpenAbout}
      >
        <AppLogo size={32} decorative />
      </ActionIcon>
      <Title
        order={1}
        size="h3"
        style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        ta="center"
      >
        {t("app.title")}
      </Title>
      <ColoringSchemeControl
        value={coloringScheme}
        onChange={onColoringSchemeChange}
      />
      <ActionIcon
        ref={settingsButtonRef}
        variant="subtle"
        size={32}
        radius="sm"
        aria-label={t("header.openSettings")}
        onClick={onOpenSettings}
      >
        <GearIcon />
      </ActionIcon>
    </Group>
  );
}
