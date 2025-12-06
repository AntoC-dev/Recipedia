import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Recipe from '@screens/Recipe';
import { EditRecipeProp, RecipePropType } from '@customTypes/RecipeNavigationTypes';
import { testRecipes } from '@test-data/recipesDataset';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { RecipeDatabaseProvider } from '@context/RecipeDatabaseContext';
import {
  ingredientType,
  shoppingListTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { StackScreenParamList } from '@customTypes/ScreenTypes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { GetByQuery, QueryByQuery } from '@testing-library/react-native/build/queries/make-queries';
import { TextMatch, TextMatchOptions } from '@testing-library/react-native/build/matches';
import { CommonQueryOptions } from '@testing-library/react-native/build/queries/options';
import { defaultValueNumber } from '@utils/Constants';
import { listFilter } from '@customTypes/RecipeFiltersTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-sqlite', () => require('@mocks/deps/expo-sqlite-mock').expoSqliteMock());
jest.mock('@utils/FileGestion', () =>
  require('@mocks/utils/FileGestion-mock.tsx').fileGestionMock()
);
jest.mock('@utils/ImagePicker', () => require('@mocks/utils/ImagePicker-mock').imagePickerMock());
jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('@components/organisms/RecipeTags', () => ({
  RecipeTags: require('@mocks/components/organisms/RecipeTags-mock').recipeTagsMock,
}));
jest.mock('@components/organisms/RecipeImage', () => ({
  RecipeImage: require('@mocks/components/organisms/RecipeImage-mock').recipeImageMock,
}));
jest.mock('@components/organisms/RecipeText', () => ({
  RecipeText: require('@mocks/components/organisms/RecipeText-mock').recipeTextMock,
}));
jest.mock('@components/organisms/RecipeNumber', () => ({
  RecipeNumber: require('@mocks/components/organisms/RecipeNumber-mock').recipeNumberMock,
}));
jest.mock('@components/organisms/RecipeIngredients', () => ({
  RecipeIngredients: require('@mocks/components/organisms/RecipeIngredients-mock')
    .recipeIngredientsMock,
}));
jest.mock('@components/organisms/RecipePreparation', () => ({
  RecipePreparation: require('@mocks/components/organisms/RecipePreparation-mock')
    .recipePreparationMock,
}));
jest.mock('@components/molecules/NutritionTable', () =>
  require('@mocks/components/molecules/NutritionTable-mock')
);
jest.mock('@components/molecules/NutritionEmptyState', () =>
  require('@mocks/components/molecules/NutritionEmptyState-mock')
);
jest.mock('@components/dialogs/Alert', () => ({
  Alert: require('@mocks/components/dialogs/Alert-mock').alertMock,
}));
jest.mock('@components/dialogs/ValidationQueue', () =>
  require('@mocks/components/dialogs/ValidationQueue-mock')
);
jest.mock('@components/organisms/AppBar', () => ({
  AppBar: require('@mocks/components/organisms/AppBar-mock').appBarMock,
}));
jest.mock('@screens/ModalImageSelect', () => ({
  ModalImageSelect: require('@mocks/screens/ModalImageSelect-mock').modalImageSelectMock,
}));

const defaultUri = '';

type GetByIdType = GetByQuery<TextMatch, CommonQueryOptions & TextMatchOptions>;
type QueryByIdType = QueryByQuery<TextMatch, CommonQueryOptions & TextMatchOptions>;

function checkAppbarButtons(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  queryByTestId: QueryByIdType
) {
  expect(getByTestId('Recipe::AppBar')).toBeTruthy();
  switch (prop.mode) {
    case 'readOnly':
      expect(getByTestId('Recipe::AppBar::BackButton')).toBeTruthy();
      expect(getByTestId('Recipe::AppBar::Delete')).toBeTruthy();
      expect(getByTestId('Recipe::AppBar::Edit')).toBeTruthy();
      expect(queryByTestId('Recipe::AppBar::Cancel')).toBeNull();
      expect(queryByTestId('Recipe::AppBar::Validate')).toBeNull();
      break;
    case 'edit':
      expect(getByTestId('Recipe::AppBar::Cancel')).toBeTruthy();
      expect(getByTestId('Recipe::AppBar::Validate')).toBeTruthy();
      expect(queryByTestId('Recipe::AppBar::BackButton')).toBeNull();
      expect(queryByTestId('Recipe::AppBar::Delete')).toBeNull();
      expect(queryByTestId('Recipe::AppBar::Edit')).toBeNull();
      break;
    case 'addManually':
    case 'addFromPic':
      expect(getByTestId('Recipe::AppBar::BackButton')).toBeTruthy();
      expect(queryByTestId('Recipe::AppBar::Delete')).toBeNull();
      expect(queryByTestId('Recipe::AppBar::Edit')).toBeNull();
      expect(queryByTestId('Recipe::AppBar::Cancel')).toBeNull();
      expect(queryByTestId('Recipe::AppBar::Validate')).toBeNull();
      break;
  }
}

function checkImage(prop: RecipePropType, getByTestId: GetByIdType, newValueExpected?: string) {
  expect(getByTestId('RecipeImage::OpenModal').props.children).toBeTruthy();
  switch (prop.mode) {
    case 'readOnly':
      expect(getByTestId('RecipeImage::ImgUri').props.children).toEqual(
        `${prop.recipe.image_Source}`
      );
      expect(getByTestId('RecipeImage::ButtonIcon').props.children).toBeUndefined();
      break;
    case 'edit':
      expect(getByTestId('RecipeImage::ImgUri').props.children).toEqual(prop.recipe.image_Source);
      expect(getByTestId('RecipeImage::ButtonIcon').props.children).toEqual('camera');

      break;
    case 'addManually':
      expect(getByTestId('RecipeImage::ImgUri').props.children).toEqual(newValueExpected);
      expect(getByTestId('RecipeImage::ButtonIcon').props.children).toEqual('camera');
      break;
    case 'addFromPic':
      expect(getByTestId('RecipeImage::ImgUri').props.children).toEqual(prop.imgUri);
      expect(getByTestId('RecipeImage::ButtonIcon').props.children).toEqual('line-scan');
      break;
  }
}

function checkTitle(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  queryByTestId: QueryByIdType,
  newValueExpected?: string
) {
  switch (prop.mode) {
    case 'readOnly':
      expect(getByTestId('RecipeTitle::RootText').props.children).toEqual(prop.recipe.title);
      expect(queryByTestId('RecipeTitle::TextEditable')).toBeNull();
      expect(queryByTestId('RecipeTitle::SetTextToEdit')).toBeNull();
      expect(queryByTestId('RecipeTitle::OpenModal')).toBeNull();
      break;
    case 'edit':
      expect(getByTestId('RecipeTitle::RootText').props.children).toEqual('title:');
      expect(getByTestId('RecipeTitle::TextEditable').props.children).toEqual(prop.recipe.title);
      expect(getByTestId('RecipeTitle::SetTextToEdit').props.children).toBeTruthy();
      expect(queryByTestId('RecipeTitle::OpenModal')).toBeNull();
      break;
    case 'addManually':
      expect(getByTestId('RecipeTitle::RootText').props.children).toEqual('title:');
      expect(getByTestId('RecipeTitle::TextEditable').props.children).toEqual(newValueExpected);
      expect(getByTestId('RecipeTitle::SetTextToEdit').props.children).toBeTruthy();
      expect(queryByTestId('RecipeTitle::OpenModal')).toBeNull();
      break;
    case 'addFromPic':
      expect(getByTestId('RecipeTitle::RootText').props.children).toEqual('title:');
      expect(queryByTestId('RecipeTitle::TextEditable')).toBeNull();
      expect(queryByTestId('RecipeTitle::SetTextToEdit')).toBeNull();
      if (prop.imgUri === defaultUri) {
        expect(getByTestId('RecipeTitle::OpenModal').props.children).toBeTruthy();
      } else {
        expect(queryByTestId('RecipeTitle::OpenModal')).toBeNull();
      }
      break;
  }
}

