# Documentation Rules

When to update TSDoc:

- Added or modified an exported function/type/class in `src/utils/` or `src/hooks/` → update its TSDoc block
- Changed a function signature → update `@param`/`@returns`
- After any TSDoc change → run `npm run docs:build` to verify no warnings

When to update `ARCHITECTURE.md`:

- New React Context provider added
- New architectural pattern introduced (new hook category, new DB operation type, new provider)
- Key invariant added or removed
- Navigation structure changed

When to add a file to `guides/`:

- New major workflow that spans multiple files/layers (e.g. new import pipeline, new form type)
- New dev setup requirement (new env var, new native dependency)

Never:

- Add inline comments inside React components unless the *why* is genuinely non-obvious
- Add TSDoc to non-exported (private) functions unless logic is complex and surprising
