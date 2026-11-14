---
paths:
  - "src/components/**"
  - "src/screens/**"
  - "src/styles/**"
---

# Design Rules (MD3 via React Native Paper 5)

Paper first — never re-implement what Paper provides. Need X → use:

- Action → `Button` (`mode`: text | outlined | contained | contained-tonal | elevated); icon-only → `IconButton`;
  primary floating action → `FAB`
- Tappable area / row → `TouchableRipple` / `List.Item`; never `Pressable` / `TouchableOpacity`
- Filter / tag → `Chip`; 2–5 exclusive options → `SegmentedButtons`; on/off → `Switch` / `Checkbox` / `RadioButton`
- Container → `Card` (`mode`) or `Surface elevation={0–5}`; separator → `Divider`; table → `DataTable`
- Overlay → `Portal` + `Dialog` / `Modal` / `Menu`; transient message → `Snackbar`; persistent → `Banner`
- Input → `TextInput` + `HelperText` for errors; search → `Searchbar`
- Text → `Text variant` (display | headline | title | body | label + Large | Medium | Small); no `fontSize`,
  `fontWeight`, `lineHeight`
- Icons → `Icon` / `icon` prop; loading → `ActivityIndicator` / `ProgressBar`
- Reuse existing atoms (`TagButton`, `RoundButton`, `CustomTextInput`, `BottomActionButton`, …) before writing new ones
- Use component props (`mode`, `compact`, `buttonColor`, `textColor`, `selected`, `disabled`, `loading`) before `style`
  overrides

Tokens (`useTheme()`; themes in `@styles/theme`):

- Colors: `colors.*` roles only, no hex/rgba; foreground = matching `on*` role; tinted surface =
  `colors.elevation.levelN`; works in light and dark
- Elevation: Paper `elevation` prop; no `shadow*` or RN `elevation` styles
- Shape: theme `roundness` is 0; custom corners only via `radius.small | medium | full` from `@styles/spacing`
- Spacing: `padding.*` from `@styles/spacing`, no numeric literals; touch targets ≥ 48dp

Behaviour: cover pressed, disabled, focused, selected, error, empty, loading. Icon-only controls need
`accessibilityLabel`. `testID` = `Component::Element`. Match neighbouring components; Atomic Design level per
`CONTRIBUTING.md`.
