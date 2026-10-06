---
paths:
  - "tests/**"
  - "src/**"
---

# Testing Rules

- Unit tests: `tests/unit/` mirroring `src/` path — `src/foo/Bar.tsx` → `tests/unit/foo/Bar.test.tsx`
- Integration tests: real code paths, mock only native modules — no mocking of hooks, RecipeDatabase, or fuzzy index
- All mocks: `tests/mocks/` — never inline in test files, never mock custom hooks unless unavoidable
- Mock components must render all props: functional props as `<Button onPress={prop}>`, others as `<Text>{prop}</Text>`
- React Native Paper: globally mocked (jest config) — check before creating new mocks
- No comments in test files — names must self-document
- Coverage goal: 100% (excludes translations, assets, navigation boilerplate)
