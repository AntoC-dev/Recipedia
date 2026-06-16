import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Search from '@screens/Search';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { Button } from 'react-native';
import { SeasonFilterProvider, useSeasonFilter } from '@context/SeasonFilterContext';
import { resetFiltersSelection } from '@mocks/components/organisms/FiltersSelection-mock';

function SeasonFilterToggler() {
  const { setSeasonFilter } = useSeasonFilter();
  return (
    <Button testID='ToggleSeasonFilter' onPress={setSeasonFilter} title='Toggle Season Filter' />
  );
}

jest.mock('@components/organisms/FiltersSelection', () => ({
  FiltersSelection: require('@mocks/components/organisms/FiltersSelection-mock')
    .filtersSelectionMock,
}));
jest.mock('@components/organisms/SearchBar', () => ({
  SearchBar: require('@mocks/components/organisms/SearchBar-mock').searchBarMock,
}));
jest.mock('@components/organisms/SearchBarResults', () => ({
  SearchBarResults: require('@mocks/components/organisms/SearchBarResults-mock')
    .searchBarResultsMock,
}));
jest.mock('@components/organisms/FilterAccordion', () => ({
  FilterAccordion: require('@mocks/components/organisms/FilterAccordion-mock').filterAccordionMock,
}));
jest.mock('@components/molecules/RecipeCard', () => ({
  RecipeCard: require('@mocks/components/molecules/RecipeCard-mock').recipeCardMock,
}));
jest.mock('@hooks/useSafeCopilot', () =>
  require('@mocks/hooks/useSafeCopilot-mock').useSafeCopilotMock()
);

const { mockUseSafeCopilot } = require('@mocks/hooks/useSafeCopilot-mock');

const Stack = createStackNavigator();

