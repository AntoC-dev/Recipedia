import { Button, Text, View } from 'react-native';
import React from 'react';
import {
  IngredientRowProps,
  IngredientsAddEmptyProps,
  IngredientsAddTailProps,
  IngredientsTableProps,
  RecipeIngredientsProps,
} from '@components/organisms/RecipeIngredients';
import { ErrorEcho } from './_recipeFieldMockHelpers';

function formatNumericQuantity(quantity: string | number | undefined): string {
  if (quantity === undefined || quantity === '') return '';
  const num =
    typeof quantity === 'number' ? quantity : parseFloat(String(quantity).replace(',', '.'));
  if (isNaN(num)) return String(quantity);
  const rounded = Math.round(num * 100) / 100;
  return rounded.toString();
}

export function recipeIngredientsMock({ testID, ingredients }: RecipeIngredientsProps) {
  return (
    <View testID={testID}>
      <Text testID={`${testID}::Ingredients`}>{JSON.stringify(ingredients)}</Text>
      {ingredients.map((ingredient, index) => (
        <View key={index} testID={`${testID}::${index}::Row`}>
          <Text testID={`${testID}::${index}::QuantityAndUnit`}>
            {`${formatNumericQuantity(ingredient.quantity)} ${ingredient.unit}`}
          </Text>
          <Text testID={`${testID}::${index}::IngredientName`}>{ingredient.name}</Text>
          {ingredient.note ? (
            <Text testID={`${testID}::${index}::Note`}>{ingredient.note}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

export function ingredientsTableMock({
  testID,
  prefixText,
  columnTitles,
  children,
  hideAddButton,
  onAddIngredient,
  error,
}: IngredientsTableProps) {
  return (
    <View testID={testID}>
      <Text testID={`${testID}::PrefixText`}>{prefixText}</Text>
      <Text testID={`${testID}::ColumnTitle1`}>{columnTitles.column1}</Text>
      <Text testID={`${testID}::ColumnTitle2`}>{columnTitles.column2}</Text>
      <Text testID={`${testID}::ColumnTitle3`}>{columnTitles.column3}</Text>
      {children}
      {!hideAddButton && onAddIngredient ? (
        <>
          <Button
            testID={`${testID}::AddButton::RoundButton::OnPressFunction`}
            onPress={onAddIngredient}
            title='Add Ingredient'
          />
          <Text testID={`${testID}::AddButton::RoundButton::Icon`}>plus</Text>
        </>
      ) : null}
      <ErrorEcho testID={testID} error={error} />
    </View>
  );
}

export function ingredientRowMock({
  testID,
  index,
  ingredient,
  rowError,
  onCommit,
  onLiveNameChange,
  onSelectName,
  onRemove,
  onOpenNote,
  onFocus,
  onBlur,
}: IngredientRowProps) {
  return (
    <View testID={`${testID}::${index}::Row`}>
      <Text testID={`${testID}::${index}::QuantityInput`}>
        {formatNumericQuantity(ingredient.quantity)}
      </Text>
      <Text testID={`${testID}::${index}::UnitInput::CustomTextInput`}>
        {ingredient.unit ?? ''}
      </Text>
      <Text testID={`${testID}::${index}::NameInput::Value`}>{ingredient.name ?? ''}</Text>
      <Text testID={`${testID}::${index}::NameInput::TextInputWithDropdown::Value`}>
        {ingredient.name ?? ''}
      </Text>
      <Button
        testID={`${testID}::${index}::OnIngredientChange`}
        onPress={value => onCommit(value as unknown as string)}
        title={`Commit row ${index}`}
      />
      <Button
        testID={`${testID}::${index}::OnLiveNameChange`}
        onPress={value => onLiveNameChange?.(value as unknown as string)}
        title={`Live name change row ${index}`}
      />
      <Button
        testID={`${testID}::${index}::OnSelectName`}
        onPress={value => onSelectName?.(value as unknown as string)}
        title={`Select name row ${index}`}
      />
      <Button
        testID={`${testID}::${index}::OnRemoveIngredient`}
        onPress={onRemove}
        title={`Remove row ${index}`}
      />
      <Button
        testID={`${testID}::${index}::NoteButton`}
        onPress={onOpenNote}
        title={`Open note ${index}`}
      />
      {onFocus ? (
        <Button
          testID={`${testID}::${index}::OnFocus`}
          onPress={onFocus}
          title={`Focus ${index}`}
        />
      ) : null}
      {onBlur ? (
        <Button testID={`${testID}::${index}::OnBlur`} onPress={onBlur} title={`Blur ${index}`} />
      ) : null}
      <ErrorEcho testID={`${testID}::${index}`} error={rowError} />
    </View>
  );
}

export function ingredientsAddEmptyMock({
  testID,
  prefixText,
  openOcrModal,
  onAddIngredient,
  error,
}: IngredientsAddEmptyProps) {
  return (
    <View testID={testID}>
      <Text testID={`${testID}::PrefixText`}>{prefixText}</Text>
      <Button
        testID={`${testID}::OpenModalNames::RoundButton::OnPressFunction`}
        onPress={openOcrModal}
        title='Open Modal Names'
      />
      <Text testID={`${testID}::OpenModalNames::RoundButton::Icon`}>line-scan</Text>
      <Button
        testID={`${testID}::AddButton::RoundButton::OnPressFunction`}
        onPress={onAddIngredient}
        title='Add Ingredient'
      />
      <Text testID={`${testID}::AddButton::RoundButton::Icon`}>pencil</Text>
      <ErrorEcho testID={testID} error={error} />
    </View>
  );
}

export function ingredientsAddTailMock({
  testID,
  openOcrModal,
  onAddIngredient,
}: IngredientsAddTailProps) {
  return (
    <View testID={`${testID}::AddTail`}>
      <Button
        testID={`${testID}::OpenModalQuantities::RoundButton::OnPressFunction`}
        onPress={openOcrModal}
        title='Open Modal Quantities'
      />
      <Text testID={`${testID}::OpenModalQuantities::RoundButton::Icon`}>line-scan</Text>
      <Button
        testID={`${testID}::AddButton::RoundButton::OnPressFunction`}
        onPress={onAddIngredient}
        title='Add Ingredient'
      />
      <Text testID={`${testID}::AddButton::RoundButton::Icon`}>pencil</Text>
    </View>
  );
}
