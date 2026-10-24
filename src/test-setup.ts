// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Global Vitest setup, wired via `setupFiles` in vite.config.ts.
//
// 1. Register the jest-dom matchers (toBeInTheDocument, etc.) once for every
//    test file so component tests don't each have to import them.
// 2. Polyfill window.matchMedia, which jsdom does not implement. Mantine's
//    MantineProvider and useMediaQuery call it on mount, so without this every
//    component test that renders a Mantine tree throws. Defaults to "not
//    matched" (mobile-first); individual tests can override per query.
import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
