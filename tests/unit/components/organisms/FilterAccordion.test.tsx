import { fireEvent, render } from '@testing-library/react-native';
import { FilterAccordion, FilterAccordionProps } from '@components/organisms/FilterAccordion';
import React from 'react';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { listFilter, nonIngredientFilters, TListFilter } from '@customTypes/RecipeFiltersTypes';
import { selectFilterCategoriesValuesToDisplay } from '@utils/FilterFunctions';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const { t } = jest.requireMock('@utils/i18n').useI18n();

describe('FilterAccordion Component', () => {
  const defaultTestId = 'test-filter-accordion';
  const sampleTags = testTags.slice(0, 5).map(tag => tag.name);
  const sampleIngredients: ingredientTableElement[] = testIngredients.slice(0, 8);
  const emptyFiltersState = new Map<TListFilter, string[]>();

  const sampleFilteredIngredients = selectFilterCategoriesValuesToDisplay(
    (Object.values(listFilter) as TListFilter[]).sort((a, b) => a.localeCompare(b)),
    sampleTags,
    sampleIngredients
  ).filter(section => section.data.length > 0);

  const mockAddFilter = jest.fn();
  const mockRemoveFilter = jest.fn();

  const renderFilterAccordion = (overrideProps = {}) => {
    const defaultProps: FilterAccordionProps = {
      testId: defaultTestId,
      tagsList: sampleTags,
      ingredientsList: sampleIngredients,
      filtersState: emptyFiltersState,
      addFilter: mockAddFilter,
      removeFilter: mockRemoveFilter,
      ...overrideProps,
    };

    return render(<FilterAccordion {...defaultProps} />);
  };

  const assertAccordionStructure = (
    getByTestId: any,
    expected = sampleFilteredIngredients,
    testId: string = defaultTestId
  ) => {
    for (let i = 0; i < expected.length; ++i) {
      const accordionTestId = `${testId}::FilterAccordion::Accordion::${i}`;
      expect(getByTestId(`${accordionTestId}::Title`).props.children).toEqual(expected[i].title);
      for (let j = 0; j < expected[i].data.length; ++j) {
        const itemTestId = `${accordionTestId}::Item::${j}`;
        const filterType = expected[i].title;
        const shouldTranslate =
          filterType === nonIngredientFilters.prepTime ||
          filterType === nonIngredientFilters.inSeason;
        const expectedText = shouldTranslate ? t(expected[i].data[j]) : expected[i].data[j];
        expect(getByTestId(itemTestId + '::Title').props.children).toEqual(expectedText);
        expect(getByTestId(itemTestId + '::CheckBox::Status').props.children).toEqual('unchecked');
      }
    }
  };

  const createFiltersStateWithItems = (filterType: TListFilter, selectedItems: string[]) => {
    const filtersState = new Map<TListFilter, string[]>();
    filtersState.set(filterType, selectedItems);
    return filtersState;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders accordion sections with correct data and collapsed state', () => {
    const { getByTestId } = renderFilterAccordion();

    assertAccordionStructure(getByTestId);
  });

  test('handles filter selection and updates checkbox states correctly', () => {
    const { getByTestId } = renderFilterAccordion();

    assertAccordionStructure(getByTestId);

    const checkbox = defaultTestId + '::FilterAccordion::Accordion::0::Item::0::CheckBox';

    fireEvent.press(getByTestId(checkbox));

    expect(mockAddFilter).toHaveBeenCalledTimes(1);
    expect(mockRemoveFilter).not.toHaveBeenCalled();
  });

  test('handles filter deselection when filter is already selected', () => {
    const filtersWithSelection = createFiltersStateWithItems(nonIngredientFilters.tags, [
      sampleTags[0],
    ]);

    const { getByTestId } = renderFilterAccordion({ filtersState: filtersWithSelection });
    const item = defaultTestId + '::FilterAccordion::Accordion::2::Item::0';
    expect(getByTestId(item + '::CheckBox::Status').props.children).toEqual('checked');

    fireEvent.press(getByTestId(item));

    expect(mockRemoveFilter).toHaveBeenCalledTimes(1);
    expect(mockAddFilter).not.toHaveBeenCalled();
  });

  test('displays multiple selected filters correctly across different sections', () => {
    const selectedTags = [sampleTags[0], sampleTags[1]];
    const complexFiltersState = new Map<TListFilter, string[]>();
    complexFiltersState.set(nonIngredientFilters.tags, selectedTags);
    complexFiltersState.set(nonIngredientFilters.recipeTitleInclude, ['Spaghetti']);

    const { getByTestId } = renderFilterAccordion({ filtersState: complexFiltersState });
    expect(
      getByTestId(`${defaultTestId}::FilterAccordion::Accordion::2::Item::0::CheckBox::Status`)
        .props.children
    ).toEqual('checked');
    expect(
      getByTestId(`${defaultTestId}::FilterAccordion::Accordion::2::Item::1::CheckBox::Status`)
        .props.children
    ).toEqual('checked');
  });

  test('handles empty data gracefully', () => {
    const { queryByTestId } = renderFilterAccordion({
      tagsList: [],
      ingredientsList: [],
    });

    assertAccordionStructure(queryByTestId, []);
  });

  test('uses different testId correctly for multiple instances', () => {
    const customTestId = 'custom-filter-accordion';
    const { getByTestId } = renderFilterAccordion({ testId: customTestId });

    assertAccordionStructure(getByTestId, sampleFilteredIngredients, customTestId);
  });

  test('handles rapid successive interactions without errors', () => {
    const { getByTestId } = renderFilterAccordion();

    const itemTestId = `${defaultTestId}::FilterAccordion::Accordion::0::Item::0`;

    fireEvent.press(getByTestId(itemTestId));
    fireEvent.press(getByTestId(itemTestId));
    fireEvent.press(getByTestId(itemTestId));

    expect(mockAddFilter).toHaveBeenCalledTimes(3);
    expect(mockRemoveFilter).toHaveBeenCalledTimes(0);
  });
});
