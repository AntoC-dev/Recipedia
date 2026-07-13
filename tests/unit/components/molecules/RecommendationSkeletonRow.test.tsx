import React from 'react';
import { render } from '@testing-library/react-native';
import { RecommendationSkeletonRow } from '@components/molecules/RecommendationSkeletonRow';

describe('RecommendationSkeletonRow Component', () => {
  test('renders without crashing', () => {
    const { toJSON } = render(<RecommendationSkeletonRow />);

    expect(toJSON()).toBeTruthy();
  });

  test('renders three card placeholders', () => {
    const { UNSAFE_getAllByType } = render(<RecommendationSkeletonRow />);

    const { View } = require('react-native');
    const views = UNSAFE_getAllByType(View);

    expect(views.length).toBeGreaterThanOrEqual(4);
  });

  test('renders a horizontal scroll view for card placeholders', () => {
    const { UNSAFE_getAllByType } = render(<RecommendationSkeletonRow />);

    const { ScrollView } = require('react-native');
    const scrollViews = UNSAFE_getAllByType(ScrollView);

    expect(scrollViews.length).toBe(1);
    expect(scrollViews[0]!.props.horizontal).toBe(true);
    expect(scrollViews[0]!.props.scrollEnabled).toBe(false);
  });

  test('renders an animated view as root', () => {
    const { UNSAFE_getAllByType } = render(<RecommendationSkeletonRow />);

    const { Animated } = require('react-native');
    const animatedViews = UNSAFE_getAllByType(Animated.View);

    expect(animatedViews.length).toBe(1);
  });

  test('can render multiple instances independently', () => {
    const { toJSON: toJSON1 } = render(<RecommendationSkeletonRow />);
    const { toJSON: toJSON2 } = render(<RecommendationSkeletonRow />);
    const { toJSON: toJSON3 } = render(<RecommendationSkeletonRow />);

    expect(toJSON1()).toBeTruthy();
    expect(toJSON2()).toBeTruthy();
    expect(toJSON3()).toBeTruthy();
  });
});
