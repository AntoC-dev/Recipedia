import { fireEvent, render, within } from '@testing-library/react-native';
import React from 'react';
import { ingredientTableElement, ingredientType } from '@customTypes/DatabaseElementTypes';
import RecipeIngredients, {
  IngredientRow,
  IngredientsAddEmpty,
  IngredientsAddTail,
  IngredientsTable,
} from '@components/organisms/RecipeIngredients';

jest.mock('@expo/vector-icons', () => require('@mocks/deps/expo-vector-icons-mock'));
jest.mock('@components/atomic/RoundButton', () => ({
  RoundButton: require('@mocks/components/atomic/RoundButton-mock').roundButtonMock,
}));
jest.mock('@components/atomic/NumericTextInput', () => ({
  NumericTextInput: require('@mocks/components/atomic/NumericTextInput-mock').numericTextInputMock,
}));
jest.mock('@components/molecules/TextInputWithDropDown', () => ({
  TextInputWithDropDown: require('@mocks/components/molecules/TextInputWithDropDown-mock')
    .TextInputWithDropDownMock,
}));

const sampleIngredients: ingredientTableElement[] = [
  {
    id: 1,
    name: 'Flour',
    unit: 'g',
    quantity: '200',
    type: ingredientType.cereal,
    season: [],
  },
  {
    id: 2,
    name: 'Sugar',
    unit: 'g',
    quantity: '100',
    type: ingredientType.cereal,
    season: [],
    note: 'Brown',
  },
];

const TEST_ID = 'RecipeIngredients';

describe('RecipeIngredients (read-only)', () => {
  it('renders each row with quantity/unit + name + optional note', () => {
    const { getByTestId, queryByTestId } = render(
      <RecipeIngredients testID={TEST_ID} ingredients={sampleIngredients} />
    );

    sampleIngredients.forEach((item, index) => {
      expect(getByTestId(`${TEST_ID}::${index}::Row`)).toBeTruthy();
      expect(getByTestId(`${TEST_ID}::${index}::QuantityAndUnit`)).toBeTruthy();
      expect(getByTestId(`${TEST_ID}::${index}::IngredientName`).props.children).toContain(
        item.name
      );
    });
    expect(getByTestId(`${TEST_ID}::1::Note`).props.children).toEqual(' (Brown)');
    expect(queryByTestId(`${TEST_ID}::0::Note`)).toBeNull();
  });

  it('renders nothing when the ingredient list is empty', () => {
    const { queryByTestId } = render(<RecipeIngredients testID={TEST_ID} ingredients={[]} />);
    expect(queryByTestId(`${TEST_ID}::0::Row`)).toBeNull();
  });
});

describe('IngredientsTable', () => {
  const columnTitles = { column1: 'Quantity', column2: 'Unit', column3: 'Name' };

  it('renders prefix, column titles, children, and add button', () => {
    const onAddIngredient = jest.fn();
    const { getByTestId, getByText } = render(
      <IngredientsTable
        testID={TEST_ID}
        prefixText='Ingredients :'
        columnTitles={columnTitles}
        onAddIngredient={onAddIngredient}
      >
        {childMarker()}
      </IngredientsTable>
    );

    expect(getByTestId(`${TEST_ID}::PrefixText`).props.children).toEqual('Ingredients :');
    expect(getByTestId(`${TEST_ID}::Header::Quantity`)).toBeTruthy();
    expect(getByText('child-marker')).toBeTruthy();
    fireEvent.press(getByTestId(`${TEST_ID}::AddButton::RoundButton::OnPressFunction`));
    expect(onAddIngredient).toHaveBeenCalledTimes(1);
  });

  it('hides add button when hideAddButton is true', () => {
    const { queryByTestId } = render(
      <IngredientsTable
        testID={TEST_ID}
        prefixText='Ingredients :'
        columnTitles={columnTitles}
        hideAddButton
        onAddIngredient={jest.fn()}
      >
        {null}
      </IngredientsTable>
    );
    expect(queryByTestId(`${TEST_ID}::AddButton::RoundButton::OnPressFunction`)).toBeNull();
  });

  it('renders an error helper when error prop is set', () => {
    const { getByTestId } = render(
      <IngredientsTable
        testID={TEST_ID}
        prefixText='Ingredients :'
        columnTitles={columnTitles}
        error='boom'
      >
        {null}
      </IngredientsTable>
    );
    expect(getByTestId(`${TEST_ID}::Error`).props.children).toEqual('boom');
  });
});

