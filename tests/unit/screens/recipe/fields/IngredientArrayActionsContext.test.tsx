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
  test('returns a no-op applyPatch when no provider is mounted', () => {
    const { result } = renderHook(() => useIngredientArrayActions());

    expect(() => result.current.applyPatch(replaceOnlyPatch)).not.toThrow();
  });
});

describe('IngredientArrayActionsContext', () => {
  test('applyPatch is a no-op before any registrant has registered', () => {
    const { result } = renderHook(() => useIngredientArrayActions(), { wrapper: providerWrapper });

    expect(() => result.current.applyPatch(replaceOnlyPatch)).not.toThrow();
  });

  test('applyPatch forwards to the registered implementation', () => {
    const mockApply = jest.fn<void, Parameters<ApplyIngredientEditPatch>>();

    const { result } = renderHook(
      () => {
        useIngredientArrayActionsRegister(mockApply);
        return useIngredientArrayActions();
      },
      { wrapper: providerWrapper }
    );

    act(() => {
      result.current.applyPatch(replaceOnlyPatch);
    });

    expect(mockApply).toHaveBeenCalledTimes(1);
    expect(mockApply).toHaveBeenCalledWith(replaceOnlyPatch);
  });

  test('applyPatch receives all patch fields correctly', () => {
    const received: Parameters<ApplyIngredientEditPatch>[0][] = [];
    const captureApply: ApplyIngredientEditPatch = patch => received.push(patch);

    const { result } = renderHook(
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

    act(() => {
      result.current.applyPatch(mergePatch);
    });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(mergePatch);
  });

  test('applyPatch falls back to no-op after the registrant unregisters', () => {
    const mockApply = jest.fn<void, Parameters<ApplyIngredientEditPatch>>();

    const { unmount } = renderHook(
      () => {
        useIngredientArrayActionsRegister(mockApply);
        return useIngredientArrayActions();
      },
      { wrapper: providerWrapper }
    );

    unmount();

    const consumerHook = renderHook(() => useIngredientArrayActions(), {
      wrapper: providerWrapper,
    });

    act(() => {
      consumerHook.result.current.applyPatch(replaceOnlyPatch);
    });

    expect(mockApply).not.toHaveBeenCalled();
  });

  test('last registered implementation wins when two registrations occur', () => {
    const firstApply = jest.fn<void, Parameters<ApplyIngredientEditPatch>>();
    const secondApply = jest.fn<void, Parameters<ApplyIngredientEditPatch>>();

    const { result } = renderHook(
      () => {
        useIngredientArrayActionsRegister(firstApply);
        useIngredientArrayActionsRegister(secondApply);
        return useIngredientArrayActions();
      },
      { wrapper: providerWrapper }
    );

    act(() => {
      result.current.applyPatch(replaceOnlyPatch);
    });

    expect(secondApply).toHaveBeenCalledTimes(1);
    expect(firstApply).not.toHaveBeenCalled();
  });
});
