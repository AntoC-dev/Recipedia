/**
 * RecipeIngredients - Ingredient table display + editable building blocks
 *
 * This file exposes the pieces the Recipe screen composes for ingredients.
 * The recipe form drives row-level state through per-row `useController`
 * subscriptions, so the organism no longer owns the array orchestration.
 * Instead it provides:
 *
 * - `RecipeIngredients` (default): read-only render of an ingredient array.
 * - `IngredientsTable`: prefix-text + DataTable frame around the mapped rows, with
 *   an add-row button or, with `withScan`, the OCR button row.
 * - `IngredientRow`: a single editable row with blur-commit quantity + name
 *   inputs, note dialog trigger, and delete button.
 * - `IngredientsOcrButtons`: the shared `addOCR` button row (scan names,
 *   optional scan quantities, add manually).
 * - `IngredientsAddEmpty`: the empty-state block rendered in `addOCR` mode
 *   before any ingredient exists: prefix label + `IngredientsOcrButtons`
 *   without the quantities button.
 *
 * @module components/organisms/RecipeIngredients
 */

import React from 'react';
import { StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { DataTable, HelperText, IconButton, Text, useTheme } from 'react-native-paper';
import { FormIngredientElement, ingredientTableElement } from '@customTypes/DatabaseElementTypes';
import { RoundButton } from '@components/atomic/RoundButton';
import { ScanButton } from '@components/molecules/ScanButton';
import { Icons, iconsSize } from '@assets/Icons';
import { NumericTextInput } from '@components/atomic/NumericTextInput';
import { TextInputWithDropDown } from '@components/molecules/TextInputWithDropDown';
import {
  formatIngredientForCallback,
  formatQuantityForDisplay,
  parseIngredientQuantity,
} from '@utils/Quantity';
import { padding } from '@styles/spacing';
import { recipeButtonStyles } from '@styles/recipeComponents';

/**
 * Read-only display of an ingredient list.
 */
export interface RecipeIngredientsProps {
  testID: string;
  ingredients: ingredientTableElement[];
}

export function RecipeIngredients({ testID, ingredients }: RecipeIngredientsProps) {
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

export interface IngredientsTableColumnTitles {
  column1: string;
  column2: string;
  column3: string;
}

/**
 * The prefix label + DataTable header frame. Renders any mapped row children
 * the caller passes, plus an optional add button below the table.
 */
export interface IngredientsTableProps {
  testID: string;
  prefixText: string;
  columnTitles: IngredientsTableColumnTitles;
  children: React.ReactNode;
  /** Replaces the add-row button with the OCR scan buttons (OCR mode). */
  withScan?: boolean;
  /** Caption rendered under the add-ingredient round button. */
  addIngredientButtonLabel: string;
  /** Caption of the manual add button shown next to the scan buttons. */
  addManuallyButtonLabel: string;
  onAddIngredient?: () => void;
  /** Optional error rendered below the table (e.g. empty-array message). */
  error?: string;
}

export function IngredientsTable({
  testID,
  prefixText,
  columnTitles,
  children,
  withScan,
  addIngredientButtonLabel,
  addManuallyButtonLabel,
  onAddIngredient,
  error,
}: IngredientsTableProps) {
  const { colors, fonts } = useTheme();
  const borderColor = colors.outline;
  const titleFontSize = fonts.titleMedium.fontSize;
  const headerTestId = testID + '::Header';

  return (
    <View style={cellStyles.container} accessible={false}>
      <Text testID={`${testID}::PrefixText`} variant='headlineSmall' style={cellStyles.prefixText}>
        {prefixText}
      </Text>
      <DataTable style={cellStyles.table} accessible={false}>
        <DataTable.Header
          style={[cellStyles.tableLine, cellStyles.noBottomBorder]}
          accessible={false}
        >
          <DataTable.Title
            testID={headerTestId + '::IngredientName'}
            style={[cellStyles.header, cellStyles.nameCell, { borderColor }]}
            textStyle={{ fontSize: titleFontSize }}
          >
            {columnTitles.column3}
          </DataTable.Title>
          <DataTable.Title
            testID={headerTestId + '::Quantity'}
            style={[cellStyles.header, cellStyles.quantityCell, { borderColor }]}
            textStyle={{ fontSize: titleFontSize }}
          >
            {columnTitles.column1}
          </DataTable.Title>
          <DataTable.Title
            testID={headerTestId + '::Unit'}
            style={[cellStyles.header, cellStyles.unitCell, { borderColor }]}
            textStyle={{ fontSize: titleFontSize }}
          >
            {columnTitles.column2}
          </DataTable.Title>
          <DataTable.Title
            testID={headerTestId + '::Note'}
            style={[cellStyles.header, cellStyles.iconCell, { borderColor }]}
          >
            {''}
          </DataTable.Title>
          <DataTable.Title
            testID={headerTestId + '::Delete'}
            style={[cellStyles.header, cellStyles.iconCell, { borderColor }]}
          >
            {''}
          </DataTable.Title>
        </DataTable.Header>
        {children}
      </DataTable>

      {withScan && onAddIngredient ? (
        <IngredientsOcrButtons
          testID={testID}
          addManuallyButtonLabel={addManuallyButtonLabel}
          onAddIngredient={onAddIngredient}
          withQuantities
        />
      ) : null}
      {!withScan && onAddIngredient ? (
        <RoundButton
          testID={`${testID}::AddButton`}
          icon={Icons.plusIcon}
          onPressFunction={onAddIngredient}
          label={addIngredientButtonLabel}
          style={cellStyles.addButton}
        />
      ) : null}

      {error ? (
        <HelperText testID={`${testID}::Error`} type='error' visible={true}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

/**
 * Single editable ingredient row. Commits via the provided callbacks on blur
 * only — no per-keystroke writes. The caller wires the commit callbacks to a
 * per-row form controller so a row edit never re-renders sibling rows.
 */
export interface IngredientRowProps {
  testID: string;
  index: number;
  ingredient: ingredientTableElement | FormIngredientElement;
  availableIngredients: string[];
  rowError?: string;
  /**
   * Single commit callback fired with the row's formatted ingredient string
   * after the user blurs an input or saves the note dialog. The caller is
   * responsible for parsing the string back into per-field commits.
   */
  onCommit: (formatted: string) => void;
  /**
   * Live-commit callback fired on every keystroke in the name input. Wired to
   * the column controller's `field.onChange` so RHF stays in sync with what
   * the user is typing without waiting for blur. Optional — consumers that
   * only need the validation-queue commit semantics can rely on `onCommit`.
   */
  onLiveNameChange?: (name: string) => void;
  /**
   * Fired when the user picks an ingredient from the name autocomplete
   * dropdown. Distinct from `onCommit`: the selection must always re-resolve
   * the row against the database (id / type / season), even when the name
   * already matches what live-commit wrote — so the consumer forces a fresh
   * validation pass rather than short-circuiting on an unchanged name.
   */
  onSelectName?: (name: string) => void;
  onRemove: () => void;
  onOpenNote: () => void;
  /** Optional focus handler called when any row input gains focus. */
  onFocus?: () => void;
  /** Optional blur handler called when any row input loses focus. */
  onBlur?: () => void;
}

export function IngredientRow({
  testID,
  index,
  ingredient,
  availableIngredients,
  rowError,
  onCommit,
  onLiveNameChange,
  onSelectName,
  onRemove,
  onOpenNote,
  onFocus,
  onBlur,
}: IngredientRowProps) {
  const { colors } = useTheme();
  const borderColor = colors.outline;
  const transparentBg = colors.elevation.level0;
  const quantity = parseIngredientQuantity(ingredient.quantity);
  const hasNote = ingredient.note && ingredient.note.trim().length > 0;

  const commit = (next: { quantity?: number; unit?: string; name?: string; note?: string }) => {
    onCommit(
      formatIngredientForCallback(
        next.quantity ?? quantity,
        next.unit ?? ingredient.unit ?? '',
        next.name ?? ingredient.name ?? '',
        next.note ?? ingredient.note
      )
    );
  };

  const trailingCells = (
    <React.Fragment>
      <DataTable.Cell style={cellStyles.quantityCell} accessible={false}>
        <NumericTextInput
          testID={`${testID}::${index}::QuantityInput`}
          value={Math.round(quantity * 100) / 100}
          onChangeValue={newQuantity => commit({ quantity: newQuantity })}
          onFocus={onFocus}
          onBlur={onBlur}
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
          {ingredient.unit}
        </Text>
      </DataTable.Cell>
      <DataTable.Cell
        style={[cellStyles.iconCell, { borderBottomColor: borderColor }]}
        accessible={false}
      >
        <IconButton
          testID={`${testID}::${index}::NoteButton`}
          icon={hasNote ? Icons.commentEditOutline : Icons.commentPlusOutline}
          iconColor={hasNote ? colors.primary : colors.onSurfaceVariant}
          onPress={onOpenNote}
          size={iconsSize.medium}
          style={cellStyles.iconButton}
        />
      </DataTable.Cell>
      <DataTable.Cell
        style={[cellStyles.iconCell, { borderBottomColor: borderColor }]}
        accessible={false}
      >
        <IconButton
          testID={`${testID}::${index}::DeleteButton`}
          icon={Icons.trashIcon}
          iconColor={colors.error}
          onPress={onRemove}
          size={iconsSize.medium}
          style={cellStyles.iconButton}
        />
      </DataTable.Cell>
    </React.Fragment>
  );

  function renderRow(nameInput: React.ReactElement, dropdown: React.ReactElement | null) {
    return (
      <React.Fragment>
        <DataTable.Row
          testID={`${testID}::${index}::Row`}
          style={[cellStyles.tableLine, cellStyles.noBottomBorder]}
          accessible={false}
        >
          <DataTable.Cell style={cellStyles.nameCell} accessible={false}>
            {nameInput}
          </DataTable.Cell>
          {trailingCells}
        </DataTable.Row>
        {dropdown ? <View style={cellStyles.tableLine}>{dropdown}</View> : null}
        {rowError ? (
          <HelperText testID={`${testID}::${index}::Error`} type='error' visible={true}>
            {rowError}
          </HelperText>
        ) : null}
      </React.Fragment>
    );
  }

  return (
    <TextInputWithDropDown
      testID={`${testID}::${index}::NameInput`}
      value={ingredient.name}
      referenceTextArray={availableIngredients}
      dense
      mode='flat'
      renderLayout={renderRow}
      onFocus={onFocus}
      onChangeText={onLiveNameChange}
      onSelect={newName => {
        if (newName && newName.trim().length > 0) {
          onSelectName?.(newName);
        }
        onBlur?.();
      }}
      onValidate={newName => {
        if (newName && newName.trim().length > 0) {
          commit({ name: newName });
        }
        onBlur?.();
      }}
      style={cellStyles.flex1}
      textInputStyle={[cellStyles.flex1, { backgroundColor: transparentBg }]}
    />
  );
}

/**
 * OCR button row for `addOCR` mode: scan ingredient names, optionally scan
 * quantities for existing names, and add a manual row. The names scan button is
 * always rendered; the quantities one requires `withQuantities`.
 */
export interface IngredientsOcrButtonsProps {
  testID: string;
  addManuallyButtonLabel: string;
  onAddIngredient: () => void;
  /** Renders the scan-quantities button next to the scan-names one */
  withQuantities?: boolean;
}

export function IngredientsOcrButtons({
  testID,
  addManuallyButtonLabel,
  onAddIngredient,
  withQuantities,
}: IngredientsOcrButtonsProps) {
  return (
    <View style={recipeButtonStyles.roundButtonsContainer}>
      <ScanButton
        testID={`${testID}::OpenModalNames`}
        field='ingredientNames'
        style={recipeButtonStyles.roundButton}
      />
      {withQuantities ? (
        <ScanButton
          testID={`${testID}::OpenModalQuantities`}
          field='ingredientQuantities'
          style={recipeButtonStyles.roundButton}
        />
      ) : null}
      <RoundButton
        testID={`${testID}::AddButton`}
        style={recipeButtonStyles.roundButton}
        icon={Icons.pencilIcon}
        onPressFunction={onAddIngredient}
        label={addManuallyButtonLabel}
      />
    </View>
  );
}

/**
 * Empty-state add block for `addOCR` mode: prefix label, the shared OCR button
 * row (names scan + manual add) and an optional error.
 */
export interface IngredientsAddEmptyProps {
  testID: string;
  prefixText: string;
  addManuallyButtonLabel: string;
  onAddIngredient: () => void;
  error?: string;
}

export function IngredientsAddEmpty({
  testID,
  prefixText,
  addManuallyButtonLabel,
  onAddIngredient,
  error,
}: IngredientsAddEmptyProps) {
  return (
    <View style={cellStyles.container} accessible={false}>
      <Text testID={`${testID}::PrefixText`} variant='headlineSmall' style={cellStyles.prefixText}>
        {prefixText}
      </Text>
      <IngredientsOcrButtons
        testID={testID}
        addManuallyButtonLabel={addManuallyButtonLabel}
        onAddIngredient={onAddIngredient}
      />
      {error ? (
        <HelperText testID={`${testID}::Error`} type='error' visible={true}>
          {error}
        </HelperText>
      ) : null}
    </View>
  );
}

const recipeTableBorderWidth = 0.5;

const recipeTableFlex = {
  name: 1.6,
  quantity: 1,
  unit: 1,
};

const paperIconButtonPadding = 8;
const recipeTableIconColumnWidth = iconsSize.medium + 2 * paperIconButtonPadding;

const cellStyles = StyleSheet.create({
  container: {
    paddingHorizontal: padding.medium,
    paddingVertical: padding.small,
  },
  prefixText: { marginVertical: padding.verySmall } as TextStyle,
  table: { paddingVertical: padding.medium } as ViewStyle,
  header: {
    justifyContent: 'center',
    borderBottomWidth: recipeTableBorderWidth,
  } as ViewStyle,
  flex1: { flex: 1 },
  noBottomBorder: { borderBottomWidth: 0 } as ViewStyle,
  addButton: { marginVertical: padding.medium } as ViewStyle,
  quantityCell: { flex: recipeTableFlex.quantity, alignItems: 'stretch' } as ViewStyle,
  unitCell: {
    flex: recipeTableFlex.unit,
    justifyContent: 'center',
    alignItems: 'stretch',
    borderBottomWidth: recipeTableBorderWidth,
  } as ViewStyle,
  iconCell: {
    flex: 0,
    width: recipeTableIconColumnWidth,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: recipeTableBorderWidth,
  } as ViewStyle,
  tableLine: { paddingHorizontal: padding.small } as ViewStyle,
  iconButton: { margin: 0 } as ViewStyle,
  nameCell: { flex: recipeTableFlex.name, alignItems: 'stretch' } as ViewStyle,
  readOnlyContainer: { paddingHorizontal: padding.medium } as ViewStyle,
  readOnlyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: padding.small,
    paddingVertical: padding.verySmall,
  } as ViewStyle,
});
