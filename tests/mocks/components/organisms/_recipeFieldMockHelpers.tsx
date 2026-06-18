import React from 'react';
import { Button, Text } from 'react-native';

export function ErrorEcho({ testID, error }: { testID: string; error?: string }) {
  if (!error) return null;
  return <Text testID={testID + '::Error'}>{error}</Text>;
}

/**
 * Renders a `::OnBlur` Button. Always present in editable-mode mocks so tests
 * can fire blur regardless of whether the consumer passed an onBlur callback.
 */
export function BlurButton({ testID, onBlur }: { testID: string; onBlur?: () => void }) {
  return <Button testID={testID + '::OnBlur'} title='Blur' onPress={() => onBlur?.()} />;
}
