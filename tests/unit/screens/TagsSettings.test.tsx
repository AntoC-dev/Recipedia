import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import TagsSettings from '@screens/TagsSettings';
import { isTagEqual, tagTableElement } from '@customTypes/DatabaseElementTypes';
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
  key: 'TagsSettings',
  name: 'TagsSettings',
  params: { tag: testTags[0] },
};

const defaultProps = {
  navigation: mockNavigationFunctions,
  route: mockRoute,
} as any;

const renderTagsSettings = async () => {
  const result = render(
    <RecipeDatabaseProvider>
      <TagsSettings {...defaultProps} />
    </RecipeDatabaseProvider>
  );

  await waitFor(() => {
    expect(result.getByTestId('TagsSettings::SettingsItemList::Type')).toBeTruthy();
    const items = result.getByTestId('TagsSettings::SettingsItemList::Items').props.children;
    expect(items).not.toEqual('[]');
  });

  return result;
};

type QueryByIdType = QueryByQuery<TextMatch, CommonQueryOptions & TextMatchOptions>;

function dialogIsNotOpen(getByTestId: QueryByIdType) {
  expect(getByTestId('TagsSettings::ItemDialog::IsVisible').props.children).toEqual(false);
  expect(getByTestId('TagsSettings::ItemDialog::Mode')).toBeTruthy();
  expect(getByTestId('TagsSettings::ItemDialog::OnClose')).toBeTruthy();
  expect(getByTestId('TagsSettings::ItemDialog::Item')).toBeTruthy();
}

function dialogIsOpen(item: tagTableElement, mode: DialogMode, getByTestId: QueryByIdType) {
  expect(getByTestId('TagsSettings::ItemDialog::IsVisible').props.children).toEqual(true);
  expect(getByTestId('TagsSettings::ItemDialog::Mode').props.children).toEqual(mode);
  expect(getByTestId('TagsSettings::ItemDialog::OnClose')).toBeTruthy();

  expect(getByTestId('TagsSettings::ItemDialog::Item::Type').props.children).toEqual('Tag');
  expect(getByTestId('TagsSettings::ItemDialog::Item::Value').props.children).toEqual(
    JSON.stringify(item)
  );
  expect(getByTestId('TagsSettings::ItemDialog::Item::OnConfirm')).toBeTruthy();
}

describe('TagsSettings Screen', () => {
  const db = RecipeDatabase.getInstance();

  let sortedDataset = testTags;

  beforeEach(async () => {
    jest.clearAllMocks();

    await db.init();
    await db.addMultipleIngredients(testIngredients);
    await db.addMultipleTags(testTags);
    await db.addMultipleRecipes(testRecipes);
    await db.addMultipleShopping(testRecipes);

    sortedDataset = [...db.get_tags()].sort((a, b) => a.name.localeCompare(b.name));
  });

  afterEach(async () => {
    await db.closeAndReset();
  });

  test('renders correctly with initial tags', async () => {
    const { getByTestId } = await renderTagsSettings();

    expect(getByTestId('TagsSettings::SettingsItemList::Type').props.children).toEqual('tag');
    expect(getByTestId('TagsSettings::SettingsItemList::Items').props.children).toEqual(
      JSON.stringify(sortedDataset)
    );
    expect(getByTestId('TagsSettings::BottomActionButton')).toBeTruthy();
    expect(getByTestId('TagsSettings::SettingsItemList::OnEdit')).toBeTruthy();
    expect(getByTestId('TagsSettings::SettingsItemList::OnDelete')).toBeTruthy();

    dialogIsNotOpen(getByTestId);
  });

  test('opens add dialog when add button is pressed and save value', async () => {
    const { getByTestId } = await renderTagsSettings();
    fireEvent.press(getByTestId('TagsSettings::BottomActionButton'));

    await waitFor(() => {
      expect(getByTestId('TagsSettings::ItemDialog::Item')).toBeTruthy();
    });

    dialogIsOpen({ name: '' }, 'add', getByTestId);

    fireEvent.press(getByTestId('TagsSettings::ItemDialog::Item::OnConfirm'));

    await waitFor(() => {
      expect(db.get_tags().length).toEqual(sortedDataset.length + 1);
    });
    const expectedTag: tagTableElement = { id: 17, name: 'New Value' };
    expect(db.get_tags()[db.get_tags().length - 1]).toEqual(expectedTag);
  });

  test('opens edit dialog when edit button is pressed and save value', async () => {
    const { getByTestId } = await renderTagsSettings();
    fireEvent.press(getByTestId('TagsSettings::SettingsItemList::OnEdit'));

    await waitFor(() => {
      expect(getByTestId('TagsSettings::ItemDialog::Item')).toBeTruthy();
    });

    dialogIsOpen(sortedDataset[0], 'edit', getByTestId);

    fireEvent.press(getByTestId('TagsSettings::ItemDialog::Item::OnConfirm'));

    await waitFor(() => {
      expect(db.get_tags().find(tag => isTagEqual(tag, sortedDataset[0]))).toBeUndefined();
    });
    const newTag = db.get_tags().find(tag => tag.id === sortedDataset[0].id);
    expect(newTag?.name).toEqual('New Value');
  });

  test('opens delete dialog when delete button is pressed and save value', async () => {
    const { getByTestId } = await renderTagsSettings();
    fireEvent.press(getByTestId('TagsSettings::SettingsItemList::OnDelete'));

    await waitFor(() => {
      expect(getByTestId('TagsSettings::ItemDialog::Item')).toBeTruthy();
    });

    dialogIsOpen(sortedDataset[0], 'delete', getByTestId);

    fireEvent.press(getByTestId('TagsSettings::ItemDialog::Item::OnConfirm'));

    await waitFor(() => {
      expect(db.get_tags().length).toEqual(sortedDataset.length - 1);
    });
    expect(db.get_tags().find(tag => isTagEqual(tag, sortedDataset[0]))).toBeUndefined();
  });
});