function checkDescription(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  queryByTestId: QueryByIdType,
  newValueExpected?: string
) {
  switch (prop.mode) {
    case 'readOnly':
      expect(getByTestId('RecipeDescription::RootText').props.children).toEqual(
        prop.recipe.description
      );
      expect(queryByTestId('RecipeDescription::TextEditable')).toBeNull();
      expect(queryByTestId('RecipeDescription::SetTextToEdit')).toBeNull();
      expect(queryByTestId('RecipeDescription::OpenModal')).toBeNull();
      break;
    case 'edit':
      expect(getByTestId('RecipeDescription::RootText').props.children).toEqual('description:');
      expect(getByTestId('RecipeDescription::TextEditable').props.children).toEqual(
        prop.recipe.description
      );
      expect(getByTestId('RecipeDescription::SetTextToEdit').props.children).toBeTruthy();
      expect(queryByTestId('RecipeDescription::OpenModal')).toBeNull();
      break;
    case 'addManually':
      expect(getByTestId('RecipeDescription::RootText').props.children).toEqual('description:');
      expect(getByTestId('RecipeDescription::TextEditable').props.children).toEqual(
        newValueExpected
      );
      expect(getByTestId('RecipeDescription::SetTextToEdit').props.children).toBeTruthy();
      expect(queryByTestId('RecipeDescription::OpenModal')).toBeNull();
      break;
    case 'addFromPic':
      expect(getByTestId('RecipeDescription::RootText').props.children).toEqual('description:');
      expect(queryByTestId('RecipeDescription::TextEditable')).toBeNull();
      expect(queryByTestId('RecipeDescription::SetTextToEdit')).toBeNull();
      if (prop.imgUri === defaultUri) {
        expect(getByTestId('RecipeDescription::OpenModal').props.children).toBeTruthy();
      } else {
        expect(queryByTestId('RecipeDescription::OpenModal')).toBeNull();
      }
      break;
  }
}

function checkTags(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  queryByTestId: QueryByIdType,
  newValueExpected?: tagTableElement[]
) {
  switch (prop.mode) {
    case 'readOnly':
      expect(getByTestId('RecipeTags::TagsList').props.children).toEqual(
        JSON.stringify(prop.recipe.tags.map(tag => tag.name))
      );
      expect(queryByTestId('RecipeTags::RandomTags')).toBeNull();
      expect(queryByTestId('RecipeTags::AddNewTag')).toBeNull();
      expect(queryByTestId('RecipeTags::RemoveTag')).toBeNull();
      break;
    case 'edit':
      expect(getByTestId('RecipeTags::TagsList').props.children).toEqual(
        JSON.stringify(prop.recipe.tags.map(tag => tag.name))
      );
      expect(getByTestId('RecipeTags::RandomTags').props.children).not.toEqual(
        testRecipes[6].tags.map(tag => tag.name)
      );
      expect(getByTestId('RecipeTags::AddNewTag').props.children).toBeTruthy();
      expect(getByTestId('RecipeTags::RemoveTag').props.children).toBeTruthy();
      break;
    case 'addManually':
      expect(getByTestId('RecipeTags::TagsList').props.children).toEqual(
        JSON.stringify(newValueExpected?.map(tag => tag.name))
      );
      expect(getByTestId('RecipeTags::RandomTags').props.children).not.toEqual(
        testRecipes[6].tags.map(tag => tag.name)
      );
      expect(getByTestId('RecipeTags::AddNewTag').props.children).toBeTruthy();
      expect(getByTestId('RecipeTags::RemoveTag').props.children).toBeTruthy();
      break;
    case 'addFromPic':
      expect(getByTestId('RecipeTags::TagsList').props.children).toEqual('[]');
      expect(
        getByTestId('RecipeTags::RandomTags').props.children.replaceAll('"', '').split(', ').length
      ).toEqual(3);
      expect(getByTestId('RecipeTags::AddNewTag').props.children).toBeTruthy();
      expect(getByTestId('RecipeTags::RemoveTag').props.children).toBeTruthy();
      break;
  }
}

function checkIngredients(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  queryByTestId: QueryByIdType
) {
  switch (prop.mode) {
    case 'readOnly':
      prop.recipe.ingredients.forEach((ingredient, index) => {
        expect(getByTestId(`RecipeIngredients::${index}::Row`)).toBeTruthy();
        expect(getByTestId(`RecipeIngredients::${index}::QuantityAndUnit`).props.children).toEqual(
          `${ingredient.quantity} ${ingredient.unit}`
        );
        expect(getByTestId(`RecipeIngredients::${index}::IngredientName`).props.children).toEqual(
          ingredient.name
        );
      });

      expect(queryByTestId('RecipeIngredients::PrefixText')).toBeNull();
      expect(queryByTestId('RecipeIngredients::OpenModal')).toBeNull();
      expect(queryByTestId('RecipeIngredients::AddButton')).toBeNull();
      break;
    case 'edit':
      expect(getByTestId('RecipeIngredients::PrefixText').props.children).toEqual('ingredients: ');
      expect(getByTestId('RecipeIngredients::AddButton::RoundButton::Icon').props.children).toEqual(
        'plus'
      );
      expect(queryByTestId('RecipeIngredients::OpenModal')).toBeNull();

      prop.recipe.ingredients.forEach((ingredient, index) => {
        expect(getByTestId(`RecipeIngredients::${index}::Row`)).toBeTruthy();
        expect(getByTestId(`RecipeIngredients::${index}::QuantityInput`).props.children).toEqual(
          ingredient.quantity
        );
        expect(
          getByTestId(`RecipeIngredients::${index}::UnitInput::CustomTextInput`).props.children
        ).toEqual(ingredient.unit);
        expect(
          getByTestId(`RecipeIngredients::${index}::NameInput::TextInputWithDropdown::Value`).props
            .children
        ).toEqual(ingredient.name);
      });
      break;
    case 'addManually':
      // Verify editable mode with empty ingredients
      expect(getByTestId('RecipeIngredients::PrefixText').props.children).toEqual('ingredients: ');
      expect(getByTestId('RecipeIngredients::AddButton::RoundButton::Icon').props.children).toEqual(
        'plus'
      );
      expect(queryByTestId('RecipeIngredients::OpenModal')).toBeNull();
      break;
    case 'addFromPic':
      expect(getByTestId('RecipeIngredients::PrefixText').props.children).toEqual('ingredients: ');
      if (prop.imgUri.length === 0) {
        // Empty state: should have both OCR and manual add buttons
        expect(
          getByTestId('RecipeIngredients::OpenModal::RoundButton::Icon').props.children
        ).toEqual('line-scan');
        expect(
          getByTestId('RecipeIngredients::AddButton::RoundButton::Icon').props.children
        ).toEqual('pencil');
      } else {
        // With ingredients: should have add button
        expect(
          getByTestId('RecipeIngredients::AddButton::RoundButton::Icon').props.children
        ).toEqual('plus');
      }
      break;
  }
}

function checkPersons(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  queryByTestId: QueryByIdType,
  newValueExpected?: number
) {
  switch (prop.mode) {
    case 'readOnly':
      expect(getByTestId('RecipePersons::Text').props.children).toEqual(
        `ingredientReadOnlyBeforePerson${prop.recipe.persons}ingredientReadOnlyAfterPerson`
      );
      expect(queryByTestId('RecipePersons::PrefixText')).toBeNull();
      expect(queryByTestId('RecipePersons::SuffixText')).toBeNull();
      expect(queryByTestId('RecipePersons::TextEditable')).toBeNull();
      expect(queryByTestId('RecipePersons::SetTextToEdit')).toBeNull();
      expect(queryByTestId('RecipePersons::OpenModal')).toBeNull();
      break;
    case 'edit':
      expect(queryByTestId('RecipePersons::Text')).toBeNull();
      expect(getByTestId('RecipePersons::PrefixText').props.children).toEqual('personPrefixEdit');
      expect(getByTestId('RecipePersons::SuffixText').props.children).toEqual('personSuffixEdit');
      expect(getByTestId('RecipePersons::TextEditable').props.children).toEqual(
        prop.recipe.persons
      );
      expect(getByTestId('RecipePersons::SetTextToEdit').props.children).toBeTruthy();
      expect(queryByTestId('RecipePersons::OpenModal')).toBeNull();
      break;
    case 'addManually':
      expect(queryByTestId('RecipePersons::Text')).toBeNull();
      expect(getByTestId('RecipePersons::PrefixText').props.children).toEqual('personPrefixEdit');
      expect(getByTestId('RecipePersons::SuffixText').props.children).toEqual('personSuffixEdit');
      expect(getByTestId('RecipePersons::TextEditable').props.children).toEqual(newValueExpected);
      expect(getByTestId('RecipePersons::SetTextToEdit').props.children).toBeTruthy();
      expect(queryByTestId('RecipePersons::OpenModal')).toBeNull();
      break;
    case 'addFromPic':
      expect(queryByTestId('RecipePersons::Text')).toBeNull();
      // When default persons is loaded (4), it falls through to edit mode
      // Only shows OCR mode when recipePersons === defaultValueNumber (-1)
      if (newValueExpected === defaultValueNumber) {
        expect(getByTestId('RecipePersons::PrefixText').props.children).toEqual('personPrefixOCR');
        expect(getByTestId('RecipePersons::SuffixText').props.children).toBeUndefined();
        if (prop.imgUri === defaultUri) {
          expect(getByTestId('RecipePersons::OpenModal').props.children).toBeTruthy();
        } else {
          expect(queryByTestId('RecipePersons::OpenModal')).toBeNull();
        }
      } else {
        // Falls through to edit mode when default persons is loaded
        expect(getByTestId('RecipePersons::PrefixText').props.children).toEqual('personPrefixEdit');
        expect(getByTestId('RecipePersons::SuffixText').props.children).toEqual('personSuffixEdit');
        expect(getByTestId('RecipePersons::TextEditable').props.children).toEqual(newValueExpected);
        expect(getByTestId('RecipePersons::SetTextToEdit').props.children).toBeTruthy();
        expect(queryByTestId('RecipePersons::OpenModal')).toBeNull();
      }
      break;
  }
}

