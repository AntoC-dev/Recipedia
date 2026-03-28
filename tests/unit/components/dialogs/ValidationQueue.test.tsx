import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ValidationQueue } from '@components/dialogs/ValidationQueue';
import { ingredientTableElement, ingredientType } from '@customTypes/DatabaseElementTypes';
import { IngredientWithSimilarity, TagWithSimilarity } from '@utils/RecipeValidationHelpers';

jest.mock('@components/dialogs/SimilarityDialog', () =>
  require('@mocks/components/dialogs/SimilarityDialog-mock')
);

describe('ValidationQueue', () => {
  const mockOnValidated = jest.fn();
  const mockOnComplete = jest.fn();

  const sampleTags: TagWithSimilarity[] = [
    { id: 1, name: 'BrandNewTag1', similarItems: [] },
    { id: 2, name: 'BrandNewTag2', similarItems: [] },
    { id: 3, name: 'BrandNewTag3', similarItems: [] },
  ];

  const sampleIngredients: IngredientWithSimilarity[] = [
    { name: 'UniqueIngredient1', unit: 'g', quantity: '100', season: [], similarItems: [] },
    { name: 'UniqueIngredient2', unit: 'g', quantity: '50', season: [], similarItems: [] },
    { name: 'UniqueIngredient3', unit: 'clove', quantity: '2', season: [], similarItems: [] },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderQueueTags = (items: TagWithSimilarity[], testID = 'test-validation') => {
    return render(
      <ValidationQueue
        type={'Tag'}
        items={items}
        onValidated={mockOnValidated}
        onComplete={mockOnComplete}
        testId={testID}
      />
    );
  };

  const renderQueueIngredients = (items: IngredientWithSimilarity[]) => {
    return render(
      <ValidationQueue
        type={'Ingredient'}
        items={items}
        onValidated={mockOnValidated}
        onComplete={mockOnComplete}
        testId='test-validation'
      />
    );
  };

  describe('Rendering & Visibility', () => {
    test('returns null when items array is empty', () => {
      const { queryByTestId } = renderQueueTags([]);
      expect(queryByTestId('test-validation::ValidationQueue::SimilarityDialog::Mock')).toBeNull();
    });

    test('renders SimilarityDialog when tags are present', () => {
      const { getByTestId } = renderQueueTags([sampleTags[0]]);
      expect(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock')
      ).toBeTruthy();
    });

    test('renders SimilarityDialog when ingredients are present', () => {
      const { getByTestId } = renderQueueIngredients([sampleIngredients[0]]);
      expect(
        getByTestId('test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock')
      ).toBeTruthy();
    });

    test('calls onComplete immediately when items array is empty', () => {
      renderQueueTags([]);
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnValidated).not.toHaveBeenCalled();
    });
  });

  describe('Tag Validation Flow', () => {
    test('shows SimilarityDialog with correct tag props', () => {
      const { getByTestId } = renderQueueTags([sampleTags[0]]);
      expect(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.type')
          .props.children
      ).toBe('Tag');
      expect(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('BrandNewTag1');
    });

    test('calls onValidated when tag is confirmed', () => {
      const { getByTestId } = renderQueueTags([sampleTags[0]]);

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      expect(mockOnValidated).toHaveBeenCalledTimes(1);
    });

    test('moves to next tag after validation', async () => {
      const { getByTestId } = renderQueueTags([sampleTags[0], sampleTags[1]]);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('BrandNewTag1');

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('BrandNewTag2');
      });
    });

    test('calls onComplete when all tags are processed', async () => {
      const { getByTestId } = renderQueueTags([sampleTags[0]]);

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Ingredient Validation Flow', () => {
    test('shows SimilarityDialog with correct ingredient props', () => {
      const { getByTestId } = renderQueueIngredients([sampleIngredients[0]]);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.type'
        ).props.children
      ).toBe('Ingredient');
      expect(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('UniqueIngredient1');
    });

    test('preserves quantity from original and uses DB unit when validated', () => {
      const { getByTestId } = renderQueueIngredients([sampleIngredients[0]]);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      expect(mockOnValidated).toHaveBeenCalledTimes(1);
      const mergedIngredient = mockOnValidated.mock.calls[0][1];
      expect(mergedIngredient.quantity).toBe('100');
    });

    test('moves to next ingredient after validation', async () => {
      const { getByTestId } = renderQueueIngredients([sampleIngredients[0], sampleIngredients[1]]);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('UniqueIngredient1');

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('UniqueIngredient2');
      });
    });

    test('calls onComplete when all ingredients are processed', async () => {
      const { getByTestId } = renderQueueIngredients([sampleIngredients[0]]);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Queue Management (FIFO)', () => {
    test('processes first item in queue', () => {
      const { getByTestId } = renderQueueTags(sampleTags);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('BrandNewTag1');
    });

    test('removes item after validation and processes next', async () => {
      const { getByTestId } = renderQueueTags(sampleTags);

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('BrandNewTag2');
      });

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('BrandNewTag3');
      });
    });

    test('processes all items sequentially', async () => {
      const { getByTestId } = renderQueueTags(sampleTags);

      for (let i = 0; i < sampleTags.length; i++) {
        fireEvent.press(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm'
          )
        );
      }

      await waitFor(() => {
        expect(mockOnValidated).toHaveBeenCalledTimes(3);
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Dialog Interaction', () => {
    test('hides dialog and moves to next when onDismiss is called', async () => {
      const { getByTestId } = renderQueueTags([sampleTags[0], sampleTags[1]]);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('BrandNewTag1');

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onDismiss')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('BrandNewTag2');
      });

      expect(mockOnValidated).not.toHaveBeenCalled();
    });

    test('passes correct testId to SimilarityDialog', () => {
      const { getByTestId } = renderQueueTags([sampleTags[0]], 'custom-test-id');

      expect(
        getByTestId('custom-test-id::ValidationQueue::Tag::SimilarityDialog::Mock')
      ).toBeTruthy();
    });

    test('handles onUseExisting callback for tags', () => {
      const dbTag = { id: 100, name: 'ExistingTag' };
      const tagWithSimilar: TagWithSimilarity[] = [
        { id: 1, name: 'NewTag', similarItems: [dbTag] },
      ];

      const { getByTestId } = renderQueueTags(tagWithSimilar);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onUseExisting'
        )
      );

      expect(mockOnValidated).toHaveBeenCalledTimes(1);
    });

    test('handles onUseExisting callback for ingredients', () => {
      const dbIngredient: ingredientTableElement = {
        id: 100,
        name: 'ExistingIngredient',
        type: ingredientType.vegetable,
        unit: 'g',
        quantity: '200',
        season: [],
      };
      const ingredientWithSimilar: IngredientWithSimilarity[] = [
        { name: 'NewIngredient', quantity: '100', unit: 'g', similarItems: [dbIngredient] },
      ];

      const { getByTestId } = renderQueueIngredients(ingredientWithSimilar);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onUseExisting'
        )
      );

      expect(mockOnValidated).toHaveBeenCalledTimes(1);
    });
  });

  describe('Similarity Display', () => {
    test('passes similarItem to SimilarityDialog when item has pre-computed similar entry', () => {
      const dbIngredient: ingredientTableElement = {
        id: 100,
        name: 'ExistingIngredient',
        type: ingredientType.vegetable,
        unit: 'g',
        quantity: '200',
        season: [],
      };

      const { getByTestId } = renderQueueIngredients([
        { name: 'NewIngredient', quantity: '100', unit: 'g', similarItems: [dbIngredient] },
      ]);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).not.toBe('undefined');
      expect(JSON.parse(similarItemText).name).toBe('ExistingIngredient');
    });

    test('passes no similarItem when item has empty similarItems', () => {
      const { getByTestId } = renderQueueIngredients([sampleIngredients[0]]);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).toBe('undefined');
    });

    test('passes no similarItem for tags with no pre-computed match', () => {
      const { getByTestId } = renderQueueTags([sampleTags[0]]);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).toBe('undefined');
    });
  });

  describe('Add New Auto-Validation', () => {
    test('auto-validates remaining items with same name after Add New', async () => {
      const tags: TagWithSimilarity[] = [
        { id: 1, name: 'Italian', similarItems: [] },
        { id: 2, name: 'Italian', similarItems: [] },
        { id: 3, name: 'French', similarItems: [] },
      ];

      const { getByTestId } = renderQueueTags(tags);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('Italian');

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('French');
      });

      expect(mockOnValidated).toHaveBeenCalledTimes(2);
    });

    test('does not auto-validate remaining items after Use Existing', async () => {
      const dbTag = { id: 100, name: 'Italiano' };
      const tags: TagWithSimilarity[] = [
        { id: 1, name: 'Italian', similarItems: [dbTag] },
        { id: 2, name: 'Italian', similarItems: [dbTag] },
        { id: 3, name: 'French', similarItems: [] },
      ];

      const { getByTestId } = renderQueueTags(tags);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onUseExisting'
        )
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('Italian');
      });

      expect(mockOnValidated).toHaveBeenCalledTimes(1);
    });

    test('does not auto-validate remaining items after Dismiss', async () => {
      const tags: TagWithSimilarity[] = [
        { id: 1, name: 'Italian', similarItems: [] },
        { id: 2, name: 'Italian', similarItems: [] },
      ];

      const { getByTestId } = renderQueueTags(tags);

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onDismiss')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('Italian');
      });

      expect(mockOnValidated).not.toHaveBeenCalled();
    });
  });

  describe('Ingredient Validation Bug Fixes', () => {
    const mockOnDismissed = jest.fn();

    const renderQueueIngredientsWithDismissed = (items: IngredientWithSimilarity[]) => {
      return render(
        <ValidationQueue
          type={'Ingredient'}
          items={items}
          onValidated={mockOnValidated}
          onDismissed={mockOnDismissed}
          onComplete={mockOnComplete}
          testId='test-validation'
        />
      );
    };

    beforeEach(() => {
      mockOnDismissed.mockClear();
    });

    test('calls onDismissed with original ingredient when dismissed', async () => {
      const formIngredients: IngredientWithSimilarity[] = [
        { name: 'Oignon', quantity: '100', unit: 'g', similarItems: [] },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onDismiss'
        )
      );

      expect(mockOnDismissed).toHaveBeenCalledTimes(1);
      expect(mockOnValidated).not.toHaveBeenCalled();

      const dismissedIngredient = mockOnDismissed.mock.calls[0][0];
      expect(dismissedIngredient.name).toBe('Oignon');
      expect(dismissedIngredient.quantity).toBe('100');
    });

    test('uses original quantity when available', () => {
      const formIngredients: IngredientWithSimilarity[] = [
        { name: 'UniqueTestIngredient', quantity: '250', unit: 'g', similarItems: [] },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      const mergedIngredient = mockOnValidated.mock.calls[0][1];
      expect(mergedIngredient.quantity).toBe('250');
    });

    test('uses validated quantity when original quantity is undefined', () => {
      const formIngredients: IngredientWithSimilarity[] = [
        { name: 'UniqueTestIngredient', unit: 'g', similarItems: [] },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      const mergedIngredient = mockOnValidated.mock.calls[0][1];
      expect(mergedIngredient.quantity).toBe('100');
    });

    test('uses validated quantity when original quantity is empty string', () => {
      const formIngredients: IngredientWithSimilarity[] = [
        { name: 'UniqueTestIngredient', quantity: '', unit: 'g', similarItems: [] },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      const mergedIngredient = mockOnValidated.mock.calls[0][1];
      expect(mergedIngredient.quantity).toBe('100');
    });

    test('preserves database ingredient metadata in validated result', () => {
      const formIngredients: IngredientWithSimilarity[] = [
        { name: 'UniqueTestIngredient', quantity: '100', unit: 'pieces', similarItems: [] },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      const mergedIngredient = mockOnValidated.mock.calls[0][1];
      expect(mergedIngredient.name).toBeDefined();
      expect(mergedIngredient.id).toBeDefined();
    });

    test('handles onUseExisting similarly to onConfirm for ingredients', () => {
      const existingIngredient: ingredientTableElement = {
        id: 100,
        name: 'SimilarTestIngredient',
        type: ingredientType.vegetable,
        unit: 'g',
        quantity: '200',
        season: [],
      };

      const formIngredients: IngredientWithSimilarity[] = [
        {
          name: 'UniqueTestIngredient',
          quantity: '50',
          unit: 'g',
          similarItems: [existingIngredient],
        },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onUseExisting'
        )
      );

      expect(mockOnDismissed).not.toHaveBeenCalled();
      expect(mockOnValidated).toHaveBeenCalledTimes(1);

      const mergedIngredient = mockOnValidated.mock.calls[0][1];
      expect(mergedIngredient.quantity).toBe('50');
    });
  });
});
