import { StyleSheet } from 'react-native';

import { padding } from '@styles/spacing';

/**
 * Cross-cutting layout primitives shared verbatim across otherwise-unrelated screens
 * and dialogs.
 *
 * These four entries were promoted here only after auditing every repeated
 * `StyleSheet.create` key in the app and confirming their bodies were byte-identical
 * at every call site. Every other repeated style name in the codebase (`container`,
 * `card`, `listContent`, `title`, ...) is a homonym: the same name reused across
 * screens with a *different* body each time, coincidence rather than duplication.
 *
 * Do not add an entry here just because a name recurs elsewhere — check the bodies
 * match first. Do not grow `emptyState` or `tutorialOverlay` past their shared core
 * either: each consumer composes its own variance (padding, vertical placement, ...)
 * via array style composition, e.g. `style={[layout.emptyState, styles.emptyStatePadding]}`,
 * keeping the differing values local to the screen that needs them.
 */
export const layout = StyleSheet.create({
  flexFill: {
    flex: 1,
  },
  dialogActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialOverlay: {
    position: 'absolute',
    left: padding.small,
    right: padding.small,
    pointerEvents: 'none',
  },
});
