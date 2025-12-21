/**
 * MenuRecipeCard - Card component for menu items
 *
 * Displays a recipe in the menu with its cooked status.
 * Features toggle for cooked status, navigation to recipe, and remove action.
 */

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Badge, Card, Checkbox, IconButton, Text, useTheme } from 'react-native-paper';
import { cardSizes, padding } from '@styles/spacing';
import { menuTableElement } from '@customTypes/DatabaseElementTypes';
import { StackScreenNavigation } from '@customTypes/ScreenTypes';
import { useNavigation } from '@react-navigation/native';
import { Icons } from '@assets/Icons';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';

export type MenuRecipeCardProps = {
  testId: string;
  menuItem: menuTableElement;
  onToggleCooked: () => void;
  onRemove: () => void;
};

export function MenuRecipeCard({
  testId,
  menuItem,
  onToggleCooked,
  onRemove,
}: MenuRecipeCardProps) {
  const { navigate } = useNavigation<StackScreenNavigation>();
  const { colors } = useTheme();
  const { recipes } = useRecipeDatabase();

  const handlePress = () => {
    const recipe = recipes.find(r => r.id === menuItem.recipeId);
    if (recipe) {
      navigate('Recipe', { mode: 'readOnly', recipe });
    }
  };

  return (
    <Card
      testID={testId}
      mode='outlined'
      style={[
        styles.card,
        {
          backgroundColor: menuItem.isCooked ? colors.surfaceVariant : colors.surface,
        },
      ]}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <Checkbox
          testID={`${testId}::Checkbox`}
          status={menuItem.isCooked ? 'checked' : 'unchecked'}
          onPress={onToggleCooked}
          color={colors.primary}
        />

        <View style={styles.imageContainer}>
          <Image
            testID={`${testId}::Cover`}
            source={{ uri: menuItem.imageSource }}
            style={[styles.image, { backgroundColor: colors.surfaceVariant }]}
          />
          {menuItem.count > 1 && (
            <Badge
              testID={`${testId}::CountBadge`}
              style={[styles.badge, { backgroundColor: colors.tertiary }]}
            >
              {menuItem.count}
            </Badge>
          )}
        </View>

        <Text
          testID={`${testId}::Title`}
          variant='titleMedium'
          numberOfLines={2}
          style={[styles.title, menuItem.isCooked && styles.cookedTitle]}
        >
          {menuItem.recipeTitle}
        </Text>

        <IconButton
          testID={`${testId}::RemoveButton`}
          icon={Icons.crossIcon}
          iconColor={colors.onSurfaceVariant}
          onPress={onRemove}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: padding.small,
    marginHorizontal: padding.large,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: padding.small,
  },
  imageContainer: {
    marginHorizontal: padding.small,
  },
  image: {
    width: cardSizes.thumbnailSize,
    aspectRatio: 1,
    borderRadius: padding.small,
  },
  badge: {
    position: 'absolute',
    top: -padding.verySmall,
    right: -padding.verySmall,
  },
  title: {
    flex: 1,
  },
  cookedTitle: {
    textDecorationLine: 'line-through',
  },
});

export default MenuRecipeCard;