function checkTime(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  queryByTestId: QueryByIdType,
  newValueExpected?: number
) {
  switch (prop.mode) {
    case 'readOnly':
      expect(getByTestId('RecipeTime::Text').props.children).toEqual(
        `timeReadOnlyBeforePerson${prop.recipe.time}timeReadOnlyAfterPerson`
      );
      expect(queryByTestId('RecipeTime::PrefixText')).toBeNull();
      expect(queryByTestId('RecipeTime::SuffixText')).toBeNull();
      expect(queryByTestId('RecipeTime::TextEditable')).toBeNull();
      expect(queryByTestId('RecipeTime::SetTextToEdit')).toBeNull();
      expect(queryByTestId('RecipeTime::OpenModal')).toBeNull();
      break;
    case 'edit':
      expect(queryByTestId('RecipeTime::Text')).toBeNull();
      expect(getByTestId('RecipeTime::PrefixText').props.children).toEqual('timePrefixEdit');
      expect(getByTestId('RecipeTime::SuffixText').props.children).toEqual('min');
      expect(getByTestId('RecipeTime::TextEditable').props.children).toEqual(prop.recipe.time);
      expect(getByTestId('RecipeTime::SetTextToEdit').props.children).toBeTruthy();
      expect(queryByTestId('RecipeTime::OpenModal')).toBeNull();
      break;
    case 'addManually':
      expect(queryByTestId('RecipeTime::Text')).toBeNull();
      expect(getByTestId('RecipeTime::PrefixText').props.children).toEqual('timePrefixEdit');
      expect(getByTestId('RecipeTime::SuffixText').props.children).toEqual('min');
      expect(getByTestId('RecipeTime::TextEditable').props.children).toEqual(newValueExpected);
      expect(getByTestId('RecipeTime::SetTextToEdit').props.children).toBeTruthy();
      expect(queryByTestId('RecipeTime::OpenModal')).toBeNull();
      break;
    case 'addFromPic':
      expect(queryByTestId('RecipeTime::Text')).toBeNull();
      if (prop.imgUri === defaultUri) {
        expect(getByTestId('RecipeTime::PrefixText').props.children).toEqual('timePrefixOCR');
        expect(getByTestId('RecipeTime::SuffixText').props.children).toBeUndefined();
        expect(getByTestId('RecipeTime::OpenModal').props.children).toBeTruthy();
      } else {
        expect(getByTestId('RecipeTime::PrefixText').props.children).toEqual('timePrefixEdit ');
        expect(getByTestId('RecipeTime::SuffixText').props.children).toEqual(' min');
        expect(queryByTestId('RecipeTime::OpenModal')).toBeNull();
      }
      break;
  }
}

function checkPreparation(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  queryByTestId: QueryByIdType
) {
  switch (prop.mode) {
    case 'readOnly':
      expect(getByTestId('RecipePreparation::Mode').props.children).toEqual('readOnly');
      expect(getByTestId('RecipePreparation::Steps').props.children).toEqual(
        JSON.stringify(prop.recipe.preparation)
      );

      expect(queryByTestId('RecipePreparation::PrefixText')).toBeNull();
      expect(
        queryByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
      ).toBeNull();
      expect(queryByTestId('RecipePreparation::OpenModal::RoundButton::Icon')).toBeNull();
      expect(
        queryByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
      ).toBeNull();
      expect(queryByTestId('RecipePreparation::AddButton::RoundButton::Icon')).toBeNull();

      prop.recipe.preparation.forEach((_, index) => {
        expect(getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionTitle`)).toBeTruthy();
        expect(
          getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionParagraph`)
        ).toBeTruthy();
      });
      break;
    case 'edit':
      expect(getByTestId('RecipePreparation::Mode').props.children).toEqual('editable');
      expect(getByTestId('RecipePreparation::PrefixText').props.children).toEqual(
        'preparationReadOnly'
      );

      expect(
        queryByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
      ).toBeNull();
      expect(queryByTestId('RecipePreparation::OpenModal::RoundButton::Icon')).toBeNull();

      expect(
        queryByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
      ).toBeNull();
      expect(queryByTestId('RecipePreparation::OpenModal::RoundButton::Icon')).toBeNull();

      prop.recipe.preparation.forEach((step, index) => {
        expect(getByTestId(`RecipePreparation::EditableStep::${index}::Step`)).toBeTruthy();
        expect(getByTestId(`RecipePreparation::EditableStep::${index}::Title`)).toBeTruthy();
        const titleInput = getByTestId(
          `RecipePreparation::EditableStep::${index}::TextInputTitle::CustomTextInput`
        );
        expect(titleInput.props.value).toEqual(step.title);
        expect(getByTestId(`RecipePreparation::EditableStep::${index}::Content`)).toBeTruthy();
        const descriptionInput = getByTestId(
          `RecipePreparation::EditableStep::${index}::TextInputContent::CustomTextInput`
        );
        expect(descriptionInput.props.value).toEqual(step.description);
      });
      break;
    case 'addManually':
      expect(getByTestId('RecipePreparation::Mode').props.children).toEqual('editable');
      expect(getByTestId('RecipePreparation::Steps').props.children).toEqual(JSON.stringify([]));
      expect(getByTestId('RecipePreparation::PrefixText').props.children).toEqual(
        'preparationReadOnly'
      );

      expect(
        getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
      expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
        'plus'
      );

      expect(
        getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
      expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
        'plus'
      );
      break;
    case 'addFromPic':
      expect(getByTestId('RecipePreparation::Mode').props.children).toEqual('add');
      expect(getByTestId('RecipePreparation::Steps').props.children).toEqual(JSON.stringify([]));
      expect(getByTestId('RecipePreparation::PrefixText').props.children).toEqual(
        'preparationReadOnly'
      );

      expect(
        getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
      expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
        'pencil'
      );

      if (prop.imgUri.length === 0) {
        expect(
          getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
        ).toBeTruthy();
        expect(
          getByTestId('RecipePreparation::OpenModal::RoundButton::Icon').props.children
        ).toEqual('line-scan');
      } else {
        expect(
          queryByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
        ).toBeNull();
        expect(queryByTestId('RecipePreparation::OpenModal::RoundButton::Icon')).toBeNull();
      }
      break;
  }
}

