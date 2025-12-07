import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { RecipeDialogsProvider, useRecipeDialogs } from '@context/RecipeDialogsContext';

function createDialogsWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <RecipeDialogsProvider>{children}</RecipeDialogsProvider>;
  };
}

describe('RecipeDialogsContext', () => {
  describe('validation dialog', () => {
    test('showValidationDialog sets props and opens dialog', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      expect(result.current.isValidationDialogOpen).toBe(false);

      act(() => {
        result.current.showValidationDialog({
          title: 'Test Title',
          content: 'Test Content',
          confirmText: 'OK',
          cancelText: 'Cancel',
        });
      });

      expect(result.current.isValidationDialogOpen).toBe(true);
      expect(result.current.validationDialogProp.title).toBe('Test Title');
      expect(result.current.validationDialogProp.content).toBe('Test Content');
      expect(result.current.validationDialogProp.confirmText).toBe('OK');
      expect(result.current.validationDialogProp.cancelText).toBe('Cancel');
    });

    test('showValidationDialog with callbacks', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      act(() => {
        result.current.showValidationDialog({
          title: 'Test',
          content: 'Content',
          confirmText: 'OK',
          onConfirm,
          onCancel,
        });
      });

      expect(result.current.validationDialogProp.onConfirm).toBe(onConfirm);
      expect(result.current.validationDialogProp.onCancel).toBe(onCancel);
    });

    test('hideValidationDialog closes dialog and resets state', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      act(() => {
        result.current.showValidationDialog({
          title: 'Test Title',
          content: 'Test Content',
          confirmText: 'OK',
        });
      });

      expect(result.current.isValidationDialogOpen).toBe(true);

      act(() => {
        result.current.hideValidationDialog();
      });

      expect(result.current.isValidationDialogOpen).toBe(false);
      expect(result.current.validationDialogProp.title).toBe('');
      expect(result.current.validationDialogProp.content).toBe('');
    });
  });

  describe('showValidationErrorDialog', () => {
    const mockT = (key: string) => key;

    test('formats singular message for single missing element', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      act(() => {
        result.current.showValidationErrorDialog(['Image'], mockT);
      });

      expect(result.current.isValidationDialogOpen).toBe(true);
      expect(result.current.validationDialogProp.title).toBe(
        'alerts.missingElements.titleSingular'
      );
      expect(result.current.validationDialogProp.confirmText).toBe('understood');
    });

    test('formats plural message for multiple missing elements', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      act(() => {
        result.current.showValidationErrorDialog(['Image', 'Title', 'Description'], mockT);
      });

      expect(result.current.isValidationDialogOpen).toBe(true);
      expect(result.current.validationDialogProp.title).toBe('alerts.missingElements.titlePlural');
    });

    test('includes all missing elements in content', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      act(() => {
        result.current.showValidationErrorDialog(['Image', 'Title'], mockT);
      });

      expect(result.current.validationDialogProp.content).toContain('Image');
      expect(result.current.validationDialogProp.content).toContain('Title');
    });
  });

  describe('similarity dialog', () => {
    test('showSimilarityDialog opens dialog with item', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      const onConfirm = jest.fn();

      expect(result.current.similarityDialog.isVisible).toBe(false);

      act(() => {
        result.current.showSimilarityDialog({
          type: 'Tag',
          newItemName: 'Italian',
          onConfirm,
        });
      });

      expect(result.current.similarityDialog.isVisible).toBe(true);
      expect(result.current.similarityDialog.item.type).toBe('Tag');
      expect(result.current.similarityDialog.item.newItemName).toBe('Italian');
      expect(result.current.similarityDialog.item.onConfirm).toBe(onConfirm);
    });

    test('showSimilarityDialog works for Ingredient type', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      const onConfirm = jest.fn();

      act(() => {
        result.current.showSimilarityDialog({
          type: 'Ingredient',
          newItemName: 'Tomato',
          onConfirm,
        });
      });

      expect(result.current.similarityDialog.isVisible).toBe(true);
      expect(result.current.similarityDialog.item.type).toBe('Ingredient');
      expect(result.current.similarityDialog.item.newItemName).toBe('Tomato');
    });

    test('hideSimilarityDialog closes dialog and resets state', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      act(() => {
        result.current.showSimilarityDialog({
          type: 'Tag',
          newItemName: 'Test',
          onConfirm: jest.fn(),
        });
      });

      expect(result.current.similarityDialog.isVisible).toBe(true);

      act(() => {
        result.current.hideSimilarityDialog();
      });

      expect(result.current.similarityDialog.isVisible).toBe(false);
    });
  });

  describe('validation queue', () => {
    test('setValidationQueue sets tag validation queue', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      const onValidated = jest.fn();

      expect(result.current.validationQueue).toBeNull();

      act(() => {
        result.current.setValidationQueue({
          type: 'Tag',
          items: [{ id: 1, name: 'Italian' }],
          onValidated,
        });
      });

      expect(result.current.validationQueue).not.toBeNull();
      expect(result.current.validationQueue?.type).toBe('Tag');
    });

    test('setValidationQueue sets ingredient validation queue', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      const onValidated = jest.fn();

      act(() => {
        result.current.setValidationQueue({
          type: 'Ingredient',
          items: [
            {
              name: 'Tomato',
              quantity: '100',
              unit: 'g',
              season: [],
            },
          ],
          onValidated,
        });
      });

      expect(result.current.validationQueue).not.toBeNull();
      expect(result.current.validationQueue?.type).toBe('Ingredient');
    });

    test('clearValidationQueue sets queue to null', () => {
      const wrapper = createDialogsWrapper();
      const { result } = renderHook(() => useRecipeDialogs(), { wrapper });

      act(() => {
        result.current.setValidationQueue({
          type: 'Tag',
          items: [{ id: 2, name: 'Test' }],
          onValidated: jest.fn(),
        });
      });

      expect(result.current.validationQueue).not.toBeNull();

      act(() => {
        result.current.clearValidationQueue();
      });

      expect(result.current.validationQueue).toBeNull();
    });
  });

  describe('error handling', () => {
    test('throws error when useRecipeDialogs is used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useRecipeDialogs());
      }).toThrow('useRecipeDialogs must be used within a RecipeDialogsProvider');

      consoleError.mockRestore();
    });
  });
});
