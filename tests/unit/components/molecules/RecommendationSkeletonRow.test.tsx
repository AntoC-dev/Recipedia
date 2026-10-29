import React from 'react';
import { render } from '@testing-library/react-native';
import { RecommendationSkeletonRow } from '@components/molecules/RecommendationSkeletonRow';
import {
  queryAllByHostType,
  SCROLL_VIEW_HOST_TYPE,
  VIEW_HOST_TYPE,
} from '@test-helpers/hostQueries';

describe('RecommendationSkeletonRow Component', () => {
  test('renders without crashing', async () => {
    const { toJSON } = await render(<RecommendationSkeletonRow />);

    expect(toJSON()).toBeTruthy();
  });

  test('renders three card placeholders', async () => {
    const { container } = await render(<RecommendationSkeletonRow />);

    const views = queryAllByHostType(container, VIEW_HOST_TYPE);

    expect(views.length).toBeGreaterThanOrEqual(4);
  });

  test('renders a horizontal scroll view for card placeholders', async () => {
    const { container } = await render(<RecommendationSkeletonRow />);

    const scrollViews = queryAllByHostType(container, SCROLL_VIEW_HOST_TYPE);

    expect(scrollViews.length).toBe(1);
    expect(scrollViews[0]!.props.horizontal).toBe(true);
    expect(scrollViews[0]!.props.scrollEnabled).toBe(false);
  });

  test('renders an animated view as root', async () => {
    const { container, getAllByTestId } = await render(<RecommendationSkeletonRow />);

    const animatedViews = getAllByTestId('RecommendationSkeletonRow');

    expect(animatedViews).toHaveLength(1);
    expect(container.children[0]).toBe(animatedViews[0]);
  });

  test('can render multiple instances independently', async () => {
    const { toJSON: toJSON1 } = await render(<RecommendationSkeletonRow />);
    const { toJSON: toJSON2 } = await render(<RecommendationSkeletonRow />);
    const { toJSON: toJSON3 } = await render(<RecommendationSkeletonRow />);

    expect(toJSON1()).toBeTruthy();
    expect(toJSON2()).toBeTruthy();
    expect(toJSON3()).toBeTruthy();
  });
});
