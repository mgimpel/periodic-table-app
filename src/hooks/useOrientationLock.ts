// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Mobile orientation-lock shim around the Web Screen Orientation API, plus the
// fallback notice state. On mobile it attempts to lock the display to
// landscape on mount; when the lock is denied or unsupported (iOS) it reports
// `showNotice` until the user dismisses it or rotates the device. Desktop/web
// never attempts a lock and never shows the notice.

import { useEffect, useState } from "react";
import { isMobilePlatform } from "../lib/platform";

// The Screen Orientation `lock` method is not in the standard lib DOM types and
// is absent on some platforms (notably iOS WKWebView). Type it as optional so
// the missing-API case is a plain runtime check, not a type error.
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

export function useOrientationLock(): {
  showNotice: boolean;
  dismissNotice: () => void;
} {
  // Read once per mount: the platform can't change mid-session.
  const [mobile] = useState(() => isMobilePlatform());
  // True only once a lock attempt has failed (denied or unsupported); the
  // successful path leaves it false. This is the only signal the notice needs.
  const [lockFailed, setLockFailed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!mobile) return;

    let cancelled = false;
    const orientation = screen.orientation as LockableOrientation | undefined;

    const run = async () => {
      try {
        // Missing API (undefined orientation or lock) → fallback path.
        if (!orientation?.lock) {
          if (!cancelled) setLockFailed(true);
          return;
        }
        // Success: leave lockFailed false, so no notice shows.
        await orientation.lock("landscape");
      } catch {
        // Rejected (denied / unsupported) → fallback path.
        if (!cancelled) setLockFailed(true);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [mobile]);

  const showNotice = mobile && lockFailed && !dismissed;

  // The notice asks the user to rotate; once they do, it has served its
  // purpose, so auto-dismiss it on the next rotation. Only listen while it is
  // showing, so the listener is absent when there is nothing to close.
  // screen.orientation's "change" is the modern signal; window
  // "orientationchange" is the legacy fallback (iOS/older WebViews), so we
  // listen for both.
  useEffect(() => {
    if (!showNotice) return;
    const dismiss = () => setDismissed(true);
    const orientation = screen.orientation;
    orientation?.addEventListener?.("change", dismiss);
    window.addEventListener("orientationchange", dismiss);
    return () => {
      orientation?.removeEventListener?.("change", dismiss);
      window.removeEventListener("orientationchange", dismiss);
    };
  }, [showNotice]);

  return { showNotice, dismissNotice: () => setDismissed(true) };
}
