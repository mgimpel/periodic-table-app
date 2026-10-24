// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Mobile orientation-lock shim around the Web Screen Orientation API. On mount
// (when enabled) it attempts to lock the display to landscape and reports
// whether the lock was attempted and whether it succeeded, so the UI can show
// the Req 1.5 fallback notice when the lock is denied or unsupported (iOS).

import { useEffect, useState } from "react";

export interface OrientationLockState {
  /** True once a lock attempt has run (mount with enabled). */
  attempted: boolean;
  /** True only when the lock resolved successfully. */
  locked: boolean;
}

// The Screen Orientation `lock` method is not in the standard lib DOM types and
// is absent on some platforms (notably iOS WKWebView). Type it as optional so
// the missing-API case is a plain runtime check, not a type error.
type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

export function useOrientationLock(enabled: boolean): OrientationLockState {
  const [state, setState] = useState<OrientationLockState>({
    attempted: false,
    locked: false,
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const orientation = screen.orientation as LockableOrientation | undefined;

    const run = async () => {
      try {
        // Missing API (undefined orientation or lock) → fallback path.
        if (!orientation?.lock) {
          if (!cancelled) setState({ attempted: true, locked: false });
          return;
        }
        await orientation.lock("landscape");
        if (!cancelled) setState({ attempted: true, locked: true });
      } catch {
        // Rejected (denied / unsupported) → fallback path.
        if (!cancelled) setState({ attempted: true, locked: false });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return state;
}
