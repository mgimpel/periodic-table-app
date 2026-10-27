// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import {
  SegmentedControl,
  useMantineColorScheme,
  type MantineColorScheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

// Theme picker: three mutually-exclusive color-scheme options wired straight
// into Mantine's color-scheme context (no local store). `value={colorScheme}`
// keeps exactly one option selected, defaulting to "auto" (Same as device)
// when nothing is stored.
export function ThemeControl() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const { t } = useTranslation("ui");
  return (
    <SegmentedControl
      value={colorScheme}
      onChange={(v) => setColorScheme(v as MantineColorScheme)}
      data={[
        { label: t("theme.light"), value: "light" },
        { label: t("theme.dark"), value: "dark" },
        { label: t("theme.auto"), value: "auto" },
      ]}
      aria-label={t("theme.label")}
      fullWidth
    />
  );
}
