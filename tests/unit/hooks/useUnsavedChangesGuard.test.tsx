import { act, renderHook } from '@testing-library/react-native';
import { useUnsavedChangesGuard } from '@hooks/useUnsavedChangesGuard';
import {
  isPreventRemoveArmed,
  mockDispatch,
  resetPreventRemove,
  triggerPreventRemove,
} from '@mocks/deps/react-navigation-mock';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

const firstAction = { type: 'GO_BACK' };
const secondAction = { type: 'NAVIGATE', payload: { name: 'Recipes' } };

beforeEach(() => {
  resetPreventRemove();
  jest.clearAllMocks();
});

describe('useUnsavedChangesGuard', () => {
  test('does not arm the guard when there are no unsaved changes', () => {
    renderHook(() => useUnsavedChangesGuard(false));

    expect(isPreventRemoveArmed()).toBe(false);
  });

  test('triggering removal without unsaved changes returns false and skips the dialog', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(false));

    let dispatched: boolean = false;
    act(() => {
      dispatched = triggerPreventRemove(firstAction);
    });

    expect(dispatched).toBe(false);
    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('triggering removal with unsaved changes shows the dialog without dispatching', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true));

    act(() => {
      triggerPreventRemove(firstAction);
    });

    expect(result.current.isDiscardDialogVisible).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('confirmDiscard hides the dialog and dispatches the intercepted action', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true));

    act(() => {
      triggerPreventRemove(firstAction);
    });
    act(() => {
      result.current.confirmDiscard();
    });

    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(firstAction);
  });

  test('cancelDiscard hides the dialog and dispatches nothing', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true));

    act(() => {
      triggerPreventRemove(firstAction);
    });
    act(() => {
      result.current.cancelDiscard();
    });

    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('confirmDiscard dispatches when the dialog dismiss handler runs before it', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true));

    act(() => {
      triggerPreventRemove(firstAction);
    });
    act(() => {
      result.current.dismissDialog();
      result.current.confirmDiscard();
    });

    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(firstAction);
  });

  test('cancelDiscard drops the pending action so a later confirm is inert', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true));

    act(() => {
      triggerPreventRemove(firstAction);
    });
    act(() => {
      result.current.cancelDiscard();
      result.current.confirmDiscard();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('confirmDiscard with no pending action dispatches nothing', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true));

    act(() => {
      result.current.confirmDiscard();
    });

    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('allowRemoval makes subsequent triggers dispatch immediately without showing the dialog', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true));

    act(() => {
      result.current.allowRemoval();
    });
    act(() => {
      triggerPreventRemove(firstAction);
    });

    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(firstAction);
  });

  test('cancelling then triggering again re-arms the dialog with the new action', () => {
    const { result } = renderHook(() => useUnsavedChangesGuard(true));

    act(() => {
      triggerPreventRemove(firstAction);
    });
    act(() => {
      result.current.cancelDiscard();
    });
    act(() => {
      triggerPreventRemove(secondAction);
    });

    expect(result.current.isDiscardDialogVisible).toBe(true);

    act(() => {
      result.current.confirmDiscard();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(secondAction);
  });

  test('flipping hasUnsavedChanges to false disarms the guard', () => {
    const { rerender } = renderHook(
      ({ hasUnsavedChanges }: { hasUnsavedChanges: boolean }) =>
        useUnsavedChangesGuard(hasUnsavedChanges),
      { initialProps: { hasUnsavedChanges: true } }
    );

    expect(isPreventRemoveArmed()).toBe(true);

    rerender({ hasUnsavedChanges: false });

    expect(isPreventRemoveArmed()).toBe(false);
  });
});
