import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ValidationQueue } from '@components/dialogs/ValidationQueue';
import RecipeDatabase from '@utils/RecipeDatabase';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import {
  FormIngredientElement,
  ingredientTableElement,
  ingredientType,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';

jest.mock('@components/dialogs/SimilarityDialog', () =>
  require('@mocks/components/dialogs/SimilarityDialog-mock')
);

describe('ValidationQueue', () => {
  const database = RecipeDatabase.getInstance();

  const mockOnValidated = jest.fn();
  const mockOnComplete = jest.fn();

  const sampleTags: tagTableElement[] = [
    { id: 1, name: 'Vegetarian' },
    { id: 2, name: 'Quick' },
    { id: 3, name: 'Healthy' },
  ];

  const sampleIngredients: ingredientTableElement[] = [
    {
      id: 1,
      name: 'Tomato',
      type: ingredientType.vegetable,
      unit: 'g',
      quantity: '100',
      season: [],
    },
    {
      id: 2,
      name: 'Onion',
      type: ingredientType.vegetable,
      unit: 'g',
      quantity: '50',
      season: [],
    },
    {
      id: 3,
      name: 'Garlic',
      type: ingredientType.vegetable,
      unit: 'clove',
      quantity: '2',
      season: [],
    },
  ];

  beforeEach(async () => {
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await database.closeAndReset();
  });

  const renderQueueTags = (items: tagTableElement[], testID = 'test-validation') => {
    return render(
      <RecipeDatabaseProvider>
        <ValidationQueue
          type={'Tag'}
          items={items}
          onValidated={mockOnValidated}
          onComplete={mockOnComplete}
          testId={testID}
        />
      </RecipeDatabaseProvider>
    );
  };

  const renderQueueIngredients = (items: ingredientTableElement[]) => {
    return render(
      <RecipeDatabaseProvider>
        <ValidationQueue
          type={'Ingredient'}
          items={items}
          onValidated={mockOnValidated}
          onComplete={mockOnComplete}
          testId='test-validation'
        />
      </RecipeDatabaseProvider>
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
      ).toBe('Vegetarian');
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
      ).toBe('Vegetarian');

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('Quick');
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
      ).toBe('Tomato');
    });

    test('preserves quantity from original and uses DB unit when validated', () => {
      const { getByTestId } = renderQueueIngredients([sampleIngredients[0]]);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      expect(mockOnValidated).toHaveBeenCalledTimes(1);
      const validatedIngredient = mockOnValidated.mock.calls[0][0];
      expect(validatedIngredient.quantity).toBe('100');
      expect(validatedIngredient.unit).toBe('g');
    });

    test('moves to next ingredient after validation', async () => {
      const { getByTestId } = renderQueueIngredients([sampleIngredients[0], sampleIngredients[1]]);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('Tomato');

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
        ).toBe('Onion');
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
      ).toBe('Vegetarian');
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
        ).toBe('Quick');
      });

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('Healthy');
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
      ).toBe('Vegetarian');

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onDismiss')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('Quick');
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
      const { getByTestId } = renderQueueTags([sampleTags[0]]);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onUseExisting'
        )
      );

      expect(mockOnValidated).toHaveBeenCalledTimes(1);
    });

    test('handles onUseExisting callback for ingredients', () => {
      const { getByTestId } = renderQueueIngredients([sampleIngredients[0]]);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onUseExisting'
        )
      );

      expect(mockOnValidated).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    test('skips items with empty name', async () => {
      const tagsWithEmpty: tagTableElement[] = [
        { id: 1, name: '' },
        { id: 2, name: 'Valid' },
      ];
      const { getByTestId } = renderQueueTags(tagsWithEmpty);

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('Valid');
      });
    });

    test('skips items with whitespace-only name', async () => {
      const tagsWithWhitespace: tagTableElement[] = [
        { id: 1, name: '   ' },
        { id: 2, name: 'Valid' },
      ];
      const { getByTestId } = renderQueueTags(tagsWithWhitespace);

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('Valid');
      });
    });

    test('updates queue when items prop changes', async () => {
      const { getByTestId, rerender } = renderQueueTags([sampleTags[0]]);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('Vegetarian');

      rerender(
        <RecipeDatabaseProvider>
          <ValidationQueue
            type='Tag'
            items={[sampleTags[1]]}
            onValidated={mockOnValidated}
            onComplete={mockOnComplete}
            testId='test-validation'
          />
        </RecipeDatabaseProvider>
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('Quick');
      });
    });

    test('handles multiple consecutive empty items', async () => {
      const tagsWithMultipleEmpty: tagTableElement[] = [
        { id: 1, name: '' },
        { id: 2, name: '   ' },
        { id: 3, name: '' },
        { id: 4, name: 'Valid' },
      ];

      const { getByTestId } = renderQueueTags(tagsWithMultipleEmpty);

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('Valid');
      });
    });

    test('calls onComplete when all items have empty names', async () => {
      const allEmptyTags: tagTableElement[] = [
        { id: 1, name: '' },
        { id: 2, name: '   ' },
      ];

      renderQueueTags(allEmptyTags);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
        expect(mockOnValidated).not.toHaveBeenCalled();
      });
    });
  });

  describe('Ingredient Validation Bug Fixes', () => {
    const mockOnDismissed = jest.fn();

    const renderQueueIngredientsWithDismissed = (items: FormIngredientElement[]) => {
      return render(
        <RecipeDatabaseProvider>
          <ValidationQueue
            type={'Ingredient'}
            items={items as ingredientTableElement[]}
            onValidated={mockOnValidated}
            onDismissed={mockOnDismissed}
            onComplete={mockOnComplete}
            testId='test-validation'
          />
        </RecipeDatabaseProvider>
      );
    };

    beforeEach(() => {
      mockOnDismissed.mockClear();
    });

    test('calls onDismissed with original ingredient before onValidated', async () => {
      const formIngredients: FormIngredientElement[] = [
        { name: 'Oignon', quantity: '100', unit: 'g' },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      expect(mockOnDismissed).toHaveBeenCalledTimes(1);
      expect(mockOnValidated).toHaveBeenCalledTimes(1);

      const dismissedIngredient = mockOnDismissed.mock.calls[0][0];
      expect(dismissedIngredient.name).toBe('Oignon');
      expect(dismissedIngredient.quantity).toBe('100');
    });

    test('uses original quantity when available', () => {
      const formIngredients: FormIngredientElement[] = [
        { name: 'Tomato', quantity: '250', unit: 'g' },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      const validatedIngredient = mockOnValidated.mock.calls[0][0];
      expect(validatedIngredient.quantity).toBe('250');
    });

    test('uses validated quantity when original quantity is undefined', () => {
      const formIngredients: FormIngredientElement[] = [{ name: 'Tomato', unit: 'g' }];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      const validatedIngredient = mockOnValidated.mock.calls[0][0];
      expect(validatedIngredient.quantity).toBe('100');
    });

    test('uses validated quantity when original quantity is empty string', () => {
      const formIngredients: FormIngredientElement[] = [
        { name: 'Tomato', quantity: '', unit: 'g' },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      const validatedIngredient = mockOnValidated.mock.calls[0][0];
      expect(validatedIngredient.quantity).toBe('100');
    });

    test('preserves database ingredient metadata in validated result', () => {
      const formIngredients: FormIngredientElement[] = [
        { name: 'Tomato', quantity: '100', unit: 'pieces' },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onConfirm'
        )
      );

      const validatedIngredient = mockOnValidated.mock.calls[0][0];
      expect(validatedIngredient.name).toBeDefined();
    });

    test('handles onUseExisting similarly to onConfirm for ingredients', () => {
      const formIngredients: FormIngredientElement[] = [
        { name: 'Onion', quantity: '50', unit: 'g' },
      ];

      const { getByTestId } = renderQueueIngredientsWithDismissed(formIngredients);

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onUseExisting'
        )
      );

      expect(mockOnDismissed).toHaveBeenCalledTimes(1);
      expect(mockOnValidated).toHaveBeenCalledTimes(1);

      const validatedIngredient = mockOnValidated.mock.calls[0][0];
      expect(validatedIngredient.quantity).toBe('50');
    });
  });
});
