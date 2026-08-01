import React from 'react';
import { List } from 'react-native-paper';
import { padding } from '@styles/spacing';

/**
 * Props for the {@link SearchSuggestionItem} component.
 */
export type SearchSuggestionItemProps = {
  /** Unique identifier for testing and accessibility. */
  testId: string;
  /** Suggestion label displayed to the user. */
  title: string;
  /** Callback fired when the suggestion is tapped. */
  onSelect: () => void;
};

/**
 * A single tappable search suggestion rendered as a full-width list row.
 *
 * Rendered directly as an item of the Search screen's recipe list (rather than
 * inside a nested list) so a tap is delivered by a single scroll responder,
 * which keeps single-tap selection reliable while the keyboard is open.
 *
 * @param props - The suggestion label, selection callback and test id.
 * @returns JSX element representing one selectable search suggestion.
 */
export function SearchSuggestionItem({ testId, title, onSelect }: SearchSuggestionItemProps) {
  return (
    <List.Item
      testID={testId}
      title={title}
      onPress={onSelect}
      style={{ padding: padding.veryLarge }}
    />
  );
}
