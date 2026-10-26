// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import { ActionIcon, Group, Title } from "@mantine/core";
import { AppLogo, GearIcon } from "./Asset";
import classes from "./HeaderBar.module.css";

interface HeaderBarProps {
  onOpenSettings: () => void;
  settingsButtonRef: React.RefObject<HTMLButtonElement | null>;
}

// Thin header bar: Logo left, Title centered (truncating, not wrapping), and a
// gear Settings_Button right (Req 1.2-1.5, 1.7, 1.9). The Group pins logo and
// button to the edges while the flex:1 centered Title truncates; the ActionIcon
// is a >=44x44 touch target (Req 1.8, 6.3) and carries the accessible name
// (Req 6.1). ref lets the Settings_Panel return focus here on close (Req 6.9).
export function HeaderBar({ onOpenSettings, settingsButtonRef }: HeaderBarProps) {
  return (
    <Group
      component="header"
      className={classes.header}
      px="sm"
      gap="sm"
      wrap="nowrap"
    >
      <AppLogo size="32" />
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
        Periodic Table of Elements
      </Title>
      <ActionIcon
        ref={settingsButtonRef}
        variant="subtle"
        size={32}
        aria-label="Open settings"
        onClick={onOpenSettings}
      >
        <GearIcon />
      </ActionIcon>
    </Group>
  );
}
