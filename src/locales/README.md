# Locales

Translation resources for the app. Two namespaces per locale:

- `ui.json` — UI chrome (titles, buttons, aria labels, notices, detail field
  labels, category labels).
- `elements.json` — element data: `name.<atomicNumber>` and (English only)
  `summary.<atomicNumber>`.

`index.ts` is the single registry that both the i18next bootstrap (`src/i18n.ts`)
and the pure language core (`src/lib/language.ts`) consume.

## Add a language

To add locale `xx`:

1. Create `src/locales/xx/ui.json` and `src/locales/xx/elements.json` (copy the
   `en/` files and translate). `elements.json` needs at least all `name.*` and
   the `category.*` keys in `ui.json`; `summary.*` can be omitted (see below).
2. Add one import pair and one entry to `resources` in `src/locales/index.ts`.
3. Add the human language name under `ui:language.xx` in each language file so
   the option shows its own label.

No component, control, lib, or bootstrap code changes.

## Summary fallback ceiling

French (and any future locale) ships translated element **names** and
**category labels**, but element **summaries** — and the free-text
`appearance` / `discoveredBy` / `namedBy` fields — are not hand-translated for
all 118 elements. Any missing `summary.<n>` (or free-text field) falls back to
the English string per-key via i18next `fallbackLng: "en"` with
`returnNull: false`. The fallback is a clean English string, never a blank or a
raw key. This is an intentional, documented ceiling — a later data-entry task
can fill the translated summaries in without any code change.

## `en/elements.json` provenance

`en/elements.json` is a committed static file whose `name.*` / `summary.*`
values are the dataset's own strings, extracted once from `src/data/elements.ts`
(`ELEMENTS`). It is never hand-transcribed. `src/locales/elements.check.ts` is a
permanent sync guard asserting the English resource still equals the dataset, so
a future data change that is not re-extracted fails the check loudly.
