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

import React, { useState } from 'react';
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { DataTable, IconButton, Text, useTheme } from 'react-native-paper';
import { FormIngredientElement, ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { RoundButton } from '@components/atomic/RoundButton';
import { Icons } from '@assets/Icons';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { NumericTextInput } from '@components/atomic/NumericTextInput';
import { TextInputWithDropDown } from '@components/molecules/TextInputWithDropDown';
import { NoteEditDialog } from '@components/dialogs/NoteEditDialog';
import {
  formatIngredientForCallback,
  formatQuantityForDisplay,
  parseIngredientQuantity,
} from '@utils/Quantity';
import { padding } from '@styles/spacing';

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
  /** Callback fired to remove an ingredient at a given index */
  onRemoveIngredient: (index: number) => void;
  /** Placeholder text for the ingredient note input */
  noteInputPlaceholder: string;
  /** Force hide the dropdown (e.g., during scroll) */
  hideDropdown?: boolean;
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
 * Wrapper component that displays a section header with prefix text.
 *
 * Provides consistent styling for ingredient sections in editable/add modes,
 * wrapping content in a styled container with a headline-sized prefix label.
 *
 * @param testID - Base test ID for accessibility and testing
 * @param prefixText - Header text to display above the content (e.g., "Ingredients:")
 * @param children - Content to render below the prefix text
 * @returns JSX element with styled container and prefix text
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
    <View style={cellStyles.container} accessible={false}>
      <Text testID={`${testID}::PrefixText`} variant='headlineSmall' style={cellStyles.prefixText}>
        {prefixText}
      </Text>
      {children}
    </View>
  );
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
  onRemoveIngredient: (index: number) => void;
  /** Placeholder text for the ingredient note input */
  noteInputPlaceholder: string;
  /** Force hide the dropdown (e.g., during scroll) */
  hideDropdown?: boolean;
};

/**
 * Read-only ingredients component
 *
 * Displays ingredients with quantity, unit, name, and optional usage note.
 * Notes are shown inline after the name with lighter styling.
 */
