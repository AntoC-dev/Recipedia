import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ValidationReviewItem } from '@components/molecules/ValidationReviewItem';

const defaultProps = {
  testID: 'test-item',
  itemType: 'Tag' as const,
  itemName: 'Italian',
  status: 'pending' as const,
  onUseSuggested: jest.fn(),
  onAddNew: jest.fn(),
  onPickFromDatabase: jest.fn(),
  onSkip: jest.fn(),
  onUndo: jest.fn(),
};

describe('ValidationReviewItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pending state', () => {
    test('renders item name', async () => {
      const { getByTestId } = await render(<ValidationReviewItem {...defaultProps} />);

      expect(getByTestId('test-item::Name').props.children).toBe('Italian');
    });

    test('renders AddNew chip', async () => {
      const { getByTestId } = await render(<ValidationReviewItem {...defaultProps} />);

      expect(getByTestId('test-item::AddNewChip')).toBeTruthy();
    });

    test('renders Pick chip', async () => {
      const { getByTestId } = await render(<ValidationReviewItem {...defaultProps} />);

      expect(getByTestId('test-item::PickChip')).toBeTruthy();
    });

    test('renders Skip chip', async () => {
      const { getByTestId } = await render(<ValidationReviewItem {...defaultProps} />);

      expect(getByTestId('test-item::SkipChip')).toBeTruthy();
    });

    test('does not render UseSuggested chip without suggestedMatch', async () => {
      const { queryByTestId } = await render(<ValidationReviewItem {...defaultProps} />);

      expect(queryByTestId('test-item::UseSuggestedChip')).toBeNull();
    });

    test('does not render similar text without suggestedMatch', async () => {
      const { queryByTestId } = await render(<ValidationReviewItem {...defaultProps} />);

      expect(queryByTestId('test-item::SuggestedMatch')).toBeNull();
    });

    test('renders UseSuggested chip when suggestedMatch is provided', async () => {
      const { getByTestId } = await render(
        <ValidationReviewItem
          {...defaultProps}
          suggestedMatch={{ id: 10, name: 'Italian Cuisine' }}
        />
      );

      expect(getByTestId('test-item::UseSuggestedChip')).toBeTruthy();
    });

    test('renders suggested match text when suggestedMatch is provided', async () => {
      const { getByTestId } = await render(
        <ValidationReviewItem
          {...defaultProps}
          suggestedMatch={{ id: 10, name: 'Italian Cuisine' }}
        />
      );

      expect(getByTestId('test-item::SuggestedMatch')).toBeTruthy();
    });

    test('calls onUseSuggested when UseSuggested chip is pressed', async () => {
      const onUseSuggested = jest.fn();
      const { getByTestId } = await render(
        <ValidationReviewItem
          {...defaultProps}
          suggestedMatch={{ id: 10, name: 'Italian Cuisine' }}
          onUseSuggested={onUseSuggested}
        />
      );

      await fireEvent.press(getByTestId('test-item::UseSuggestedChip'));

      expect(onUseSuggested).toHaveBeenCalledTimes(1);
    });

    test('calls onAddNew when AddNew chip is pressed', async () => {
      const onAddNew = jest.fn();
      const { getByTestId } = await render(
        <ValidationReviewItem {...defaultProps} onAddNew={onAddNew} />
      );

      await fireEvent.press(getByTestId('test-item::AddNewChip'));

      expect(onAddNew).toHaveBeenCalledTimes(1);
    });

    test('calls onPickFromDatabase when Pick chip is pressed', async () => {
      const onPickFromDatabase = jest.fn();
      const { getByTestId } = await render(
        <ValidationReviewItem {...defaultProps} onPickFromDatabase={onPickFromDatabase} />
      );

      await fireEvent.press(getByTestId('test-item::PickChip'));

      expect(onPickFromDatabase).toHaveBeenCalledTimes(1);
    });

    test('calls onSkip when Skip chip is pressed', async () => {
      const onSkip = jest.fn();
      const { getByTestId } = await render(
        <ValidationReviewItem {...defaultProps} onSkip={onSkip} />
      );

      await fireEvent.press(getByTestId('test-item::SkipChip'));

      expect(onSkip).toHaveBeenCalledTimes(1);
    });
  });

  describe('resolved state', () => {
    const resolvedProps = {
      ...defaultProps,
      status: 'resolved' as const,
      resolution: {
        type: 'use-suggested' as const,
        resolvedItem: { id: 10, name: 'Italian Cuisine' },
      },
    };

    test('renders item name', async () => {
      const { getByTestId } = await render(<ValidationReviewItem {...resolvedProps} />);

      expect(getByTestId('test-item::Name').props.children).toBe('Italian');
    });

    test('renders mapped-to status text', async () => {
      const { getByTestId } = await render(<ValidationReviewItem {...resolvedProps} />);

      expect(getByTestId('test-item::StatusText')).toBeTruthy();
    });

    test('renders undo button', async () => {
      const { getByTestId } = await render(<ValidationReviewItem {...resolvedProps} />);

      expect(getByTestId('test-item::UndoButton')).toBeTruthy();
    });

    test('calls onUndo when undo button is pressed', async () => {
      const onUndo = jest.fn();
      const { getByTestId } = await render(
        <ValidationReviewItem {...resolvedProps} onUndo={onUndo} />
      );

      await fireEvent.press(getByTestId('test-item::UndoButton'));

      expect(onUndo).toHaveBeenCalledTimes(1);
    });

    test('does not render action chips', async () => {
      const { queryByTestId } = await render(<ValidationReviewItem {...resolvedProps} />);

      expect(queryByTestId('test-item::AddNewChip')).toBeNull();
      expect(queryByTestId('test-item::PickChip')).toBeNull();
      expect(queryByTestId('test-item::SkipChip')).toBeNull();
    });
  });

  describe('skipped state', () => {
    const skippedProps = {
      ...defaultProps,
      status: 'skipped' as const,
    };

    test('renders skipped status text', async () => {
      const { getByTestId } = await render(<ValidationReviewItem {...skippedProps} />);

      expect(getByTestId('test-item::StatusText')).toBeTruthy();
    });

    test('renders undo button', async () => {
      const { getByTestId } = await render(<ValidationReviewItem {...skippedProps} />);

      expect(getByTestId('test-item::UndoButton')).toBeTruthy();
    });

    test('calls onUndo when undo button is pressed', async () => {
      const onUndo = jest.fn();
      const { getByTestId } = await render(
        <ValidationReviewItem {...skippedProps} onUndo={onUndo} />
      );

      await fireEvent.press(getByTestId('test-item::UndoButton'));

      expect(onUndo).toHaveBeenCalledTimes(1);
    });
  });
});
