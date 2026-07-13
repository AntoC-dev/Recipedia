import React from 'react';
import { Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import { ErrorBoundary, withErrorBoundary } from '@components/organisms/ErrorBoundary';
import { mockHideAsync } from '@mocks/deps/expo-splash-screen-mock';
import { mockReportCrash } from '@mocks/utils/bug-report-mock';

jest.mock('@utils/i18n', () => require('@mocks/utils/i18n-mock').i18nMock());

jest.mock('expo-splash-screen', () =>
  require('@mocks/deps/expo-splash-screen-mock').expoSplashScreenMock()
);

jest.mock('@utils/BugReport', () => require('@mocks/utils/bug-report-mock').bugReportMock());

function Boom({ crash }: { crash: boolean }): React.ReactElement {
  if (crash) {
    throw new Error('render exploded');
  }
  return <Text testID='SafeChild'>safe</Text>;
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockHideAsync.mockClear();
    mockReportCrash.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  test('renders children when no error thrown', () => {
    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary>
        <Boom crash={false} />
      </ErrorBoundary>
    );

    expect(getByTestId('SafeChild')).toBeTruthy();
    expect(queryByTestId('ErrorFallback')).toBeNull();
  });

  test('renders fallback when a child throws during render', () => {
    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary>
        <Boom crash={true} />
      </ErrorBoundary>
    );

    expect(getByTestId('ErrorFallback::Title')).toBeTruthy();
    expect(queryByTestId('SafeChild')).toBeNull();
  });

  test('hides the splash screen when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom crash={true} />
      </ErrorBoundary>
    );

    expect(mockHideAsync).toHaveBeenCalled();
  });

  test('swallows a splash-hide rejection without surfacing it', async () => {
    mockHideAsync.mockRejectedValueOnce(new Error('splash already hidden'));

    const { getByTestId } = render(
      <ErrorBoundary>
        <Boom crash={true} />
      </ErrorBoundary>
    );
    await Promise.resolve();

    expect(getByTestId('ErrorFallback::Title')).toBeTruthy();
  });

  test('does not hide the splash screen while children render normally', () => {
    render(
      <ErrorBoundary>
        <Boom crash={false} />
      </ErrorBoundary>
    );

    expect(mockHideAsync).not.toHaveBeenCalled();
  });

  test('forwards testID to fallback', () => {
    const { getByTestId } = render(
      <ErrorBoundary testID='RootBoundary'>
        <Boom crash={true} />
      </ErrorBoundary>
    );

    expect(getByTestId('RootBoundary')).toBeTruthy();
  });

  test('renders a report action and the recoverable message on first crash', () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <Boom crash={true} />
      </ErrorBoundary>
    );

    expect(getByTestId('ErrorFallback::Report')).toBeTruthy();
    expect(getByTestId('ErrorFallback::Message')).toHaveTextContent('errorBoundary.message');
  });

  test('reports the caught error and component stack when the report action is pressed', async () => {
    const { getByTestId } = render(
      <ErrorBoundary>
        <Boom crash={true} />
      </ErrorBoundary>
    );

    await act(async () => {
      fireEvent.press(getByTestId('ErrorFallback::Report'));
    });

    const [reportedError, componentStack] = mockReportCrash.mock.calls[0];
    expect(reportedError).toBeInstanceOf(Error);
    expect(reportedError.message).toBe('render exploded');
    expect(typeof componentStack).toBe('string');
    expect(componentStack.length).toBeGreaterThan(0);
  });

  test('recovers and re-renders children after reporting', async () => {
    let crashNext = true;
    const FlakyBoom = () => {
      if (crashNext) {
        throw new Error('render exploded');
      }
      return <Text testID='SafeChild'>safe</Text>;
    };
    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary>
        <FlakyBoom />
      </ErrorBoundary>
    );

    expect(getByTestId('ErrorFallback::Report')).toBeTruthy();

    crashNext = false;
    await act(async () => {
      fireEvent.press(getByTestId('ErrorFallback::Report'));
    });

    expect(getByTestId('SafeChild')).toBeTruthy();
    expect(queryByTestId('ErrorFallback')).toBeNull();
  });

  test('shows a persistent message with no action when the retry crashes again', async () => {
    const { getByTestId, queryByTestId } = render(
      <ErrorBoundary>
        <Boom crash={true} />
      </ErrorBoundary>
    );

    await act(async () => {
      fireEvent.press(getByTestId('ErrorFallback::Report'));
    });

    expect(queryByTestId('ErrorFallback::Report')).toBeNull();
    expect(getByTestId('ErrorFallback::Message')).toHaveTextContent(
      'errorBoundary.persistentMessage'
    );
  });

  test('stores a null component stack when React provides none', () => {
    const ref = React.createRef<ErrorBoundary>();
    render(
      <ErrorBoundary ref={ref}>
        <Boom crash={false} />
      </ErrorBoundary>
    );

    act(() => {
      ref.current?.componentDidCatch(new Error('boom'), { componentStack: null });
    });

    expect(ref.current?.state.componentStack).toBeNull();
  });

  test('reports a fallback error when no error is stored in state', async () => {
    const ref = React.createRef<ErrorBoundary>();
    render(
      <ErrorBoundary ref={ref}>
        <Boom crash={false} />
      </ErrorBoundary>
    );

    await act(async () => {
      await ref.current?.reportAndRecover();
    });

    expect(mockReportCrash).toHaveBeenCalledWith(expect.any(Error), null);
    expect(mockReportCrash.mock.calls[0][0].message).toBe('Unknown render error');
  });

  describe('withErrorBoundary', () => {
    test('renders wrapped component output when it does not throw', () => {
      const Guarded = withErrorBoundary(Boom);
      const { getByTestId } = render(<Guarded crash={false} />);

      expect(getByTestId('SafeChild')).toBeTruthy();
    });

    test('renders fallback when wrapped component throws', () => {
      const Guarded = withErrorBoundary(Boom, 'GuardedBoom');
      const { getByTestId } = render(<Guarded crash={true} />);

      expect(getByTestId('GuardedBoom')).toBeTruthy();
    });

    test('sets a descriptive displayName from the component name', () => {
      const Guarded = withErrorBoundary(Boom);

      expect(Guarded.displayName).toBe('withErrorBoundary(Boom)');
    });

    test('prefers an explicit displayName over the function name', () => {
      const Named = ({ crash }: { crash: boolean }) => <Boom crash={crash} />;
      Named.displayName = 'ExplicitName';

      const Guarded = withErrorBoundary(Named);

      expect(Guarded.displayName).toBe('withErrorBoundary(ExplicitName)');
    });

    test('falls back to "Component" for an anonymous component', () => {
      const nameless = jest.fn(() => null);
      Object.defineProperty(nameless, 'name', { value: '' });

      const Guarded = withErrorBoundary(nameless as unknown as React.ComponentType);

      expect(Guarded.displayName).toBe('withErrorBoundary(Component)');
    });
  });
});
