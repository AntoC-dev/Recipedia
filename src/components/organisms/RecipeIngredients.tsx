/**
 * RecipeIngredients - Dedicated ingredient table component
 *
 * A specialized component for displaying and editing recipe ingredients in a table format.
 * Features two distinct modes: read-only display with perfect alignment and editable mode
 * with inline inputs for quantity, unit, and ingredient name.
 *
 * Key Features:
 * - React Native Paper DataTable for consistent table layout
 * - Editable mode with inline NumericTextInput, CustomTextInput, and dropdown
 * - Column headers in editable mode for clarity
 * - Scrollable list for handling many ingredients
 * - Three-column layout: Quantity | Unit | Ingredient Name
 * - Autocomplete for ingredient names with database integration
 *
 * @example
 * ```typescript
 * // Read-only mode
 * <RecipeIngredients
 *   testID="recipe-ingredients"
 *   ingredients={recipe.ingredients}
 *   mode="readOnly"
 * />
 *
 * // Editable mode
 * <RecipeIngredients
 *   testID="recipe-ingredients"
 *   ingredients={editableIngredients}
 *   mode="editable"
 *   columnTitles={{
 *     column1: "Quantity",
 *     column2: "Unit",
 *     column3: "Ingredient"
 *   }}
 *   onIngredientChange={(index, newValue) => updateIngredient(index, newValue)}
 *   onAddIngredient={() => addNewIngredient()}
 * />
 * ```
 */

