# Documentation Rules

When to update TSDoc:

- Added or modified an exported function/type/class in `src/utils/` or `src/hooks/` → update its TSDoc block
- Changed a function signature → update `@param`/`@returns`
- After any TSDoc change → run `npm run docs:build` to verify no warnings

When to update `architecture/` (index `architecture/README.md`):

- New React Context provider added → `state.md`
- New architectural pattern introduced (new hook category, new DB operation type, new provider) → matching topic doc
- Key invariant added or removed → `invariants.md` (UI rules: `ui-invariants.md`)
- Navigation structure changed → `navigation.md`
- New topic doc → add one line to `README.md` index
- Keep docs terse: bullets, tables, short sentences

When to add a file to `guides/`:

- New major workflow that spans multiple files/layers (e.g. new import pipeline, new form type)
- New dev setup requirement (new env var, new native dependency)

Never:

- Add inline comments inside React components unless the *why* is genuinely non-obvious
- Add TSDoc to non-exported (private) functions unless logic is complex and surprising
