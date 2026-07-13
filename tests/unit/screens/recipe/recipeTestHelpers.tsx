import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testRecipes } from '@test-data/recipesDataset';
import { testTags } from '@test-data/tagsDataset';
import { testIngredients } from '@test-data/ingredientsDataset';
import { tagTableElement } from '@customTypes/DatabaseElementTypes';
import { RecipePropType, ScrapedRecipeData } from '@customTypes/RecipeNavigationTypes';
import { StackScreenParamList } from '@customTypes/ScreenTypes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { GetByQuery, QueryByQuery } from '@testing-library/react-native/build/queries/make-queries';
import { TextMatch, TextMatchOptions } from '@testing-library/react-native/build/matches';
import { CommonQueryOptions } from '@testing-library/react-native/build/queries/options';
import { defaultValueNumber } from '@utils/Constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecipeView } from '@screens/recipe/RecipeView';
import { RecipeEdit } from '@screens/recipe/RecipeEdit';
import { RecipeAddManual } from '@screens/recipe/RecipeAddManual';
import { RecipeAddOcr } from '@screens/recipe/RecipeAddOcr';
import { RecipeAddScrape } from '@screens/recipe/RecipeAddScrape';

export const defaultUri = '';

export type GetByIdType = GetByQuery<TextMatch, CommonQueryOptions & TextMatchOptions>;
export type QueryByIdType = QueryByQuery<TextMatch, CommonQueryOptions & TextMatchOptions>;

export function checkAppbarButtons(
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
    case 'addFromScrape':
      expect(getByTestId('Recipe::AppBar::BackButton')).toBeTruthy();
      expect(queryByTestId('Recipe::AppBar::Delete')).toBeNull();
      expect(queryByTestId('Recipe::AppBar::Edit')).toBeNull();
      expect(queryByTestId('Recipe::AppBar::Cancel')).toBeNull();
      expect(queryByTestId('Recipe::AppBar::Validate')).toBeNull();
      break;
  }
}

