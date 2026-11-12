// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// The app's SVG icons. The logo and gear artwork live in src/assets files (one
// source each), imported here: the logo as a bundled URL, the gear as raw
// markup inlined into the DOM. The radiation trefoil is a handful of paths, so
// it is drawn inline.

import { useTranslation } from "react-i18next";
import logoUrl from "../assets/logo.svg";
import gearMarkup from "../assets/gear.svg?raw";

interface AssetProps {
  size?: number;
}

interface AppLogoProps extends AssetProps {
  // When the logo sits inside a labelled control (the header's About button),
  // the button already carries the accessible name, so the image must be
  // decorative (alt="") to avoid announcing the app title twice.
  decorative?: boolean;
}

// Small app brand mark (the same artwork as the Tauri app icon). Standalone it
// carries the accessible name identifying the app; inside a labelled
// button it is decorative so the name is not announced twice.
export function AppLogo({ size = 28, decorative = false }: AppLogoProps) {
  const { t } = useTranslation("ui");
  return (
    <img
      src={logoUrl}
      alt={decorative ? "" : t("app.title")}
      width={size}
      height={size}
    />
  );
}

// Gear (settings) icon. Decorative: its accessible name comes from the
// consuming ActionIcon's aria-label ("Open settings"), so the
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

// Standard radiation trefoil in the fixed hazard colors (black on yellow, not
// theme-dependent). Three 60°-wide blades at 120° apart around a central disc.
// Carries its own accessible name (role="img" + aria-label + <title>).
export function RadioactiveIcon({ label, size = 18 }: { label: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      fill="black"
    >
      <title>{label}</title>
      <circle r="48" fill="yellow" stroke="black" strokeWidth="4" />
      <circle r="12" />
      {[0, 120, 240].map((deg) => (
        <path
          key={deg}
          transform={`rotate(${deg})`}
          // Annular sector from 16→42 radius spanning -30°..30°.
          d="M -8 -14 a 16 16 0 0 1 16 0 l 13 -22 a 42 42 0 0 0 -42 0 z"
        />
      ))}
    </svg>
  );
}
