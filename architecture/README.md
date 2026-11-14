# Architecture

Recipedia: single-user, local-first recipe app (React Native + Expo). Fully
on-device — no backend, no cloud sync. Data in SQLite. iOS + Android only,
portrait.

| Doc                                          | Covers                                                          |
| -------------------------------------------- | --------------------------------------------------------------- |
| [overview.md](overview.md)                   | Capabilities, offline model, canonical data flow                |
| [database.md](database.md)                   | `RecipeDatabase` singleton, tables, encoding, cache, migrations |
| [state.md](state.md)                         | Contexts, reactive DB hooks, idle-time scheduling               |
| [navigation.md](navigation.md)               | Navigator tree, freezing, error boundaries, share, preloading   |
| [components.md](components.md)               | Atomic Design layers                                            |
| [recipe-form.md](recipe-form.md)             | RHF form, guard, scaling, search-field focus mode, validation   |
| [bulk-import.md](bulk-import.md)             | Bulk import pipeline, providers, validation phases              |
| [invariants.md](invariants.md)               | Code, DB, test, i18n, native rules that must hold               |
| [ui-invariants.md](ui-invariants.md)         | Images, design tokens, theme, safe area, numbers, styles        |
| [conventions.md](conventions.md)             | File naming                                                     |
| [feature-checklist.md](feature-checklist.md) | Steps for a non-trivial feature                                 |
