import React, { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { Icons } from '@assets/Icons';
import { useI18n } from '@utils/i18n';
import { padding, radius } from '@styles/spacing';

/**
 * Props for {@link FilterToggleButton}
 */
export type FilterToggleButtonProps = {
  /** testID for the underlying button */
  testID: string;
  /** Whether filter-adding mode is active (controls the label and icon) */
  addingFilterMode: boolean;
  /** Fired when the button is pressed */
  onToggle: () => void;
};

/**
 * Toggle button switching between filter selection and results view.
 *
 * Ref-forwarded to its root View so callers (e.g. the tutorial spotlight) can
 * measure its on-screen position.
 *
 * @param props - {@link FilterToggleButtonProps}
 * @returns The filter mode toggle button
 */
export const FilterToggleButton = forwardRef<View, FilterToggleButtonProps>(
  function FilterToggleButton({ testID, addingFilterMode, onToggle }, ref) {
    const { t } = useI18n();
    return (
      <View ref={ref} style={styles.container}>
        <Button
          testID={testID}
          mode={'contained'}
          onPress={onToggle}
          icon={addingFilterMode ? Icons.removeFilterIcon : Icons.addFilterIcon}
          style={styles.button}
        >
          {t(addingFilterMode ? 'seeFilterResult' : 'addFilter')}
        </Button>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  button: {
    margin: padding.medium,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
  },
});