function ReadOnlyIngredients({ testID, ingredients }: ReadOnlyProps) {
  const { colors } = useTheme();

  return (
    <View style={cellStyles.readOnlyContainer} accessible={false}>
      {ingredients.map((item, index) => (
        <View
          key={index}
          testID={`${testID}::${index}::Row`}
          style={cellStyles.readOnlyRow}
          accessible={false}
        >
          <Text
            testID={`${testID}::${index}::QuantityAndUnit`}
            variant='bodyLarge'
            style={{ color: colors.onSurfaceVariant }}
            accessible={true}
          >
            {formatQuantityForDisplay(item.quantity ?? '')} {item.unit}
          </Text>
          <Text
            testID={`${testID}::${index}::IngredientName`}
            variant='bodyLarge'
            accessible={true}
          >
            {item.name}
            {item.note && (
              <Text
                testID={`${testID}::${index}::Note`}
                variant='bodyLarge'
                style={{ color: colors.outline }}
              >
                {` (${item.note})`}
              </Text>
            )}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Editable ingredients component (internal)
 *
 * Used by both editable and add modes. Displays ingredients in a 3-column table
 * with editable quantity, unit display, and ingredient name autocomplete.
 * Notes can be edited via a dialog triggered by an icon button in the name column.
 */
function EditableIngredients(props: EditableIngredientsProps) {
  const {
    testID,
    ingredients,
    prefixText,
    columnTitles,
    onIngredientChange,
    onAddIngredient,
    onRemoveIngredient,
    noteInputPlaceholder,
    hideDropdown,
  } = props;
  const { ingredients: dbIngredients } = useRecipeDatabase();
  const { colors, fonts } = useTheme();
  const [noteDialogIndex, setNoteDialogIndex] = useState<number | null>(null);

  const usedIngredientNames = ingredients
    .map(ing => ing.name)
    .filter((name, idx, arr) => name && name.trim().length > 0 && arr.indexOf(name) === idx);

  const availableIngredients = dbIngredients
    .map(ingredient => ingredient.name)
    .filter(dbIngredient => !usedIngredientNames.includes(dbIngredient))
    .sort();

  /**
   * Handles changes to an ingredient's fields.
   * Formats the data using standard separators and calls the parent callback.
   */
  const handleIngredientChange = (
    index: number,
    quantity: number,
    unit: string,
    name: string,
    note?: string
  ) => {
    onIngredientChange(index, formatIngredientForCallback(quantity, unit, name, note));
  };

  /**
   * Handles saving a note from the note edit dialog.
   * Retrieves the current ingredient data and triggers an update with the new note.
   */
  const handleNoteDialogSave = (note: string) => {
    if (noteDialogIndex !== null) {
      const item = ingredients[noteDialogIndex];
      const quantity = parseIngredientQuantity(item.quantity);
      handleIngredientChange(
        noteDialogIndex,
        quantity,
        item.unit ?? '',
        item.name ?? '',
        note || undefined
      );
    }
  };

  const headerTestId = testID + '::Header';
  const dialogItem = noteDialogIndex !== null ? ingredients[noteDialogIndex] : null;

  const borderColor = colors.outline;
  const transparentBg = colors.elevation.level0;
  const titleFontSize = fonts.titleMedium.fontSize;

  return (
    <PrefixTextWrapper testID={testID} prefixText={prefixText}>
      <DataTable style={cellStyles.table} accessible={false}>
        <DataTable.Header style={{ borderBottomWidth: 0 }} accessible={false}>
          <DataTable.Title
            testID={headerTestId + '::Quantity'}
            style={[cellStyles.header, cellStyles.quantityCell, { borderColor }]}
            textStyle={[cellStyles.title, { fontSize: titleFontSize }]}
          >
            {columnTitles.column1}
          </DataTable.Title>
          <DataTable.Title
            testID={headerTestId + '::Unit'}
            style={[cellStyles.header, cellStyles.unitCell, { borderColor }]}
            textStyle={[cellStyles.title, { fontSize: titleFontSize }]}
          >
            {columnTitles.column2}
          </DataTable.Title>
          <DataTable.Title
            testID={headerTestId + '::Note'}
            style={[cellStyles.header, cellStyles.noteCell, { borderColor }]}
            textStyle={cellStyles.title}
          >
            {''}
          </DataTable.Title>
          <DataTable.Title
            testID={headerTestId + '::IngredientName'}
            style={[cellStyles.header, cellStyles.nameCell, { borderColor }]}
            textStyle={[cellStyles.title, { fontSize: titleFontSize }]}
          >
            {columnTitles.column3}
          </DataTable.Title>
          <DataTable.Title
            testID={headerTestId + '::Delete'}
            style={[cellStyles.header, cellStyles.deleteCell, { borderColor }]}
            textStyle={cellStyles.title}
          >
            {''}
          </DataTable.Title>
        </DataTable.Header>
        {ingredients.map((item, index) => {
          const quantity = parseIngredientQuantity(item.quantity);
          const hasNote = item.note && item.note.trim().length > 0;

          return (
            <DataTable.Row
              key={item.id ?? index}
              testID={`${testID}::${index}::Row`}
              style={{ borderBottomWidth: 0 }}
              accessible={false}
            >
              <DataTable.Cell style={cellStyles.quantityCell} accessible={false}>
                <NumericTextInput
                  testID={`${testID}::${index}::QuantityInput`}
                  value={Math.round(quantity * 100) / 100}
                  onChangeValue={newQuantity =>
                    handleIngredientChange(
                      index,
                      newQuantity,
                      item.unit ?? '',
                      item.name ?? '',
                      item.note
                    )
                  }
                  dense
                  mode='flat'
                  style={cellStyles.flex1}
                  textInputStyle={[cellStyles.flex1, { backgroundColor: transparentBg }]}
                />
              </DataTable.Cell>
              <DataTable.Cell
                style={[cellStyles.unitCell, { borderBottomColor: borderColor }]}
                accessible={false}
              >
                <Text
                  testID={`${testID}::${index}::Unit`}
                  variant='bodyLarge'
                  style={[cellStyles.flex1, { textAlign: 'center', textAlignVertical: 'center' }]}
                >
                  {item.unit}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell
                style={[cellStyles.noteCell, { borderBottomColor: borderColor }]}
                accessible={false}
              >
                <IconButton
                  testID={`${testID}::${index}::NoteButton`}
                  icon={hasNote ? Icons.commentEditOutline : Icons.commentPlusOutline}
                  iconColor={hasNote ? colors.primary : colors.onSurfaceVariant}
                  onPress={() => setNoteDialogIndex(index)}
                  size={20}
                />
              </DataTable.Cell>
              <DataTable.Cell style={cellStyles.nameCell} accessible={false}>
                <TextInputWithDropDown
                  testID={`${testID}::${index}::NameInput`}
                  value={item.name}
                  referenceTextArray={availableIngredients}
                  dense
                  mode='flat'
                  hideDropdown={hideDropdown}
                  onValidate={newName => {
                    if (!newName || newName.trim().length === 0) {
                      return;
                    }
                    handleIngredientChange(index, quantity, item.unit ?? '', newName, item.note);
                  }}
                  style={cellStyles.flex1}
                  textInputStyle={[cellStyles.flex1, { backgroundColor: transparentBg }]}
                />
              </DataTable.Cell>
              <DataTable.Cell
                style={[cellStyles.deleteCell, { borderBottomColor: borderColor }]}
                accessible={false}
              >
                <IconButton
                  testID={`${testID}::${index}::DeleteButton`}
                  icon={Icons.trashIcon}
                  iconColor={colors.error}
                  onPress={() => onRemoveIngredient(index)}
                  size={20}
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
        style={cellStyles.addButton}
      />

      <NoteEditDialog
        testId={testID}
        isVisible={noteDialogIndex !== null}
        ingredientName={dialogItem?.name ?? ''}
        initialNote={dialogItem?.note ?? ''}
        placeholder={noteInputPlaceholder}
        onClose={() => setNoteDialogIndex(null)}
        onSave={handleNoteDialogSave}
      />
    </PrefixTextWrapper>
  );
}

/**
 * Add mode ingredients component with OCR support.
 *
 * Displays either an empty state with OCR/manual entry buttons, or delegates
 * to EditableIngredients when ingredients already exist. Used during recipe
 * creation via OCR workflow.
 *
 * Empty state buttons:
 * - Scan icon: Opens OCR modal for image-based ingredient extraction
 * - Pencil icon: Adds a blank ingredient row for manual entry
 *
 * @param props - AddProps including openModal callback for OCR
 * @returns JSX element for add mode ingredient management
 */
function AddIngredients(props: AddProps) {
  const {
    testID,
    ingredients,
    prefixText,
    openModal,
    onAddIngredient,
    onRemoveIngredient,
    columnTitles,
    onIngredientChange,
    noteInputPlaceholder,
    hideDropdown,
  } = props;

  if (ingredients.length === 0) {
    return (
      <PrefixTextWrapper testID={testID} prefixText={prefixText}>
        <View style={cellStyles.roundButtonsContainer}>
          <RoundButton
            testID={`${testID}::OpenModal`}
            style={cellStyles.roundButton}
            size='medium'
            icon={Icons.scanImageIcon}
            onPressFunction={openModal}
          />
          <RoundButton
            testID={`${testID}::AddButton`}
            style={cellStyles.roundButton}
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
      onRemoveIngredient={onRemoveIngredient}
      noteInputPlaceholder={noteInputPlaceholder}
      hideDropdown={hideDropdown}
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
          onRemoveIngredient={props.onRemoveIngredient}
          noteInputPlaceholder={props.noteInputPlaceholder}
          hideDropdown={props.hideDropdown}
        />
      );
  }
}

const recipeTableBorderWidth = 0.5;

const recipeTableFlex = {
  quantity: 1,
  unit: 0.8,
  note: 0.5,
  name: 1.8,
  delete: 0.4,
};

const cellStyles = StyleSheet.create({
  container: {
    paddingHorizontal: padding.medium,
    paddingVertical: padding.small,
  },
  prefixText: { marginVertical: padding.verySmall } as TextStyle,
  table: { paddingVertical: padding.medium } as ViewStyle,
  header: {
    flex: 1,
    justifyContent: 'center',
    borderBottomWidth: recipeTableBorderWidth,
  } as ViewStyle,
  title: { fontWeight: 'bold' } as TextStyle,
  flex1: { flex: 1 },
  addButton: { marginVertical: padding.medium } as ViewStyle,
  roundButtonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginVertical: padding.medium,
  } as ViewStyle,
  roundButton: { flex: 1, justifyContent: 'center', alignItems: 'center' } as ViewStyle,
  quantityCell: { flex: recipeTableFlex.quantity, alignItems: 'stretch' } as ViewStyle,
  unitCell: {
    flex: recipeTableFlex.unit,
    justifyContent: 'center',
    alignItems: 'stretch',
    borderBottomWidth: recipeTableBorderWidth,
  } as ViewStyle,
  noteCell: {
    flex: recipeTableFlex.note,
    justifyContent: 'center',
    borderBottomWidth: recipeTableBorderWidth,
  } as ViewStyle,
  nameCell: { flex: recipeTableFlex.name, alignItems: 'stretch' } as ViewStyle,
  deleteCell: {
    flex: recipeTableFlex.delete,
    justifyContent: 'center',
    borderBottomWidth: recipeTableBorderWidth,
  } as ViewStyle,
  readOnlyContainer: { paddingHorizontal: padding.medium } as ViewStyle,
  readOnlyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: padding.small,
    paddingVertical: padding.verySmall,
  } as ViewStyle,
});

export default RecipeIngredients;
