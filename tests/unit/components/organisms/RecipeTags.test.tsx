import { fireEvent, render, waitFor } from '@testing-library/react-native';
import RecipeTags, { RecipeTagProps } from '@components/organisms/RecipeTags';
import React from 'react';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import RecipeDatabase from '@utils/RecipeDatabase';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';

jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));
jest.mock('@components/molecules/TextInputWithDropDown', () => ({
  TextInputWithDropDown: require('@mocks/components/molecules/TextInputWithDropDown-mock.tsx')
    .textInputWithDropdownMock,
}));
jest.mock('@components/molecules/HorizontalList', () => ({
  HorizontalList: require('@mocks/components/molecules/HorizontalList-mock').horizontalListMock,
}));
jest.mock('@expo/vector-icons', () => require('@mocks/deps/expo-vector-icons-mock'));

jest.mock('@shopify/flash-list', () => require('@mocks/deps/flashlist-mock').flashListMock());

describe('RecipeTags Component', () => {
  const sampleTags = testTags.map(tag => tag.name).sort();

  const renderRecipeTags = async (props: RecipeTagProps) => {
    const result = render(
      <RecipeDatabaseProvider>
        <RecipeTags {...props} />
      </RecipeDatabaseProvider>
    );

    await waitFor(() => {
      expect(result.getByTestId('RecipeTags::PropType')).toBeTruthy();
    });
    return result;
  };

  describe('readOnly mode', () => {
    it('renders a HorizontalList showing the provided tags', async () => {
      const { getByTestId } = await renderRecipeTags({
        type: 'readOnly',
        tagsList: sampleTags,
      });

      expect(getByTestId('RecipeTags::PropType').props.children).toEqual('Tag');
      expect(getByTestId('RecipeTags::ItemCount').props.children).toEqual(
        sampleTags.length.toString()
      );

      sampleTags.forEach((tag, index) => {
        expect(getByTestId(`RecipeTags::Item::${index}::Uri`).props.children).toEqual(tag);
      });
      expect(getByTestId('RecipeTags::Icon').props.children).toBeUndefined();
      expect(getByTestId('HorizontalList::OnPress')).toBeTruthy();
    });
  });

  describe('addOrEdit mode', () => {
    const randomTags = `${sampleTags[6]}, ${sampleTags[1]}, ${sampleTags[11]}`;
    const addNewTagMock = jest.fn();
    const removeTagMock = jest.fn();

    const defaultProps: RecipeTagProps = {
      type: 'addOrEdit',
      editType: 'edit',
      tagsList: new Array<string>(
        sampleTags[sampleTags.length - 1],
        sampleTags[sampleTags.length - 2],
        sampleTags[sampleTags.length - 3]
      ),
      randomTags: randomTags,
      addNewTag: addNewTagMock,
      removeTag: removeTagMock,
    };

    const dbInstance = RecipeDatabase.getInstance();
    beforeEach(async () => {
      jest.clearAllMocks();
      jest.clearAllMocks();

      await dbInstance.init();
      await dbInstance.addMultipleIngredients(testIngredients);
      await dbInstance.addMultipleTags(testTags);
      await dbInstance.addMultipleRecipes(testRecipes);
    });
    afterEach(async () => {
      await dbInstance.closeAndReset();
    });
    describe('edit mode', () => {
      it('renders header and description texts with the add button', async () => {
        const { getByTestId } = await renderRecipeTags(defaultProps);

        expect(getByTestId('RecipeTags::ElementText').props.children).toContain(randomTags);

        expect(getByTestId('RecipeTags::PropType').props.children).toEqual('Tag');
        expect(getByTestId('RecipeTags::ItemCount').props.children).toEqual(
          defaultProps.tagsList.length.toString()
        );

        defaultProps.tagsList.forEach((tag, index) => {
          expect(getByTestId(`RecipeTags::Item::${index}::Uri`).props.children).toEqual(tag);
        });
        expect(getByTestId('RecipeTags::Icon').props.children).toEqual('close');
        expect(getByTestId('HorizontalList::OnPress')).toBeTruthy();

        expect(getByTestId('RecipeTags::RoundButton::Icon').props.children).toEqual('plus');
        expect(getByTestId('RecipeTags::RoundButton::OnPressFunction')).toBeTruthy();
      });

      it('does not show a new tag input initially', async () => {
        const { queryByTestId, getByTestId } = await renderRecipeTags(defaultProps);

        await waitFor(() => {
          expect(getByTestId('RecipeTags::HeaderText')).toBeTruthy();
        });
        // No new tag input should be rendered at the start.
        expect(queryByTestId('RecipeTags::List::1')).toBeNull();
      });

      it('adds a new tag input field when the RoundButton is pressed', async () => {
        const { getByTestId } = await renderRecipeTags(defaultProps);

        // Press the RoundButton (using its testID).
        fireEvent.press(getByTestId('RecipeTags::RoundButton::OnPressFunction'));

        // After pressing, a new tag input should appear with testID "RecipeTags::List::1".
        await waitFor(() =>
          expect(
            getByTestId('RecipeTags::List::0::TextInputWithDropdown::AbsoluteDropDown').props
              .children
          ).toEqual(false)
        );
        expect(
          getByTestId('RecipeTags::List::0::TextInputWithDropdown::ReferenceTextArray').props
            .children
        ).toEqual(JSON.stringify(sampleTags.filter(name => !defaultProps.tagsList.includes(name))));
        expect(
          getByTestId('RecipeTags::List::0::TextInputWithDropdown::Value').props.children
        ).toBeUndefined();
        expect(
          getByTestId('RecipeTags::List::0::TextInputWithDropdown::Label').props.children
        ).toBeUndefined();
        expect(getByTestId('RecipeTags::List::0::TextInputWithDropdown::OnValidate')).toBeTruthy();
      });

      it('calls addNewTag callback when a new tag is validated and removes the input', async () => {
        const { getByTestId, queryByTestId } = await renderRecipeTags(defaultProps);

        // Simulate adding a new tag input by pressing the RoundButton.
        fireEvent.press(getByTestId('RecipeTags::RoundButton::OnPressFunction'));
        fireEvent.press(getByTestId('RecipeTags::RoundButton::OnPressFunction'));

        await waitFor(() =>
          expect(
            getByTestId('RecipeTags::List::0::TextInputWithDropdown::AbsoluteDropDown').props
              .children
          ).toEqual(false)
        );
        await waitFor(() =>
          expect(
            getByTestId('RecipeTags::List::1::TextInputWithDropdown::AbsoluteDropDown').props
              .children
          ).toEqual(false)
        );

        for (let i = 0; i < 2; i++) {
          expect(
            getByTestId('RecipeTags::List::' + i + '::TextInputWithDropdown::ReferenceTextArray')
              .props.children
          ).toEqual(
            JSON.stringify(sampleTags.filter(name => !defaultProps.tagsList.includes(name)))
          );
          expect(
            getByTestId('RecipeTags::List::' + i + '::TextInputWithDropdown::Value').props.children
          ).toBeUndefined();
          expect(
            getByTestId('RecipeTags::List::' + i + '::TextInputWithDropdown::Label').props.children
          ).toBeUndefined();
          expect(
            getByTestId('RecipeTags::List::' + i + '::TextInputWithDropdown::OnValidate')
          ).toBeTruthy();
        }

        // Simulate the onValidate event (user finishes entering a new tag).
        fireEvent.press(getByTestId('RecipeTags::List::0::TextInputWithDropdown::OnValidate'));

        // Verify that the addNewTag callback was called with the correct argument.
        expect(addNewTagMock).toHaveBeenCalledWith('Test string');

        // After validation, the new tag input should be removed.
        expect(
          queryByTestId('RecipeTags::List::0::TextInputWithDropdown::AbsoluteDropDown')
        ).toBeNull();
        expect(
          queryByTestId('RecipeTags::List::0::TextInputWithDropdown::ReferenceTextArray')
        ).toBeNull();
        expect(queryByTestId('RecipeTags::List::0::TextInputWithDropdown::Value')).toBeNull();
        expect(queryByTestId('RecipeTags::List::0::TextInputWithDropdown::Label')).toBeNull();
        expect(queryByTestId('RecipeTags::List::0::TextInputWithDropdown::OnValidate')).toBeNull();

        expect(
          getByTestId('RecipeTags::List::1::TextInputWithDropdown::AbsoluteDropDown').props.children
        ).toEqual(false);
        expect(
          getByTestId('RecipeTags::List::1::TextInputWithDropdown::ReferenceTextArray').props
            .children
        ).toEqual(JSON.stringify(sampleTags.filter(name => !defaultProps.tagsList.includes(name))));
        expect(
          getByTestId('RecipeTags::List::1::TextInputWithDropdown::Value').props.children
        ).toBeUndefined();
        expect(
          getByTestId('RecipeTags::List::1::TextInputWithDropdown::Label').props.children
        ).toBeUndefined();
        expect(getByTestId('RecipeTags::List::1::TextInputWithDropdown::OnValidate')).toBeTruthy();
      });
    });
    describe('add mode', () => {
      it('renders header and description texts with the add button', async () => {
        const props: RecipeTagProps = {
          ...defaultProps,
          editType: 'add',
          openModal: jest.fn(),
        };
        const { getByTestId } = await renderRecipeTags(props);

        expect(getByTestId('RecipeTags::ElementText').props.children).toContain(randomTags);

        expect(getByTestId('RecipeTags::PropType').props.children).toEqual('Tag');
        expect(getByTestId('RecipeTags::ItemCount').props.children).toEqual(
          defaultProps.tagsList.length.toString()
        );

        defaultProps.tagsList.forEach((tag, index) => {
          expect(getByTestId(`RecipeTags::Item::${index}::Uri`).props.children).toEqual(tag);
        });
        expect(getByTestId('RecipeTags::Icon').props.children).toEqual('close');
        expect(getByTestId('HorizontalList::OnPress')).toBeTruthy();

        expect(getByTestId('RecipeTags::RoundButton::Icon').props.children).toEqual('plus');
        expect(getByTestId('RecipeTags::RoundButton::OnPressFunction')).toBeTruthy();

        expect(getByTestId('RecipeTags::OpenModal::RoundButton::Icon').props.children).toEqual(
          'line-scan'
        );
        expect(getByTestId('RecipeTags::OpenModal::RoundButton::OnPressFunction')).toBeTruthy();
      });
    });
  });
});
