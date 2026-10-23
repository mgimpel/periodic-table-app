// Assert-based self-check for the element data adapter (no test framework).
// Run with a TS runner (e.g. `pnpm exec vite-node src/data/elements.check.ts`).
// Throws on the first failed assertion, so any runner exits non-zero on failure.
// Uses no Node globals (no `process`) so it also type-checks under the app's
// DOM-only tsconfig without adding @types/node.

import { ELEMENTS, getElementByNumber } from './elements';
import { CATEGORY_COLORS, type ElementCategory } from './element';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

// (a) exactly 118 elements
assert(ELEMENTS.length === 118, `expected 118 elements, got ${ELEMENTS.length}`);

// (d) atomic numbers are the contiguous set 1..118
ELEMENTS.forEach((e, i) => {
  assert(e.atomicNumber === i + 1, `expected atomicNumber ${i + 1}, got ${e.atomicNumber}`);
});

const validCategories = new Set(Object.keys(CATEGORY_COLORS) as ElementCategory[]);
for (const e of ELEMENTS) {
  // (b) + (e) category is a valid key present in CATEGORY_COLORS
  assert(validCategories.has(e.category), `invalid category "${e.category}" for ${e.symbol}`);
  // (c) grid positions in range
  assert(e.xpos >= 1 && e.xpos <= 18, `xpos out of range for ${e.symbol}: ${e.xpos}`);
  assert(e.ypos >= 1 && e.ypos <= 10, `ypos out of range for ${e.symbol}: ${e.ypos}`);
}

// Spot-checks for known positions.
assert(getElementByNumber(1)?.xpos === 1, 'H should be in group/column 1');
assert(getElementByNumber(2)?.xpos === 18, 'He should be in column 18');
assert(getElementByNumber(26)?.category === 'transition-metal', 'Fe should be a transition metal');
assert(getElementByNumber(57)?.category === 'lanthanide', 'La should be a lanthanide');
assert(getElementByNumber(89)?.category === 'actinide', 'Ac should be an actinide');

console.log(`ok: ${ELEMENTS.length} elements validated`);
