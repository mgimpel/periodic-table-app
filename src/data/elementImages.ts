// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Map an eager glob of "<English name>.webp" asset URLs to a lookup keyed by the
// basename without extension (the element's English name, e.g. "Hydrogen").
// import.meta.glob must stay a literal call at each call site (Vite statically
// analyses the pattern), so only this transform is factored out.
function byName(glob: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(glob).map(([path, url]) => [
      path.slice(path.lastIndexOf("/") + 1, -".webp".length),
      url,
    ]),
  );
}

// Bundle the element photos (keyed by English element name, e.g. "Hydrogen").
// import.meta.glob with eager+url is Vite's native way to ship a whole asset
// folder and map it by filename — no runtime fetch, no new dependency. Not every
// element has a photo; missing names resolve to undefined.
const ELEMENT_IMAGES = byName(
  import.meta.glob<string>("../assets/images/*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
);

/** Bundled photo URL for an element's English name, or undefined if none. */
export function elementImageUrl(name: string): string | undefined {
  return ELEMENT_IMAGES[name];
}

// Emission spectrum strips, bundled and keyed the same way (CC0, see
// ../assets/spectra/spectra.LICENSE.txt). Not every element has one.
const ELEMENT_SPECTRA = byName(
  import.meta.glob<string>("../assets/spectra/*.webp", {
    eager: true,
    import: "default",
    query: "?url",
  }),
);

/** Bundled spectrum URL for an element's English name, or undefined if none. */
export function elementSpectrumUrl(name: string): string | undefined {
  return ELEMENT_SPECTRA[name];
}
