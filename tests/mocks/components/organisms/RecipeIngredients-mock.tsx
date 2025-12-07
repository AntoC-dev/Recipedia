import {Button, Text, View} from 'react-native';
import React from 'react';
import {RecipeIngredientsProps} from '@components/organisms/RecipeIngredients';
import {formatQuantityForDisplay} from '@utils/Quantity';

function formatNumericQuantity(quantity: string | number | undefined): string {
    if (quantity === undefined || quantity === '') return '';
    const num = typeof quantity === 'number' ? quantity : parseFloat(String(quantity).replace(',', '.'));
    if (isNaN(num)) return String(quantity);
    const rounded = Math.round(num * 100) / 100;
    return rounded.toString();
}

export function recipeIngredientsMock(props: RecipeIngredientsProps) {
  const { testID, ingredients, mode } = props;

  return (
    <View testID={testID}>
      <Text testID={`${testID}::Mode`}>{mode}</Text>
      <Text testID={`${testID}::Ingredients`}>{JSON.stringify(ingredients)}</Text>
      {'prefixText' in props && <Text testID={`${testID}::PrefixText`}>{props.prefixText}</Text>}
      {'columnTitles' in props && props.columnTitles && (
        <View>
          <Text testID={`${testID}::ColumnTitle1`}>{props.columnTitles.column1}</Text>
          <Text testID={`${testID}::ColumnTitle2`}>{props.columnTitles.column2}</Text>
          <Text testID={`${testID}::ColumnTitle3`}>{props.columnTitles.column3}</Text>
        </View>
      )}
      {ingredients.map((ingredient, index) => (
        <View key={index} testID={`${testID}::${index}::Row`}>
          {mode === 'readOnly' ? (
            <>
              <Text testID={`${testID}::${index}::QuantityAndUnit`}>
                  {`${formatQuantityForDisplay(String(ingredient.quantity ?? ''))} ${ingredient.unit}`}
              </Text>
              <Text testID={`${testID}::${index}::IngredientName`}>{ingredient.name}</Text>
            </>
          ) : (
            <>
                <Text testID={`${testID}::${index}::QuantityInput`}>
                    {formatNumericQuantity(ingredient.quantity)}
                </Text>
              <Text testID={`${testID}::${index}::UnitInput::CustomTextInput`}>
                {ingredient.unit}
              </Text>
              <Text testID={`${testID}::${index}::NameInput::TextInputWithDropdown::Value`}>
                {ingredient.name}
              </Text>
            </>
          )}
        </View>
      ))}
      {'openModal' in props && ingredients.length === 0 && (
        <>
          <Button
            testID={`${testID}::OpenModal::RoundButton::OnPressFunction`}
            onPress={props.openModal}
            title='Open Modal'
          />
          <Text testID={`${testID}::OpenModal::RoundButton::Icon`}>line-scan</Text>
        </>
      )}
      {'onAddIngredient' in props && (
        <>
          <Button
            testID={`${testID}::AddButton::RoundButton::OnPressFunction`}
            onPress={props.onAddIngredient}
            title='Add Ingredient'
          />
          <Text testID={`${testID}::AddButton::RoundButton::Icon`}>
            {mode === 'add' && ingredients.length === 0 ? 'pencil' : 'plus'}
          </Text>
        </>
      )}
    </View>
  );
}
