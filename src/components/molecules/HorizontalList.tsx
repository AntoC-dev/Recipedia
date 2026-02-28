/**
 * HorizontalList - Flexible multi-line list component for tags and images
 *
 * A versatile component that displays lists of items in a wrapping horizontal layout.
 * Supports two distinct modes: tag chips for text-based content and image buttons
 * for visual content. Uses discriminated union types for type safety and renders
 * appropriate components based on the content type.
 *
 * Key Features:
 * - Two display modes: Tag chips and Image buttons
 * - Multi-line wrapping layout for optimal space usage
 * - Type-safe discriminated union props
 * - Optional click handlers for interactive lists
 * - Configurable icons for tag buttons
 * - Consistent spacing and styling
 * - Optimized for small to medium-sized lists
 *
 * @example
 * ```typescript
 * // Tag list with click handlers
 * <HorizontalList
 *   propType="Tag"
 *   item={['vegetarian', 'gluten-free', 'dairy-free']}
 *   icon="close"
 *   onPress={(tag) => removeTag(tag)}
 *   testID="recipe-tags"
 * />
 *
 * // Image gallery list
 * <HorizontalList
 *   propType="Image"
 *   item={['/path/image1.jpg', '/path/image2.jpg']}
 *   onPress={(imagePath) => viewFullImage(imagePath)}
 *   testID="recipe-images"
 * />
 *
 * // Read-only tag display
 * <HorizontalList
 *   propType="Tag"
 *   item={['breakfast', 'quick', 'healthy']}
 *   testID="recipe-categories"
 * />
 * ```
 */

import { IconName } from '@assets/Icons';
import { SquareButton } from '@components/atomic/SquareButton';
import { smallCardWidth, viewButtonStyles } from '@styles/buttons';
import React from 'react';
import { View } from 'react-native';
import { TagButton } from '@components/atomic/TagButton';

/** Props for Tag mode */
export type TagProp = {
  propType: 'Tag';
  /** Array of tag strings to display */
  item: string[];
  /** Optional icon to display on tag buttons */
  icon?: IconName;
};

/** Props for Image mode */
export type ImageProp = {
  propType: 'Image';
  /** Array of image paths/URIs to display */
  item: string[];
};

/**
 * Props for HorizontalList component
 * Uses discriminated union for type safety between Tag and Image modes
 */
export type HorizontalListProps = {
  /** Type of content to display */
  propType: 'Tag' | 'Image';
  /** Optional callback fired when an item is pressed */
  onPress?: (elem: string) => void;
  /** Unique identifier for testing and accessibility */
  testID: string;
} & (TagProp | ImageProp);

/**
 * HorizontalList component for flexible content display
 *
 * @param props - The component props with discriminated union for type safety
 * @returns JSX element representing a multi-line wrapping list of tags or images
 */
export function HorizontalList(props: HorizontalListProps) {
  /**
   * Renders individual list items based on the content type
   * @param item - The item data to render
   * @param index - The index of the item in the array
   * @returns JSX element for the rendered item
   */
  function renderItem(item: string, index: number) {
    return (
      <View key={item} style={viewButtonStyles.viewContainingButton}>
        {props.propType === 'Tag' ? (
          <TagButton
            testID={props.testID + `::${index}`}
            text={item as string}
            rightIcon={props.icon}
            onPressFunction={() => props.onPress?.(item)}
          />
        ) : (
          <SquareButton
            testID={props.testID + `::List#${index}`}
            side={smallCardWidth}
            imgSrc={item}
            onPressFunction={() => props.onPress?.(item)}
            type={'image'}
          />
        )}
      </View>
    );
  }

  return (
    <View style={viewButtonStyles.wrappingListOfButton}>
      {/* FlatList doesn't respond to the dynamic multi-line behavior, so keep the mapping. This doesn't allow a lot of optimization, but the list will likely have a short number of elements. */}
      {props.item.map(renderItem)}
    </View>
  );
}

export default HorizontalList;
