// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

import logoUrl from "../assets/logo.svg";

interface AppLogoProps {
  size?: number;
}

// Small app mark rendered from the bundled brand asset (src/assets/logo.svg,
// the same artwork as the Tauri app icon). alt carries the accessible name
// identifying the app (Req 6.2); an empty alt would hide it from assistive tech.
export function AppLogo({ size = 28 }: AppLogoProps) {
  return (
    <img
      src={logoUrl}
      alt="Periodic Table App"
      width={size}
      height={size}
    />
  );
}
