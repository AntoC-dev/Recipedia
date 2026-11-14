# UI invariants

Must hold, like [invariants.md](invariants.md).

## Images

- **Recipe images bounded before permanent storage.** `saveRecipeImage` runs
  every picked/captured/downloaded file through `resizeImageToBound`
  (`@utils/imageResize`): longest side capped at `MAX_IMAGE_DIMENSION`, original
  container format kept.
  - An 8–48MP camera file must never land verbatim in `documents/Recipedia/`.
  - Applies to new images only; existing libraries not rewritten (re-encoding a
    user's only copy is destructive).
- **`CustomImage` owns expo-image policy; call sites never set it.**
  - `recyclingKey` (the `uri`) and `cachePolicy` (`memory-disk`) fixed inside
    `CustomImage` — app-wide policy; callers neither pass nor override.
  - expo-image decodes to the view's _measured_ size → container must be
    measurable: fixed `size`, or flex/absolute layout resolving to real
    dimensions. Never inside an unconstrained auto-sized container.
- **`RecipeCard` stays on Paper `Card.Cover`, not `CustomImage`.**
  - Switching regressed Reassure by 20–47% on Search/Home benchmarks: extra
    per-row work (wrapper `View`, `useTheme`, two `useState`, placeholder `Icon`
    on no-uri path) over lists up to 1200 recipes.
  - Caveats: Reassure measures JS render under Jest (no native decode) → prices
    `CustomImage` cost, can't see expo-image decode benefit. Fixtures have empty
    `image_Source` → placeholder path production never hits → overstates cost,
    though wrapper + hooks are paid either way.
  - `MenuRecipeCard` is the deliberate exception: fixed 56px thumbnail
    (measured-size decode pays most) on a planned-menu list, not the whole
    library.
  - Revisit `RecipeCard` only with a `CustomImage` cheap enough for a hot list
    cell.

## Design tokens

**Never hardcode a UI size, weight, or separator.** One source of truth each; a
local constant or bare literal reintroduces drift.

| Token                                                | Module                | Covers                                                                                               |
| ---------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `iconsSize`                                          | `@assets/Icons`       | Every `Icon`/`IconButton` `size`, 4px ladder (`verySmall` 12 → `veryLarge` 40), scaled by `remValue` |
| `padding`, `radius`                                  | `@styles/spacing`     | All spacing and corner radii                                                                         |
| `tabScreenEdges`, `tabScreenBottomPadding`           | `@styles/spacing`     | Safe-area edges + bottom breathing room for tab-hosted screens                                       |
| `layout`                                             | `@styles/layout`      | Four formerly byte-identical blocks: `flexFill`, `dialogActions`, `emptyState`, `tutorialOverlay`    |
| `formatDecimalForDisplay`, `formatDecimalForStorage` | `@utils/NumberFormat` | Every float shown to the user / written to DB                                                        |

## Theme: fonts and colours

**Only from the Paper theme, never a local constant.** `src/styles/theme.tsx` is
the single source; `useTheme()` the only reader. No `colors.tsx` /
`typography.tsx` on purpose: a module-level palette can't follow light/dark —
that's how hardcoded hexes/weights drifted before.

- Colours: `const { colors } = useTheme()` → `colors.primary`,
  `colors.secondaryContainer`, `colors.outline`, …
- Font sizes: Paper `variant` (`<Text variant='titleMedium'>`), never numeric
  `fontSize`.
- Font weights: carried by `variant`, never set by hand.
  - `configureFonts` in flat-config mode → all 15 variants keep MD3 default
    weight: `'400'` for display/headline/title-large/body, `'500'` for
    title-medium/small and label.
  - Emphasis → heavier variant (`titleSmall` for a label next to body copy), not
    a `fontWeight` override.
  - No `'bold'` / `'700'` / `'600'` literals; no reading `fonts.*.fontWeight`
    back out to re-apply.
- Font _loading_: `useFetchFonts` in `@styles/theme` (Paper configures fonts,
  `expo-font` loads them).

## Safe area

**Tab-hosted screens never apply the `'bottom'` safe-area edge.**

- `BottomNavigation.Bar` already spans the bottom inset
  (`src/navigation/BottomTabs.tsx` passes `safeAreaInsets`); applying it again
  double-counts → white strip above tab bar.
- Use `edges={tabScreenEdges}`; reserve scroll room with
  `tabScreenBottomPadding`.
- Not enforced: a new tab screen that forgets reintroduces the gap. Worth
  revisiting: `ScreenWrapper` detecting the tab navigator via
  `BottomTabBarHeightContext`.

## Numbers

**Displayed in device regional format, stored in a fixed one.**

- `formatDecimalForDisplay` takes the separator from `expo-localization`
  (`getLocales()[0].decimalSeparator`): US `8.53`, French `8,53`.
- Follows _device region_, not app language — separators are regional, not
  linguistic.
- `formatDecimalForStorage` is locale-independent: scaled quantities are
  persisted and must not change meaning when region changes.
- `parseQuantity` accepts both separators on input.

## Styles

**Style objects in `StyleSheet.create`, not inline JSX.**

- Literal `style={{ ... }}` allocates per render — measurable in recipe lists.
- Only truly dynamic values stay inline (`useTheme()` colours, prop/state sizes,
  `Animated.Value`s), composed as an array
  (`style={[styles.card, { backgroundColor: colors.surface }]}`), kept minimal.
- `StyleSheet.create` runs at module load → theme values can never live in it.
