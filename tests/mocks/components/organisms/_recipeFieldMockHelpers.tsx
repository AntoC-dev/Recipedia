import React from 'react';
import { Button, Text } from 'react-native';
import type { OcrModalTarget } from '@utils/OCR';
import { useRecipeDialogs } from '@context/RecipeDialogsContext';

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

export function MockScanButton({ testID, field }: { testID: string; field: OcrModalTarget }) {
  const { openImageModal } = useRecipeDialogs();
  return <Button testID={testID} title='Scan' onPress={() => openImageModal(field)} />;
}
