import React from 'react';
import { render } from '@testing-library/react-native';
import { RecommendationsSkeleton } from '@screens/Home';

describe('RecommendationsSkeleton', () => {
  test('renders without crashing', () => {
    const { toJSON } = render(<RecommendationsSkeleton />);

    expect(toJSON()).toBeTruthy();
  });

  test('renders three skeleton rows', () => {
    const { UNSAFE_getAllByType } = render(<RecommendationsSkeleton />);

    const { Animated } = require('react-native');
    const animatedViews = UNSAFE_getAllByType(Animated.View);

    expect(animatedViews.length).toBe(3);
  });
});
