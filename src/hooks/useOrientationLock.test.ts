// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Unit tests for useOrientationLock. Covers the three lock outcomes that drive
// the Req 1.5 fallback notice: resolve (locked), reject (denied), and missing
// API (unsupported, e.g. iOS), plus the disabled-on-desktop no-attempt path.
// Validates: Requirements 1.5

import { describe, it, expect, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useOrientationLock } from "./useOrientationLock";

// Swap screen.orientation for the duration of a test, then restore it. The
// property is replaced (not just .lock) so the "missing API entirely" case can
// set orientation to undefined. getOwnPropertyDescriptor captures the original
// so we don't leak a fake across tests.
const originalDescriptor = Object.getOwnPropertyDescriptor(screen, "orientation");

function setOrientation(value: unknown): void {
  Object.defineProperty(screen, "orientation", {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  if (originalDescriptor) {
    Object.defineProperty(screen, "orientation", originalDescriptor);
  } else {
    // jsdom may not define it natively; drop the fake so nothing leaks.
    delete (screen as unknown as { orientation?: unknown }).orientation;
  }
  vi.restoreAllMocks();
});

describe("useOrientationLock", () => {
  it("reports locked when the orientation lock resolves", async () => {
    const lock = vi.fn().mockResolvedValue(undefined);
    setOrientation({ lock });

    const { result } = renderHook(() => useOrientationLock(true));

    await waitFor(() => expect(result.current.attempted).toBe(true));
    expect(result.current.locked).toBe(true);
    expect(lock).toHaveBeenCalledWith("landscape");
  });

  it("falls back (attempted, not locked) when the lock is rejected", async () => {
    const lock = vi.fn().mockRejectedValue(new Error("denied"));
    setOrientation({ lock });

    const { result } = renderHook(() => useOrientationLock(true));

    await waitFor(() => expect(result.current.attempted).toBe(true));
    expect(result.current.locked).toBe(false);
    expect(lock).toHaveBeenCalledWith("landscape");
  });

  it("falls back (attempted, not locked) when the lock API is missing", async () => {
    // Orientation present but without a lock method (one unsupported shape)...
    setOrientation({});

    const { result, rerender } = renderHook(() => useOrientationLock(true));

    await waitFor(() => expect(result.current.attempted).toBe(true));
    expect(result.current.locked).toBe(false);

    // ...and with no orientation object at all (e.g. iOS WKWebView).
    setOrientation(undefined);
    rerender();
    await waitFor(() => expect(result.current.attempted).toBe(true));
    expect(result.current.locked).toBe(false);
  });

  it("does not attempt a lock when disabled (desktop)", async () => {
    const lock = vi.fn().mockResolvedValue(undefined);
    setOrientation({ lock });

    const { result } = renderHook(() => useOrientationLock(false));

    // Give any (unexpected) async effect a chance to run before asserting.
    await Promise.resolve();
    expect(result.current.attempted).toBe(false);
    expect(result.current.locked).toBe(false);
    expect(lock).not.toHaveBeenCalled();
  });
});
