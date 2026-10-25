// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Best-effort, synchronous OS-platform detection. Used to gate
// useOrientationLock and mobile-only UI (Req 1.1 mobile landscape lock,
// Req 1.3 desktop follows the OS). Kept synchronous so callers (hooks, render)
// can branch without awaiting.
//
// Primary source: @tauri-apps/plugin-os platform(), which the plugin injects
// synchronously at WebView startup (no async IPC) and which reports Rust's
// std::env::consts::OS. Fallback: the pure user-agent heuristic below, used
// whenever the native binding is absent or throws — i.e. a plain browser
// (`pnpm dev`), the vitest/jsdom env, or any non-Tauri context.
// ponytail: the UA fallback is a heuristic with a known ceiling — spoofed or
// unusual user-agents can misclassify. It only runs outside a Tauri WebView,
// where platform() has no backing; inside Tauri the native value wins.

import { platform } from "@tauri-apps/plugin-os";

/** The platforms detectPlatform can identify; "unknown" is the safe default. */
export type Platform =
  | "windows"
  | "macos"
  | "linux"
  | "android"
  | "ios"
  | "unknown";

/**
 * Current OS platform. Prefers the native @tauri-apps/plugin-os platform()
 * call (synchronous — injected at WebView startup); falls back to the UA
 * heuristic on any failure (not in a Tauri WebView, throws, or an OS value
 * outside the Platform union). Stays synchronous so callers needn't await.
 */
export function currentPlatform(): Platform {
  try {
    switch (platform()) {
      case "windows":
        return "windows";
      case "macos":
        return "macos";
      case "linux":
        return "linux";
      case "android":
        return "android";
      case "ios":
        return "ios";
      // Other OS values (e.g. "freebsd") → fall through to "unknown".
    }
  } catch {
    // No native binding (plain browser / dev / vitest) → UA fallback below.
  }
  return detectPlatform(currentUserAgent());
}

/**
 * Returns true when the app is running on a mobile platform (Android or iOS).
 * Prefers the native platform(), falling back to the user-agent heuristic.
 * Returns false in unknown/non-browser environments (treated as desktop, the
 * safe default for orientation).
 */
export function isMobilePlatform(): boolean {
  const platform = currentPlatform();
  return platform === "android" || platform === "ios";
}

/** Current user-agent, or "" in a non-browser env. Shared by the wrappers. */
function currentUserAgent(): string {
  return typeof navigator !== "undefined" &&
    typeof navigator.userAgent === "string"
    ? navigator.userAgent
    : "";
}

/**
 * Pure OS classifier from a user-agent — the single source of truth the other
 * classifiers consult. Order matters: Android's UA also contains "Linux", and
 * iPadOS reports as "Macintosh", so the mobile OSes are matched before their
 * desktop lookalikes. iPadOS 13+ masquerades as desktop Safari ("Macintosh")
 * but is a touch device, so touch points disambiguate it from a real Mac.
 * Returns "unknown" when nothing matches (non-browser env or unusual UA).
 */
export function detectPlatform(
  userAgent: string,
  maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0,
): Platform {
  if (/Android/i.test(userAgent)) return "android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "ios";
  if (/Windows/i.test(userAgent)) return "windows";
  // iPadOS before macOS: a touch-enabled "Macintosh" is really an iPad.
  if (/Macintosh|Mac OS X/i.test(userAgent)) {
    return maxTouchPoints > 1 ? "ios" : "macos";
  }
  if (/Linux/i.test(userAgent)) return "linux";
  return "unknown";
}
