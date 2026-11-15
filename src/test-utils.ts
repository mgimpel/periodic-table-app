// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Shared test helpers (not a test file; imported by tests that need them).

const NATIVE_OS_KEY = "__TAURI_OS_PLUGIN_INTERNALS__";

/**
 * Fake the native OS binding that @tauri-apps/plugin-os' `platform()` reads, so
 * tests drive the real `currentPlatform()` / `isMobilePlatform()` without
 * mocking a module. Pass `undefined` to remove it, which makes `platform()`
 * throw exactly as it does in a plain browser.
 */
export function setNativePlatform(os: string | undefined): void {
  if (os === undefined) {
    Reflect.deleteProperty(window, NATIVE_OS_KEY);
  } else {
    Object.assign(window, { [NATIVE_OS_KEY]: { platform: os } });
  }
}

/** Narrow a queried element to an <input>, failing loudly if it is not one. */
export function asInput(element: Element | null): HTMLInputElement {
  if (!(element instanceof HTMLInputElement)) {
    throw new Error("expected an <input> element");
  }

  return element;
}

/** Narrow every queried element to an <input> (e.g. a radio group). */
export function asInputs(elements: readonly Element[]): HTMLInputElement[] {
  return elements.map(asInput);
}

/** Narrow a possibly-null query result to an HTMLElement, failing loudly if absent. */
export function asHtmlElement(element: Element | null): HTMLElement {
  if (!(element instanceof HTMLElement)) {
    throw new Error("expected an HTML element");
  }

  return element;
}
