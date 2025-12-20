/**
 * ValidationProgress - Unified validation UI for tags and ingredients
 *
 * Shows validation progress, the ValidationQueue dialog, and a Skip All button
 * for either tags or ingredients based on the type prop.
 *
 * @module components/molecules/ValidationProgress
 */

import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import { ValidationQueue } from '@components/dialogs/ValidationQueue';
import { useI18n } from '@utils/i18n';
import {
  FormIngredientElement,
  ingredientTableElement,
  tagTableElement,
} from '@customTypes/DatabaseElementTypes';
import { ValidationProgress as ValidationProgressData } from '@hooks/useValidationWorkflow';
import { padding } from '@styles/spacing';

/** Props for tag validation progress */
export type TagValidationProgressProps = {
  type: 'Tag';
  items: tagTableElement[];
  onValidated: (originalTag: tagTableElement, validatedTag: tagTableElement) => void;
  progress: ValidationProgressData | null;
  onDismissed: () => void;
  onComplete: () => void;
  testID: string;
};

/** Props for ingredient validation progress */
export type IngredientValidationProgressProps = {
  type: 'Ingredient';
  items: FormIngredientElement[];
  onValidated: (
    originalIngredient: FormIngredientElement,
    validatedIngredient: ingredientTableElement
  ) => void;
  progress: ValidationProgressData | null;
  onDismissed: () => void;
  onComplete: () => void;
  testID: string;
};

export type ValidationProgressProps =
  | TagValidationProgressProps
  | IngredientValidationProgressProps;

type ValidationProgressLayoutProps = {
  title: string;
  current: number;
  total: number;
  showProgress: boolean;
  children: ReactNode;
};

function ValidationProgressLayout({
  title,
  current,
  total,
  showProgress,
  children,
}: ValidationProgressLayoutProps) {
  const { t } = useI18n();
  const progressValue = total > 0 ? current / total : 0;

  return (
    <View style={styles.centerContent}>
      <Text variant='headlineSmall' style={styles.statusText}>
        {title}
      </Text>
      {showProgress && (
        <>
          <Text variant='bodyMedium' style={styles.progressText}>
            {t('bulkImport.validation.progress', { current, total })}
          </Text>
          <ProgressBar progress={progressValue} style={styles.progressBar} />
        </>
      )}
      {children}
    </View>
  );
}

/**
 * ValidationProgress component for displaying validation progress
 *
 * Shows progress bar, validation queue dialog, and Skip All button
 * for either tags or ingredients.
 *
 * @param props - Component props
 * @returns JSX element representing the validation progress display
 */
export function ValidationProgress(props: ValidationProgressProps) {
  const { progress, onDismissed, onComplete, testID } = props;
  const { t } = useI18n();

  const isTag = props.type === 'Tag';
  const title = isTag
    ? t('bulkImport.validation.validatingTags')
    : t('bulkImport.validation.validatingIngredients');
  const current = isTag ? (progress?.validatedTags ?? 0) : (progress?.validatedIngredients ?? 0);
  const total = isTag ? (progress?.totalTags ?? 0) : (progress?.totalIngredients ?? 0);
  const queueTestId = testID + (isTag ? '::TagQueue' : '::IngredientQueue');

  return (
    <ValidationProgressLayout
      title={title}
      current={current}
      total={total}
      showProgress={progress !== null}
    >
      {props.items.length > 0 &&
        (props.type === 'Tag' ? (
          <ValidationQueue
            testId={queueTestId}
            type='Tag'
            items={props.items}
            onValidated={props.onValidated}
            onDismissed={onDismissed}
            onComplete={onComplete}
          />
        ) : (
          <ValidationQueue
            testId={queueTestId}
            type='Ingredient'
            items={props.items}
            onValidated={props.onValidated}
            onDismissed={onDismissed}
            onComplete={onComplete}
          />
        ))}
    </ValidationProgressLayout>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    textAlign: 'center',
    marginVertical: padding.medium,
  },
  progressText: {
    textAlign: 'center',
    marginBottom: padding.small,
  },
  progressBar: {
    width: '100%',
    height: padding.small,
    borderRadius: padding.verySmall,
    marginVertical: padding.medium,
  },
});

export default ValidationProgress;
