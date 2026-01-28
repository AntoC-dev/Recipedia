import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ValidationQueue } from '@components/dialogs/ValidationQueue';
import RecipeDatabase from '@utils/RecipeDatabase';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import {
  ingredientTableElement,
  ingredientType,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { IngredientWithSimilarity, TagWithSimilarity } from '@utils/RecipeValidationHelpers';

jest.mock('@components/dialogs/SimilarityDialog', () =>
  require('@mocks/components/dialogs/SimilarityDialog-mock')
);

describe('ValidationQueue', () => {
  const database = RecipeDatabase.getInstance();

  const mockOnValidated = jest.fn();
  const mockOnComplete = jest.fn();

  const sampleTags: TagWithSimilarity[] = [
    { id: 1, name: 'Vegetarian', similarItems: [] },
    { id: 2, name: 'Quick', similarItems: [] },
    { id: 3, name: 'Healthy', similarItems: [] },
  ];

  const sampleIngredients: IngredientWithSimilarity[] = [
    {
      id: 1,
      name: 'Tomato',
      type: ingredientType.vegetable,
      unit: 'g',
      quantity: '100',
      season: [],
      similarItems: [],
    },
    {
      id: 2,
      name: 'Onion',
      type: ingredientType.vegetable,
      unit: 'g',
      quantity: '50',
      season: [],
      similarItems: [],
    },
    {
      id: 3,
      name: 'Garlic',
      type: ingredientType.vegetable,
      unit: 'clove',
      quantity: '2',
      season: [],
      similarItems: [],
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

  const renderQueueTags = (items: TagWithSimilarity[], testID = 'test-validation') => {
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

  const renderQueueIngredients = (items: IngredientWithSimilarity[]) => {
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
      const tagWithSimilar: TagWithSimilarity[] = [
        { id: 1, name: 'NewTag', similarItems: [{ id: 100, name: 'ExistingTag' }] },
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
      const ingredientWithSimilar: IngredientWithSimilarity[] = [
        {
          name: 'NewIngredient',
          quantity: '100',
          unit: 'g',
          similarItems: [
            {
              id: 100,
              name: 'ExistingIngredient',
              type: ingredientType.vegetable,
              unit: 'g',
              quantity: '200',
              season: [],
            },
          ],
        },
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

  describe('Edge Cases', () => {
    test('skips items with empty name', async () => {
      const tagsWithEmpty: TagWithSimilarity[] = [
        { id: 1, name: '', similarItems: [] },
        { id: 2, name: 'Valid', similarItems: [] },
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
      const tagsWithWhitespace: TagWithSimilarity[] = [
        { id: 1, name: '   ', similarItems: [] },
        { id: 2, name: 'Valid', similarItems: [] },
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
      const tagsWithMultipleEmpty: TagWithSimilarity[] = [
        { id: 1, name: '', similarItems: [] },
        { id: 2, name: '   ', similarItems: [] },
        { id: 3, name: '', similarItems: [] },
        { id: 4, name: 'Valid', similarItems: [] },
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
      const allEmptyTags: TagWithSimilarity[] = [
        { id: 1, name: '', similarItems: [] },
        { id: 2, name: '   ', similarItems: [] },
      ];

      renderQueueTags(allEmptyTags);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
        expect(mockOnValidated).not.toHaveBeenCalled();
      });
    });
  });

  describe('Pre-computed similarItems', () => {
    test('passes pre-computed similarItems to SimilarityDialog for tags', () => {
      const dbTag: tagTableElement = { id: 100, name: 'ExistingTag' };
      const tagsWithSimilar: TagWithSimilarity[] = [
        { id: 1, name: 'NewTag', similarItems: [dbTag] },
      ];

      const { getByTestId } = renderQueueTags(tagsWithSimilar);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).not.toBe('undefined');
      expect(JSON.parse(similarItemText).name).toBe('ExistingTag');
    });

    test('passes pre-computed similarItems to SimilarityDialog for ingredients', () => {
      const dbIngredient: ingredientTableElement = {
        id: 100,
        name: 'ExistingIngredient',
        type: ingredientType.vegetable,
        unit: 'g',
        quantity: '200',
        season: [],
      };
      const ingredientsWithSimilar: IngredientWithSimilarity[] = [
        {
          name: 'NewIngredient',
          quantity: '100',
          unit: 'g',
          similarItems: [dbIngredient],
        },
      ];

      const { getByTestId } = renderQueueIngredients(ingredientsWithSimilar);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).not.toBe('undefined');
      expect(JSON.parse(similarItemText).name).toBe('ExistingIngredient');
    });

    test('passes empty similarItems correctly for tags', () => {
      const tagsWithoutSimilar: TagWithSimilarity[] = [
        { id: 1, name: 'BrandNewTag', similarItems: [] },
      ];

      const { getByTestId } = renderQueueTags(tagsWithoutSimilar);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).toBe('undefined');
    });

    test('passes empty similarItems correctly for ingredients', () => {
      const ingredientsWithoutSimilar: IngredientWithSimilarity[] = [
        {
          name: 'BrandNewIngredient',
          quantity: '100',
          unit: 'g',
          similarItems: [],
        },
      ];

      const { getByTestId } = renderQueueIngredients(ingredientsWithoutSimilar);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).toBe('undefined');
    });

    test('passes multiple similarItems correctly', () => {
      const dbIngredients: ingredientTableElement[] = [
        {
          id: 100,
          name: 'Similar1',
          type: ingredientType.vegetable,
          unit: 'g',
          quantity: '100',
          season: [],
        },
        {
          id: 101,
          name: 'Similar2',
          type: ingredientType.vegetable,
          unit: 'g',
          quantity: '200',
          season: [],
        },
        {
          id: 102,
          name: 'Similar3',
          type: ingredientType.vegetable,
          unit: 'g',
          quantity: '300',
          season: [],
        },
      ];
      const ingredientsWithMultipleSimilar: IngredientWithSimilarity[] = [
        {
          name: 'NewIngredient',
          quantity: '100',
          unit: 'g',
          similarItems: dbIngredients,
        },
      ];

      const { getByTestId } = renderQueueIngredients(ingredientsWithMultipleSimilar);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).not.toBe('undefined');
      expect(JSON.parse(similarItemText).name).toBe('Similar1');
    });
  });

  describe('Sorted items order', () => {
    test('processes items in passed order (items without matches first)', async () => {
      const sortedTags: TagWithSimilarity[] = [
        { id: 1, name: 'NoMatch1', similarItems: [] },
        { id: 2, name: 'NoMatch2', similarItems: [] },
        { id: 3, name: 'HasMatch', similarItems: [{ id: 100, name: 'ExistingTag' }] },
      ];

      const { getByTestId } = renderQueueTags(sortedTags);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('NoMatch1');

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('NoMatch2');
      });

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('HasMatch');
      });
    });

    test('maintains sorted order for ingredients (no match items first)', async () => {
      const sortedIngredients: IngredientWithSimilarity[] = [
        { name: 'BrandNew', quantity: '100', unit: 'g', similarItems: [] },
        {
          name: 'HasSimilar',
          quantity: '200',
          unit: 'g',
          similarItems: [
            {
              id: 100,
              name: 'Similar',
              type: ingredientType.vegetable,
              unit: 'g',
              quantity: '50',
              season: [],
            },
          ],
        },
      ];

      const { getByTestId } = renderQueueIngredients(sortedIngredients);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('BrandNew');

      let similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;
      expect(similarItemText).toBe('undefined');

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
        ).toBe('HasSimilar');
      });

      similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;
      expect(similarItemText).not.toBe('undefined');
      expect(JSON.parse(similarItemText).name).toBe('Similar');
    });

    test('processes all items regardless of similarItems presence', async () => {
      const mixedTags: TagWithSimilarity[] = [
        { id: 1, name: 'First', similarItems: [] },
        { id: 2, name: 'Second', similarItems: [{ id: 100, name: 'Existing' }] },
        { id: 3, name: 'Third', similarItems: [] },
      ];

      const { getByTestId } = renderQueueTags(mixedTags);

      for (let i = 0; i < 3; i++) {
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

  describe('Ingredient Filtering (Cleaned Name Logic)', () => {
    test('shows similarity dialog when similarItems contains exact match', async () => {
      const ingredientExactMatch: IngredientWithSimilarity[] = [
        {
          id: 99,
          name: 'cheddar',
          type: ingredientType.dairy,
          unit: 'g',
          quantity: '100',
          season: [],
          similarItems: [
            {
              id: 1,
              name: 'Cheddar',
              type: ingredientType.dairy,
              unit: 'g',
              quantity: '100',
              season: [],
            },
          ],
        },
      ];

      const { getByTestId } = renderQueueIngredients(ingredientExactMatch);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).not.toBe('undefined');
      expect(JSON.parse(similarItemText).name).toBe('Cheddar');

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onUseExisting'
        )
      ).toBeTruthy();
    });

    test('shows similarity dialog when similarItems contains fuzzy match', async () => {
      const ingredientFuzzyMatch: IngredientWithSimilarity[] = [
        {
          id: 99,
          name: 'Tomatos',
          type: ingredientType.vegetable,
          unit: 'g',
          quantity: '100',
          season: [],
          similarItems: [
            {
              id: 1,
              name: 'Tomatoes',
              type: ingredientType.vegetable,
              unit: 'g',
              quantity: '100',
              season: [],
            },
          ],
        },
      ];

      const { getByTestId } = renderQueueIngredients(ingredientFuzzyMatch);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).not.toBe('undefined');
      expect(JSON.parse(similarItemText).name).toBe('Tomatoes');

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onUseExisting'
        )
      ).toBeTruthy();
    });

    test('shows tag as-is (tags are passed with pre-computed similarItems)', async () => {
      const tagWithParentheses: TagWithSimilarity[] = [
        { id: 99, name: 'Quick (fast meals)', similarItems: [] },
      ];

      const { getByTestId } = renderQueueTags(tagWithParentheses);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('Quick (fast meals)');
    });
  });

  describe('Ingredient Validation Bug Fixes', () => {
    const mockOnDismissed = jest.fn();

    const renderQueueIngredientsWithDismissed = (items: IngredientWithSimilarity[]) => {
      return render(
        <RecipeDatabaseProvider>
          <ValidationQueue
            type={'Ingredient'}
            items={items}
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
        { name: 'Tomato', quantity: '250', unit: 'g', similarItems: [] },
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
        { name: 'Tomato', unit: 'g', similarItems: [] },
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
        { name: 'Tomato', quantity: '', unit: 'g', similarItems: [] },
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
        { name: 'Tomato', quantity: '100', unit: 'pieces', similarItems: [] },
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
        name: 'Onion',
        type: ingredientType.vegetable,
        unit: 'g',
        quantity: '200',
        season: [],
      };
      const formIngredients: IngredientWithSimilarity[] = [
        { name: 'Onion', quantity: '50', unit: 'g', similarItems: [existingIngredient] },
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
