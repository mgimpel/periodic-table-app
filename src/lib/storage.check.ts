// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the shared storage helper (no test framework).
// Run via `pnpm check` (or `pnpm exec vite-node src/lib/storage.check.ts`).
// Stubs a minimal localStorage on globalThis so the four branches — normal
// read, throwing read, normal write, throwing write — all run outside a DOM.

import assert from "node:assert/strict";
import { persistPref, readPref } from "./storage";

// A total normalizer: echoes a string value, otherwise the default sentinel.
const normalize = (raw: unknown): string =>
  typeof raw === "string" ? raw : "DEFAULT";

function installStore(store: Pick<Storage, "getItem" | "setItem">): void {
  (globalThis as unknown as { window: { localStorage: unknown } }).window = {
    localStorage: store,
  };
}

// Working store: read-back returns the normalized stored value.
const backing = new Map<string, string>();
installStore({
  getItem: (k) => backing.get(k) ?? null,
  setItem: (k, v) => {
    backing.set(k, v);
  },
});

persistPref("k", "value");
assert.equal(readPref("k", normalize), "value", "normal read-back");
assert.equal(readPref("missing", normalize), "DEFAULT", "absent key -> default");

// Throwing read falls back via normalize(undefined), never throws.
installStore({
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {},
});
assert.equal(readPref("k", normalize), "DEFAULT", "throwing read -> default");

// Throwing write never throws and fires onSaveError with the thrown error.
const failure = new Error("quota");
installStore({
  getItem: () => null,
  setItem: () => {
    throw failure;
  },
});
let captured: unknown = null;
assert.doesNotThrow(
  () => persistPref("k", "v", (e) => (captured = e)),
  "throwing write must not throw",
);
assert.equal(captured, failure, "onSaveError receives the thrown error");

console.log("ok: storage helper self-check passed");