import React from 'react';
import { View } from 'react-native';
import { DataTable, Text, useTheme } from 'react-native-paper';
import { FormIngredientElement, ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { textSeparator, unitySeparator } from '@styles/typography';
import {
  recipeTableFlex,
  recipeTableReadOnlyFlex,
  recipeTableStyles,
} from '@styles/recipeComponents';
import { RoundButton } from '@components/atomic/RoundButton';
import { Icons } from '@assets/Icons';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { NumericTextInput } from '@components/atomic/NumericTextInput';
import { TextInputWithDropDown } from '@components/molecules/TextInputWithDropDown';
import { defaultValueNumber } from '@utils/Constants';
import { formatQuantityForDisplay } from '@utils/Quantity';

/**
 * Common props shared across all modes
 */
export type BaseProps = {
  /** Unique identifier for testing and accessibility */
  testID: string;
  /** Array of ingredient table elements to display/edit */
  ingredients: ingredientTableElement[];
};

/**
 * Props for read-only mode
 */
export type ReadOnlyProps = BaseProps & {
  mode: 'readOnly';
};

/**
 * Common props for editable and add modes
 */
export type EditableBaseProps = BaseProps & {
  /** Prefix text displayed above the table */
  prefixText: string;
  /** Column titles for the table header */
  columnTitles: {
    column1: string;
    column2: string;
    column3: string;
  };
  /** Callback fired when an ingredient is edited */
  onIngredientChange: (index: number, newValue: string) => void;
  /** Callback fired to add a new ingredient */
  onAddIngredient: () => void;
};

/**
 * Props for editable mode
 */
export type EditableProps = EditableBaseProps & {
  mode: 'editable';
};

/**
 * Props for add mode (OCR)
 * Same as editable mode but with additional OCR button support for empty state
 * Accepts incomplete ingredients (FormIngredientElement) for new ingredients being added
 */
export type AddProps = Omit<EditableBaseProps, 'ingredients'> & {
  mode: 'add';
  /** Array of ingredients, may include incomplete FormIngredientElement for new ingredients */
  ingredients: (ingredientTableElement | FormIngredientElement)[];
  /** Callback fired to open OCR modal (for empty state) */
  openModal: () => void;
};

/**
 * Props for the RecipeIngredients component (discriminated union)
 */
export type RecipeIngredientsProps = ReadOnlyProps | EditableProps | AddProps;

/**
 * Wrapper component with prefix text and container
 */
function PrefixTextWrapper({
  testID,
  prefixText,
  children,
}: {
  testID: string;
  prefixText: string;
  children: React.ReactNode;
}) {
  return (
    <View style={recipeTableStyles.container}>
      <Text
        testID={`${testID}::PrefixText`}
        variant='headlineSmall'
        style={recipeTableStyles.prefixText}
      >
        {prefixText}
      </Text>
      {children}
    </View>
  );
}

/**
 * Helper to parse ingredient quantity string to number
 */
function parseIngredientQuantity(quantityStr: string | undefined): number {
  if (!quantityStr || quantityStr.trim().length === 0) return defaultValueNumber;
  const parsed = parseFloat(quantityStr.replace(',', '.'));
  return isNaN(parsed) ? defaultValueNumber : parsed;
}

/**
 * Helper to format ingredient change for callback
 */
function formatIngredientChange(quantity: number, unit: string, name: string): string {
  const quantityStr = quantity === defaultValueNumber ? '' : quantity.toString();
  return `${quantityStr}${unitySeparator}${unit}${textSeparator}${name}`;
}

/**
 * Internal props for EditableIngredients component
 * Accepts both complete and incomplete ingredients since it's used by both editable and add modes
 */
type EditableIngredientsProps = {
  testID: string;
  ingredients: (ingredientTableElement | FormIngredientElement)[];
  prefixText: string;
  columnTitles: {
    column1: string;
    column2: string;
    column3: string;
  };
  onIngredientChange: (index: number, newValue: string) => void;
  onAddIngredient: () => void;
};

/**
 * Read-only ingredients component
 */
function ReadOnlyIngredients({ testID, ingredients }: ReadOnlyProps) {
  return (
    <View style={{ paddingHorizontal: 10 }}>
      <DataTable>
        {ingredients.map((item, index) => (
          <DataTable.Row
            key={index}
            testID={`${testID}::${index}::Row`}
            style={{ borderBottomWidth: 0 }}
          >
            <DataTable.Cell
              testID={`${testID}::${index}::QuantityAndUnit`}
              style={{ flex: recipeTableReadOnlyFlex.quantityAndUnit }}
            >
              <Text variant='titleMedium'>
                {formatQuantityForDisplay(item.quantity ?? '')} {item.unit}
              </Text>
            </DataTable.Cell>
            <DataTable.Cell
              testID={`${testID}::${index}::IngredientName`}
              style={{ flex: recipeTableReadOnlyFlex.name }}
            >
              <Text variant='titleMedium'>{item.name}</Text>
            </DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </View>
  );
}

/**
 * Editable ingredients component (internal)
 * Used by both editable and add modes
 */
function EditableIngredients(props: EditableIngredientsProps) {
  const { testID, ingredients, prefixText, columnTitles, onIngredientChange, onAddIngredient } =
    props;
  const { ingredients: dbIngredients } = useRecipeDatabase();
  const { colors, fonts } = useTheme();

  const usedIngredientNames = ingredients
    .map(ing => ing.name)
    .filter((name, idx, arr) => name && name.trim().length > 0 && arr.indexOf(name) === idx);

  const availableIngredients = dbIngredients
    .map(ingredient => ingredient.name)
    .filter(dbIngredient => !usedIngredientNames.includes(dbIngredient))
    .sort();

  const handleIngredientChange = (index: number, quantity: number, unit: string, name: string) => {
    onIngredientChange(index, formatIngredientChange(quantity, unit, name));
  };

  const headerTestId = testID + '::Header';
  return (
    <PrefixTextWrapper testID={testID} prefixText={prefixText}>
      <DataTable style={recipeTableStyles.table}>
        <DataTable.Header style={{ borderBottomWidth: 0 }}>
          <DataTable.Title
            testID={headerTestId + '::Quantity'}
            style={[
              recipeTableStyles.header,
              { flex: recipeTableFlex.quantity, borderColor: colors.outline },
            ]}
            textStyle={[recipeTableStyles.title, { fontSize: fonts.titleMedium.fontSize }]}
          >
            {columnTitles.column1}
          </DataTable.Title>
          <DataTable.Title
            testID={headerTestId + '::Unit'}
            style={[
              recipeTableStyles.header,
              { flex: recipeTableFlex.unit, borderColor: colors.outline },
            ]}
            textStyle={[recipeTableStyles.title, { fontSize: fonts.titleMedium.fontSize }]}
          >
            {columnTitles.column2}
          </DataTable.Title>
          <DataTable.Title
            testID={headerTestId + '::IngredientName'}
            style={[
              recipeTableStyles.header,
              { flex: recipeTableFlex.name, borderColor: colors.outline },
              recipeTableStyles.rightBorder,
            ]}
            textStyle={[recipeTableStyles.title, { fontSize: fonts.titleMedium.fontSize }]}
          >
            {columnTitles.column3}
          </DataTable.Title>
        </DataTable.Header>
        {ingredients.map((item, index) => {
          const quantity = parseIngredientQuantity(item.quantity);

          return (
            <DataTable.Row
              key={index}
              testID={`${testID}::${index}::Row`}
              style={{ borderBottomWidth: 0 }}
            >
              <DataTable.Cell
                style={[
                  recipeTableStyles.cellBase,
                  { flex: recipeTableFlex.quantity, borderColor: colors.outline },
                ]}
              >
                <NumericTextInput
                  testID={`${testID}::${index}::QuantityInput`}
                  value={Math.round(quantity * 100) / 100}
                  onChangeValue={newQuantity =>
                    handleIngredientChange(index, newQuantity, item.unit ?? '', item.name ?? '')
                  }
                  dense
                  mode='flat'
                  style={recipeTableStyles.inputContainer}
                />
              </DataTable.Cell>
              <DataTable.Cell
                style={[
                  recipeTableStyles.cellBase,
                  {
                    flex: recipeTableFlex.unit,
                    borderColor: colors.outline,
                    alignItems: 'stretch',
                  },
                ]}
              >
                <Text
                  testID={`${testID}::${index}::Unit`}
                  variant='bodyLarge'
                  style={[
                    recipeTableStyles.inputContainer,
                    {
                      backgroundColor: colors.backdrop,
                      textAlign: 'center',
                      textAlignVertical: 'center',
                    },
                  ]}
                >
                  {item.unit}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell
                style={[
                  recipeTableStyles.cellBase,
                  { flex: recipeTableFlex.name, borderColor: colors.outline },
                  recipeTableStyles.rightBorder,
                ]}
              >
                <TextInputWithDropDown
                  testID={`${testID}::${index}::NameInput`}
                  value={item.name}
                  absoluteDropDown={false}
                  referenceTextArray={availableIngredients}
                  dense
                  mode='flat'
                  onValidate={newName =>
                    handleIngredientChange(index, quantity, item.unit ?? '', newName)
                  }
                  style={recipeTableStyles.inputContainer}
                />
              </DataTable.Cell>
            </DataTable.Row>
          );
        })}
      </DataTable>

      <RoundButton
        testID={`${testID}::AddButton`}
        size='medium'
        icon={Icons.plusIcon}
        onPressFunction={onAddIngredient}
        style={recipeTableStyles.addButton}
      />
    </PrefixTextWrapper>
  );
}

/**
 * Add ingredients component (with OCR support)
 */
function AddIngredients(props: AddProps) {
  const {
    testID,
    ingredients,
    prefixText,
    openModal,
    onAddIngredient,
    columnTitles,
    onIngredientChange,
  } = props;

  if (ingredients.length === 0) {
    return (
      <PrefixTextWrapper testID={testID} prefixText={prefixText}>
        <View style={recipeTableStyles.roundButtonsContainer}>
          <RoundButton
            testID={`${testID}::OpenModal`}
            style={recipeTableStyles.roundButton}
            size='medium'
            icon={Icons.scanImageIcon}
            onPressFunction={openModal}
          />
          <RoundButton
            testID={`${testID}::AddButton`}
            style={recipeTableStyles.roundButton}
            size='medium'
            icon={Icons.pencilIcon}
            onPressFunction={onAddIngredient}
          />
        </View>
      </PrefixTextWrapper>
    );
  }

  return (
    <EditableIngredients
      testID={testID}
      ingredients={ingredients}
      prefixText={prefixText}
      columnTitles={columnTitles}
      onIngredientChange={onIngredientChange}
      onAddIngredient={onAddIngredient}
    />
  );
}

/**
 * RecipeIngredients component for ingredient table display and editing
 *
 * @param props - The component props
 * @returns JSX element representing the ingredients table
 */
export function RecipeIngredients(props: RecipeIngredientsProps) {
  switch (props.mode) {
    case 'add':
      return <AddIngredients {...props} />;
    case 'readOnly':
      return <ReadOnlyIngredients {...props} />;
    case 'editable':
      return (
        <EditableIngredients
          testID={props.testID}
          ingredients={props.ingredients}
          prefixText={props.prefixText}
          columnTitles={props.columnTitles}
          onIngredientChange={props.onIngredientChange}
          onAddIngredient={props.onAddIngredient}
        />
      );
  }
}

export default RecipeIngredients;
