/**
 * useUnsavedChangesGuard - Discard-confirmation guard for dirty forms
 *
 * Wraps React Navigation v7's `usePreventRemove` so a screen holding unsaved
 * edits intercepts every removal of itself — hardware/predictive back, the
 * swipe-back gesture, the header back arrow and any explicit `goBack()` /
 * `reset()` — and surfaces a confirmation dialog instead of silently dropping
 * the edits.
 *
 * The intercepted action is replayed verbatim once the user confirms, so the
 * original destination is preserved rather than being approximated with a
 * `goBack()`. React Navigation tags an action with the routes that already
 * emitted `beforeRemove` for it, so replaying it does not re-trigger this
 * guard.
 *
 * Saves must call `allowRemoval()` before navigating away: the form is still
 * dirty at that point, and the guard would otherwise block the very navigation
 * that a successful save performs.
 */

import { useRef, useState } from 'react';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import type { NavigationAction } from '@react-navigation/native';

/**
 * Dialog state and handlers returned by {@link useUnsavedChangesGuard}.
 */
export interface UnsavedChangesGuard {
  /** Whether the discard-confirmation dialog should be rendered. */
  isDiscardDialogVisible: boolean;
  /** Dismisses the dialog and replays the navigation action that was blocked. */
  confirmDiscard: () => void;
  /** Drops the blocked action and keeps the user on the screen. */
  cancelDiscard: () => void;
  /** Hides the dialog without deciding — safe to run before `confirmDiscard`. */
  dismissDialog: () => void;
  /** Disarms the guard permanently so a completed save can navigate away. */
  allowRemoval: () => void;
}

/**
 * Blocks removal of the current screen while it holds unsaved changes.
 *
 * @param hasUnsavedChanges - Whether the screen currently holds edits that
 *   would be lost by navigating away. Typically React Hook Form's
 *   `formState.isDirty`.
 * @returns Dialog visibility plus the confirm/cancel/disarm handlers.
 *
 * @example
 * ```typescript
 * const guard = useUnsavedChangesGuard(form.formState.isDirty);
 *
 * async function save() {
 *   await persist();
 *   guard.allowRemoval();
 *   navigation.goBack();
 * }
 *
 * return (
 *   <Alert
 *     testId='RecipeDiscard'
 *     isVisible={guard.isDiscardDialogVisible}
 *     title={t('unsavedChanges.title')}
 *     content={t('unsavedChanges.content')}
 *     confirmText={t('unsavedChanges.discard')}
 *     cancelText={t('unsavedChanges.keepEditing')}
 *     onClose={guard.dismissDialog}
 *     onConfirm={guard.confirmDiscard}
 *     onCancel={guard.cancelDiscard}
 *   />
 * );
 * ```
 */
export function useUnsavedChangesGuard(hasUnsavedChanges: boolean): UnsavedChangesGuard {
  const navigation = useNavigation();
  const [isDiscardDialogVisible, setIsDiscardDialogVisible] = useState(false);
  const pendingActionRef = useRef<NavigationAction | null>(null);
  const isRemovalAllowedRef = useRef(false);

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    if (isRemovalAllowedRef.current) {
      navigation.dispatch(data.action);
      return;
    }
    pendingActionRef.current = data.action;
    setIsDiscardDialogVisible(true);
  });

  const confirmDiscard = () => {
    setIsDiscardDialogVisible(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      navigation.dispatch(action);
    }
  };

  // Dialogs report dismissal separately from an explicit cancel, and may report
  // both for one tap. Hiding must therefore stay free of side effects so it can
  // precede `confirmDiscard` without disarming it.
  const dismissDialog = () => {
    setIsDiscardDialogVisible(false);
  };

  const cancelDiscard = () => {
    pendingActionRef.current = null;
    dismissDialog();
  };

  const allowRemoval = () => {
    isRemovalAllowedRef.current = true;
  };

  return { isDiscardDialogVisible, confirmDiscard, cancelDiscard, dismissDialog, allowRemoval };
}