describe('Search Screen', () => {
  const database: RecipeDatabase = RecipeDatabase.getInstance();

  const defaultComponent = (
    <SeasonFilterProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name={'Search'} component={Search} />
        </Stack.Navigator>
      </NavigationContainer>
    </SeasonFilterProvider>
  );

  const renderSearchComponent = async () => {
    const result = render(defaultComponent);
    await waitFor(() => {
      expect(result.getByTestId('SearchScreen')).toBeTruthy();
    });
    return result;
  };

  // Helper function to wait for async operations and rerender if needed
  const waitAndRerender = async (rerender: any, getByTestId: any) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    rerender(defaultComponent);
    await waitFor(() => {
      expect(getByTestId('SearchScreen')).toBeTruthy();
    });
    return { getByTestId };
  };

  // Helper function to assert initial component state
  const assertInitialComponentState = (getByTestId: any) => {
    // Assert main screen is present
    expect(getByTestId('SearchScreen')).toBeTruthy();

    // Assert SearchBar is present and in correct initial state
    expect(getByTestId('SearchScreen::SearchBar')).toBeTruthy();
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('');
    expect(getByTestId('SearchScreen::SearchBar::Clicked').props.children).toEqual('false');

    // Assert SearchBarResults is NOT present when searchBar is not clicked
    expect(() => getByTestId('SearchScreen::SearchBarResults')).toThrow();

    // Assert FiltersSelection is present and in correct initial state
    expect(getByTestId('SearchScreen::Filters')).toBeTruthy();
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('false');
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual('[]');

    // Assert Divider is present
    expect(getByTestId('SearchScreen::Divider')).toBeTruthy();

    // Assert FilterAccordion is NOT rendered initially (addingFilterMode is false)
    expect(() => getByTestId('SearchScreen::FilterAccordion')).toThrow();
  };

  const assertDatabasePopulatedState = (getByTestId: any) => {
    expect(() => getByTestId('SearchScreen::TextWhenEmpty')).toThrow();
    expect(getByTestId('SearchScreen::RecipeCards::1')).toBeTruthy();
  };

  beforeEach(async () => {
    resetFiltersSelection();

    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
    await database.addMultipleRecipes(testRecipes);
  });

  afterEach(async () => {
    await database.closeAndReset();
    mockUseSafeCopilot.mockReturnValue(null);
  });

  test('renders the tutorial spotlight proxy when copilot is available', async () => {
    mockUseSafeCopilot.mockReturnValue({
      copilotEvents: {},
      currentStep: { order: 2, name: 'Search', text: 'Search step' },
      isActive: true,
    });

    const { getByTestId } = await renderSearchComponent();

    expect(getByTestId('CopilotStep::Search')).toBeTruthy();
    expect(getByTestId('SearchScreen::Tutorial')).toBeTruthy();
  });

  test('advances to the search step once its target is measured from an earlier step', async () => {
    const goToNext = jest.fn();
    const goToPrev = jest.fn();
    mockUseSafeCopilot.mockReturnValue({
      copilotEvents: {},
      currentStep: { order: 1, name: 'Home', text: 'Home step' },
      isActive: true,
      goToNext,
      goToPrev,
    });

    const { getByTestId } = await renderSearchComponent();
    fireEvent.press(getByTestId('SearchScreen::ReportToggleTop'));

    expect(goToNext).toHaveBeenCalled();
    expect(goToPrev).not.toHaveBeenCalled();
  });

  test('regresses to the search step once its target is measured from a later step', async () => {
    const goToNext = jest.fn();
    const goToPrev = jest.fn();
    mockUseSafeCopilot.mockReturnValue({
      copilotEvents: {},
      currentStep: { order: 3, name: 'Menu', text: 'Menu step' },
      isActive: true,
      goToNext,
      goToPrev,
    });

    const { getByTestId } = await renderSearchComponent();
    fireEvent.press(getByTestId('SearchScreen::ReportToggleTop'));

    expect(goToPrev).toHaveBeenCalled();
    expect(goToNext).not.toHaveBeenCalled();
  });

  test('does not change step when already on the search step', async () => {
    const goToNext = jest.fn();
    const goToPrev = jest.fn();
    mockUseSafeCopilot.mockReturnValue({
      copilotEvents: {},
      currentStep: { order: 2, name: 'Search', text: 'Search step' },
      isActive: true,
      goToNext,
      goToPrev,
    });

    const { getByTestId } = await renderSearchComponent();
    fireEvent.press(getByTestId('SearchScreen::ReportToggleTop'));

    expect(goToNext).not.toHaveBeenCalled();
    expect(goToPrev).not.toHaveBeenCalled();
  });

  test('initializes with database recipes', async () => {
    const { getByTestId: emptyGetByTestId, rerender } = await renderSearchComponent();

    // Assert initial component state before database data loads
    assertInitialComponentState(emptyGetByTestId);

    // Wait for database operations to complete and rerender
    const { getByTestId } = await waitAndRerender(rerender, emptyGetByTestId);

    // Assert component state after database is populated
    assertDatabasePopulatedState(getByTestId);

    // Assert SearchBar child components are present and in correct state
    expect(getByTestId('SearchScreen::SearchBar::ToggleClicked')).toBeTruthy();
    expect(getByTestId('SearchScreen::SearchBar::UpdateSearchPhrase')).toBeTruthy();
    expect(getByTestId('SearchScreen::AddFilter')).toBeTruthy();
    expect(getByTestId('SearchScreen::RemoveFilter')).toBeTruthy();
    expect(getByTestId('SearchScreen::ToggleAddingFilterMode')).toBeTruthy();
  });

  test('Add filter on child components update the React.useState', async () => {
    const { getByTestId: emptyGetByTestId, rerender } = await renderSearchComponent();

    assertInitialComponentState(emptyGetByTestId);

    const { getByTestId } = await waitAndRerender(rerender, emptyGetByTestId);

    // Assert database populated state
    assertDatabasePopulatedState(getByTestId);

    // Test adding first filter
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual('[]');
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('false');

    fireEvent.press(getByTestId('SearchScreen::AddFilter'));

    // Assert state after first filter added
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual('["filterTypes.inSeason"]');
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('true');

    // Assert FilterAccordion is now rendered (addingFilterMode is true)
    expect(() => getByTestId('SearchScreen::FilterAccordion')).not.toThrow();

    // Test adding second filter
    fireEvent.press(getByTestId('SearchScreen::AddFilter'));

    // Assert state after second filter added
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual(
      '["filterTypes.inSeason","ingredientTypes.nutsAndSeeds"]'
    );
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('false');

    // Assert FilterAccordion is hidden again (addingFilterMode is false)
    expect(() => getByTestId('SearchScreen::FilterAccordion')).toThrow();

    // Test adding third filter
    fireEvent.press(getByTestId('SearchScreen::AddFilter'));

    // Assert final state after all filters added
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual(
      '["filterTypes.inSeason","ingredientTypes.nutsAndSeeds","filterTypes.purchased"]'
    );
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('true');

    // Assert all original components are still present
    expect(getByTestId('SearchScreen::SearchBar')).toBeTruthy();
    expect(getByTestId('SearchScreen::Divider')).toBeTruthy();
  });

  test('Remove filter on child components update the React.useState', async () => {
    const { getByTestId: emptyGetByTestId, rerender } = await renderSearchComponent();

    assertInitialComponentState(emptyGetByTestId);

    const { getByTestId } = await waitAndRerender(rerender, emptyGetByTestId);

    // Assert database populated state
    assertDatabasePopulatedState(getByTestId);

    // Setup: Add three filters first
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual('[]');

    fireEvent.press(getByTestId('SearchScreen::AddFilter'));
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual('["filterTypes.inSeason"]');
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('true');

    fireEvent.press(getByTestId('SearchScreen::AddFilter'));
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual(
      '["filterTypes.inSeason","ingredientTypes.nutsAndSeeds"]'
    );
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('false');

    fireEvent.press(getByTestId('SearchScreen::AddFilter'));
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual(
      '["filterTypes.inSeason","ingredientTypes.nutsAndSeeds","filterTypes.purchased"]'
    );
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('true');

    // Assert FilterAccordion is visible when addingFilterMode is true
    expect(() => getByTestId('SearchScreen::FilterAccordion')).not.toThrow();

    // Test removing first filter
    fireEvent.press(getByTestId('SearchScreen::RemoveFilter'));
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual(
      '["ingredientTypes.nutsAndSeeds","filterTypes.purchased"]'
    );

    // Assert all other components are still present
    expect(getByTestId('SearchScreen::SearchBar')).toBeTruthy();
    expect(getByTestId('SearchScreen::AddingFilterMode')).toBeTruthy();

    // Test removing second filter
    fireEvent.press(getByTestId('SearchScreen::RemoveFilter'));
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual(
      '["filterTypes.purchased"]'
    );

    // Assert search functionality still works after filter changes
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('');

    // Test removing final filter
    fireEvent.press(getByTestId('SearchScreen::RemoveFilter'));
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual('[]');

    // Assert component returns to initial filter state
    expect(getByTestId('SearchScreen::AddFilter')).toBeTruthy();
    expect(getByTestId('SearchScreen::RemoveFilter')).toBeTruthy();
    expect(getByTestId('SearchScreen::ToggleAddingFilterMode')).toBeTruthy();

    // Assert all core components are still functional
    expect(getByTestId('SearchScreen::SearchBar::ToggleClicked')).toBeTruthy();
    expect(getByTestId('SearchScreen::SearchBar::UpdateSearchPhrase')).toBeTruthy();
  });

  test('Click on section on child components update the React.useState', async () => {
    const { getByTestId: emptyGetByTestId, rerender } = await renderSearchComponent();

    assertInitialComponentState(emptyGetByTestId);

    const { getByTestId } = await waitAndRerender(rerender, emptyGetByTestId);

    // Test initial addingFilterMode state
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('false');
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual('[]');

    // Assert FilterAccordion is NOT visible initially
    expect(() => getByTestId('SearchScreen::FilterAccordion')).toThrow();

    // Assert all other components are present in initial state
    expect(getByTestId('SearchScreen::SearchBar')).toBeTruthy();
    expect(getByTestId('SearchScreen::Divider')).toBeTruthy();

    // Test toggling addingFilterMode to true
    fireEvent.press(getByTestId('SearchScreen::ToggleAddingFilterMode'));

    // Wait for state update to propagate
    const { getByTestId: updatedTestId } = await waitAndRerender(rerender, getByTestId);

    expect(updatedTestId('SearchScreen::AddingFilterMode').props.children).toEqual('true');

    expect(updatedTestId('SearchScreen::SearchBar::Clicked').props.children).toEqual('false');
    expect(() => updatedTestId('SearchScreen::FilterAccordion')).not.toThrow();

    // Assert all other components are still present
    expect(updatedTestId('SearchScreen::SearchBar')).toBeTruthy();
    expect(updatedTestId('SearchScreen::Divider')).toBeTruthy();
    expect(updatedTestId('SearchScreen::AddFilter')).toBeTruthy();
    expect(updatedTestId('SearchScreen::RemoveFilter')).toBeTruthy();

    // Test toggling addingFilterMode back to false
    fireEvent.press(updatedTestId('SearchScreen::ToggleAddingFilterMode'));
    expect(updatedTestId('SearchScreen::AddingFilterMode').props.children).toEqual('false');

    // Assert FilterAccordion is hidden again
    expect(() => updatedTestId('SearchScreen::FilterAccordion')).toThrow();

    // Assert component returns to initial visual state
    expect(updatedTestId('SearchScreen::Filters').props.children).toEqual('[]');
    expect(updatedTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('');
    expect(updatedTestId('SearchScreen::SearchBar::Clicked').props.children).toEqual('false');
  });

  test('Click on search bar shall update the React.useState', async () => {
    const { getByTestId: emptyGetByTestId, rerender } = await renderSearchComponent();

    assertInitialComponentState(emptyGetByTestId);

    const { getByTestId } = await waitAndRerender(rerender, emptyGetByTestId);

    // Test initial search bar state
    expect(getByTestId('SearchScreen::SearchBar::Clicked').props.children).toEqual('false');
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('');

    // Assert components are present before search bar interaction (SearchBarResults not visible when not clicked)
    expect(() => getByTestId('SearchScreen::SearchBarResults')).toThrow();
    expect(getByTestId('SearchScreen::Filters')).toBeTruthy();
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('false');
    expect(() => getByTestId('SearchScreen::FilterAccordion')).toThrow();

    // Test clicking search bar (toggle to clicked state)
    fireEvent.press(getByTestId('SearchScreen::SearchBar::ToggleClicked'));
    expect(getByTestId('SearchScreen::SearchBar::Clicked').props.children).toEqual('true');

    // Assert SearchBarResults remains present when search bar is clicked
    expect(getByTestId('SearchScreen::SearchBarResults')).toBeTruthy();
    expect(getByTestId('SearchScreen::SearchBarResults::FilteredTitles')).toBeTruthy();

    // Assert FiltersSelection components are HIDDEN when search bar is clicked (!searchBarClicked logic)
    expect(() => getByTestId('SearchScreen::Filters')).toThrow();
    expect(() => getByTestId('SearchScreen::Divider')).toThrow();
    expect(() => getByTestId('SearchScreen::AddFilter')).toThrow();
    expect(() => getByTestId('SearchScreen::RemoveFilter')).toThrow();
    expect(() => getByTestId('SearchScreen::AddingFilterMode')).toThrow();
    expect(() => getByTestId('SearchScreen::ToggleAddingFilterMode')).toThrow();

    // Assert search phrase remains unchanged
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('');

    // Test clicking search bar again (toggle back to not clicked)
    fireEvent.press(getByTestId('SearchScreen::SearchBar::ToggleClicked'));
    expect(getByTestId('SearchScreen::SearchBar::Clicked').props.children).toEqual('false');

    // Assert FiltersSelection components are now VISIBLE again (!searchBarClicked is true)
    expect(getByTestId('SearchScreen::Filters')).toBeTruthy();
    expect(getByTestId('SearchScreen::Divider')).toBeTruthy();
    expect(getByTestId('SearchScreen::AddFilter')).toBeTruthy();
    expect(getByTestId('SearchScreen::RemoveFilter')).toBeTruthy();
    expect(getByTestId('SearchScreen::AddingFilterMode')).toBeTruthy();
    expect(getByTestId('SearchScreen::ToggleAddingFilterMode')).toBeTruthy();

    // Assert component returns to initial state
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('');
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('false');
    expect(getByTestId('SearchScreen::Filters').props.children).toEqual('[]');

    // Assert FilterAccordion is still hidden (addingFilterMode is false)
    expect(() => getByTestId('SearchScreen::FilterAccordion')).toThrow();
  });

  test('Edit search phrase shall update the React.useState', async () => {
    const { getByTestId: emptyGetByTestId, rerender } = await renderSearchComponent();

    assertInitialComponentState(emptyGetByTestId);

    const { getByTestId } = await waitAndRerender(rerender, emptyGetByTestId);

    // Test initial search phrase state
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('');
    expect(getByTestId('SearchScreen::SearchBar::Clicked').props.children).toEqual('false');

    // Assert components are present before search phrase editing (SearchBarResults not visible initially)
    expect(() => getByTestId('SearchScreen::SearchBarResults')).toThrow();
    expect(getByTestId('SearchScreen::Filters')).toBeTruthy();
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('false');

    // Test progressive search phrase updates
    fireEvent.press(getByTestId('SearchScreen::SearchBar::UpdateSearchPhrase'));
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('S');

    // Assert components remain present during search (SearchBarResults still not visible during phrase editing)
    expect(() => getByTestId('SearchScreen::SearchBarResults')).toThrow();
    expect(getByTestId('SearchScreen::Filters')).toBeTruthy();
    expect(getByTestId('SearchScreen::Divider')).toBeTruthy();

    fireEvent.press(getByTestId('SearchScreen::SearchBar::UpdateSearchPhrase'));
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('Su');

    // Assert search phrase is being updated correctly
    // (Note: SearchBarResults is not visible unless searchBar is clicked)

    fireEvent.press(getByTestId('SearchScreen::SearchBar::UpdateSearchPhrase'));
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('Sus');

    // Assert filter functionality is still available
    expect(getByTestId('SearchScreen::AddFilter')).toBeTruthy();
    expect(getByTestId('SearchScreen::RemoveFilter')).toBeTruthy();
    expect(getByTestId('SearchScreen::ToggleAddingFilterMode')).toBeTruthy();

    fireEvent.press(getByTestId('SearchScreen::SearchBar::UpdateSearchPhrase'));
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('Sush');

    // Assert clicked state remains unchanged during phrase updates
    expect(getByTestId('SearchScreen::SearchBar::Clicked').props.children).toEqual('false');

    fireEvent.press(getByTestId('SearchScreen::SearchBar::UpdateSearchPhrase'));
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('Sushi');

    // Assert all core components are still present after full phrase entry
    expect(getByTestId('SearchScreen::SearchBar')).toBeTruthy();
    expect(getByTestId('SearchScreen::Filters')).toBeTruthy();
    expect(getByTestId('SearchScreen::AddingFilterMode').props.children).toEqual('false');

    // Assert FilterAccordion is still hidden (addingFilterMode is false)
    expect(() => getByTestId('SearchScreen::FilterAccordion')).toThrow();
  });

  test('FilterAccordion addFilter callback updates filtersState', async () => {
    const { getByTestId: emptyGetByTestId, rerender } = await renderSearchComponent();
    assertInitialComponentState(emptyGetByTestId);
    const { getByTestId } = await waitAndRerender(rerender, emptyGetByTestId);
    assertDatabasePopulatedState(getByTestId);

    fireEvent.press(getByTestId('SearchScreen::ToggleAddingFilterMode'));

    expect(getByTestId('SearchScreen::FilterAccordion::FiltersState').props.children).toEqual(
      '{"filterTypes.inSeason":["filterTypes.inSeason"]}'
    );

    fireEvent.press(getByTestId('SearchScreen::FilterAccordion::AddFilter'));

    expect(getByTestId('SearchScreen::FilterAccordion::FiltersState').props.children).toEqual(
      '{"filterTypes.inSeason":["filterTypes.inSeason"],"filterTypes.tags":["New filter"]}'
    );
  });

  test('SearchBarResults UpdateSearchString updates search phrase', async () => {
    const { getByTestId: emptyGetByTestId, rerender } = await renderSearchComponent();
    assertInitialComponentState(emptyGetByTestId);
    const { getByTestId } = await waitAndRerender(rerender, emptyGetByTestId);

    fireEvent.press(getByTestId('SearchScreen::SearchBar::ToggleClicked'));
    expect(getByTestId('SearchScreen::SearchBarResults')).toBeTruthy();

    fireEvent.press(getByTestId('SearchScreen::SearchBarResults::UpdateSearchString'));

    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual(
      'New string'
    );
  });

  test('removeAFilterToTheState with recipeTitleInclude clears searchPhrase', async () => {
    const { getByTestId: emptyGetByTestId, rerender } = await renderSearchComponent();
    assertInitialComponentState(emptyGetByTestId);
    const { getByTestId } = await waitAndRerender(rerender, emptyGetByTestId);

    fireEvent.press(getByTestId('SearchScreen::SearchBar::UpdateSearchPhrase'));
    expect(getByTestId('SearchScreen::SearchBar::SearchPhrase').props.children).toEqual('S');

    fireEvent.press(getByTestId('SearchScreen::ToggleAddingFilterMode'));

    expect(getByTestId('SearchScreen::FilterAccordion::FiltersState').props.children).toContain(
      '"filterTypes.recipeTitleInclude":["S"]'
    );

    fireEvent.press(getByTestId('SearchScreen::FilterAccordion::RemoveFilterByTitle'));

    expect(getByTestId('SearchScreen::FilterAccordion::FiltersState').props.children).not.toContain(
      '"filterTypes.recipeTitleInclude"'
    );
  });

  test('Season filter toggle covers all useEffect branches', async () => {
    const componentWithToggler = (
      <SeasonFilterProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name={'Search'} component={Search} />
          </Stack.Navigator>
        </NavigationContainer>
        <SeasonFilterToggler />
      </SeasonFilterProvider>
    );

    const { getByTestId, rerender } = render(componentWithToggler);
    await waitFor(() => expect(getByTestId('SearchScreen')).toBeTruthy());

    await new Promise(resolve => setTimeout(resolve, 100));
    rerender(componentWithToggler);
    await waitFor(() => expect(getByTestId('SearchScreen')).toBeTruthy());

    fireEvent.press(getByTestId('SearchScreen::ToggleAddingFilterMode'));

    await waitFor(() => {
      expect(getByTestId('SearchScreen::FilterAccordion::FiltersState').props.children).toEqual(
        '{"filterTypes.inSeason":["filterTypes.inSeason"]}'
      );
    });

    fireEvent.press(getByTestId('ToggleSeasonFilter'));
    await waitFor(() => {
      expect(getByTestId('SearchScreen::FilterAccordion::FiltersState').props.children).toEqual(
        '{}'
      );
    });

    fireEvent.press(getByTestId('SearchScreen::FilterAccordion::AddFilter'));
    await waitFor(() => {
      expect(getByTestId('SearchScreen::FilterAccordion::FiltersState').props.children).toEqual(
        '{"filterTypes.tags":["New filter"]}'
      );
    });

    fireEvent.press(getByTestId('ToggleSeasonFilter'));
    await waitFor(() => {
      expect(getByTestId('SearchScreen::FilterAccordion::FiltersState').props.children).toEqual(
        '{"filterTypes.tags":["New filter"]}'
      );
    });
  });
});

describe('Search Screen - empty state', () => {
  const database: RecipeDatabase = RecipeDatabase.getInstance();

  const emptyStateComponent = (
    <SeasonFilterProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name={'Search'} component={Search} />
        </Stack.Navigator>
      </NavigationContainer>
    </SeasonFilterProvider>
  );

  beforeEach(async () => {
    resetFiltersSelection();
    await database.init();
    await database.addMultipleIngredients(testIngredients);
    await database.addMultipleTags(testTags);
  });

  afterEach(async () => {
    await database.closeAndReset();
  });

  test('shows TextWhenEmpty when no recipes exist', async () => {
    const { getByTestId, rerender } = render(emptyStateComponent);
    await waitFor(() => expect(getByTestId('SearchScreen')).toBeTruthy());

    await new Promise(resolve => setTimeout(resolve, 100));
    rerender(emptyStateComponent);
    await waitFor(() => expect(getByTestId('SearchScreen')).toBeTruthy());

    expect(getByTestId('SearchScreen::TextWhenEmpty')).toBeTruthy();
    expect(() => getByTestId('SearchScreen::RecipeCards::1')).toThrow();
  });
});
