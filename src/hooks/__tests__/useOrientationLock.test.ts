// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Unit tests for useOrientationLock. Covers the three lock outcomes that drive
// the Req 1.5 fallback notice: resolve (locked), reject (denied), and missing
// API (unsupported, e.g. iOS), the desktop no-attempt path, and dismissing the
// notice explicitly or by rotating.
// Validates: Requirements 1.5

import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useOrientationLock } from "../useOrientationLock";
import { isMobilePlatform } from "../../lib/platform";

vi.mock("../../lib/platform", () => ({ isMobilePlatform: vi.fn(() => true) }));

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

beforeEach(() => {
  vi.mocked(isMobilePlatform).mockReturnValue(true);
});

afterEach(() => {
  if (originalDescriptor) {
    Object.defineProperty(screen, "orientation", originalDescriptor);
  } else {
    // jsdom may not define it natively; drop the fake so nothing leaks.
    delete (screen as unknown as { orientation?: unknown }).orientation;
  }
  vi.clearAllMocks();
});

describe("useOrientationLock", () => {
  it("hides the notice when the orientation lock resolves", async () => {
    const lock = vi.fn().mockResolvedValue(undefined);
    setOrientation({ lock });

    const { result } = renderHook(() => useOrientationLock());

    await waitFor(() => expect(lock).toHaveBeenCalledWith("landscape"));
    await Promise.resolve();
    expect(result.current.showNotice).toBe(false);
  });

  it("shows the notice when the lock is rejected", async () => {
    const lock = vi.fn().mockRejectedValue(new Error("denied"));
    setOrientation({ lock });

    const { result } = renderHook(() => useOrientationLock());

    await waitFor(() => expect(result.current.showNotice).toBe(true));
    expect(lock).toHaveBeenCalledWith("landscape");
  });

  it("shows the notice when the lock API is missing", async () => {
    // Orientation present but without a lock method (one unsupported shape)...
    setOrientation({});
    const first = renderHook(() => useOrientationLock());
    await waitFor(() => expect(first.result.current.showNotice).toBe(true));
    first.unmount();

    // ...and with no orientation object at all (e.g. iOS WKWebView).
    setOrientation(undefined);
    const second = renderHook(() => useOrientationLock());
    await waitFor(() => expect(second.result.current.showNotice).toBe(true));
  });

  it("does not attempt a lock or show the notice on desktop", async () => {
    vi.mocked(isMobilePlatform).mockReturnValue(false);
    const lock = vi.fn().mockResolvedValue(undefined);
    setOrientation({ lock });

    const { result } = renderHook(() => useOrientationLock());

    // Give any (unexpected) async effect a chance to run before asserting.
    await Promise.resolve();
    expect(result.current.showNotice).toBe(false);
    expect(lock).not.toHaveBeenCalled();
  });

  it("hides the notice after dismissNotice()", async () => {
    setOrientation({});
    const { result } = renderHook(() => useOrientationLock());
    await waitFor(() => expect(result.current.showNotice).toBe(true));

    act(() => result.current.dismissNotice());
    expect(result.current.showNotice).toBe(false);
  });

  it("hides the notice when the device rotates", async () => {
    setOrientation({});
    const { result } = renderHook(() => useOrientationLock());
    await waitFor(() => expect(result.current.showNotice).toBe(true));

    act(() => {
      window.dispatchEvent(new Event("orientationchange"));
    });
    expect(result.current.showNotice).toBe(false);
  });
});
