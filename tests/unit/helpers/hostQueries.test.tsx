import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { render } from '@testing-library/react-native';
import {
  queryAllByHostType,
  SCROLL_VIEW_HOST_TYPE,
  VIEW_HOST_TYPE,
} from '@test-helpers/hostQueries';

describe('queryAllByHostType', () => {
  test('returns every scroll view host element in tree order', async () => {
    const { container } = await render(
      <View>
        <ScrollView testID='first' />
        <ScrollView testID='second' horizontal />
      </View>
    );

    expect(
      queryAllByHostType(container, SCROLL_VIEW_HOST_TYPE).map(scroll => scroll.props.testID)
    ).toEqual(['first', 'second']);
  });

  test('returns an empty list when no element has the host type', async () => {
    const { container } = await render(<Text>plain</Text>);

    expect(queryAllByHostType(container, SCROLL_VIEW_HOST_TYPE)).toEqual([]);
  });

  test('excludes the container itself', async () => {
    const { container } = await render(<View testID='only' />);

    expect(queryAllByHostType(container, VIEW_HOST_TYPE).map(view => view.props.testID)).toEqual([
      'only',
    ]);
  });
});
