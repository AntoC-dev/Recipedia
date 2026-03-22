import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import {
  SeasonalityCalendar,
  SeasonalityCalendarProps,
} from '@components/molecules/SeasonalityCalendar';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

const mockOnMonthsChange = jest.fn();
const testIDProp = 'SeasonalityCalendar';
const calendarTestId = testIDProp + '::SeasonalityCalendar';

const selectedMonthProp = ['1', '4'];
const allYearProp = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

describe('SeasonalityCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('read-only mode', () => {
    const readOnlyProps: SeasonalityCalendarProps = {
      readOnly: true,
      selectedMonths: selectedMonthProp,
      testID: testIDProp,
      onMonthsChange: mockOnMonthsChange,
    };

    test('renders seasonality title', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...readOnlyProps} />);

      expect(getByTestId(calendarTestId + '::SeasonalityText').props.children).toEqual([
        'seasonality',
        ':',
      ]);
    });

    test('renders chips for selected months only', () => {
      const { getByTestId, queryByTestId } = render(<SeasonalityCalendar {...readOnlyProps} />);

      for (const month of selectedMonthProp) {
        expect(getByTestId(calendarTestId + '::' + month)).toBeTruthy();
        expect(getByTestId(calendarTestId + '::' + month + '::Children').props.children).toBe(
          'month_' + month
        );
      }

      expect(queryByTestId(calendarTestId + '::2')).toBeNull();
      expect(queryByTestId(calendarTestId + '::AllYear')).toBeNull();
    });

    test('renders all year label when all months selected', () => {
      const { getByTestId, queryByTestId } = render(
        <SeasonalityCalendar {...readOnlyProps} selectedMonths={allYearProp} />
      );

      expect(getByTestId(calendarTestId + '::AllYear').props.children).toBe('all_year');
      expect(queryByTestId(calendarTestId + '::1')).toBeNull();
    });

    test('renders nothing for empty selectedMonths', () => {
      const { queryByTestId } = render(
        <SeasonalityCalendar {...readOnlyProps} selectedMonths={[]} />
      );

      expect(queryByTestId(calendarTestId + '::AllYear')).toBeNull();
      expect(queryByTestId(calendarTestId + '::1')).toBeNull();
    });

    test('pressing a chip does not call onMonthsChange', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...readOnlyProps} />);

      fireEvent.press(getByTestId(calendarTestId + '::' + selectedMonthProp[0]));

      expect(mockOnMonthsChange).not.toHaveBeenCalled();
    });

    test('renders single selected month', () => {
      const { getByTestId, queryByTestId } = render(
        <SeasonalityCalendar {...readOnlyProps} selectedMonths={['7']} />
      );

      expect(getByTestId(calendarTestId + '::7::Children').props.children).toBe('month_7');
      expect(queryByTestId(calendarTestId + '::1')).toBeNull();
      expect(queryByTestId(calendarTestId + '::AllYear')).toBeNull();
    });

    test('does not render ToggleAllButton in read-only mode', () => {
      const { queryByTestId } = render(<SeasonalityCalendar {...readOnlyProps} />);

      expect(queryByTestId(calendarTestId + '::ToggleAllButton')).toBeNull();
    });
  });

  describe('edit mode', () => {
    const editProps: SeasonalityCalendarProps = {
      readOnly: false,
      selectedMonths: selectedMonthProp,
      testID: testIDProp,
      onMonthsChange: mockOnMonthsChange,
    };

    test('renders SelectableAccordion with seasonality title', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...editProps} />);

      expect(getByTestId(calendarTestId + '::Title').props.children).toBe('seasonality');
    });

    test('renders all 12 month items', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...editProps} />);

      for (let m = 1; m <= 12; m++) {
        expect(getByTestId(calendarTestId + '::' + m)).toBeTruthy();
      }
    });

    test('renders month labels', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...editProps} />);

      for (let m = 1; m <= 12; m++) {
        expect(getByTestId(calendarTestId + '::' + m + '::Children').props.children).toBe(
          'month_' + m
        );
      }
    });

    test('pressing selected month removes it', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...editProps} />);

      fireEvent.press(getByTestId(calendarTestId + '::4'));

      expect(mockOnMonthsChange).toHaveBeenCalledWith(['1']);
    });

    test('pressing unselected month adds it', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...editProps} />);

      fireEvent.press(getByTestId(calendarTestId + '::6'));

      expect(mockOnMonthsChange).toHaveBeenCalledWith(['1', '4', '6']);
    });

    test('pressing month does not crash when onMonthsChange is undefined', () => {
      const { getByTestId } = render(
        <SeasonalityCalendar testID={testIDProp} selectedMonths={selectedMonthProp} />
      );

      fireEvent.press(getByTestId(calendarTestId + '::1'));

      expect(mockOnMonthsChange).not.toHaveBeenCalled();
    });

    test('defaults to edit mode when readOnly is omitted', () => {
      const { getByTestId } = render(
        <SeasonalityCalendar
          testID={testIDProp}
          selectedMonths={selectedMonthProp}
          onMonthsChange={mockOnMonthsChange}
        />
      );

      expect(getByTestId(calendarTestId + '::Title').props.children).toBe('seasonality');
    });

    test('description shows selected months', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...editProps} />);

      expect(getByTestId(calendarTestId + '::Description').props.children).toBe('month_1, month_4');
    });

    test('description shows all_year when all months selected', () => {
      const { getByTestId } = render(
        <SeasonalityCalendar {...editProps} selectedMonths={allYearProp} />
      );

      expect(getByTestId(calendarTestId + '::Description').props.children).toBe('all_year');
    });

    test('shows empty description when no months selected', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...editProps} selectedMonths={[]} />);

      expect(getByTestId(calendarTestId + '::Description').props.children).toBe('');
    });

    test('renders ToggleAllButton when onMonthsChange is provided', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...editProps} />);

      expect(getByTestId(calendarTestId + '::ToggleAllButton')).toBeTruthy();
    });

    test('does not render ToggleAllButton when onMonthsChange is undefined', () => {
      const { queryByTestId } = render(
        <SeasonalityCalendar testID={testIDProp} selectedMonths={selectedMonthProp} />
      );

      expect(queryByTestId(calendarTestId + '::ToggleAllButton')).toBeNull();
    });

    test('pressing ToggleAllButton with no months selected calls onMonthsChange with all 12 months', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...editProps} selectedMonths={[]} />);

      fireEvent.press(getByTestId(calendarTestId + '::ToggleAllButton'));

      expect(mockOnMonthsChange).toHaveBeenCalledWith([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
      ]);
    });

    test('pressing ToggleAllButton with all months selected calls onMonthsChange with empty array', () => {
      const { getByTestId } = render(
        <SeasonalityCalendar {...editProps} selectedMonths={allYearProp} />
      );

      fireEvent.press(getByTestId(calendarTestId + '::ToggleAllButton'));

      expect(mockOnMonthsChange).toHaveBeenCalledWith([]);
    });

    test('pressing ToggleAllButton with some months selected calls onMonthsChange with all 12 months', () => {
      const { getByTestId } = render(<SeasonalityCalendar {...editProps} />);

      fireEvent.press(getByTestId(calendarTestId + '::ToggleAllButton'));

      expect(mockOnMonthsChange).toHaveBeenCalledWith([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
      ]);
    });
  });
});
