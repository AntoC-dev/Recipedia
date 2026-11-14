# New feature checklist

For non-trivial features; skip steps that don't apply.

**Types**

- [ ] Define/extend types in `src/customTypes/`
- [ ] Export them; check nothing relies on the old shape

**Database (persisted data changes)**

- [ ] Column in the encoded type + `*ColumnsEncoding` array
- [ ] Encoding/decoding in `RecipeDatabase`
- [ ] `PRAGMA`-guarded `ALTER TABLE` migration in `init()`
- [ ] Expose via a focused hook (new or extended)

**Business logic**

- [ ] Utilities outside React components, in `src/utils/`
- [ ] TypeDoc on all exported functions
- [ ] Unit tests in `tests/unit/`

**UI**

- [ ] Correct atomic layer (atomic → molecule → organism → screen)
- [ ] React Native Paper components
- [ ] Light + dark themes via `useTheme().colors`
- [ ] i18n keys in `src/translations/en/` and `src/translations/fr/`

**Navigation (new screen)**

- [ ] Screen name + params in `ScreenTypes.tsx`
- [ ] Register in `RootNavigator.tsx` or `BottomTabs.tsx`

**Testing**

- [ ] Unit tests for new utilities
- [ ] Integration test for cross-module flows
- [ ] Maestro E2E if a user-visible workflow has burned regressions before

**Quality**

- [ ] `npm run quality` passes
- [ ] `npm run test:unit` passes
- [ ] `npm run test:integration` passes
