import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AdBanner, AdBannerProps } from '@components/organisms/AdBanner';

describe('AdBanner Component', () => {
  const defaultProps: AdBannerProps = {
    placement: 'home',
    testId: 'Test',
  };

  const originalNodeEnv = process.env.NODE_ENV;

  const renderAdBanner = (props: AdBannerProps = defaultProps) => {
    return render(<AdBanner {...props} />);
  };

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('when ads are enabled', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('renders banner container', async () => {
      const { getByTestId } = renderAdBanner();
      await waitFor(() => {
        expect(getByTestId('Test::AdBanner')).toBeTruthy();
      });
    });

    test('renders BannerAd with test ad unit ID in development', async () => {
      const { getByTestId } = renderAdBanner();
      await waitFor(() => {
        expect(getByTestId('BannerAd::UnitId').props.children).toBe(
          'ca-app-pub-3940256099942544/9214589741'
        );
      });
    });

    test('renders BannerAd with adaptive banner size', async () => {
      const { getByTestId } = renderAdBanner();
      await waitFor(() => {
        expect(getByTestId('BannerAd::Size').props.children).toBe('ANCHORED_ADAPTIVE_BANNER');
      });
    });

    test('uses custom testId correctly', async () => {
      const { getByTestId } = renderAdBanner({ placement: 'menu', testId: 'Custom' });
      await waitFor(() => {
        expect(getByTestId('Custom::AdBanner')).toBeTruthy();
      });
    });
  });

  describe('when ads are disabled', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    test('returns null', () => {
      const { queryByTestId } = renderAdBanner();
      expect(queryByTestId('Test::AdBanner')).toBeNull();
    });
  });
});
