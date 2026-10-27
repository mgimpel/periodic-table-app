// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// SVG assets used in the header. The artwork lives in src/assets files (one
// source each), imported here: the logo as a bundled URL, the gear as raw
// markup inlined into the DOM.

import { useTranslation } from "react-i18next";
import logoUrl from "../assets/logo.svg";
import gearMarkup from "../assets/gear.svg?raw";

interface AssetProps {
  size?: number;
}

// Small app brand mark (the same artwork as the Tauri app icon). alt carries
// the accessible name identifying the app (Req 6.2); an empty alt would hide
// it from assistive tech.
export function AppLogo({ size = 28 }: AssetProps) {
  const { t } = useTranslation("ui");
  return <img src={logoUrl} alt={t("app.title")} width={size} height={size} />;
}

// Gear (settings) icon. Decorative: its accessible name comes from the
// consuming ActionIcon's aria-label ("Open settings", Req 6.1/6.2), so the
// wrapper is hidden from assistive tech.
//
// The gear.svg is inlined (not an <img>) so its stroke="currentColor" inherits
// the ActionIcon's theme text color and its background stays transparent — an
// <img>/mask approach paints a box that doesn't match the theme background.
// The source file sizes to 24px; wrap it so the caller's size controls it and
// the inline SVG scales to fill.
export function GearIcon({ size = 24 }: AssetProps) {
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex", width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: gearMarkup }}
    />
  );
}