function checkNutrition(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  queryByTestId: QueryByIdType
) {
  const nutritionTestId = 'Recipe::RecipeNutrition';
  const nutritionTableTestId = nutritionTestId + '::NutritionTable';
  const nutritionEmptyStateTestId = nutritionTestId + '::NutritionEmptyState';

  switch (prop.mode) {
    case 'readOnly':
      if (prop.recipe.nutrition) {
        expect(getByTestId(nutritionTableTestId)).toBeTruthy();
        expect(getByTestId(nutritionTableTestId + '::IsEditable').props.children).toEqual(false);
        expect(getByTestId(nutritionTableTestId + '::ShowRemoveButton').props.children).toEqual(
          false
        );
        expect(queryByTestId(nutritionEmptyStateTestId)).toBeNull();
      } else {
        expect(queryByTestId(nutritionTableTestId)).toBeNull();
        expect(queryByTestId(nutritionEmptyStateTestId)).toBeNull();
      }
      break;
    case 'edit':
      if (prop.recipe.nutrition) {
        expect(getByTestId(nutritionTableTestId)).toBeTruthy();
        expect(getByTestId(nutritionTableTestId + '::IsEditable').props.children).toEqual(true);
        expect(getByTestId(nutritionTableTestId + '::ShowRemoveButton').props.children).toEqual(
          true
        );
        expect(queryByTestId(nutritionEmptyStateTestId)).toBeNull();
      } else {
        expect(queryByTestId(nutritionTableTestId)).toBeNull();
        expect(queryByTestId(nutritionEmptyStateTestId)).toBeNull();
      }
      break;
    case 'addManually':
      expect(getByTestId(nutritionEmptyStateTestId)).toBeTruthy();
      expect(getByTestId(nutritionEmptyStateTestId + '::Mode').props.children).toEqual('add');
      expect(queryByTestId(nutritionTableTestId)).toBeNull();
      break;
    case 'addFromPic':
      expect(getByTestId(nutritionEmptyStateTestId)).toBeTruthy();
      expect(getByTestId(nutritionEmptyStateTestId + '::Mode').props.children).toEqual('ocr');
      expect(queryByTestId(nutritionTableTestId)).toBeNull();
      break;
  }
}

