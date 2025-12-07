import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import IngredientsSettings from '@screens/IngredientsSettings';
import {
  FormIngredientElement,
  ingredientTableElement,
  ingredientType,
  isIngredientEqual,
} from '@customTypes/DatabaseElementTypes';
import { mockNavigationFunctions } from '@mocks/deps/react-navigation-mock';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import { QueryByQuery } from '@testing-library/react-native/build/queries/make-queries';
import {
  CommonQueryOptions,
  TextMatchOptions,
} from '@testing-library/react-native/build/queries/options';
import { TextMatch } from '@testing-library/react-native/build/matches';
import { DialogMode } from '@components/dialogs/ItemDialog';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';

jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);
jest.mock('@components/organisms/SettingsItemList', () => ({
  SettingsItemList: require('@mocks/components/organisms/SettingsItemList-mock')
    .settingsItemListMock,
}));
jest.mock('@components/dialogs/ItemDialog', () => ({
  ItemDialog: require('@mocks/components/dialogs/ItemDialog-mock').itemDialogMock,
}));

const mockRoute = {
  key: 'IngredientsSettings',
  name: 'IngredientsSettings',
  params: {},
};

const defaultProps = {
  navigation: mockNavigationFunctions,
  route: mockRoute,
} as any;

const renderIngredientsSettings = async () => {
  const result = render(
    <RecipeDatabaseProvider>
      <IngredientsSettings {...defaultProps} />
    </RecipeDatabaseProvider>
  );

  await waitFor(() => {
    expect(result.getByTestId('IngredientsSettings::SettingsItemList::Type')).toBeTruthy();
    const items = result.getByTestId('IngredientsSettings::SettingsItemList::Items').props.children;
    expect(items).not.toEqual('[]');
  });

  return result;
};

type QueryByIdType = QueryByQuery<TextMatch, CommonQueryOptions & TextMatchOptions>;

function dialogIsNotOpen(getByTestId: QueryByIdType) {
  expect(getByTestId('IngredientsSettings::ItemDialog::IsVisible').props.children).toEqual(false);
  expect(getByTestId('IngredientsSettings::ItemDialog::Mode')).toBeTruthy();
  expect(getByTestId('IngredientsSettings::ItemDialog::OnClose')).toBeTruthy();
  expect(getByTestId('IngredientsSettings::ItemDialog::Item')).toBeTruthy();
}

function dialogIsOpen(
  item: ingredientTableElement | FormIngredientElement,
  mode: DialogMode,
  getByTestId: QueryByIdType
) {
  expect(getByTestId('IngredientsSettings::ItemDialog::IsVisible').props.children).toEqual(true);
  expect(getByTestId('IngredientsSettings::ItemDialog::Mode').props.children).toEqual(mode);
  expect(getByTestId('IngredientsSettings::ItemDialog::OnClose')).toBeTruthy();

  expect(getByTestId('IngredientsSettings::ItemDialog::Item::Type').props.children).toEqual(
    'Ingredient'
  );
  expect(getByTestId('IngredientsSettings::ItemDialog::Item::Value').props.children).toEqual(
    JSON.stringify(item)
  );
  expect(getByTestId('IngredientsSettings::ItemDialog::Item::OnConfirm')).toBeTruthy();
}

