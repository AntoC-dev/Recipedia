import React, { act } from 'react';
import { Keyboard } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import TextInputWithDropDown, {
  TextInputWithDropDownType,
} from '@components/molecules/TextInputWithDropDown';
import RecipeDatabase from '@utils/RecipeDatabase';
import { testIngredients } from '@test-data/ingredientsDataset';
import { testTags } from '@test-data/tagsDataset';
import { testRecipes } from '@test-data/recipesDataset';

const keyboardListeners: { [key: string]: (() => void)[] } = {};
const mockRemove = jest.fn();
let keyboardAddListenerSpy: jest.SpyInstance;

const MockNativeMethods = require('react-native/jest/MockNativeMethods');
MockNativeMethods.measureInWindow.mockImplementation(
  (cb: (x: number, y: number, width: number, height: number) => void) => {
    cb(10, 20, 300, 50);
  }
);

jest.mock('@components/atomic/CustomTextInput', () => ({
  CustomTextInput: require('@mocks/components/atomic/CustomTextInput-mock').customTextInputMock,
}));

describe('TextInputWithDropDown Component', () => {
  const mockOnValidate = jest.fn();
  const dbInstance = RecipeDatabase.getInstance();

  const defaultProps: TextInputWithDropDownType = {
    testID: 'TextInputWithDropDown',
    referenceTextArray: [],
    label: 'Ingredient',
    onValidate: mockOnValidate,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    Object.keys(keyboardListeners).forEach(key => delete keyboardListeners[key]);

    keyboardAddListenerSpy = jest
      .spyOn(Keyboard, 'addListener')
      .mockImplementation((event, callback) => {
        if (!keyboardListeners[event]) {
          keyboardListeners[event] = [];
        }
        keyboardListeners[event].push(callback as () => void);
        return { remove: mockRemove } as any;
      });

    await dbInstance.init();
    await dbInstance.addMultipleIngredients(testIngredients);
    await dbInstance.addMultipleTags(testTags);
    await dbInstance.addMultipleRecipes(testRecipes);
    defaultProps.referenceTextArray = dbInstance
      .get_ingredients()
      .map(ingredient => ingredient.name)
      .sort();
  });

  afterEach(async () => {
    keyboardAddListenerSpy?.mockRestore();
    jest.clearAllMocks();
    jest.useRealTimers();
    await dbInstance.closeAndReset();
  });

  describe('rendering', () => {
    test('renders input without dropdown when not focused', () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      expect(getByTestId('TextInputWithDropDown::CustomTextInput')).toBeTruthy();
      expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull();
    });

    test('renders with initial value from props', () => {
      const { getByTestId } = render(
        <TextInputWithDropDown {...defaultProps} value='Initial Value' />
      );

      expect(getByTestId('TextInputWithDropDown::CustomTextInput').props.value).toEqual(
        'Initial Value'
      );
    });
  });

  describe('dropdown visibility', () => {
    test('shows dropdown when typing matching text', async () => {
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'past');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );
    });

    test('shows dropdown on focus when text has matches', async () => {
      const { getByTestId, queryByTestId } = render(
        <TextInputWithDropDown {...defaultProps} value='Sal' />
      );

      expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull();

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent(input, 'focus');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Salmon')).toBeTruthy()
      );
    });

    test('hides dropdown when no matching items', async () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'nonexistentitem');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::CustomTextInput').props.value).toEqual(
          'nonexistentitem'
        )
      );
      expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull();
    });

    test('hides dropdown when text matches exactly one item', async () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'Pasta');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::CustomTextInput').props.value).toEqual('Pasta')
      );
      expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull();
    });

    test('hides dropdown when hideDropdown prop is true', async () => {
      const { getByTestId, queryByTestId, rerender } = render(
        <TextInputWithDropDown {...defaultProps} />
      );

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'past');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );

      rerender(<TextInputWithDropDown {...defaultProps} hideDropdown={true} />);

      await waitFor(() =>
        expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull()
      );
    });
  });

  describe('item selection', () => {
    test('selects item and calls onValidate when pressing dropdown item', async () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'past');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );

      await act(async () => {
        fireEvent.press(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta'));
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::CustomTextInput').props.value).toEqual('Pasta')
      );
      expect(mockOnValidate).toHaveBeenCalledWith('Pasta');
      expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull();
    });

    test('calls onValidate on end editing', async () => {
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'custom text');
      });

      await act(async () => {
        fireEvent(input, 'endEditing');
      });

      expect(mockOnValidate).toHaveBeenCalledWith('custom text');
    });
  });

  describe('external value changes', () => {
    test('syncs internal state when value prop changes externally', async () => {
      const { getByTestId, rerender } = render(
        <TextInputWithDropDown {...defaultProps} value='Initial' />
      );

      expect(getByTestId('TextInputWithDropDown::CustomTextInput').props.value).toEqual('Initial');

      rerender(<TextInputWithDropDown {...defaultProps} value='Updated Value' />);

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::CustomTextInput').props.value).toEqual(
          'Updated Value'
        )
      );
    });

    test('handles value changing to undefined', async () => {
      const { getByTestId, rerender } = render(
        <TextInputWithDropDown {...defaultProps} value='Initial' />
      );

      rerender(<TextInputWithDropDown {...defaultProps} value={undefined} />);

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::CustomTextInput').props.value).toEqual('')
      );
    });
  });

  describe('keyboard events', () => {
    test('remeasures position on keyboardDidShow', async () => {
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'past');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );

      await act(async () => {
        const showCallbacks = keyboardListeners['keyboardDidShow'] || [];
        showCallbacks.forEach(callback => callback());
        jest.advanceTimersByTime(150);
      });

      expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy();
    });

    test('remeasures position on keyboardDidHide', async () => {
      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'past');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );

      await act(async () => {
        const hideCallbacks = keyboardListeners['keyboardDidHide'] || [];
        hideCallbacks.forEach(callback => callback());
        jest.advanceTimersByTime(150);
      });

      expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy();
    });
  });

  describe('hideDropdown prop transitions', () => {
    test('remeasures position when hideDropdown changes from true to false', async () => {
      const { getByTestId, queryByTestId, rerender } = render(
        <TextInputWithDropDown {...defaultProps} />
      );

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'past');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );

      rerender(<TextInputWithDropDown {...defaultProps} hideDropdown={true} />);
      await waitFor(() =>
        expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull()
      );

      rerender(<TextInputWithDropDown {...defaultProps} hideDropdown={false} />);
      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );
    });
  });

  describe('layout handling', () => {
    test('remeasures position on layout change when dropdown is visible', async () => {
      const { getByTestId, UNSAFE_root } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'past');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );

      const container = UNSAFE_root.findByType('View' as any);
      await act(async () => {
        fireEvent(container, 'layout', {
          nativeEvent: { layout: { x: 0, y: 100, width: 300, height: 50 } },
        });
      });

      expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy();
    });

    test('does not remeasure position on layout change when dropdown is not visible', async () => {
      const { queryByTestId, UNSAFE_root } = render(<TextInputWithDropDown {...defaultProps} />);

      expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull();

      const container = UNSAFE_root.findByType('View' as any);
      await act(async () => {
        fireEvent(container, 'layout', {
          nativeEvent: { layout: { x: 0, y: 100, width: 300, height: 50 } },
        });
      });

      expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull();
    });
  });

  describe('filtering', () => {
    test('filters items case-insensitively', async () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'PAST');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );
      expect(queryByTestId('TextInputWithDropDown::AutocompleteItem::Salmon')).toBeNull();
    });

    test('shows multiple matching items', async () => {
      const { getByTestId } = render(
        <TextInputWithDropDown
          {...defaultProps}
          referenceTextArray={['Apple', 'Apricot', 'Banana']}
        />
      );

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'ap');
      });

      await waitFor(() => {
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Apple')).toBeTruthy();
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Apricot')).toBeTruthy();
      });
    });
  });

  describe('edge cases', () => {
    test('handles empty reference array', async () => {
      const { getByTestId, queryByTestId } = render(
        <TextInputWithDropDown {...defaultProps} referenceTextArray={[]} />
      );

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'test');
      });

      expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull();
    });

    test('handles rapid text changes', async () => {
      const { getByTestId, queryByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');

      await act(async () => {
        fireEvent.changeText(input, 'p');
        fireEvent.changeText(input, 'pa');
        fireEvent.changeText(input, 'pas');
        fireEvent.changeText(input, 'past');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );

      await act(async () => {
        fireEvent.changeText(input, 'xyz');
      });

      await waitFor(() =>
        expect(queryByTestId('TextInputWithDropDown::AutocompleteList')).toBeNull()
      );
    });

    test('works without onValidate callback', async () => {
      const propsWithoutCallback = { ...defaultProps, onValidate: undefined };
      const { getByTestId } = render(<TextInputWithDropDown {...propsWithoutCallback} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'past');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );

      await act(async () => {
        fireEvent.press(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta'));
      });

      expect(getByTestId('TextInputWithDropDown::CustomTextInput').props.value).toEqual('Pasta');
    });

    test('does not update layout when measureInWindow returns zero dimensions', async () => {
      MockNativeMethods.measureInWindow.mockImplementation(
        (cb: (x: number, y: number, width: number, height: number) => void) => {
          cb(0, 0, 0, 0);
        }
      );

      const { getByTestId } = render(<TextInputWithDropDown {...defaultProps} />);

      const input = getByTestId('TextInputWithDropDown::CustomTextInput');
      await act(async () => {
        fireEvent.changeText(input, 'past');
      });

      await waitFor(() =>
        expect(getByTestId('TextInputWithDropDown::AutocompleteItem::Pasta')).toBeTruthy()
      );

      const dropdown = getByTestId('TextInputWithDropDown::AutocompleteList');
      expect(dropdown.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ top: 0, left: 0, width: 0 })])
      );

      MockNativeMethods.measureInWindow.mockImplementation(
        (cb: (x: number, y: number, width: number, height: number) => void) => {
          cb(10, 20, 300, 50);
        }
      );
    });
  });
});
