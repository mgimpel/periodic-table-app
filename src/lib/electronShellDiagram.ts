// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Pure generator for an element's electron-shell (Bohr) diagram as an SVG string.
// Framework- and data-agnostic: callers pass primitives (atomic number, symbol,
// electron configuration, shell occupancies, fill color) rather than an Element,
// so the function stays testable in isolation.
//
// Geometry mirrors the reference Python generator exactly: the nucleus sits at
// the origin (r=200), each shell is an orbit circle at r = 300 + index*100 with
// its electrons drawn as r=30 dots on that orbit. The first electron sits at the
// top (cy = -(radius), no rotation) and the rest are spaced evenly by rotating
// i * (360/shell) degrees. Degrees are truncated to integers to match the Python
// `int(i*angle)`, so the two implementations produce byte-identical shell markup.

/** Nucleus radius in user units. */
const NUCLEUS_RADIUS = 200;
/** Radius of the innermost electron orbit. */
const FIRST_SHELL_RADIUS = 300;
/** Radial gap between successive shells. */
const SHELL_SPACING = 100;

/** Build the inner `<g>` markup: one orbit circle plus evenly spaced electrons per shell. */
function buildShellsMarkup(shells: number[]): string {
  const lines: string[] = [];
  shells.forEach((shell, index) => {
    const radius = FIRST_SHELL_RADIUS + index * SHELL_SPACING;
    lines.push(`<circle fill="none" r="${radius}"/>`);
    lines.push(`<circle r="30" cy="-${radius}"/>`);
    if (shell > 1) {
      const angle = 360 / shell;
      for (let i = 1; i < shell; i++) {
        // Math.trunc matches Python's int() (truncation toward zero); angle*i is
        // always non-negative here so it equals Math.floor too.
        lines.push(
          `<circle r="30" cy="-${radius}" transform="rotate(${Math.trunc(
            i * angle,
          )})"/>`,
        );
      }
    }
  });
  return lines.join("\n");
}

/**
 * Generate the SVG document (as a string) for an element's electron-shell diagram.
 *
 * @throws if `shells` is empty — a diagram needs at least one shell.
 */
export function buildElectronShellDiagram(
  atomicNumber: number,
  symbol: string,
  electronConfiguration: string,
  shells: number[],
  color: string
): string {
  if (shells.length === 0) {
    throw new Error("buildElectronShellDiagram: `shells` must not be empty");
  }

  const size = 300 + 100 * shells.length;
  const viewSize = 2 * size;
  const dimension = size - 100;
  const electronConf = electronConfiguration;

  return `<svg version="1.1" xmlns="http://www.w3.org/2000/svg"
viewBox="-${size} -${size} ${viewSize} ${viewSize}" width="${dimension}" height="${dimension}">
<circle fill="${color}" r="${NUCLEUS_RADIUS}" stroke="#404040" stroke-width="8"/>
<text x="0" y="-100" font-size="50" font-weight="bold" font="arial" text-anchor="middle">${atomicNumber}</text>
<text x="0" y="50" font-size="150" font-weight="bold" font="arial" text-anchor="middle">${symbol}</text>
<text x="0" y="125" font-size="28" font="arial" text-anchor="middle">${electronConf}</text>
<g fill="grey" stroke="grey" stroke-width="8">
${buildShellsMarkup(shells)}
</g>
</svg>
`;
}