describe('IngredientRow', () => {
  const baseIngredient: ingredientTableElement = {
    id: 1,
    name: 'Flour',
    unit: 'g',
    quantity: '200',
    type: ingredientType.cereal,
    season: [],
  };

  it('renders quantity and name inputs from the ingredient prop', () => {
    const { getByTestId } = render(
      <IngredientRow
        testID={TEST_ID}
        index={0}
        ingredient={baseIngredient}
        availableIngredients={['Sugar', 'Butter']}
        onCommit={jest.fn()}
        onRemove={jest.fn()}
        onOpenNote={jest.fn()}
      />
    );

    expect(getByTestId(`${TEST_ID}::0::QuantityInput`)).toBeTruthy();
    expect(
      getByTestId(`${TEST_ID}::0::NameInput::TextInputWithDropdown::Value`).props.children
    ).toEqual('Flour');
  });

  it('commits a quantity change as a formatted ingredient string on blur', () => {
    const onCommit = jest.fn();
    const { getByTestId } = render(
      <IngredientRow
        testID={TEST_ID}
        index={0}
        ingredient={baseIngredient}
        availableIngredients={[]}
        onCommit={onCommit}
        onRemove={jest.fn()}
        onOpenNote={jest.fn()}
      />
    );

    const qty = getByTestId(`${TEST_ID}::0::QuantityInput`);
    fireEvent.changeText(qty, '300');
    fireEvent(qty, 'blur');
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit.mock.calls[0][0]).toContain('Flour');
    expect(onCommit.mock.calls[0][0]).toContain('300');
  });

  it('commits a name change via TextInputWithDropDown.onValidate', () => {
    const onCommit = jest.fn();
    const { getByTestId } = render(
      <IngredientRow
        testID={TEST_ID}
        index={0}
        ingredient={baseIngredient}
        availableIngredients={[]}
        onCommit={onCommit}
        onRemove={jest.fn()}
        onOpenNote={jest.fn()}
      />
    );

    fireEvent.press(getByTestId(`${TEST_ID}::0::NameInput::TextInputWithDropdown::OnValidate`));
    expect(onCommit).toHaveBeenCalled();
    const lastCall = onCommit.mock.calls[onCommit.mock.calls.length - 1][0];
    expect(lastCall).toContain('Test string');
  });

  it('triggers onRemove + onOpenNote when their buttons are pressed', () => {
    const onRemove = jest.fn();
    const onOpenNote = jest.fn();
    const { getByTestId } = render(
      <IngredientRow
        testID={TEST_ID}
        index={2}
        ingredient={baseIngredient}
        availableIngredients={[]}
        onCommit={jest.fn()}
        onRemove={onRemove}
        onOpenNote={onOpenNote}
      />
    );

    fireEvent.press(getByTestId(`${TEST_ID}::2::DeleteButton`));
    expect(onRemove).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId(`${TEST_ID}::2::NoteButton`));
    expect(onOpenNote).toHaveBeenCalledTimes(1);
  });

  function renderRow(overrides: Partial<React.ComponentProps<typeof IngredientRow>> = {}) {
    return render(
      <IngredientRow
        testID={TEST_ID}
        index={0}
        ingredient={baseIngredient}
        availableIngredients={['Sugar', 'Butter']}
        onCommit={jest.fn()}
        onRemove={jest.fn()}
        onOpenNote={jest.fn()}
        {...overrides}
      />
    );
  }

  const nameInputMockId = `${TEST_ID}::0::NameInput::TextInputWithDropdown`;

  it('orders the row cells as name, quantity, unit, note then delete', () => {
    const { getByTestId } = renderRow();
    const expectedOrder = [
      `${nameInputMockId}::Value`,
      `${TEST_ID}::0::QuantityInput`,
      `${TEST_ID}::0::Unit`,
      `${TEST_ID}::0::NoteButton`,
      `${TEST_ID}::0::DeleteButton`,
    ];

    const renderedOrder = getByTestId(`${TEST_ID}::0::Row`)
      .findAll(node => typeof node.type === 'string' && expectedOrder.includes(node.props.testID))
      .map(node => node.props.testID);

    expect(renderedOrder).toEqual(expectedOrder);
  });

  it('forwards available ingredients to the name input', () => {
    const { getByTestId } = renderRow();

    expect(getByTestId(`${nameInputMockId}::ReferenceTextArray`).props.children).toEqual(
      JSON.stringify(['Sugar', 'Butter'])
    );
  });

  it('renders no name dropdown until it opens', () => {
    const { queryByTestId } = renderRow();

    expect(queryByTestId(`${nameInputMockId}::Dropdown`)).toBeNull();
  });

  it('renders the name dropdown under the whole row', () => {
    const { getByTestId } = renderRow();

    fireEvent.press(getByTestId(`${nameInputMockId}::ShowDropdown`));
    expect(getByTestId(`${nameInputMockId}::Dropdown`)).toBeTruthy();
    expect(
      within(getByTestId(`${TEST_ID}::0::Row`)).queryByTestId(`${nameInputMockId}::Dropdown`)
    ).toBeNull();
  });

  it('forwards a picked name to onSelectName then blurs', () => {
    const onSelectName = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId } = renderRow({ onSelectName, onBlur });

    fireEvent.press(getByTestId(`${nameInputMockId}::OnSelect`));

    expect(onSelectName).toHaveBeenCalledWith('Test string');
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('forwards focus and live name changes from the name input', () => {
    const onFocus = jest.fn();
    const onLiveNameChange = jest.fn();
    const { getByTestId } = renderRow({ onFocus, onLiveNameChange });

    fireEvent.press(getByTestId(`${nameInputMockId}::OnFocus`));
    fireEvent.press(getByTestId(`${nameInputMockId}::OnChangeText`));

    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onLiveNameChange).toHaveBeenCalledWith('Test string');
  });

  it('only blurs when the name input validates or selects a blank name', () => {
    const onCommit = jest.fn();
    const onSelectName = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId } = renderRow({ onCommit, onSelectName, onBlur });

    fireEvent.press(getByTestId(`${nameInputMockId}::OnValidateBlank`));
    fireEvent.press(getByTestId(`${nameInputMockId}::OnSelectBlank`));

    expect(onCommit).not.toHaveBeenCalled();
    expect(onSelectName).not.toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalledTimes(2);
  });

  it('renders the rowError helper when rowError is set', () => {
    const { getByTestId } = render(
      <IngredientRow
        testID={TEST_ID}
        index={0}
        ingredient={baseIngredient}
        availableIngredients={[]}
        rowError='row broken'
        onCommit={jest.fn()}
        onRemove={jest.fn()}
        onOpenNote={jest.fn()}
      />
    );
    expect(getByTestId(`${TEST_ID}::0::Error`).props.children).toEqual('row broken');
  });
});

