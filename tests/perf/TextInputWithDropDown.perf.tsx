import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';
import { TextInputWithDropDown } from '@components/molecules/TextInputWithDropDown';
import { IngredientRow } from '@components/organisms/RecipeIngredients';
import { performanceTags } from '@assets/datasets/performance/tags';
import { performanceIngredients } from '@assets/datasets/performance/ingredients';
import { HEAVY_WARMUP } from './perfOptions';

const tagNames = performanceTags.map(tag => tag.name).sort();
const ingredientNames = performanceIngredients.map(ingredient => ingredient.name).sort();
const tagInputId = 'PerfTest::TagInput';
const ingredientRowId = 'PerfTest::Ingredients';
const ingredientNameInputId = `${ingredientRowId}::0::NameInput`;

const emptyIngredient = {
  name: '',
  unit: '',
  quantity: '',
  season: [],
};

function TagDropdown() {
  return <TextInputWithDropDown testID={tagInputId} referenceTextArray={tagNames} />;
}

function IngredientNameDropdown() {
  return (
    <IngredientRow
      testID={ingredientRowId}
      index={0}
      ingredient={emptyIngredient}
      availableIngredients={ingredientNames}
      onCommit={() => {}}
      onRemove={() => {}}
      onOpenNote={() => {}}
    />
  );
}

async function flushListFrames() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
}

async function focusInput(inputId: string) {
  await act(async () => {
    fireEvent(screen.getByTestId(`${inputId}::CustomTextInput`), 'focus');
  });
}

async function typeInInput(inputId: string, text: string) {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(`${inputId}::CustomTextInput`), text);
  });
}

describe('TextInputWithDropDown Performance', () => {
  test(`open tag dropdown with all ${tagNames.length} tags`, async () => {
    await measureRenders(<TagDropdown />, {
      runs: 10,
      ...HEAVY_WARMUP,
      scenario: async () => {
        await focusInput(tagInputId);
        await flushListFrames();
      },
    });
  });

  test('narrow open tag dropdown while typing', async () => {
    await measureRenders(<TagDropdown />, {
      runs: 10,
      ...HEAVY_WARMUP,
      scenario: async () => {
        await focusInput(tagInputId);
        await flushListFrames();
        await typeInInput(tagInputId, 'a');
        await flushListFrames();
        await typeInInput(tagInputId, 'an');
        await flushListFrames();
      },
    });
  });

  test(`open ingredient name dropdown with all ${ingredientNames.length} ingredients`, async () => {
    await measureRenders(<IngredientNameDropdown />, {
      runs: 10,
      ...HEAVY_WARMUP,
      scenario: async () => {
        await focusInput(ingredientNameInputId);
        await flushListFrames();
      },
    });
  });
});
