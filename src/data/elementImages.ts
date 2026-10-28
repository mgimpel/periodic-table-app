// Copyright (C) 2026 Marc Gimpel.
// This file is part of the Periodic Table App project
// (https://github.com/mgimpel/periodic-table-app).
// SPDX-License-Identifier: BSD-3-Clause

// Bundle the element photos (keyed by English element name, e.g. "Hydrogen").
// import.meta.glob with eager+url is Vite's native way to ship a whole asset
// folder and map it by filename — no runtime fetch, no new dependency. Not every
// element has a photo; missing names resolve to undefined.
const ELEMENT_IMAGES = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../assets/images/*.webp", {
      eager: true,
      import: "default",
      query: "?url",
    }),
  ).map(([path, url]) => [
    path.slice(path.lastIndexOf("/") + 1, -".webp".length),
    url,
  ]),
) as Record<string, string>;

/** Bundled photo URL for an element's English name, or undefined if none. */
export function elementImageUrl(name: string): string | undefined {
  return ELEMENT_IMAGES[name];
}

// Emission spectrum strips, bundled and keyed the same way (CC0, see
// ../assets/spectra/spectra.LICENSE.txt). Not every element has one.
const ELEMENT_SPECTRA = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>("../assets/spectra/*.webp", {
      eager: true,
      import: "default",
      query: "?url",
    }),
  ).map(([path, url]) => [
    path.slice(path.lastIndexOf("/") + 1, -".webp".length),
    url,
  ]),
) as Record<string, string>;

/** Bundled spectrum URL for an element's English name, or undefined if none. */
export function elementSpectrumUrl(name: string): string | undefined {
  return ELEMENT_SPECTRA[name];
}