describe('IngredientsAddEmpty', () => {
  it('renders OCR + add buttons and forwards callbacks', () => {
    const openOcrModal = jest.fn();
    const onAddIngredient = jest.fn();
    const { getByTestId } = render(
      <IngredientsAddEmpty
        testID={TEST_ID}
        prefixText='Ingredients :'
        scanLabel='Scan names'
        manualLabel='Add manually'
        openOcrModal={openOcrModal}
        onAddIngredient={onAddIngredient}
      />
    );

    fireEvent.press(getByTestId(`${TEST_ID}::OpenModalNames::RoundButton::OnPressFunction`));
    expect(openOcrModal).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId(`${TEST_ID}::AddButton::RoundButton::OnPressFunction`));
    expect(onAddIngredient).toHaveBeenCalledTimes(1);
  });
});

describe('IngredientsAddTail', () => {
  it('renders scan-quantities + add buttons and forwards callbacks', () => {
    const openOcrModal = jest.fn();
    const onAddIngredient = jest.fn();
    const { getByTestId } = render(
      <IngredientsAddTail
        testID={TEST_ID}
        scanLabel='Scan quantities'
        manualLabel='Add manually'
        openOcrModal={openOcrModal}
        onAddIngredient={onAddIngredient}
      />
    );

    fireEvent.press(getByTestId(`${TEST_ID}::OpenModalQuantities::RoundButton::OnPressFunction`));
    expect(openOcrModal).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId(`${TEST_ID}::AddButton::RoundButton::OnPressFunction`));
    expect(onAddIngredient).toHaveBeenCalledTimes(1);
  });
});

function childMarker() {
  const { Text } = require('react-native');
  return <Text>child-marker</Text>;
}
