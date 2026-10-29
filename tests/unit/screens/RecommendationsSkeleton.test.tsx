import React from 'react';
import { render } from '@testing-library/react-native';
import { RecommendationsSkeleton } from '@screens/Home';

describe('RecommendationsSkeleton', () => {
  test('renders without crashing', async () => {
    const { toJSON } = await render(<RecommendationsSkeleton />);

    expect(toJSON()).toBeTruthy();
  });

  test('renders three skeleton rows', async () => {
    const { getAllByTestId } = await render(<RecommendationsSkeleton />);

    expect(getAllByTestId('RecommendationSkeletonRow')).toHaveLength(3);
  });
});
