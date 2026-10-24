// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Best-effort, synchronous mobile-platform detection. Used to gate
// useOrientationLock and mobile-only UI (Req 1.1 mobile landscape lock,
// Req 1.3 desktop follows the OS). Kept synchronous so callers (hooks, render)
// can branch without awaiting.
//
// Tauri 2's core @tauri-apps/api exposes no synchronous OS-platform API — the
// platform() call lives in the separate @tauri-apps/plugin-os package, which
// would add a dependency and a capability permission. Both the Tauri mobile
// WebView (Android/iOS) and a mobile browser dev target report the OS in the
// user-agent string, so a UA heuristic covers both without that dependency.
// ponytail: UA sniffing is a heuristic with a known ceiling — spoofed or
// unusual user-agents can misclassify. Upgrade path: depend on
// @tauri-apps/plugin-os and read platform() === "android" | "ios" when exact
// native detection is needed.

/**
 * Returns true when the app is running on a mobile platform (Android or iOS),
 * best-effort from the user-agent. Returns false in unknown/non-browser
 * environments (treated as desktop, the safe default for orientation).
 */
export function isMobilePlatform(): boolean {
  const ua =
    typeof navigator !== "undefined" && typeof navigator.userAgent === "string"
      ? navigator.userAgent
      : "";
  return isMobileUserAgent(ua);
}

/**
 * Pure UA classifier, split out so it can be exercised without a live
 * `navigator`. Matches Android and the iOS family (iPhone/iPad/iPod), including
 * iPadOS, which reports as "Macintosh" but with touch points.
 */
export function isMobileUserAgent(
  userAgent: string,
  maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0,
): boolean {
  if (/Android/i.test(userAgent)) return true;
  if (/iPhone|iPad|iPod/i.test(userAgent)) return true;
  // iPadOS 13+ masquerades as desktop Safari ("Macintosh") but is a touch
  // device; distinguish it from a real Mac by the presence of touch points.
  if (/Macintosh/i.test(userAgent) && maxTouchPoints > 1) return true;
  return false;
}
