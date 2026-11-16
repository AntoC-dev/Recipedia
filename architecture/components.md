# Component hierarchy

Atomic Design, under `src/components/`:

| Layer     | Directory               | Rule                                                        |
| --------- | ----------------------- | ----------------------------------------------------------- |
| Atomic    | `components/atomic/`    | Single-purpose, no business logic, no DB-touching hooks     |
| Molecules | `components/molecules/` | Combine atoms; local UI state allowed; no DB hooks          |
| Organisms | `components/organisms/` | Feature sections; may use hooks, DB hooks indirectly        |
| Dialogs   | `components/dialogs/`   | Modal overlays; state via props or context, never DB direct |
| Templates | `components/templates/` | Layout wrappers (e.g. `ScreenWrapper`)                      |

- React Native Paper components (`Text`, `Button`, `Card`, …) before custom
  primitives.
- Theme colours: `useTheme()` from `react-native-paper`.
