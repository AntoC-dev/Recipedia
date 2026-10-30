import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import {
  IngredientArrayActionsProvider,
  useIngredientArrayActions,
  useIngredientArrayActionsRegister,
} from '@screens/recipe/fields/IngredientArrayActionsContext';
import { ApplyIngredientEditPatch } from '@hooks/useRecipeIngredients';

const replaceOnlyPatch: Parameters<ApplyIngredientEditPatch>[0] = {
  kind: 'replace',
  index: 0,
  row: { name: 'Sugar', quantity: '50', unit: 'g' } as never,
};

function providerWrapper({ children }: { children: React.ReactNode }) {
  return <IngredientArrayActionsProvider>{children}</IngredientArrayActionsProvider>;
}

describe('useIngredientArrayActions - no provider', () => {
  test('returns a no-op applyPatch when no provider is mounted', async () => {
    const { result } = await renderHook(() => useIngredientArrayActions());

    expect(() => result.current.applyPatch(replaceOnlyPatch)).not.toThrow();
  });
});

describe('IngredientArrayActionsContext', () => {
  test('applyPatch is a no-op before any registrant has registered', async () => {
    const { result } = await renderHook(() => useIngredientArrayActions(), {
      wrapper: providerWrapper,
    });

    expect(() => result.current.applyPatch(replaceOnlyPatch)).not.toThrow();
  });

  test('applyPatch forwards to the registered implementation', async () => {
    const mockApply = jest.fn<void, Parameters<ApplyIngredientEditPatch>>();

    const { result } = await renderHook(
      () => {
        useIngredientArrayActionsRegister(mockApply);
        return useIngredientArrayActions();
      },
      { wrapper: providerWrapper }
    );

    await act(() => {
      result.current.applyPatch(replaceOnlyPatch);
    });

    expect(mockApply).toHaveBeenCalledTimes(1);
    expect(mockApply).toHaveBeenCalledWith(replaceOnlyPatch);
  });

  test('applyPatch receives all patch fields correctly', async () => {
    const received: Parameters<ApplyIngredientEditPatch>[0][] = [];
    const captureApply: ApplyIngredientEditPatch = patch => received.push(patch);

    const { result } = await renderHook(
      () => {
        useIngredientArrayActionsRegister(captureApply);
        return useIngredientArrayActions();
      },
      { wrapper: providerWrapper }
    );

    const mergePatch: Parameters<ApplyIngredientEditPatch>[0] = {
      kind: 'merge',
      intoIndex: 0,
      removeIndex: 1,
      row: { name: 'Flour', quantity: '100', unit: 'g' } as never,
    };

    await act(() => {
      result.current.applyPatch(mergePatch);
    });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(mergePatch);
  });

  test('applyPatch falls back to no-op after the registrant unregisters', async () => {
    const mockApply = jest.fn<void, Parameters<ApplyIngredientEditPatch>>();

    const { unmount } = await renderHook(
      () => {
        useIngredientArrayActionsRegister(mockApply);
        return useIngredientArrayActions();
      },
      { wrapper: providerWrapper }
    );

    await unmount();

    const consumerHook = await renderHook(() => useIngredientArrayActions(), {
      wrapper: providerWrapper,
    });

    await act(() => {
      consumerHook.result.current.applyPatch(replaceOnlyPatch);
    });

    expect(mockApply).not.toHaveBeenCalled();
  });

  test('last registered implementation wins when two registrations occur', async () => {
    const firstApply = jest.fn<void, Parameters<ApplyIngredientEditPatch>>();
    const secondApply = jest.fn<void, Parameters<ApplyIngredientEditPatch>>();

    const { result } = await renderHook(
      () => {
        useIngredientArrayActionsRegister(firstApply);
        useIngredientArrayActionsRegister(secondApply);
        return useIngredientArrayActions();
      },
      { wrapper: providerWrapper }
    );

    await act(() => {
      result.current.applyPatch(replaceOnlyPatch);
    });

    expect(secondApply).toHaveBeenCalledTimes(1);
    expect(firstApply).not.toHaveBeenCalled();
  });
});
