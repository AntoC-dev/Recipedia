import { fireEvent, render, waitFor } from '@testing-library/react-native';
import Parameters from '@screens/Parameters';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { getMockCopilotEvents, resetMockCopilot } from '@mocks/deps/react-native-copilot-mock';
import { TUTORIAL_STEPS } from '@utils/Constants';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());
jest.mock('@context/DarkModeContext', () => require('@mocks/context/DarkModeContext-mock'));
jest.mock('@context/SeasonFilterContext', () => require('@mocks/context/SeasonFilterContext-mock'));
jest.mock('@context/DefaultPersonsContext', () =>
  require('@mocks/context/DefaultPersonsContext-mock')
);
jest.mock('@react-navigation/native', () =>
  require('@mocks/deps/react-navigation-mock').reactNavigationMock()
);

const { mockToggleDarkMode } = require('@mocks/context/DarkModeContext-mock');
const { mockSetSeasonFilter } = require('@mocks/context/SeasonFilterContext-mock');
const { mockNavigate } = require('@mocks/deps/react-navigation-mock');

jest.mock('expo-constants', () => require('@mocks/deps/expo-constants-mock').expoConstantsMock());

jest.mock('@hooks/useSafeCopilot', () =>
  require('@mocks/hooks/useSafeCopilot-mock').useSafeCopilotMock()
);

const { mockUseSafeCopilot } = require('@mocks/hooks/useSafeCopilot-mock');

const Stack = createStackNavigator();

