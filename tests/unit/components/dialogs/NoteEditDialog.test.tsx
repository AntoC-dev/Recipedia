import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { NoteEditDialog } from '@components/dialogs/NoteEditDialog';
import React from 'react';

describe('NoteEditDialog', () => {
  const defaultProps = {
    testId: 'test',
    isVisible: true,
    ingredientName: 'Flour',
    initialNote: '',
    placeholder: 'Usage note (e.g., for the sauce)',
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('dialog title', () => {
    test('shows "Add Note" title when initialNote is empty', () => {
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} initialNote='' />);

      expect(getByTestId('test::NoteDialog::Title').props.children).toBe(
        'recipe.noteDialog.addTitle'
      );
    });

    test('shows "Edit Note" title when initialNote has content', () => {
      const { getByTestId } = render(
        <NoteEditDialog {...defaultProps} initialNote='for the sauce' />
      );

      expect(getByTestId('test::NoteDialog::Title').props.children).toBe(
        'recipe.noteDialog.editTitle'
      );
    });

    test('shows "Add Note" when initialNote is whitespace only', () => {
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} initialNote='   ' />);

      expect(getByTestId('test::NoteDialog::Title').props.children).toBe(
        'recipe.noteDialog.addTitle'
      );
    });
  });

  describe('rendering', () => {
    test('renders dialog when isVisible is true', () => {
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} isVisible={true} />);

      expect(getByTestId('test::NoteDialog::Title')).toBeTruthy();
    });

    test('displays ingredient name in dialog', () => {
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} ingredientName='Butter' />);

      expect(getByTestId('test::NoteDialog::IngredientName').props.children).toBe('Butter');
    });

    test('displays initial note in input', () => {
      const { getByTestId } = render(
        <NoteEditDialog {...defaultProps} initialNote='for the sauce' />
      );

      expect(getByTestId('test::NoteDialog::Input::CustomTextInput').props.value).toBe(
        'for the sauce'
      );
    });

    test('displays placeholder text in input label', () => {
      const { getByTestId } = render(
        <NoteEditDialog {...defaultProps} placeholder='Custom placeholder' />
      );

      expect(getByTestId('test::NoteDialog::Input::CustomTextInput').props.label).toBe(
        'Custom placeholder'
      );
    });
  });

  describe('user interactions', () => {
    test('calls onSave with trimmed note on save button press', () => {
      const onSave = jest.fn();
      const { getByTestId } = render(
        <NoteEditDialog {...defaultProps} onSave={onSave} initialNote='  for the sauce  ' />
      );

      fireEvent.press(getByTestId('test::NoteDialog::SaveButton'));

      expect(onSave).toHaveBeenCalledWith('for the sauce');
    });

    test('calls onClose on cancel button press', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} onClose={onClose} />);

      fireEvent.press(getByTestId('test::NoteDialog::CancelButton'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose after saving', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} onClose={onClose} />);

      fireEvent.press(getByTestId('test::NoteDialog::SaveButton'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('handles save with empty note', () => {
      const onSave = jest.fn();
      const { getByTestId } = render(
        <NoteEditDialog {...defaultProps} onSave={onSave} initialNote='' />
      );

      fireEvent.press(getByTestId('test::NoteDialog::SaveButton'));

      expect(onSave).toHaveBeenCalledWith('');
    });

    test('trims whitespace before saving', () => {
      const onSave = jest.fn();
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} onSave={onSave} />);

      fireEvent.changeText(
        getByTestId('test::NoteDialog::Input::CustomTextInput'),
        '  trimmed note  '
      );
      fireEvent.press(getByTestId('test::NoteDialog::SaveButton'));

      expect(onSave).toHaveBeenCalledWith('trimmed note');
    });

    test('updates note text on input change', () => {
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} />);

      fireEvent.changeText(
        getByTestId('test::NoteDialog::Input::CustomTextInput'),
        'new note value'
      );

      expect(getByTestId('test::NoteDialog::Input::CustomTextInput').props.value).toBe(
        'new note value'
      );
    });
  });

  describe('state management', () => {
    test('resets note state when dialog becomes visible', async () => {
      const { getByTestId, rerender } = render(
        <NoteEditDialog {...defaultProps} isVisible={false} initialNote='initial' />
      );

      rerender(<NoteEditDialog {...defaultProps} isVisible={true} initialNote='initial' />);

      await waitFor(() => {
        expect(getByTestId('test::NoteDialog::Input::CustomTextInput').props.value).toBe('initial');
      });
    });

    test('resets to new initialNote when dialog reopens with different value', async () => {
      const { getByTestId, rerender } = render(
        <NoteEditDialog {...defaultProps} isVisible={true} initialNote='first' />
      );

      fireEvent.changeText(getByTestId('test::NoteDialog::Input::CustomTextInput'), 'modified');

      rerender(<NoteEditDialog {...defaultProps} isVisible={false} initialNote='first' />);
      rerender(<NoteEditDialog {...defaultProps} isVisible={true} initialNote='second' />);

      await waitFor(() => {
        expect(getByTestId('test::NoteDialog::Input::CustomTextInput').props.value).toBe('second');
      });
    });
  });

  describe('edge cases', () => {
    test('handles very long note', () => {
      const longNote = 'a'.repeat(500);
      const onSave = jest.fn();
      const { getByTestId } = render(
        <NoteEditDialog {...defaultProps} onSave={onSave} initialNote={longNote} />
      );

      fireEvent.press(getByTestId('test::NoteDialog::SaveButton'));

      expect(onSave).toHaveBeenCalledWith(longNote);
    });

    test('handles note with special characters', () => {
      const onSave = jest.fn();
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} onSave={onSave} />);

      fireEvent.changeText(
        getByTestId('test::NoteDialog::Input::CustomTextInput'),
        'for the "special" sauce (organic)'
      );
      fireEvent.press(getByTestId('test::NoteDialog::SaveButton'));

      expect(onSave).toHaveBeenCalledWith('for the "special" sauce (organic)');
    });

    test('handles note with unicode characters', () => {
      const onSave = jest.fn();
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} onSave={onSave} />);

      fireEvent.changeText(
        getByTestId('test::NoteDialog::Input::CustomTextInput'),
        '🌶️ spicy à volonté'
      );
      fireEvent.press(getByTestId('test::NoteDialog::SaveButton'));

      expect(onSave).toHaveBeenCalledWith('🌶️ spicy à volonté');
    });

    test('handles empty ingredient name', () => {
      const { getByTestId } = render(<NoteEditDialog {...defaultProps} ingredientName='' />);

      expect(getByTestId('test::NoteDialog::IngredientName').props.children).toBe('');
    });
  });
});
