/**
 * ErrorBoundary - React error boundary guarding a subtree against render crashes.
 *
 * Any error thrown while rendering, in a lifecycle method, or in a constructor of
 * a descendant is caught here, logged, and replaced by an {@link ErrorFallback}
 * recovery screen instead of unmounting the whole app. The fallback's single action
 * sends a crash report and then re-mounts the children (an automatic retry). If that
 * retry crashes again, the fallback switches to a "please restart" message with no
 * action, since retrying is proven futile.
 *
 * Also hides the native splash screen on catch: an early first-render crash happens
 * before {@link https://docs.expo.dev/versions/latest/sdk/splash-screen | SplashScreen.hideAsync}
 * is reached in `App`, which would otherwise leave the fallback hidden behind the splash.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <AppContent />
 * </ErrorBoundary>
 * ```
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorFallback } from '@components/molecules/ErrorFallback';
import { appLogger } from '@utils/logger';
import { reportCrash } from '@utils/BugReport';

export type ErrorBoundaryProps = {
  children: ReactNode;
  testID?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
  retriedOnce: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    componentStack: null,
    retriedOnce: false,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    appLogger.error('Render error caught by ErrorBoundary', {
      error,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ componentStack: errorInfo.componentStack ?? null });

    SplashScreen.hideAsync().catch(() => {});
  }

  override componentDidUpdate(_prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
    if (prevState.hasError && !this.state.hasError && this.state.retriedOnce) {
      this.setState({ retriedOnce: false });
    }
  }

  reportAndRecover = async (): Promise<void> => {
    await reportCrash(
      this.state.error ?? new Error('Unknown render error'),
      this.state.componentStack
    );
    this.setState({ hasError: false, error: null, componentStack: null, retriedOnce: true });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          persistent={this.state.retriedOnce}
          onReport={this.state.retriedOnce ? undefined : this.reportAndRecover}
          testID={this.props.testID}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Screen `layout` that contains a render error inside the screen that threw
 * instead of tearing down the whole navigator.
 *
 * Passed to a `Stack.Screen`'s `layout` or a `Stack.Group`'s `screenLayout` in
 * React Navigation v7. This replaced the former `withErrorBoundary` HOC: the
 * wrapping is declared on the route rather than baked into the screen's export.
 *
 * @param props - Screen layout args; only `children` (the rendered screen) is used
 * @returns The screen wrapped in an {@link ErrorBoundary}
 *
 * @example
 * ```tsx
 * <Stack.Group screenLayout={errorBoundaryLayout}>
 *   <Stack.Screen name='RecipeAddOcr' component={RecipeAddOcr} />
 * </Stack.Group>
 * ```
 */
export function errorBoundaryLayout({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
