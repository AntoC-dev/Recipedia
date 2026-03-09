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
    { id: 1, name: 'BrandNewTag1' },
    { id: 2, name: 'BrandNewTag2' },
    { id: 3, name: 'BrandNewTag3' },
  ];

  const sampleIngredients: FormIngredientElement[] = [
    { name: 'UniqueIngredient1', unit: 'g', quantity: '100', season: [] },
    { name: 'UniqueIngredient2', unit: 'g', quantity: '50', season: [] },
    { name: 'UniqueIngredient3', unit: 'clove', quantity: '2', season: [] },
  ];

  beforeEach(async () => {
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

  const renderQueueIngredients = (items: FormIngredientElement[]) => {
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
      const dbTag: tagTableElement = { id: 100, name: 'ExistingTag' };
      const tagWithSimilar: tagTableElement[] = [{ id: 1, name: 'NewTag' }];

      jest.spyOn(RecipeDatabase.getInstance(), 'findSimilarTags').mockReturnValue([dbTag]);

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
      const ingredientWithSimilar: FormIngredientElement[] = [
        { name: 'NewIngredient', quantity: '100', unit: 'g' },
      ];

      jest
        .spyOn(RecipeDatabase.getInstance(), 'findSimilarIngredients')
        .mockReturnValue([dbIngredient]);

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
      const tagsWithEmpty: tagTableElement[] = [
        { id: 1, name: '' },
        { id: 2, name: 'ValidTag' },
      ];
      const { getByTestId } = renderQueueTags(tagsWithEmpty);

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('ValidTag');
      });
    });

    test('skips items with whitespace-only name', async () => {
      const tagsWithWhitespace: tagTableElement[] = [
        { id: 1, name: '   ' },
        { id: 2, name: 'ValidTag' },
      ];
      const { getByTestId } = renderQueueTags(tagsWithWhitespace);

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('ValidTag');
      });
    });

    test('updates queue when items prop changes', async () => {
      const { getByTestId, rerender } = renderQueueTags([sampleTags[0]]);

      expect(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('BrandNewTag1');

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
        ).toBe('BrandNewTag2');
      });
    });

    test('handles multiple consecutive empty items', async () => {
      const tagsWithMultipleEmpty: tagTableElement[] = [
        { id: 1, name: '' },
        { id: 2, name: '   ' },
        { id: 3, name: '' },
        { id: 4, name: 'ValidTag' },
      ];

      const { getByTestId } = renderQueueTags(tagsWithMultipleEmpty);

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('ValidTag');
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

  describe('Exact Match Auto-Validation', () => {
    test('auto-validates tag that exactly matches a DB entry without showing dialog', async () => {
      const italianInDB: tagTableElement = { id: 1, name: 'Italian' };
      jest.spyOn(RecipeDatabase.getInstance(), 'findSimilarTags').mockReturnValue([italianInDB]);

      const exactMatchTag: tagTableElement[] = [{ id: -1, name: 'Italian' }];

      renderQueueTags(exactMatchTag);

      await waitFor(() => {
        expect(mockOnValidated).toHaveBeenCalledTimes(1);
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });

      expect(mockOnValidated.mock.calls[0][0].name).toBe('Italian');
      expect(mockOnValidated.mock.calls[0][1].name).toBe('Italian');
    });

    test('auto-validates ingredient that exactly matches a DB entry without showing dialog', async () => {
      const spaghettiInDB: ingredientTableElement = {
        id: 1,
        name: 'Spaghetti',
        type: ingredientType.vegetable,
        unit: 'g',
        quantity: '100',
        season: [],
      };
      jest
        .spyOn(RecipeDatabase.getInstance(), 'findSimilarIngredients')
        .mockReturnValue([spaghettiInDB]);

      const exactMatchIngredient: FormIngredientElement[] = [
        { name: 'Spaghetti', quantity: '200', unit: 'g', season: [] },
      ];

      renderQueueIngredients(exactMatchIngredient);

      await waitFor(() => {
        expect(mockOnValidated).toHaveBeenCalledTimes(1);
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });

      expect(mockOnValidated.mock.calls[0][1].name).toBe('Spaghetti');
      expect(mockOnValidated.mock.calls[0][1].quantity).toBe('200');
    });

    test('auto-validates exact matches and shows dialog for non-matches', async () => {
      const italianInDB: tagTableElement = { id: 1, name: 'Italian' };
      jest.spyOn(RecipeDatabase.getInstance(), 'findSimilarTags').mockImplementation(name => {
        if (name.toLowerCase() === 'italian') return [italianInDB];
        return [];
      });

      const mixedTags: tagTableElement[] = [
        { id: -1, name: 'Italian' },
        { id: -1, name: 'BrandNewUniqueTag' },
      ];

      const { getByTestId } = renderQueueTags(mixedTags);

      // With sorting: BrandNewUniqueTag (no similar) shows first, Italian (has similar) second
      expect(
        getByTestId(
          'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.newItemName'
        ).props.children
      ).toBe('BrandNewUniqueTag');

      fireEvent.press(
        getByTestId('test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.onConfirm')
      );

      // After confirming BrandNewUniqueTag, Italian auto-validates (exact match)
      await waitFor(() => {
        expect(mockOnValidated).toHaveBeenCalledTimes(2);
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Similarity Computation', () => {
    test('passes similarItem to SimilarityDialog when DB has similar entry', () => {
      const dbIngredient: ingredientTableElement = {
        id: 100,
        name: 'ExistingIngredient',
        type: ingredientType.vegetable,
        unit: 'g',
        quantity: '200',
        season: [],
      };

      jest
        .spyOn(RecipeDatabase.getInstance(), 'findSimilarIngredients')
        .mockReturnValue([dbIngredient]);

      const { getByTestId } = renderQueueIngredients([
        { name: 'NewIngredient', quantity: '100', unit: 'g' },
      ]);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).not.toBe('undefined');
      expect(JSON.parse(similarItemText).name).toBe('ExistingIngredient');
    });

    test('passes no similarItem when DB has no similar entry', () => {
      const { getByTestId } = renderQueueIngredients([sampleIngredients[0]]);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).toBe('undefined');
    });

    test('passes no similarItem for tags with no DB match', () => {
      const { getByTestId } = renderQueueTags([sampleTags[0]]);

      const similarItemText = getByTestId(
        'test-validation::ValidationQueue::Tag::SimilarityDialog::Mock::item.similarItem'
      ).props.children;

      expect(similarItemText).toBe('undefined');
    });
  });

  describe('Re-compute After Add New', () => {
    test('does not re-compute similarity after Use Existing', async () => {
      const findSimilarIngredientsSpy = jest.spyOn(
        RecipeDatabase.getInstance(),
        'findSimilarIngredients'
      );
      const dbIngredient: ingredientTableElement = {
        id: 100,
        name: 'ExistingIngredient',
        type: ingredientType.vegetable,
        unit: 'g',
        quantity: '200',
        season: [],
      };
      findSimilarIngredientsSpy.mockReturnValue([dbIngredient]);

      const twoIngredients: FormIngredientElement[] = [
        { name: 'FirstIngredient', quantity: '100', unit: 'g' },
        { name: 'SecondIngredient', quantity: '50', unit: 'ml' },
      ];

      const { getByTestId } = renderQueueIngredients(twoIngredients);

      const callCountAfterInit = findSimilarIngredientsSpy.mock.calls.length;

      fireEvent.press(
        getByTestId(
          'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.onUseExisting'
        )
      );

      await waitFor(() => {
        expect(
          getByTestId(
            'test-validation::ValidationQueue::Ingredient::SimilarityDialog::Mock::item.newItemName'
          ).props.children
        ).toBe('SecondIngredient');
      });

      expect(findSimilarIngredientsSpy.mock.calls.length).toBe(callCountAfterInit);
    });
  });

  describe('Sorted Items Order', () => {
    test('processes items without similar matches before items with similar matches', async () => {
      const dbTag: tagTableElement = { id: 100, name: 'ExistingTag' };
      const findSimilarTagsSpy = jest.spyOn(RecipeDatabase.getInstance(), 'findSimilarTags');

      findSimilarTagsSpy.mockImplementation(name => {
        if (name === 'HasMatch') return [dbTag];
        return [];
      });

      const unsortedTags: tagTableElement[] = [
        { id: 1, name: 'HasMatch' },
        { id: 2, name: 'NoMatch1' },
        { id: 3, name: 'NoMatch2' },
      ];

      const { getByTestId } = renderQueueTags(unsortedTags);

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
  });

  describe('Ingredient Validation Bug Fixes', () => {
    const mockOnDismissed = jest.fn();

    const renderQueueIngredientsWithDismissed = (items: FormIngredientElement[]) => {
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
      const formIngredients: FormIngredientElement[] = [
        { name: 'Oignon', quantity: '100', unit: 'g' },
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
      const formIngredients: FormIngredientElement[] = [
        { name: 'UniqueTestIngredient', quantity: '250', unit: 'g' },
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
      const formIngredients: FormIngredientElement[] = [
        { name: 'UniqueTestIngredient', unit: 'g' },
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
      const formIngredients: FormIngredientElement[] = [
        { name: 'UniqueTestIngredient', quantity: '', unit: 'g' },
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
      const formIngredients: FormIngredientElement[] = [
        { name: 'UniqueTestIngredient', quantity: '100', unit: 'pieces' },
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

      jest
        .spyOn(RecipeDatabase.getInstance(), 'findSimilarIngredients')
        .mockReturnValue([existingIngredient]);

      const formIngredients: FormIngredientElement[] = [
        { name: 'UniqueTestIngredient', quantity: '50', unit: 'g' },
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
