// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Assert-based self-check for the electron-shell diagram generator (no test
// framework). Run via `pnpm check` (or
// `pnpm exec vite-node src/lib/electronShellDiagram.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.

import assert from "node:assert/strict";
import { buildElectronShellDiagram } from "./electronShellDiagram";

// (1) Geometry/header for a two-shell element. size = 300 + 100*2 = 500.
const svg = buildElectronShellDiagram(3,"Li","Lithium","1s2 2s1",[2, 1],"#00ffa0");

assert(
  svg.includes('viewBox="-500 -500 1000 1000"'),
  "viewBox should use -size -size and 2*size",
);
assert(
  svg.includes('width="400" height="400"'),
  "width/height should be size-100",
);
assert(
  svg.includes('<circle fill="#00ffa0" r="200" stroke="#404040"'),
  "nucleus should carry the fill color and r=200",
);
assert(svg.includes(">3</text>"), "atomic number should render");
assert(svg.includes(">Li</text>"), "symbol should render");
assert(svg.includes(">1s2 2s1</text>"), "electron configuration should render");
assert(svg.includes("role=\"img\""), "SVG should have role");
assert(svg.includes("aria-label="), "SVG should have aria-label");

// (2) Shell markup must be byte-identical to the reference Python output.
// shells=[2,1]: inner orbit r=300 with 2 electrons (top + rotate(180)),
// outer orbit r=400 with 1 electron (top only).
const expectedShells = [
  '<circle fill="none" r="300"/>',
  '<circle r="30" cy="-300"/>',
  '<circle r="30" cy="-300" transform="rotate(180)"/>',
  '<circle fill="none" r="400"/>',
  '<circle r="30" cy="-400"/>',
].join("\n");
assert(
  svg.includes(expectedShells),
  `shell markup mismatch; got:\n${svg}`,
);

// (3) Degree truncation matches Python int(): shell of 3 → angle 120, dots at
// rotate(120) and rotate(240) (both already integers); shell of 7 → angle
// 51.428..., so i=1 → trunc 51, i=2 → trunc 102.
const s3 = buildElectronShellDiagram(1, "X", "X", "x", [3], "grey");
assert(s3.includes('transform="rotate(120)"'), "3-shell: 120deg dot");
assert(s3.includes('transform="rotate(240)"'), "3-shell: 240deg dot");

const s7 = buildElectronShellDiagram(1, "X", "X", "x", [7], "grey");
assert(s7.includes('transform="rotate(51)"'), "7-shell: trunc(51.42)=51");
assert(s7.includes('transform="rotate(102)"'), "7-shell: trunc(102.85)=102");
assert(!s7.includes('transform="rotate(52)"'), "7-shell: must truncate, not round");
assert(!s7.includes('transform="rotate(103)"'), "7-shell: must truncate, not round");

// (6) Empty shells is rejected — a diagram needs at least one shell.
let threw = false;
try {
  buildElectronShellDiagram(1, "X", "X", "x", [], "grey");
} catch {
  threw = true;
}
assert(threw, "empty shells should throw");

console.log("ok: electron-shell diagram generator validated");