export function checkImage(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  newValueExpected?: string
) {
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

export function checkTitle(
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

export function checkDescription(
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

export function checkTags(
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
      expect(
        getByTestId('RecipeTags::RandomTags').props.children.replaceAll('"', '').split(', ').length
      ).toEqual(3);
      expect(getByTestId('RecipeTags::AddNewTag').props.children).toBeTruthy();
      expect(getByTestId('RecipeTags::RemoveTag').props.children).toBeTruthy();
      break;
    case 'addManually':
      expect(getByTestId('RecipeTags::TagsList').props.children).toEqual(
        JSON.stringify(newValueExpected?.map(tag => tag.name))
      );
      expect(getByTestId('RecipeTags::RandomTags').props.children).not.toEqual(
        testRecipes[6]!.tags.map(tag => tag.name)
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

export function checkIngredients(
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
      expect(queryByTestId('RecipeIngredients::OpenModalNames')).toBeNull();
      expect(queryByTestId('RecipeIngredients::AddButton')).toBeNull();
      break;
    case 'edit':
      expect(getByTestId('RecipeIngredients::PrefixText').props.children).toEqual('ingredients: ');
      expect(getByTestId('RecipeIngredients::AddButton::RoundButton::Icon').props.children).toEqual(
        'plus'
      );
      expect(queryByTestId('RecipeIngredients::OpenModalNames')).toBeNull();
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
      expect(getByTestId('RecipeIngredients::PrefixText').props.children).toEqual('ingredients: ');
      expect(getByTestId('RecipeIngredients::AddButton::RoundButton::Icon').props.children).toEqual(
        'plus'
      );
      expect(queryByTestId('RecipeIngredients::OpenModalNames')).toBeNull();
      break;
    case 'addFromPic':
      expect(getByTestId('RecipeIngredients::PrefixText').props.children).toEqual('ingredients: ');
      if (prop.imgUri.length === 0) {
        expect(
          getByTestId('RecipeIngredients::OpenModalNames::RoundButton::Icon').props.children
        ).toEqual('line-scan');
        expect(
          getByTestId('RecipeIngredients::AddButton::RoundButton::Icon').props.children
        ).toEqual('pencil');
      } else {
        expect(
          getByTestId('RecipeIngredients::AddButton::RoundButton::Icon').props.children
        ).toEqual('plus');
        expect(
          getByTestId('RecipeIngredients::OpenModalQuantities::RoundButton::Icon').props.children
        ).toEqual('line-scan');
      }
      break;
  }
}

export function checkPersons(
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
      if (newValueExpected === defaultValueNumber) {
        expect(getByTestId('RecipePersons::PrefixText').props.children).toEqual('personPrefixOCR');
        expect(getByTestId('RecipePersons::SuffixText').props.children).toBeUndefined();
        if (prop.imgUri === defaultUri) {
          expect(getByTestId('RecipePersons::OpenModal').props.children).toBeTruthy();
        } else {
          expect(queryByTestId('RecipePersons::OpenModal')).toBeNull();
        }
      } else {
        expect(getByTestId('RecipePersons::PrefixText').props.children).toEqual('personPrefixEdit');
        expect(getByTestId('RecipePersons::SuffixText').props.children).toEqual('personSuffixEdit');
        expect(getByTestId('RecipePersons::TextEditable').props.children).toEqual(newValueExpected);
        expect(getByTestId('RecipePersons::SetTextToEdit').props.children).toBeTruthy();
        expect(queryByTestId('RecipePersons::OpenModal')).toBeNull();
      }
      break;
  }
}

export function checkTime(
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

export function checkPreparation(
  prop: RecipePropType,
  getByTestId: GetByIdType,
  queryByTestId: QueryByIdType
) {
  switch (prop.mode) {
    case 'readOnly':
      expect(getByTestId('RecipePreparation::Steps').props.children).toEqual(
        JSON.stringify(prop.recipe.preparation)
      );
      expect(queryByTestId('RecipePreparation::PrefixText')).toBeNull();
      expect(
        queryByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
      ).toBeNull();
      expect(
        queryByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
      ).toBeNull();
      prop.recipe.preparation.forEach((_, index) => {
        expect(getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionTitle`)).toBeTruthy();
        expect(
          getByTestId(`RecipePreparation::ReadOnlyStep::${index}::SectionParagraph`)
        ).toBeTruthy();
      });
      break;
    case 'edit':
      expect(getByTestId('RecipePreparation::PrefixText').props.children).toEqual(
        'preparationReadOnly'
      );
      expect(
        queryByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
      ).toBeNull();
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
      expect(getByTestId('RecipePreparation::PrefixText').props.children).toEqual(
        'preparationReadOnly'
      );
      expect(
        queryByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
      ).toBeNull();
      expect(
        getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
      expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
        'plus'
      );
      break;
    case 'addFromPic':
      expect(getByTestId('RecipePreparation::PrefixText').props.children).toEqual(
        'preparationReadOnly'
      );
      expect(
        getByTestId('RecipePreparation::AddButton::RoundButton::OnPressFunction')
      ).toBeTruthy();
      expect(getByTestId('RecipePreparation::AddButton::RoundButton::Icon').props.children).toEqual(
        'pencil'
      );
      expect(
        getByTestId('RecipePreparation::OpenModal::RoundButton::OnPressFunction')
      ).toBeTruthy();
      expect(getByTestId('RecipePreparation::OpenModal::RoundButton::Icon').props.children).toEqual(
        'line-scan'
      );
      break;
  }
}

export function checkNutrition(
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

export const mockNavigation = {
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
};

interface SavedViewRoute {
  name: string;
  params?: { recipe?: { nutrition?: unknown }; scaledFromServings?: number };
}

export function runSaveNavigationReducer(): {
  routes: SavedViewRoute[];
  savedView: SavedViewRoute;
} {
  const reducer = mockNavigation.dispatch.mock.calls[0]?.[0];
  if (typeof reducer !== 'function') {
    throw new Error('navigation.dispatch was not called with a state reducer');
  }
  const state = {
    key: 'stack-test',
    index: 2,
    routeNames: ['Home', 'RecipeView', 'RecipeEdit'],
    routes: [
      { key: 'Home-0', name: 'Home' },
      { key: 'RecipeView-orig', name: 'RecipeView', params: { recipe: { title: 'Original' } } },
      { key: 'RecipeEdit-0', name: 'RecipeEdit', params: { recipe: { title: 'Original' } } },
    ],
  };
  const action = (reducer as (s: typeof state) => { payload: { routes: SavedViewRoute[] } })(state);
  const routes = action.payload.routes;
  return { routes, savedView: routes[routes.length - 1]! };
}

type RouteName =
  'RecipeView' | 'RecipeEdit' | 'RecipeAddManual' | 'RecipeAddOcr' | 'RecipeAddScrape';

export function makeRoute<R extends RouteName>(
  name: R,
  params: StackScreenParamList[R]
): RouteProp<StackScreenParamList, R> {
  return {
    key: `${name}-test`,
    name,
    params,
  } as unknown as RouteProp<StackScreenParamList, R>;
}

function makeNav<R extends RouteName>(): NativeStackNavigationProp<StackScreenParamList, R> {
  return mockNavigation as unknown as NativeStackNavigationProp<StackScreenParamList, R>;
}

export async function renderRoute(prop: RecipePropType) {
  let result: ReturnType<typeof render>;
  switch (prop.mode) {
    case 'readOnly':
      result = render(
        <RecipeView
          route={makeRoute('RecipeView', { recipe: prop.recipe })}
          navigation={makeNav<'RecipeView'>()}
        />
      );
      break;
    case 'edit':
      result = render(
        <RecipeEdit
          route={makeRoute('RecipeEdit', { recipe: prop.recipe })}
          navigation={makeNav<'RecipeEdit'>()}
        />
      );
      break;
    case 'addManually':
      result = render(
        <RecipeAddManual
          route={makeRoute('RecipeAddManual', undefined as unknown as undefined)}
          navigation={makeNav<'RecipeAddManual'>()}
        />
      );
      break;
    case 'addFromPic':
      result = render(
        <RecipeAddOcr
          route={makeRoute('RecipeAddOcr', { imgUri: prop.imgUri })}
          navigation={makeNav<'RecipeAddOcr'>()}
        />
      );
      break;
    case 'addFromScrape':
      result = render(
        <RecipeAddScrape
          route={makeRoute('RecipeAddScrape', {
            scrapedData: prop.scrapedData as ScrapedRecipeData,
            sourceUrl: prop.sourceUrl,
          })}
          navigation={makeNav<'RecipeAddScrape'>()}
        />
      );
      break;
  }

  await waitFor(() => {
    if (prop.mode === 'edit') {
      expect(result.getByTestId('Recipe::AppBar::Cancel')).toBeTruthy();
    } else {
      expect(result.getByTestId('Recipe::AppBar::BackButton')).toBeTruthy();
    }
    if (prop.mode === 'addManually') {
      const personsValue = result.queryByTestId('RecipePersons::TextEditable')?.props.children;
      if (personsValue !== undefined) {
        expect(personsValue).toEqual(4);
      }
    }
  });

  return result;
}

export async function setupDb() {
  const dbInstance = RecipeDatabase.getInstance();
  await dbInstance.init();
  await dbInstance.addMultipleIngredients(testIngredients);
  await dbInstance.addMultipleTags(testTags);
  await dbInstance.addMultipleRecipes(testRecipes);
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue('4');
  return dbInstance;
}

export async function teardownDb() {
  const dbInstance = RecipeDatabase.getInstance();
  await dbInstance.closeAndReset();
}
