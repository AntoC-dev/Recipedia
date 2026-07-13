import React from 'react';

export const mockInsets = { top: 47, right: 0, bottom: 34, left: 0 };

export function safeAreaContextMock() {
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SafeAreaView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useSafeAreaInsets: () => mockInsets,
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: mockInsets,
    },
  };
}
