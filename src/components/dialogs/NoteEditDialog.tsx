/**
 * NoteEditDialog - Simple dialog for editing ingredient usage notes
 *
 * A lightweight dialog component for editing the note/usage context of an ingredient.
 * Used in the recipe ingredients editable mode to keep the table design clean.
 *
 * @example
 * ```typescript
 * <NoteEditDialog
 *   testId="ingredient-note"
 *   isVisible={showNoteDialog}
 *   ingredientName="Butter"
 *   initialNote="for the sauce"
 *   onClose={() => setShowNoteDialog(false)}
 *   onSave={(note) => handleSaveNote(note)}
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { useI18n } from '@utils/i18n';
import { CustomTextInput } from '@components/atomic/CustomTextInput';
import { padding } from '@styles/spacing';

/**
 * Props for NoteEditDialog component.
 */
export type NoteEditDialogProps = {
  /** Unique identifier for testing and accessibility */
  testId: string;
  /** Whether the dialog is currently visible */
  isVisible: boolean;
  /** Name of the ingredient being edited (for context) */
  ingredientName: string;
  /** Initial note value */
  initialNote: string;
  /** Placeholder text for the note input */
  placeholder: string;
  /** Callback fired when dialog is closed without saving */
  onClose: () => void;
  /** Callback fired when note is saved */
  onSave: (note: string) => void;
};

/**
 * NoteEditDialog component for ingredient note editing.
 *
 * @param props - Component props
 * @returns JSX element representing a note edit dialog
 */
export function NoteEditDialog({
  testId,
  isVisible,
  ingredientName,
  initialNote,
  placeholder,
  onClose,
  onSave,
}: NoteEditDialogProps) {
  const { t } = useI18n();
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (isVisible) {
      setNote(initialNote);
    }
  }, [isVisible, initialNote]);

  const handleDismiss = () => {
    onClose();
  };

  const handleSave = () => {
    onSave(note.trim());
    onClose();
  };

  const modalTestId = testId + '::NoteDialog';
  const isEditing = initialNote.trim().length > 0;
  const dialogTitle = isEditing
    ? t('recipe.noteDialog.editTitle')
    : t('recipe.noteDialog.addTitle');

  return (
    <Portal>
      <Dialog visible={isVisible} onDismiss={handleDismiss}>
        <Dialog.Title testID={modalTestId + '::Title'}>{dialogTitle}</Dialog.Title>
        <Dialog.Content>
          <Text
            testID={modalTestId + '::IngredientName'}
            variant='bodyMedium'
            style={styles.ingredientName}
          >
            {ingredientName}
          </Text>
          <CustomTextInput
            testID={modalTestId + '::Input'}
            label={placeholder}
            value={note}
            onChangeText={setNote}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <View style={styles.dialogActions} accessible={false}>
            <Button testID={modalTestId + '::CancelButton'} mode='outlined' onPress={handleDismiss}>
              {t('cancel')}
            </Button>
            <Button testID={modalTestId + '::SaveButton'} mode='contained' onPress={handleSave}>
              {t('save')}
            </Button>
          </View>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  ingredientName: {
    marginBottom: padding.small,
    fontWeight: '600',
  },
  dialogActions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default NoteEditDialog;