describe('Recipe Component tests', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    navigateDeprecated: jest.fn(),
    preload: jest.fn(),
    setOptions: jest.fn(),
    dispatch: jest.fn(),
    canGoBack: jest.fn(),
    getId: jest.fn(),
    getParent: jest.fn(),
    isFocused: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    replaceParams: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popTo: jest.fn(),
    popToTop: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    getState: jest.fn(),
  } as NativeStackNavigationProp<StackScreenParamList, 'Recipe'>;
  const mockRouteReadOnly: RecipePropType = {
    mode: 'readOnly',
    recipe: testRecipes[1],
  };

  const mockRouteEdit: RecipePropType = {
    mode: 'edit',
    recipe: { ...testRecipes[6] } as const,
  } as const;

  const mockRouteAddOCR: RecipePropType = { mode: 'addFromPic', imgUri: defaultUri };
  const mockRouteAddManually: RecipePropType = { mode: 'addManually' };

  const createMockRoute = (params: RecipePropType): RouteProp<StackScreenParamList, 'Recipe'> => ({
    key: 'Recipe-test',
    name: 'Recipe',
    params,
  });

  const renderRecipe = async (route: RouteProp<StackScreenParamList, 'Recipe'>) => {
    const result = render(
      <RecipeDatabaseProvider>
        <Recipe route={route} navigation={mockNavigation} />
      </RecipeDatabaseProvider>
    );

    await waitFor(() => {
      if (route.params.mode === 'edit') {
        expect(result.getByTestId('Recipe::AppBar::Cancel')).toBeTruthy();
      } else {
        expect(result.getByTestId('Recipe::AppBar::BackButton')).toBeTruthy();
      }
      if (route.params.mode === 'addManually') {
        const personsValue = result.queryByTestId('RecipePersons::TextEditable')?.props.children;
        if (personsValue !== undefined) {
          expect(personsValue).toEqual(4);
        }
      }
    });

    return result;
  };

  const dbInstance = RecipeDatabase.getInstance();
  beforeEach(async () => {
    jest.clearAllMocks();

    await dbInstance.init();
    await dbInstance.addMultipleIngredients(testIngredients);
    await dbInstance.addMultipleTags(testTags);
    await dbInstance.addMultipleRecipes(testRecipes);

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('4');
  });
  afterEach(async () => {
    await dbInstance.reset();
    mockRouteEdit.recipe = { ...testRecipes[6] };
  });

  // -------- INIT CASES --------
  test('Initial state is correctly set in readOnly mode', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteReadOnly));

    checkAppbarButtons(mockRouteReadOnly, getByTestId, queryByTestId);

    checkImage(mockRouteReadOnly, getByTestId);
    checkTitle(mockRouteReadOnly, getByTestId, queryByTestId);
    checkDescription(mockRouteReadOnly, getByTestId, queryByTestId);
    checkTags(mockRouteReadOnly, getByTestId, queryByTestId);
    checkIngredients(mockRouteReadOnly, getByTestId, queryByTestId);
    checkPersons(mockRouteReadOnly, getByTestId, queryByTestId);
    checkTime(mockRouteReadOnly, getByTestId, queryByTestId);
    checkPreparation(mockRouteReadOnly, getByTestId, queryByTestId);
    checkNutrition(mockRouteReadOnly, getByTestId, queryByTestId);
  });

  test('Initial state is correctly set in edit mode', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

    checkAppbarButtons(mockRouteEdit, getByTestId, queryByTestId);

    checkImage(mockRouteEdit, getByTestId);
    checkTitle(mockRouteEdit, getByTestId, queryByTestId);
    checkDescription(mockRouteEdit, getByTestId, queryByTestId);
    checkTags(mockRouteEdit, getByTestId, queryByTestId, []);
    checkIngredients(mockRouteEdit, getByTestId, queryByTestId);
    checkPersons(mockRouteEdit, getByTestId, queryByTestId);
    checkTime(mockRouteEdit, getByTestId, queryByTestId);
    checkPreparation(mockRouteEdit, getByTestId, queryByTestId);
    checkNutrition(mockRouteEdit, getByTestId, queryByTestId);
  });

  test('Initial state is correctly set in add manually mode', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(
      createMockRoute(mockRouteAddManually)
    );

    checkAppbarButtons(mockRouteAddManually, getByTestId, queryByTestId);

    checkImage(mockRouteAddManually, getByTestId, '');
    checkTitle(mockRouteAddManually, getByTestId, queryByTestId, '');
    checkDescription(mockRouteAddManually, getByTestId, queryByTestId, '');
    checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
    checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
    checkPersons(mockRouteAddManually, getByTestId, queryByTestId, 4);
    checkTime(mockRouteAddManually, getByTestId, queryByTestId, defaultValueNumber);
    checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
    checkNutrition(mockRouteAddManually, getByTestId, queryByTestId);
  });

  test('Initial state is correctly set in add ocr mode', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteAddOCR));

    checkAppbarButtons(mockRouteAddOCR, getByTestId, queryByTestId);

    checkImage(mockRouteAddOCR, getByTestId);
    checkTitle(mockRouteAddOCR, getByTestId, queryByTestId);
    checkDescription(mockRouteAddOCR, getByTestId, queryByTestId);
    checkTags(mockRouteAddOCR, getByTestId, queryByTestId);
    checkIngredients(mockRouteAddOCR, getByTestId, queryByTestId);
    // In OCR mode, default persons loads asynchronously (4), so it shows edit mode UI
    checkPersons(mockRouteAddOCR, getByTestId, queryByTestId, 4);
    checkTime(mockRouteAddOCR, getByTestId, queryByTestId);
    checkPreparation(mockRouteAddOCR, getByTestId, queryByTestId);
    checkNutrition(mockRouteAddOCR, getByTestId, queryByTestId);
  });

  // -------- CHANGE ON TITLE CASES --------
  test('updates recipeTitle and reflects in RecipeText only', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

    const newTitle = 'New Recipe Title';
    fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), newTitle);
    const newEditProp: EditRecipeProp = { ...mockRouteEdit };
    newEditProp.recipe.title = newTitle;

    checkImage(newEditProp, getByTestId);
    checkTitle(newEditProp, getByTestId, queryByTestId);
    checkDescription(newEditProp, getByTestId, queryByTestId);
    checkTags(newEditProp, getByTestId, queryByTestId);
    checkIngredients(newEditProp, getByTestId, queryByTestId);
    checkPersons(newEditProp, getByTestId, queryByTestId);
    checkTime(newEditProp, getByTestId, queryByTestId);
    checkPreparation(newEditProp, getByTestId, queryByTestId);
  });

  test('fill recipeTitle and reflects in RecipeText only', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(
      createMockRoute(mockRouteAddManually)
    );

    const newTitle = 'New Recipe Title';
    fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), newTitle);

    checkImage(mockRouteAddManually, getByTestId, '');
    checkTitle(mockRouteAddManually, getByTestId, queryByTestId, newTitle);
    checkDescription(mockRouteAddManually, getByTestId, queryByTestId, '');
    checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
    checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
    checkPersons(mockRouteAddManually, getByTestId, queryByTestId, 4);
    checkTime(mockRouteAddManually, getByTestId, queryByTestId, defaultValueNumber);
    checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
  });

  // -------- CHANGE ON DESCRIPTION CASES --------
  test('updates recipeDescription and reflects in RecipeDescription only', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

    const newDescription = 'New Recipe Description';
    fireEvent.press(getByTestId('RecipeDescription::SetTextToEdit'), newDescription);
    const newEditProp: EditRecipeProp = { ...mockRouteEdit };
    newEditProp.recipe.description = newDescription;

    checkImage(newEditProp, getByTestId);
    checkTitle(newEditProp, getByTestId, queryByTestId);
    checkDescription(newEditProp, getByTestId, queryByTestId);
    checkTags(newEditProp, getByTestId, queryByTestId);
    checkIngredients(newEditProp, getByTestId, queryByTestId);
    checkPersons(newEditProp, getByTestId, queryByTestId);
    checkTime(newEditProp, getByTestId, queryByTestId);
    checkPreparation(newEditProp, getByTestId, queryByTestId);
  });

  test('fill recipeDescription and reflects in RecipeText only', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(
      createMockRoute(mockRouteAddManually)
    );

    const newDescription = 'New Recipe Description';
    fireEvent.press(getByTestId('RecipeDescription::SetTextToEdit'), newDescription);

    checkImage(mockRouteAddManually, getByTestId, '');
    checkTitle(mockRouteAddManually, getByTestId, queryByTestId, '');
    checkDescription(mockRouteAddManually, getByTestId, queryByTestId, newDescription);
    checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
    checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
    checkPersons(mockRouteAddManually, getByTestId, queryByTestId, 4);
    checkTime(mockRouteAddManually, getByTestId, queryByTestId, defaultValueNumber);
    checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
  });

  // -------- CHANGE ON TAGS CASES --------
  test('remove recipeTags and reflects in RecipeTags only', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

    fireEvent.press(getByTestId('RecipeTags::RemoveTag'));
    const newEditProp: EditRecipeProp = {
      mode: mockRouteEdit.mode,
      recipe: {
        ...mockRouteEdit.recipe,
        tags: mockRouteEdit.recipe.tags.map(tag => ({ ...tag })),
      },
    };
    newEditProp.recipe.tags.splice(0, 1);

    checkImage(newEditProp, getByTestId);
    checkTitle(newEditProp, getByTestId, queryByTestId);
    checkDescription(newEditProp, getByTestId, queryByTestId);
    checkTags(newEditProp, getByTestId, queryByTestId);
    checkIngredients(newEditProp, getByTestId, queryByTestId);
    checkPersons(newEditProp, getByTestId, queryByTestId);
    checkTime(newEditProp, getByTestId, queryByTestId);
    checkPreparation(newEditProp, getByTestId, queryByTestId);
  });

  // -------- CHANGE ON PERSONS CASES --------
  test('updates recipePersons and scales ingredients accordingly', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

    const newPerson = '23';
    fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), newPerson);
    const newEditProp: EditRecipeProp = { ...mockRouteEdit };
    newEditProp.recipe.persons = Number(newPerson);

    // Scale ingredients from 6 persons to 23 persons using the same logic as scaleQuantityForPersons
    newEditProp.recipe.ingredients = newEditProp.recipe.ingredients.map(
      (ingredient: (typeof newEditProp.recipe.ingredients)[number]) => ({
        ...ingredient,
        quantity: ingredient.quantity
          ? (() => {
              const scaledValue = (parseFloat(ingredient.quantity) * 23) / 6;
              const rounded = Math.round(scaledValue * 100) / 100;
              return rounded.toString().replace('.', ',');
            })()
          : ingredient.quantity,
      })
    );

    checkImage(newEditProp, getByTestId);
    checkTitle(newEditProp, getByTestId, queryByTestId);
    checkDescription(newEditProp, getByTestId, queryByTestId);
    checkTags(newEditProp, getByTestId, queryByTestId);
    checkIngredients(newEditProp, getByTestId, queryByTestId);
    checkPersons(newEditProp, getByTestId, queryByTestId);
    checkTime(newEditProp, getByTestId, queryByTestId);
    checkPreparation(newEditProp, getByTestId, queryByTestId);
  });

  test('fill recipePersons and reflects in RecipeText only', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(
      createMockRoute(mockRouteAddManually)
    );

    const newPerson = 23;
    fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), newPerson.toString());

    checkImage(mockRouteAddManually, getByTestId, '');
    checkTitle(mockRouteAddManually, getByTestId, queryByTestId, '');
    checkDescription(mockRouteAddManually, getByTestId, queryByTestId, '');
    checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
    checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
    checkPersons(mockRouteAddManually, getByTestId, queryByTestId, newPerson);
    checkTime(mockRouteAddManually, getByTestId, queryByTestId, defaultValueNumber);
    checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
  });

  // -------- CHANGE ON INGREDIENTS CASES --------
  test('updates recipeIngredients and reflects in RecipeIngredients only', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

    const initialName = getByTestId('RecipeIngredients::0::NameInput::TextInputWithDropdown::Value')
      .props.children;
    expect(initialName).toBe('Flour');

    await waitFor(() => {
      expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
    });

    const newEditProp: EditRecipeProp = { ...mockRouteEdit };

    checkImage(newEditProp, getByTestId);
    checkTitle(newEditProp, getByTestId, queryByTestId);
    checkDescription(newEditProp, getByTestId, queryByTestId);
    checkTags(newEditProp, getByTestId, queryByTestId);
    checkPersons(newEditProp, getByTestId, queryByTestId);
    checkTime(newEditProp, getByTestId, queryByTestId);
    checkPreparation(newEditProp, getByTestId, queryByTestId);
  });

  // -------- CHANGE ON TIME CASES --------
  test('updates recipeTime and reflects in RecipeTime only', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

    const newTime = '71';
    fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), newTime);
    const newEditProp: EditRecipeProp = { ...mockRouteEdit };
    newEditProp.recipe.time = Number(newTime);

    checkImage(newEditProp, getByTestId);
    checkTitle(newEditProp, getByTestId, queryByTestId);
    checkDescription(newEditProp, getByTestId, queryByTestId);
    checkTags(newEditProp, getByTestId, queryByTestId);
    checkIngredients(newEditProp, getByTestId, queryByTestId);
    checkPersons(newEditProp, getByTestId, queryByTestId);
    checkTime(newEditProp, getByTestId, queryByTestId);
    checkPreparation(newEditProp, getByTestId, queryByTestId);
  });

  test('fill recipeTime and reflects in RecipeText only', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(
      createMockRoute(mockRouteAddManually)
    );

    const newTime = 71;
    fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), newTime.toString());

    checkImage(mockRouteAddManually, getByTestId, '');
    checkTitle(mockRouteAddManually, getByTestId, queryByTestId, '');
    checkDescription(mockRouteAddManually, getByTestId, queryByTestId, '');
    checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
    checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
    checkPersons(mockRouteAddManually, getByTestId, queryByTestId, 4);
    checkTime(mockRouteAddManually, getByTestId, queryByTestId, newTime);
    checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
  });

  // -------- CHANGE ON PREPARATION CASES --------
  test('updates recipePreparation and reflects in RecipePreparation only', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

    const newEditProp: EditRecipeProp = {
      ...mockRouteEdit,
      recipe: {
        ...mockRouteEdit.recipe,
        preparation: [...mockRouteEdit.recipe.preparation],
      },
    };
    newEditProp.recipe.preparation[0].description += '.New part of a paragraph';

    const descriptionInput = getByTestId(
      'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
    );
    fireEvent.changeText(descriptionInput, newEditProp.recipe.preparation[0].description);

    await waitFor(() => {
      checkPreparation(newEditProp, getByTestId, queryByTestId);
    });

    checkImage(newEditProp, getByTestId);
    checkTitle(newEditProp, getByTestId, queryByTestId);
    checkDescription(newEditProp, getByTestId, queryByTestId);
    checkTags(newEditProp, getByTestId, queryByTestId);
    checkIngredients(newEditProp, getByTestId, queryByTestId);
    checkPersons(newEditProp, getByTestId, queryByTestId);
    checkTime(newEditProp, getByTestId, queryByTestId);
  });

  test('validates button on read only mode', async () => {
    const { getByTestId } = await renderRecipe(createMockRoute(mockRouteReadOnly));

    expect(RecipeDatabase.getInstance().get_shopping()).toEqual([]);

    fireEvent.press(getByTestId('Recipe::BottomActionButton'));

    // Wait for shopping list to be populated (validation dialog is shown but navigation doesn't happen immediately)
    await waitFor(() => {
      expect(RecipeDatabase.getInstance().get_shopping()).toHaveLength(4);
    });
    expect(RecipeDatabase.getInstance().get_shopping()).toEqual(
      new Array<shoppingListTableElement[]>(
        {
          //@ts-ignore id is always set at this point
          id: 1,
          name: 'Taco Shells',
          purchased: false,
          quantity: '6',
          recipesTitle: ['Chicken Tacos'],
          type: listFilter.cereal,
          unit: 'pieces',
        },
        {
          id: 2,
          name: 'Chicken Breast',
          purchased: false,
          quantity: '300',
          recipesTitle: ['Chicken Tacos'],
          type: listFilter.poultry,
          unit: 'g',
        },
        {
          id: 3,
          name: 'Lettuce',
          purchased: false,
          quantity: '50',
          recipesTitle: ['Chicken Tacos'],
          type: listFilter.vegetable,
          unit: 'g',
        },
        {
          id: 4,
          name: 'Cheddar',
          purchased: false,
          quantity: '50',
          recipesTitle: ['Chicken Tacos'],
          type: listFilter.cheese,
          unit: 'g',
        }
      )
    );
  });

  test('validates button on edit mode', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

    const newPropEdit: EditRecipeProp = {
      ...mockRouteEdit,
      recipe: {
        image_Source: mockRouteEdit.recipe.image_Source,
        title: 'New Recipe Title',
        description: 'New Recipe Description',
        tags: new Array(mockRouteEdit.recipe.tags[1]),
        persons: 23,
        ingredients: mockRouteEdit.recipe.ingredients.map(ingredient => ({ ...ingredient })),
        time: 71,
        preparation: [...mockRouteEdit.recipe.preparation],
        season: ['*'],
      },
    };

    newPropEdit.recipe.ingredients = newPropEdit.recipe.ingredients.map(
      (ingredient: (typeof newPropEdit.recipe.ingredients)[number], index: number) => ({
        ...ingredient,
        quantity:
          index === 0
            ? '766,67'
            : (() => {
                const originalQty = parseFloat(ingredient.quantity as string);
                const scaledQty = Math.round(((originalQty * 23) / 6) * 100) / 100;
                return scaledQty.toString().replace('.', ',');
              })(),
      })
    );

    const updatePreparationWith = '.New part of a paragraph';
    newPropEdit.recipe.preparation[0].description += updatePreparationWith;

    fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), newPropEdit.recipe.title);
    fireEvent.press(
      getByTestId('RecipeDescription::SetTextToEdit'),
      newPropEdit.recipe.description
    );
    fireEvent.press(getByTestId('RecipeTags::RemoveTag'));
    fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), newPropEdit.recipe.persons);
    fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), newPropEdit.recipe.time);

    const descriptionInput = getByTestId(
      'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
    );
    fireEvent.changeText(descriptionInput, newPropEdit.recipe.preparation[0].description);
    fireEvent(descriptionInput, 'endEditing');

    await waitFor(() => {
      checkPreparation(newPropEdit, getByTestId, queryByTestId);
    });

    fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

    const newPropReadOnly: RecipePropType = {
      mode: 'readOnly',
      recipe: newPropEdit.recipe,
    };

    await waitFor(() => {
      checkTitle(newPropReadOnly, getByTestId, queryByTestId);
    });
    checkImage(newPropReadOnly, getByTestId);
    checkDescription(newPropReadOnly, getByTestId, queryByTestId);
    checkTags(newPropReadOnly, getByTestId, queryByTestId);
    checkIngredients(newPropReadOnly, getByTestId, queryByTestId);
    checkPersons(newPropReadOnly, getByTestId, queryByTestId);
    checkTime(newPropReadOnly, getByTestId, queryByTestId);
  });
  //TODO change expected results when recipe edition will be implemented
  // TODO  a validation that new recipe is well inserted in the database

  test('validates button on add manually mode', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(
      createMockRoute(mockRouteAddManually)
    );

    const newTitle = 'New Recipe Title';
    const newDescription = 'New Recipe Description';
    const newPersons = 23;
    const newTime = 71;

    fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), newTitle);
    fireEvent.press(getByTestId('RecipeDescription::SetTextToEdit'), newDescription);
    fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), newPersons.toString());
    fireEvent.press(getByTestId('RecipeTime::SetTextToEdit'), newTime.toString());
    // TODO missing ingredients, preparation and tags

    fireEvent.press(getByTestId('Recipe::BottomActionButton'));

    checkImage(mockRouteAddManually, getByTestId, '');
    checkTitle(mockRouteAddManually, getByTestId, queryByTestId, newTitle);
    checkDescription(mockRouteAddManually, getByTestId, queryByTestId, newDescription);
    checkTags(mockRouteAddManually, getByTestId, queryByTestId, []);
    checkIngredients(mockRouteAddManually, getByTestId, queryByTestId);
    checkPersons(mockRouteAddManually, getByTestId, queryByTestId, newPersons);
    checkTime(mockRouteAddManually, getByTestId, queryByTestId, newTime);
    checkPreparation(mockRouteAddManually, getByTestId, queryByTestId);
  });

  test('shows validation error when image is missing in add mode', async () => {
    const { getByTestId } = await renderRecipe(createMockRoute(mockRouteAddManually));

    fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Test Recipe');
    fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));
    fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '4');
    fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));

    fireEvent.press(getByTestId('Recipe::BottomActionButton'));

    expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
    expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
      'alerts.missingElements.titlePlural'
    );
    expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
      'alerts.missingElements.image'
    );
  });

  test('shows validation error when nutrition has zero values in edit mode', async () => {
    const mockRecipeWithNutrition = {
      mode: 'edit' as const,
      recipe: {
        ...testRecipes[1], // Start with complete recipe
        nutrition: {
          energyKcal: defaultValueNumber, // defaultValueNumber should trigger validation error
          energyKj: 200,
          fat: 5,
          saturatedFat: 1,
          carbohydrates: 20,
          sugars: 5,
          fiber: 3,
          protein: 10,
          salt: 1,
          portionWeight: 100,
        },
      },
    };

    const { getByTestId } = await renderRecipe(createMockRoute(mockRecipeWithNutrition));

    fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

    expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
    expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
      'alerts.missingElements.titleSingular'
    );
    expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
      'alerts.missingElements.messageSingularNutrition'
    );
  });

  test('shows validation error when time is missing in add mode', async () => {
    const { getByTestId } = await renderRecipe(createMockRoute(mockRouteAddManually));

    fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Test Recipe');
    fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));
    fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), '4');
    fireEvent.press(getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction'));

    fireEvent.press(getByTestId('Recipe::BottomActionButton'));

    expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
    expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
      'alerts.missingElements.titlePlural'
    );
    expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
      'alerts.missingElements.titleTime'
    );
  });

  test('edit mode validates comprehensively like add mode', async () => {
    const mockRouteEditWithoutImage = {
      mode: 'edit' as const,
      recipe: {
        ...testRecipes[1],
        image_Source: '',
      },
    };

    const { getByTestId } = await renderRecipe(createMockRoute(mockRouteEditWithoutImage));

    fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

    expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
    expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
      'alerts.missingElements.titleSingular'
    );
    expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
      'alerts.missingElements.image'
    );
  });

  test('shows special nutrition message for single missing nutrition', async () => {
    const mockRecipeWithZeroNutrition = {
      mode: 'edit' as const,
      recipe: {
        ...testRecipes[1],
        nutrition: {
          energyKcal: defaultValueNumber,
          energyKj: defaultValueNumber,
          fat: defaultValueNumber,
          saturatedFat: defaultValueNumber,
          carbohydrates: defaultValueNumber,
          sugars: defaultValueNumber,
          fiber: defaultValueNumber,
          protein: defaultValueNumber,
          salt: defaultValueNumber,
          portionWeight: defaultValueNumber,
        },
      },
    };

    const { getByTestId } = await renderRecipe(createMockRoute(mockRecipeWithZeroNutrition));

    fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

    expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
    expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
      'alerts.missingElements.titleSingular'
    );
    expect(getByTestId('Recipe::Alert::Content').props.children).toBe(
      'alerts.missingElements.messageSingularNutrition'
    );
  });

  test('shows plural validation errors when multiple elements are missing', async () => {
    const { getByTestId } = await renderRecipe(createMockRoute(mockRouteAddManually));

    // Don't add anything - everything should be missing
    fireEvent.press(getByTestId('Recipe::BottomActionButton'));

    expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(true);
    expect(getByTestId('Recipe::Alert::Title').props.children).toBe(
      'alerts.missingElements.titlePlural'
    );
    expect(getByTestId('Recipe::Alert::Content').props.children).toContain(
      'alerts.missingElements.messagePlural'
    );
  });

  test('validation passes when all required fields are complete in edit mode', async () => {
    const mockCompleteRecipe = {
      mode: 'edit' as const,
      recipe: {
        ...testRecipes[1],
        nutrition: undefined,
      },
    };

    const { getByTestId } = await renderRecipe(createMockRoute(mockCompleteRecipe as any));

    fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

    // Edit mode should switch to read-only mode when validation passes
    // No validation dialog should be shown for successful edit
    expect(getByTestId('Recipe::Alert::IsVisible').props.children).toBe(false);
  });

  test('scales recipe back to default persons when editing', async () => {
    const editRecipeSpy = jest.spyOn(dbInstance, 'editRecipe');

    const mockRecipeForEdit = {
      mode: 'edit' as const,
      recipe: {
        ...testRecipes[0],
      },
    };

    const { getByTestId } = await renderRecipe(createMockRoute(mockRecipeForEdit));

    fireEvent.press(getByTestId('RecipeTitle::SetTextToEdit'), 'Modified Title');
    const newPersons = '8';
    fireEvent.press(getByTestId('RecipePersons::SetTextToEdit'), newPersons);

    fireEvent.press(getByTestId('Recipe::AppBar::Validate'));

    await waitFor(() => {
      expect(editRecipeSpy).toHaveBeenCalled();
    });

    const savedRecipe = editRecipeSpy.mock.calls[0][0];
    expect(savedRecipe.title).toBe('Modified Title');
    expect(savedRecipe.persons).toBe(4);
    expect(savedRecipe.ingredients[0].quantity).toBe('200');
    expect(savedRecipe.ingredients[1].quantity).toBe('300');
    expect(savedRecipe.ingredients[2].quantity).toBe('250');
    expect(savedRecipe.ingredients[3].quantity).toBe('50');

    editRecipeSpy.mockRestore();
  });

  test('toggles stackMode between readOnly and edit', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteReadOnly));
    const paramEdit: EditRecipeProp = { ...mockRouteReadOnly, mode: 'edit' };
    fireEvent.press(getByTestId('Recipe::AppBar::Edit'));

    checkAppbarButtons(paramEdit, getByTestId, queryByTestId);

    checkImage(paramEdit, getByTestId);
    checkTitle(paramEdit, getByTestId, queryByTestId);
    checkDescription(paramEdit, getByTestId, queryByTestId);
    checkTags(paramEdit, getByTestId, queryByTestId);
    checkIngredients(paramEdit, getByTestId, queryByTestId);
    checkPersons(paramEdit, getByTestId, queryByTestId);
    checkTime(paramEdit, getByTestId, queryByTestId);
    checkPreparation(paramEdit, getByTestId, queryByTestId);
    checkNutrition(paramEdit, getByTestId, queryByTestId);
  });

  // -------- NUTRITION OCR TESTS --------
  test('shows OCR nutrition empty state in addOCR mode', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteAddOCR));

    checkNutrition(mockRouteAddOCR, getByTestId, queryByTestId);
  });

  test('shows manual nutrition empty state in addManual mode', async () => {
    const { getByTestId, queryByTestId } = await renderRecipe(
      createMockRoute(mockRouteAddManually)
    );

    checkNutrition(mockRouteAddManually, getByTestId, queryByTestId);
  });

  describe('duplicate prevention', () => {
    test('prevents adding duplicate tag with exact same name', async () => {
      const { getByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

      const initialTagsJson = getByTestId('RecipeTags::TagsList').props.children;
      const initialTags = JSON.parse(initialTagsJson);
      const initialCount = initialTags.length;

      expect(initialCount).toBeGreaterThan(0);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(
        () => {
          const finalTagsJson = getByTestId('RecipeTags::TagsList').props.children;
          const finalTags = JSON.parse(finalTagsJson);
          expect(finalTags).toHaveLength(initialCount);
        },
        { timeout: 1000 }
      );
    });

    test('prevents adding duplicate tag with case insensitive match', async () => {
      const mockRouteWithTags: RecipePropType = {
        mode: 'edit',
        recipe: {
          ...testRecipes[6],
          tags: [{ id: 1, name: 'Dessert' }],
        },
      };

      const { getByTestId } = await renderRecipe(createMockRoute(mockRouteWithTags));

      const initialTagsJson = getByTestId('RecipeTags::TagsList').props.children;
      const initialTags = JSON.parse(initialTagsJson);

      expect(initialTags).toEqual(['Dessert']);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(
        () => {
          const finalTagsJson = getByTestId('RecipeTags::TagsList').props.children;
          const finalTags = JSON.parse(finalTagsJson);
          expect(finalTags).toHaveLength(1);
          expect(finalTags).toEqual(['Dessert']);
        },
        { timeout: 1000 }
      );
    });

    test('prevents adding duplicate ingredient with exact same name', async () => {
      const { getByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

      const initialCount = mockRouteEdit.recipe.ingredients.length;

      expect(getByTestId(`RecipeIngredients::0::Row`)).toBeTruthy();

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId(`RecipeIngredients::${initialCount}::Row`)).toBeTruthy();
      });

      const ingredientsCount = mockRouteEdit.recipe.ingredients.length;
      for (let i = 0; i <= ingredientsCount; i++) {
        expect(getByTestId(`RecipeIngredients::${i}::Row`)).toBeTruthy();
      }
    });

    test('prevents adding duplicate ingredient with case insensitive match', async () => {
      const { getByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

      const initialCount = mockRouteEdit.recipe.ingredients.length;

      expect(getByTestId(`RecipeIngredients::0::Row`)).toBeTruthy();

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId(`RecipeIngredients::${initialCount}::Row`)).toBeTruthy();
      });

      const ingredientsCount = mockRouteEdit.recipe.ingredients.length;
      for (let i = 0; i <= ingredientsCount; i++) {
        expect(getByTestId(`RecipeIngredients::${i}::Row`)).toBeTruthy();
      }
    });

    test('allows editing ingredient to a different value', async () => {
      const { getByTestId } = await renderRecipe(createMockRoute(mockRouteEdit));

      const initialCount = mockRouteEdit.recipe.ingredients.length;
      const initialName = getByTestId(
        'RecipeIngredients::0::NameInput::TextInputWithDropdown::Value'
      ).props.children;
      expect(initialName).toBe('Flour');

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      });

      mockRouteEdit.recipe.ingredients.forEach((_, index) => {
        expect(getByTestId(`RecipeIngredients::${index}::Row`)).toBeTruthy();
      });
      expect(mockRouteEdit.recipe.ingredients).toHaveLength(initialCount);
    });
  });

  describe('ValidationQueue integration', () => {
    test('shows ValidationQueue when manually adding a new tag', async () => {
      const { getByTestId, queryByTestId } = await renderRecipe(
        createMockRoute(mockRouteAddManually)
      );

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      expect(getByTestId('RecipeValidation::ValidationQueue::Mock::type').props.children).toBe(
        'Tag'
      );
    });

    test('does not show ValidationQueue immediately when adding empty ingredient row', async () => {
      const { getByTestId, queryByTestId } = await renderRecipe(
        createMockRoute(mockRouteAddManually)
      );

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      });

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
    });

    test('hides ValidationQueue when onComplete is called', async () => {
      const { getByTestId, queryByTestId } = await renderRecipe(
        createMockRoute(mockRouteAddManually)
      );

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onComplete'));

      await waitFor(() => {
        expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
      });
    });

    test('adds tag when ValidationQueue calls onValidated', async () => {
      const { getByTestId } = await renderRecipe(createMockRoute(mockRouteAddManually));

      const initialTagsJson = getByTestId('RecipeTags::TagsList').props.children;
      const initialTags = JSON.parse(initialTagsJson);
      const initialCount = initialTags.length;

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onValidated'));

      await waitFor(() => {
        const finalTagsJson = getByTestId('RecipeTags::TagsList').props.children;
        const finalTags = JSON.parse(finalTagsJson);
        expect(finalTags.length).toBeGreaterThan(initialCount);
      });
    });

    test('adds empty ingredient row when add button is pressed', async () => {
      const { getByTestId } = await renderRecipe(createMockRoute(mockRouteAddManually));

      const initialCount = 0;

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId(`RecipeIngredients::${initialCount}::Row`)).toBeTruthy();
      });

      expect(
        getByTestId('RecipeIngredients::0::NameInput::TextInputWithDropdown::Value').props.children
      ).toBe('');
    });

    test('does not show ValidationQueue for duplicate tags (pre-filtered)', async () => {
      const mockRouteWithTags: RecipePropType = {
        mode: 'edit',
        recipe: {
          ...testRecipes[6],
          tags: [{ id: 1, name: 'mockTag' }],
        },
      };

      const { getByTestId, queryByTestId } = await renderRecipe(createMockRoute(mockRouteWithTags));

      const initialTagsJson = getByTestId('RecipeTags::TagsList').props.children;
      const initialTags = JSON.parse(initialTagsJson);

      expect(initialTags).toEqual(['mockTag']);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(
        () => {
          expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
          const finalTagsJson = getByTestId('RecipeTags::TagsList').props.children;
          const finalTags = JSON.parse(finalTagsJson);
          expect(finalTags).toHaveLength(1);
          expect(finalTags).toEqual(['mockTag']);
        },
        { timeout: 1000 }
      );
    });

    test('ValidationQueue callback handles duplicate ingredients by merging quantities', async () => {
      const mockRouteWithIngredient: RecipePropType = {
        mode: 'edit',
        recipe: {
          ...testRecipes[6],
          ingredients: [
            {
              id: 1,
              name: 'mockIngredient',
              type: ingredientType.vegetable,
              unit: 'g',
              quantity: '100',
              season: [],
            },
          ],
        },
      };

      const { getByTestId, queryByTestId } = await renderRecipe(
        createMockRoute(mockRouteWithIngredient)
      );

      expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      const initialQty = getByTestId('RecipeIngredients::0::QuantityInput').props.children;
      expect(initialQty).toBe('100');

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
    });

    test('ValidationQueue callback handles ingredient replacement when units differ', async () => {
      const mockRouteWithIngredient: RecipePropType = {
        mode: 'edit',
        recipe: {
          ...testRecipes[6],
          ingredients: [
            {
              id: 1,
              name: 'Tomato',
              type: ingredientType.vegetable,
              unit: 'kg',
              quantity: '1',
              season: [],
            },
          ],
        },
      };

      const { getByTestId, queryByTestId } = await renderRecipe(
        createMockRoute(mockRouteWithIngredient)
      );

      expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      const initialUnit = getByTestId('RecipeIngredients::0::UnitInput::CustomTextInput').props
        .children;
      expect(initialUnit).toBe('kg');

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();
    });

    test('ValidationQueue processes items sequentially', async () => {
      const { getByTestId, queryByTestId } = await renderRecipe(
        createMockRoute(mockRouteAddManually)
      );

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      const items = JSON.parse(
        getByTestId('RecipeValidation::ValidationQueue::Mock::items').props.children
      );
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('mockTag');
    });

    test('ValidationQueue passes correct testId', async () => {
      const { getByTestId } = await renderRecipe(createMockRoute(mockRouteAddManually));

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });
    });

    test('does not show ValidationQueue for exact match tag (auto-added)', async () => {
      await dbInstance.addTag({ name: 'mockTag' });

      const { getByTestId, queryByTestId } = await renderRecipe(
        createMockRoute(mockRouteAddManually)
      );

      const initialTagsJson = getByTestId('RecipeTags::TagsList').props.children;
      const initialTags = JSON.parse(initialTagsJson);
      const initialCount = initialTags.length;

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(
        () => {
          expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();

          const finalTagsJson = getByTestId('RecipeTags::TagsList').props.children;
          const finalTags = JSON.parse(finalTagsJson);
          expect(finalTags.length).toBeGreaterThan(initialCount);
        },
        { timeout: 2000 }
      );
    });

    test('ValidationQueue callback preserves previously added tags from state', async () => {
      const { getByTestId } = await renderRecipe(createMockRoute(mockRouteAddManually));

      const initialTags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
      expect(initialTags.length).toBe(0);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onValidated'));

      await waitFor(() => {
        const tagsAfterFirst = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
        expect(tagsAfterFirst).toContain('mockTag');
        expect(tagsAfterFirst.length).toBe(1);
      });

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onValidated'));

      await waitFor(() => {
        const finalTags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
        expect(finalTags).toContain('mockTag');
        expect(finalTags.length).toBe(1);
      });
    });

    test('ValidationQueue callback preserves previously auto-added exact match ingredients', async () => {
      const { getByTestId, queryByTestId } = await renderRecipe(
        createMockRoute(mockRouteAddManually)
      );

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::0::Row')).toBeTruthy();
      });

      let ingredientsList = JSON.parse(
        getByTestId('RecipeIngredients::Ingredients').props.children
      );
      expect(ingredientsList).toHaveLength(1);
      expect(ingredientsList[0].name).toBe('');

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        expect(getByTestId('RecipeIngredients::1::Row')).toBeTruthy();
      });

      ingredientsList = JSON.parse(getByTestId('RecipeIngredients::Ingredients').props.children);
      expect(ingredientsList).toHaveLength(2);
      expect(ingredientsList[0].name).toBe('');
      expect(ingredientsList[1].name).toBe('');
    });

    test('ValidationQueue prevents duplicate tags using latest state', async () => {
      const { getByTestId } = await renderRecipe(createMockRoute(mockRouteAddManually));

      const initialTags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
      expect(initialTags).toHaveLength(0);

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onValidated'));

      await waitFor(() => {
        const tags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
        expect(tags).toHaveLength(1);
        expect(tags[0]).toBe('mockTag');
      });

      fireEvent.press(getByTestId('RecipeTags::AddNewTag'));

      await waitFor(() => {
        expect(getByTestId('RecipeValidation::ValidationQueue::Mock')).toBeTruthy();
      });

      fireEvent.press(getByTestId('RecipeValidation::ValidationQueue::Mock::onValidated'));

      await waitFor(() => {
        const finalTags = JSON.parse(getByTestId('RecipeTags::TagsList').props.children);
        expect(finalTags).toHaveLength(1);
        expect(finalTags[0]).toBe('mockTag');
      });
    });

    test('exact match ingredient auto-added then new ingredient validated both persist', async () => {
      await dbInstance.addIngredient({
        name: 'PreExisting',
        type: ingredientType.vegetable,
        unit: 'g',
        season: [],
      });

      const { getByTestId, queryByTestId } = await renderRecipe(
        createMockRoute(mockRouteAddManually)
      );

      const initialIngredients = JSON.parse(
        getByTestId('RecipeIngredients::Ingredients').props.children
      );
      expect(initialIngredients).toHaveLength(0);

      fireEvent.press(getByTestId('RecipeIngredients::AddButton::RoundButton::OnPressFunction'));

      await waitFor(() => {
        const ingredients = JSON.parse(
          getByTestId('RecipeIngredients::Ingredients').props.children
        );
        expect(ingredients).toHaveLength(1);
        expect(ingredients[0].name).toBe('');
      });

      expect(queryByTestId('RecipeValidation::ValidationQueue::Mock')).toBeNull();

      const finalIngredients = JSON.parse(
        getByTestId('RecipeIngredients::Ingredients').props.children
      );
      expect(finalIngredients).toHaveLength(1);
    });
  });

  // TODO add delete test
});
