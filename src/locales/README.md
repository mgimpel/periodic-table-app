# Locales

Translation resources for the app. All files live flat in this folder, named
`<namespace>.<language-code>.json`. Two namespaces per locale:

- `ui.<xx>.json` — UI chrome (titles, buttons, aria labels, notices, detail
  field labels, category labels). A flat key/value map.
- `periodic-table.<xx>.json` — per-element translated text. It mirrors the
  source dataset (`src/data/periodic-table.json`): an `elements` array of
  `{ number, symbol, name, appearance, summary }`, carrying only the three
  translatable fields. `index.ts` adapts the array into the `periodicTable`
  i18next namespace keyed by atomic number (`name.<n>`, `appearance.<n>`,
  `summary.<n>`), dropping entries above 118.

`index.ts` is the single registry that both the i18next bootstrap (`src/i18n.ts`)
and the pure language core (`src/lib/language.ts`) consume.

## Add a language

To add locale `xx`:

1. Create `src/locales/ui.xx.json` and `src/locales/periodic-table.xx.json`
   (copy the `*.en.json` files and translate). `periodic-table.xx.json` keeps
   the source array shape; translate `name`, `appearance`, and `summary`. A
   `null` appearance stays `null`. The `category.*` labels live in `ui.xx.json`.
   Any field may be left as English (see below).
2. Add one import pair and one entry to `resources` in `src/locales/index.ts`.
3. Add the language name under `ui:language.xx` in each language file, written
   in that file's language (en `"de": "German"`, de `"de": "Deutsch"`).

`pnpm check` (`periodicTable.check.ts`) fails if a locale's `ui.xx.json` key set
differs from `en` or its `periodic-table.xx.json` lacks a name for any of the
118 elements.

No component, control, lib, or bootstrap code changes.

## English-fallback ceiling

Element `name`, `appearance`, and `summary` are translated through the
`periodicTable` namespace. The shipped `fr` / `es` / `de` / `it` / `pt` files
currently carry full translations of all three, but any value a locale leaves
as (or omits relative to) English still resolves to the English string per-key
via i18next `fallbackLng: "en"` with `returnNull: false` — never a blank or a
raw key. The free-text `discoveredBy` / `namedBy` detail fields are **not** in
this namespace; they render the raw dataset (English) value. This is an
intentional, documented ceiling — filling translations in later needs no code
change.

## `periodic-table.en.json` provenance

`periodic-table.en.json` is a committed static file whose `name` / `appearance`
/ `summary` values are the dataset's own strings (from
`src/data/periodic-table.json`, surfaced via `src/data/elements.ts` `ELEMENTS`).
It is never hand-transcribed. `src/locales/periodicTable.check.ts` is a permanent
sync guard asserting the English resource still equals the dataset, so a future
data change that is not mirrored fails the check loudly.