describe('IngredientsSettings Screen', () => {
  const db = RecipeDatabase.getInstance();

  let sortedDataset = testIngredients;

  beforeEach(async () => {
    jest.clearAllMocks();

    await db.init();
    await db.addMultipleIngredients(testIngredients);
    await db.addMultipleTags(testTags);
    await db.addMultipleRecipes(testRecipes);
    await db.addMultipleShopping(testRecipes);

    sortedDataset = [...db.get_ingredients()].sort((a, b) => a.name.localeCompare(b.name));
  });

  afterEach(async () => {
    await db.closeAndReset();
  });

  test('renders correctly with initial tags', async () => {
    const { getByTestId, queryByTestId } = await renderIngredientsSettings();

    expect(getByTestId('IngredientsSettings::SettingsItemList::Type').props.children).toEqual(
      'ingredient'
    );
    expect(getByTestId('IngredientsSettings::SettingsItemList::Items').props.children).toEqual(
      JSON.stringify(sortedDataset)
    );
    expect(getByTestId('IngredientsSettings::BottomActionButton')).toBeTruthy();
    expect(getByTestId('IngredientsSettings::SettingsItemList::OnEdit')).toBeTruthy();
    expect(getByTestId('IngredientsSettings::SettingsItemList::OnDelete')).toBeTruthy();

    dialogIsNotOpen(getByTestId);
  });

  test('opens add dialog with empty template when add button is pressed', async () => {
    const { getByTestId } = await renderIngredientsSettings();
    fireEvent.press(getByTestId('IngredientsSettings::BottomActionButton'));

    await waitFor(() => {
      expect(getByTestId('IngredientsSettings::ItemDialog::Item')).toBeTruthy();
    });

    const emptyTemplate: FormIngredientElement = {};

    dialogIsOpen(emptyTemplate, 'add', getByTestId);
  });

  test('opens add dialog when add button is pressed and save value', async () => {
    const { getByTestId } = await renderIngredientsSettings();
    fireEvent.press(getByTestId('IngredientsSettings::BottomActionButton'));

    await waitFor(() => {
      expect(getByTestId('IngredientsSettings::ItemDialog::Item')).toBeTruthy();
    });

    fireEvent.press(getByTestId('IngredientsSettings::ItemDialog::Item::OnConfirm'));

    await waitFor(() => {
      expect(db.get_ingredients().length).toEqual(sortedDataset.length + 1);
    });
    const expectedIngredient: ingredientTableElement = {
      id: 38,
      name: 'New Value',
      season: ['5', '6', '7', '8', '9', '10'],
      type: ingredientType.fruit,
      unit: 'g',
    };
    expect(db.get_ingredients()[db.get_ingredients().length - 1]).toEqual(expectedIngredient);
  });

  test('opens edit dialog when edit button is pressed and save value', async () => {
    const { getByTestId } = await renderIngredientsSettings();
    fireEvent.press(getByTestId('IngredientsSettings::SettingsItemList::OnEdit'));

    await waitFor(() => {
      expect(getByTestId('IngredientsSettings::ItemDialog::Item')).toBeTruthy();
    });

    dialogIsOpen(sortedDataset[0], 'edit', getByTestId);

    fireEvent.press(getByTestId('IngredientsSettings::ItemDialog::Item::OnConfirm'));

    await waitFor(() => {
      expect(
        db.get_ingredients().find(ingredient => isIngredientEqual(ingredient, sortedDataset[0]))
      ).toBeUndefined();
    });
    const newIngredient = db
      .get_ingredients()
      .find(ingredient => ingredient.id === sortedDataset[0].id);
    expect(newIngredient?.name).toEqual('New Value');
  });

  test('opens delete dialog when delete button is pressed and save value', async () => {
    const { getByTestId } = await renderIngredientsSettings();
    fireEvent.press(getByTestId('IngredientsSettings::SettingsItemList::OnDelete'));

    await waitFor(() => {
      expect(getByTestId('IngredientsSettings::ItemDialog::Item')).toBeTruthy();
    });

    dialogIsOpen(sortedDataset[0], 'delete', getByTestId);

    fireEvent.press(getByTestId('IngredientsSettings::ItemDialog::Item::OnConfirm'));

    await waitFor(() => {
      expect(db.get_ingredients().length).toEqual(sortedDataset.length - 1);
    });
    expect(
      db.get_ingredients().find(ingredient => isIngredientEqual(ingredient, sortedDataset[0]))
    ).toBeUndefined();
  });
});
