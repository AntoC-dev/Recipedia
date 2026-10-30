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
  test('does not arm the guard when there are no unsaved changes', async () => {
    await renderHook(() => useUnsavedChangesGuard(false));

    expect(isPreventRemoveArmed()).toBe(false);
  });

  test('triggering removal without unsaved changes returns false and skips the dialog', async () => {
    const { result } = await renderHook(() => useUnsavedChangesGuard(false));

    let dispatched: boolean = false;
    await act(() => {
      dispatched = triggerPreventRemove(firstAction);
    });

    expect(dispatched).toBe(false);
    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('triggering removal with unsaved changes shows the dialog without dispatching', async () => {
    const { result } = await renderHook(() => useUnsavedChangesGuard(true));

    await act(() => {
      triggerPreventRemove(firstAction);
    });

    expect(result.current.isDiscardDialogVisible).toBe(true);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('confirmDiscard hides the dialog and dispatches the intercepted action', async () => {
    const { result } = await renderHook(() => useUnsavedChangesGuard(true));

    await act(() => {
      triggerPreventRemove(firstAction);
    });
    await act(() => {
      result.current.confirmDiscard();
    });

    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(firstAction);
  });

  test('cancelDiscard hides the dialog and dispatches nothing', async () => {
    const { result } = await renderHook(() => useUnsavedChangesGuard(true));

    await act(() => {
      triggerPreventRemove(firstAction);
    });
    await act(() => {
      result.current.cancelDiscard();
    });

    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('confirmDiscard dispatches when the dialog dismiss handler runs before it', async () => {
    const { result } = await renderHook(() => useUnsavedChangesGuard(true));

    await act(() => {
      triggerPreventRemove(firstAction);
    });
    await act(() => {
      result.current.dismissDialog();
      result.current.confirmDiscard();
    });

    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(firstAction);
  });

  test('cancelDiscard drops the pending action so a later confirm is inert', async () => {
    const { result } = await renderHook(() => useUnsavedChangesGuard(true));

    await act(() => {
      triggerPreventRemove(firstAction);
    });
    await act(() => {
      result.current.cancelDiscard();
      result.current.confirmDiscard();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('confirmDiscard with no pending action dispatches nothing', async () => {
    const { result } = await renderHook(() => useUnsavedChangesGuard(true));

    await act(() => {
      result.current.confirmDiscard();
    });

    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  test('allowRemoval makes subsequent triggers dispatch immediately without showing the dialog', async () => {
    const { result } = await renderHook(() => useUnsavedChangesGuard(true));

    await act(() => {
      result.current.allowRemoval();
    });
    await act(() => {
      triggerPreventRemove(firstAction);
    });

    expect(result.current.isDiscardDialogVisible).toBe(false);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(firstAction);
  });

  test('cancelling then triggering again re-arms the dialog with the new action', async () => {
    const { result } = await renderHook(() => useUnsavedChangesGuard(true));

    await act(() => {
      triggerPreventRemove(firstAction);
    });
    await act(() => {
      result.current.cancelDiscard();
    });
    await act(() => {
      triggerPreventRemove(secondAction);
    });

    expect(result.current.isDiscardDialogVisible).toBe(true);

    await act(() => {
      result.current.confirmDiscard();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(secondAction);
  });

  test('flipping hasUnsavedChanges to false disarms the guard', async () => {
    const { rerender } = await renderHook(
      ({ hasUnsavedChanges }: { hasUnsavedChanges: boolean }) =>
        useUnsavedChangesGuard(hasUnsavedChanges),
      { initialProps: { hasUnsavedChanges: true } }
    );

    expect(isPreventRemoveArmed()).toBe(true);

    await rerender({ hasUnsavedChanges: false });

    expect(isPreventRemoveArmed()).toBe(false);
  });
});