describe('Parameters Screen', () => {
  const renderParameters = () => {
    return render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name='Parameters' component={Parameters} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  const assertParameters = (
    getByTestId: any,
    getAllByTestId: any,
    expectedPersonsCount: string = '4 persons'
  ) => {
    const sections = getAllByTestId('list-section');
    expect(sections.length).toBeGreaterThanOrEqual(3);

    const sectionTitles = getAllByTestId('list-section-title');
    expect(sectionTitles.length).toBeGreaterThanOrEqual(3);

    expect(getByTestId('Parameters::Section::RecipeDefaults::Divider')).toBeTruthy();
    expect(getByTestId('Parameters::Section::Data::Divider')).toBeTruthy();

    expect(
      getByTestId('Parameters::Section::Appearance::DarkMode::Item::Title').props.children
    ).toBe('dark_mode');
    expect(
      getByTestId('Parameters::Section::Appearance::DarkMode::Switch::Value').props.children
    ).toBe('OFF');
    expect(
      getByTestId('Parameters::Section::Appearance::Language::Item::Title').props.children
    ).toBe('language');
    expect(
      getByTestId('Parameters::Section::Appearance::Language::Item::Description').props.children
    ).toBe('locale name');

    expect(
      getByTestId('Parameters::Section::RecipeDefaults::Persons::Item::Title').props.children
    ).toBe('default_persons');
    expect(
      getByTestId('Parameters::Section::RecipeDefaults::Persons::Item::Description').props.children
    ).toBe(expectedPersonsCount);
    expect(
      getByTestId('Parameters::Section::RecipeDefaults::Season::Item::Title').props.children
    ).toBe('default_season_filter');
    expect(
      getByTestId('Parameters::Section::RecipeDefaults::Season::Switch::Value').props.children
    ).toBe('ON');

    expect(getByTestId('Parameters::Section::About::Version::Item::Title').props.children).toBe(
      'version'
    );
    const appInfoDescription = getByTestId('Parameters::Section::About::Version::Item::Description')
      .props.children;
    expect(appInfoDescription).toBe('1.0.0');

    const icons = getAllByTestId('list-icon');
    expect(icons.length).toBeGreaterThanOrEqual(6);
    const iconTexts = icons.map((icon: any) => icon.props.children);
    const expectedIcons = [
      'theme-light-dark',
      'translate',
      'chevron-right',
      'account-group',
      'calendar',
      'food-apple',
      'tag-multiple',
      'information',
    ];
    expectedIcons.forEach(icon => expect(iconTexts).toContain(icon));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all parameter sections with correct structure', async () => {
    const { getByTestId, getAllByTestId } = renderParameters();

    await waitFor(() => {
      assertParameters(getByTestId, getAllByTestId);
    });
  });

  test('handles dark mode toggle correctly', async () => {
    const { getByTestId } = renderParameters();

    await waitFor(() => {
      expect(
        getByTestId('Parameters::Section::Appearance::DarkMode::Switch::Value').props.children
      ).toBe('OFF');
    });

    expect(mockToggleDarkMode).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('Parameters::Section::Appearance::DarkMode::Switch'));

    expect(mockToggleDarkMode).toHaveBeenCalledTimes(1);
  });

  test('handles season filter toggle correctly', async () => {
    const { getByTestId } = renderParameters();

    await waitFor(() => {
      expect(
        getByTestId('Parameters::Section::RecipeDefaults::Season::Switch::Value').props.children
      ).toBe('ON');
    });

    expect(mockSetSeasonFilter).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('Parameters::Section::RecipeDefaults::Season::Switch'));

    expect(mockSetSeasonFilter).toHaveBeenCalledTimes(1);
    expect(mockSetSeasonFilter).toHaveBeenCalledWith(false);
  });

  test('navigates to language settings when language item is pressed', async () => {
    const { getByTestId } = renderParameters();

    await waitFor(() => {
      expect(
        getByTestId('Parameters::Section::Appearance::Language::Item::Title').props.children
      ).toBe('language');
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('Parameters::Section::Appearance::Language::Item'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('LanguageSettings');
  });

  test('navigates to default persons settings when pressed', async () => {
    const { getByTestId } = renderParameters();

    await waitFor(() => {
      expect(
        getByTestId('Parameters::Section::RecipeDefaults::Persons::Item::Title').props.children
      ).toBe('default_persons');
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('Parameters::Section::RecipeDefaults::Persons::Item'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('DefaultPersonsSettings');
  });

  test('navigates to ingredients management when pressed', async () => {
    const { getByTestId } = renderParameters();

    await waitFor(() => {
      expect(
        getByTestId('Parameters::Section::Data::Ingredients::Item::Title').props.children
      ).toBe('ingredients');
    });

    fireEvent.press(getByTestId('Parameters::Section::Data::Ingredients::Item'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('IngredientsSettings');
  });

  test('navigates to tags management when pressed', async () => {
    const { getByTestId } = renderParameters();

    await waitFor(() => {
      expect(getByTestId('Parameters::Section::Data::Tags::Item::Title').props.children).toBe(
        'filters.tags'
      );
    });

    fireEvent.press(getByTestId('Parameters::Section::Data::Tags::Item'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('TagsSettings');
  });

  test('navigates to bulk import provider selection when pressed', async () => {
    const { getByTestId } = renderParameters();

    await waitFor(() => {
      expect(getByTestId('Parameters::Section::Import::FromWebsite::Item')).toBeTruthy();
    });

    fireEvent.press(getByTestId('Parameters::Section::Import::FromWebsite::Item'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('BulkImportSettings');
  });

  test('navigates to dismissed recipes management when pressed', async () => {
    const { getByTestId } = renderParameters();

    await waitFor(() => {
      expect(getByTestId('Parameters::Section::Import::DismissedRecipes::Item')).toBeTruthy();
    });

    fireEvent.press(getByTestId('Parameters::Section::Import::DismissedRecipes::Item'));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('DismissedRecipesSettings');
  });

  test('displays default persons from context', async () => {
    const { getByTestId } = renderParameters();

    await waitFor(() => {
      expect(
        getByTestId('Parameters::Section::RecipeDefaults::Persons::Item::Description').props
          .children
      ).toBe('4 persons');
    });
  });

  test('maintains switch states correctly across interactions', async () => {
    const { getByTestId, getAllByTestId } = renderParameters();

    await waitFor(() => {
      assertParameters(getByTestId, getAllByTestId);
    });

    fireEvent.press(getByTestId('Parameters::Section::Appearance::DarkMode::Switch'));
    fireEvent.press(getByTestId('Parameters::Section::RecipeDefaults::Season::Switch'));
    fireEvent.press(getByTestId('Parameters::Section::Appearance::DarkMode::Switch'));

    expect(mockToggleDarkMode).toHaveBeenCalledTimes(2);
    expect(mockSetSeasonFilter).toHaveBeenCalledTimes(1);
    expect(mockSetSeasonFilter).toHaveBeenCalledWith(false);
  });

  test('handles rapid successive navigation correctly', async () => {
    const { getByTestId, getAllByTestId } = renderParameters();

    await waitFor(() => {
      assertParameters(getByTestId, getAllByTestId);
    });

    fireEvent.press(getByTestId('Parameters::Section::Appearance::Language::Item'));
    fireEvent.press(getByTestId('Parameters::Section::RecipeDefaults::Persons::Item'));
    fireEvent.press(getByTestId('Parameters::Section::Data::Ingredients::Item'));

    expect(mockNavigate).toHaveBeenCalledTimes(3);
    expect(mockNavigate).toHaveBeenNthCalledWith(1, 'LanguageSettings');
    expect(mockNavigate).toHaveBeenNthCalledWith(2, 'DefaultPersonsSettings');
    expect(mockNavigate).toHaveBeenNthCalledWith(3, 'IngredientsSettings');
  });

  test('maintains accessibility and structure during interactions', async () => {
    const { getByTestId, getAllByTestId } = renderParameters();

    await waitFor(() => {
      assertParameters(getByTestId, getAllByTestId);
    });

    fireEvent.press(getByTestId('Parameters::Section::Appearance::DarkMode::Switch'));
    fireEvent.press(getByTestId('Parameters::Section::RecipeDefaults::Season::Switch'));

    assertParameters(getByTestId, getAllByTestId);

    fireEvent.press(getByTestId('Parameters::Section::Appearance::Language::Item'));
  });

  test('integrates with all required contexts and utilities', async () => {
    const { getByTestId, getAllByTestId } = renderParameters();

    await waitFor(() => {
      assertParameters(getByTestId, getAllByTestId);
    });

    fireEvent.press(getByTestId('Parameters::Section::Appearance::DarkMode::Switch'));
    fireEvent.press(getByTestId('Parameters::Section::RecipeDefaults::Season::Switch'));
    fireEvent.press(getByTestId('Parameters::Section::Appearance::Language::Item'));

    expect(mockToggleDarkMode).toHaveBeenCalled();
    expect(mockSetSeasonFilter).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
  });

  describe('In Tutorial Mode', () => {
    const mockEvents = getMockCopilotEvents();

    beforeEach(() => {
      jest.clearAllMocks();
      resetMockCopilot();
      mockUseSafeCopilot.mockReturnValue(null);
    });

    test('renders with tutorial wrapper when copilot is available', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: mockEvents,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
        isActive: true,
      });

      const { getByTestId } = renderParameters();

      await waitFor(() => {
        expect(getByTestId('CopilotStep::Parameters')).toBeTruthy();
        expect(getByTestId('Parameters::Tutorial')).toBeTruthy();
      });

      expect(getByTestId('Parameters::Section::RecipeDefaults::Persons::Item')).toBeTruthy();
      expect(getByTestId('Parameters::Section::RecipeDefaults::Season::Item')).toBeTruthy();
    });

    test('renders without tutorial wrapper when copilot is not available', async () => {
      const { queryByTestId, getByTestId } = renderParameters();

      await waitFor(() => {
        expect(queryByTestId('CopilotStep::Parameters')).toBeNull();
        expect(queryByTestId('Parameters::Tutorial')).toBeNull();
      });

      expect(getByTestId('Parameters::Section::RecipeDefaults::Persons::Item')).toBeTruthy();
      expect(getByTestId('Parameters::Section::RecipeDefaults::Season::Item')).toBeTruthy();
    });

    test('handles tutorial integration correctly', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: mockEvents,
        currentStep: {
          order: TUTORIAL_STEPS.Parameters.order,
          name: 'Parameters',
          text: 'Parameters step',
        },
        isActive: true,
      });

      const { getByTestId } = renderParameters();

      await waitFor(() => {
        expect(getByTestId('CopilotStep::Parameters')).toBeTruthy();
        expect(getByTestId('Parameters::Tutorial')).toBeTruthy();
      });

      expect(
        getByTestId('Parameters::Section::RecipeDefaults::Persons::Item::Title').props.children
      ).toBe('default_persons');
      expect(
        getByTestId('Parameters::Section::RecipeDefaults::Season::Item::Title').props.children
      ).toBe('default_season_filter');
    });

    test('renders tutorial content with proper structure', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: mockEvents,
        currentStep: {
          order: TUTORIAL_STEPS.Parameters.order,
          name: 'Parameters',
          text: 'Parameters step',
        },
        isActive: true,
      });

      const { getByTestId } = renderParameters();

      await waitFor(() => {
        expect(getByTestId('CopilotStep::Parameters')).toBeTruthy();
        expect(getByTestId('Parameters::Tutorial')).toBeTruthy();
      });

      expect(getByTestId('Parameters::Section::RecipeDefaults::SubHeader')).toBeTruthy();
      expect(getByTestId('Parameters::Section::RecipeDefaults::Divider')).toBeTruthy();
      expect(getByTestId('Parameters::Section::RecipeDefaults::Persons::Item')).toBeTruthy();
      expect(getByTestId('Parameters::Section::RecipeDefaults::Season::Item')).toBeTruthy();
      expect(getByTestId('Parameters::Section::RecipeDefaults::Season::Switch')).toBeTruthy();
    });

    test('does not set up listeners when copilot events unavailable', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: null,
        currentStep: { order: 1, name: 'Home', text: 'Home step' },
        isActive: true,
      });

      renderParameters();

      expect(mockEvents.on).not.toHaveBeenCalled();
    });

    test('tutorial wrapper contains recipe defaults section', async () => {
      mockUseSafeCopilot.mockReturnValue({
        copilotEvents: mockEvents,
        currentStep: {
          order: TUTORIAL_STEPS.Parameters.order,
          name: 'Parameters',
          text: 'Parameters step',
        },
        isActive: true,
      });

      const { getByTestId } = renderParameters();

      await waitFor(() => {
        expect(getByTestId('Parameters::Tutorial')).toBeTruthy();
      });

      const tutorialWrapper = getByTestId('Parameters::Tutorial');
      expect(tutorialWrapper).toBeTruthy();

      expect(getByTestId('Parameters::Section::RecipeDefaults::Persons::Item')).toBeTruthy();
      expect(getByTestId('Parameters::Section::RecipeDefaults::Season::Item')).toBeTruthy();
    });
  });
});
