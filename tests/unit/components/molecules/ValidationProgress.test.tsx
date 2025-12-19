import { render } from '@testing-library/react-native';
import { ValidationProgress } from '@components/molecules/ValidationProgress';
import React from 'react';
import { FormIngredientElement, tagTableElement } from '@customTypes/DatabaseElementTypes';
import { ValidationProgress as ValidationProgressData } from '@hooks/useValidationWorkflow';

jest.mock('@components/dialogs/ValidationQueue', () =>
  require('@mocks/components/dialogs/ValidationQueue-mock')
);

describe('ValidationProgress', () => {
  const mockTagProgress: ValidationProgressData = {
    validatedTags: 3,
    totalTags: 10,
    validatedIngredients: 0,
    totalIngredients: 5,
    remainingTags: 7,
    remainingIngredients: 5,
  };

  const mockIngredientProgress: ValidationProgressData = {
    validatedTags: 10,
    totalTags: 10,
    validatedIngredients: 2,
    totalIngredients: 8,
    remainingTags: 0,
    remainingIngredients: 6,
  };

  const mockTags: tagTableElement[] = [{ id: 1, name: 'Italian' }];

  const mockIngredients: FormIngredientElement[] = [
    { id: 1, name: 'Chicken', quantity: '500', unit: 'g' },
  ];

  describe('Tag validation', () => {
    const tagProps = {
      type: 'Tag' as const,
      items: mockTags,
      onValidated: jest.fn(),
      progress: mockTagProgress,
      onDismissed: jest.fn(),
      onComplete: jest.fn(),
      testID: 'test-progress',
    };

    test('displays tag validation title', () => {
      const { getByText } = render(<ValidationProgress {...tagProps} />);

      expect(getByText('bulkImport.validation.validatingTags')).toBeTruthy();
    });

    test('displays tag progress', () => {
      const { getByText } = render(<ValidationProgress {...tagProps} />);

      expect(getByText('bulkImport.validation.progress')).toBeTruthy();
    });

    test('renders ValidationQueue for tags', () => {
      const { getByTestId } = render(<ValidationProgress {...tagProps} />);

      expect(getByTestId('test-progress::TagQueue::ValidationQueue::Mock')).toBeTruthy();
      expect(
        getByTestId('test-progress::TagQueue::ValidationQueue::Mock::type').props.children
      ).toBe('Tag');
    });

    test('does not show progress bar when progress is null', () => {
      const { queryByText } = render(<ValidationProgress {...tagProps} progress={null} />);

      expect(queryByText('bulkImport.validation.progress')).toBeNull();
    });
  });

  describe('Ingredient validation', () => {
    const ingredientProps = {
      type: 'Ingredient' as const,
      items: mockIngredients,
      onValidated: jest.fn(),
      progress: mockIngredientProgress,
      onDismissed: jest.fn(),
      onComplete: jest.fn(),
      testID: 'test-progress',
    };

    test('displays ingredient validation title', () => {
      const { getByText } = render(<ValidationProgress {...ingredientProps} />);

      expect(getByText('bulkImport.validation.validatingIngredients')).toBeTruthy();
    });

    test('displays ingredient progress', () => {
      const { getByText } = render(<ValidationProgress {...ingredientProps} />);

      expect(getByText('bulkImport.validation.progress')).toBeTruthy();
    });

    test('renders ValidationQueue for ingredients', () => {
      const { getByTestId } = render(<ValidationProgress {...ingredientProps} />);

      expect(getByTestId('test-progress::IngredientQueue::ValidationQueue::Mock')).toBeTruthy();
      expect(
        getByTestId('test-progress::IngredientQueue::ValidationQueue::Mock::type').props.children
      ).toBe('Ingredient');
    });
  });

  describe('Empty items', () => {
    test('does not render ValidationQueue when tag items empty', () => {
      const { queryByTestId } = render(
        <ValidationProgress
          type='Tag'
          items={[]}
          onValidated={jest.fn()}
          progress={mockTagProgress}
          onDismissed={jest.fn()}
          onComplete={jest.fn()}
          testID='test-progress'
        />
      );

      expect(queryByTestId('test-progress::TagQueue::ValidationQueue::Mock')).toBeNull();
    });

    test('does not render ValidationQueue when ingredient items empty', () => {
      const { queryByTestId } = render(
        <ValidationProgress
          type='Ingredient'
          items={[]}
          onValidated={jest.fn()}
          progress={mockIngredientProgress}
          onDismissed={jest.fn()}
          onComplete={jest.fn()}
          testID='test-progress'
        />
      );

      expect(queryByTestId('test-progress::IngredientQueue::ValidationQueue::Mock')).toBeNull();
    });
  });
});
