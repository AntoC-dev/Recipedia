import React, { useState } from 'react';
import { View } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';
import { RecipeSelectionCard } from '@components/molecules/RecipeSelectionCard';
import { DiscoveredRecipe } from '@customTypes/BulkImportTypes';

jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

function generateMockRecipe(
  index: number,
  memoryStatus: 'fresh' | 'seen' = 'fresh'
): DiscoveredRecipe {
  return {
    url: `https://example.com/${memoryStatus}-recipe-${index}`,
    title: `Performance Test Recipe ${index}`,
    imageUrl: `https://example.com/img${index}.jpg`,
    description: `A delicious recipe for performance testing number ${index}`,
    memoryStatus,
  };
}

function RecipeSelectionCardWrapper({
  recipe,
  initialSelected = false,
}: {
  recipe: DiscoveredRecipe;
  initialSelected?: boolean;
}) {
  const [isSelected, setIsSelected] = useState(initialSelected);

  return (
    <RecipeSelectionCard
      testId='PerfTest::Card'
      recipe={recipe}
      isSelected={isSelected}
      onSelected={() => setIsSelected(true)}
      onUnselected={() => setIsSelected(false)}
    />
  );
}

function BatchCardsWrapper({
  count,
  memoryStatus = 'fresh',
}: {
  count: number;
  memoryStatus?: 'fresh' | 'seen';
}) {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

  const recipes = Array.from({ length: count }, (_, i) => generateMockRecipe(i, memoryStatus));

  return (
    <View>
      {recipes.map((recipe, index) => (
        <RecipeSelectionCard
          key={recipe.url}
          testId={`PerfTest::Card::${index}`}
          recipe={recipe}
          isSelected={selectedUrls.has(recipe.url)}
          onSelected={() => setSelectedUrls(prev => new Set(prev).add(recipe.url))}
          onUnselected={() => {
            setSelectedUrls(prev => {
              const next = new Set(prev);
              next.delete(recipe.url);
              return next;
            });
          }}
        />
      ))}
    </View>
  );
}

describe('RecipeSelectionCard Performance', () => {
  describe('Initial Render', () => {
    test('unselected fresh recipe', async () => {
      const recipe = generateMockRecipe(1, 'fresh');
      await measureRenders(<RecipeSelectionCardWrapper recipe={recipe} />, { runs: 10 });
    });

    test('selected fresh recipe', async () => {
      const recipe = generateMockRecipe(1, 'fresh');
      await measureRenders(<RecipeSelectionCardWrapper recipe={recipe} initialSelected={true} />, {
        runs: 10,
      });
    });

    test('unselected seen recipe (with badge)', async () => {
      const recipe = generateMockRecipe(1, 'seen');
      await measureRenders(<RecipeSelectionCardWrapper recipe={recipe} />, { runs: 10 });
    });

    test('selected seen recipe (with badge)', async () => {
      const recipe = generateMockRecipe(1, 'seen');
      await measureRenders(<RecipeSelectionCardWrapper recipe={recipe} initialSelected={true} />, {
        runs: 10,
      });
    });
  });

  describe('Re-render on Selection Toggle', () => {
    test('toggle selection via card press', async () => {
      const recipe = generateMockRecipe(1, 'fresh');

      const scenario = async () => {
        const card = screen.getByTestId('PerfTest::Card');
        fireEvent.press(card);
      };

      await measureRenders(<RecipeSelectionCardWrapper recipe={recipe} />, { runs: 10, scenario });
    });

    test('toggle selection via checkbox press', async () => {
      const recipe = generateMockRecipe(1, 'fresh');

      const scenario = async () => {
        const checkbox = screen.getByTestId('PerfTest::Card::Checkbox');
        fireEvent.press(checkbox);
      };

      await measureRenders(<RecipeSelectionCardWrapper recipe={recipe} />, { runs: 10, scenario });
    });

    test('toggle selection on seen recipe', async () => {
      const recipe = generateMockRecipe(1, 'seen');

      const scenario = async () => {
        const card = screen.getByTestId('PerfTest::Card');
        fireEvent.press(card);
      };

      await measureRenders(<RecipeSelectionCardWrapper recipe={recipe} />, { runs: 10, scenario });
    });
  });

  describe('Batch Rendering (List Simulation)', () => {
    test('10 fresh cards initial render', async () => {
      await measureRenders(<BatchCardsWrapper count={10} memoryStatus='fresh' />, { runs: 10 });
    });

    test('10 seen cards initial render', async () => {
      await measureRenders(<BatchCardsWrapper count={10} memoryStatus='seen' />, { runs: 10 });
    });

    test('50 fresh cards initial render', async () => {
      await measureRenders(<BatchCardsWrapper count={50} memoryStatus='fresh' />, { runs: 10 });
    });

    test('50 cards with selection toggle', async () => {
      const scenario = async () => {
        const card = screen.getByTestId('PerfTest::Card::25');
        fireEvent.press(card);
      };

      await measureRenders(<BatchCardsWrapper count={50} memoryStatus='fresh' />, {
        runs: 10,
        scenario,
      });
    });

    test('100 fresh cards initial render', async () => {
      await measureRenders(<BatchCardsWrapper count={100} memoryStatus='fresh' />, { runs: 10 });
    });

    test('100 cards with multiple selections', async () => {
      const scenario = async () => {
        fireEvent.press(screen.getByTestId('PerfTest::Card::25'));
        fireEvent.press(screen.getByTestId('PerfTest::Card::50'));
        fireEvent.press(screen.getByTestId('PerfTest::Card::75'));
      };

      await measureRenders(<BatchCardsWrapper count={100} memoryStatus='fresh' />, {
        runs: 5,
        scenario,
      });
    });
  });
});
