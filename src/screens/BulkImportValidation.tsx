/**
 * BulkImportValidation - Validation and import screen for bulk recipe import
 *
 * This screen handles the validation of imported recipe data, including:
 * - Tag validation and mapping to existing database tags
 * - Ingredient validation and mapping to existing database ingredients
 * - Final import of validated recipes to the database
 *
 * Screen Phases:
 * 1. **Initializing**: Analyzes recipes to find items needing validation
 * 2. **Tags**: User validates/maps unknown tags
 * 3. **Ingredients**: User validates/maps unknown ingredients
 * 4. **Importing**: Saves validated recipes to the database
 * 5. **Complete**: Shows import success message
 * 6. **Error**: Shows error message if import failed
 *
 * Key Features:
 * - Batch validation to reduce duplicate prompts
 * - Progress tracking during validation
 * - Automatic exact-match handling for known items
 * - Error handling with user feedback
 *
 * Navigation Flow:
 * BulkImportDiscovery -> BulkImportValidation -> Home (on complete)
 *
 * @example
 * ```typescript
 * navigation.navigate('BulkImportValidation', {
 *   providerId: 'hellofresh',
 *   selectedRecipes: convertedRecipes,
 * });
 * ```
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackScreenNavigation, StackScreenParamList } from '@customTypes/ScreenTypes';
import { AppBar } from '@components/organisms/AppBar';
import { ImportErrorMessage } from '@components/molecules/ImportErrorMessage';
import { ImportSuccessMessage } from '@components/molecules/ImportSuccessMessage';
import { ValidationProgress } from '@components/molecules/ValidationProgress';
import { useI18n } from '@utils/i18n';
import { useRecipeDatabase } from '@context/RecipeDatabaseContext';
import { useValidationWorkflow } from '@hooks/useValidationWorkflow';
import { padding } from '@styles/spacing';

type BulkImportValidationRouteProp = RouteProp<StackScreenParamList, 'BulkImportValidation'>;

const screenId = 'BulkImportValidation';

/**
 * BulkImportValidation screen component
 *
 * Manages the validation and import workflow for bulk recipe import.
 * Presents validation dialogs for unknown tags and ingredients,
 * then imports validated recipes to the database.
 *
 * @returns JSX element representing the validation screen
 */
export function BulkImportValidation() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation<StackScreenNavigation>();
  const route = useRoute<BulkImportValidationRouteProp>();
  const { selectedRecipes } = route.params;
  const { findSimilarIngredients, findSimilarTags, addMultipleRecipes } = useRecipeDatabase();

  const { phase, validationState, progress, importedCount, errorMessage, handlers } =
    useValidationWorkflow(
      selectedRecipes,
      findSimilarIngredients,
      findSimilarTags,
      addMultipleRecipes
    );

  const handleFinish = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      })
    );
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const renderPhaseContent = () => {
    switch (phase) {
      case 'initializing':
      case 'importing':
        return (
          <View style={styles.centered}>
            <ActivityIndicator size='large' testID={screenId + '::InitializingIndicator'} />
            <Text variant='bodyLarge' style={styles.loadingText}>
              {phase === 'initializing'
                ? t('bulkImport.validation.initializing')
                : t('bulkImport.validation.importingRecipes')}
            </Text>
          </View>
        );

      case 'tags':
        return (
          <ValidationProgress
            key='tags'
            type='Tag'
            progress={progress}
            items={validationState?.tagsToValidate ?? []}
            onValidated={handlers.onTagValidated}
            onDismissed={handlers.onTagDismissed}
            onComplete={handlers.onTagQueueComplete}
            testID={screenId}
          />
        );

      case 'ingredients':
        return (
          <ValidationProgress
            key='ingredients'
            type='Ingredient'
            progress={progress}
            items={validationState?.ingredientsToValidate ?? []}
            onValidated={handlers.onIngredientValidated}
            onDismissed={handlers.onIngredientDismissed}
            onComplete={handlers.onIngredientQueueComplete}
            testID={screenId}
          />
        );

      case 'complete':
        return (
          <ImportSuccessMessage
            importedCount={importedCount}
            onFinish={handleFinish}
            testID={screenId}
          />
        );

      case 'error':
        return <ImportErrorMessage errorMessage={errorMessage} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <AppBar title={t('bulkImport.validation.title')} onGoBack={handleCancel} testID={screenId} />
      <View style={styles.container}>{renderPhaseContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: padding.medium,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginVertical: padding.medium,
  },
});

export default BulkImportValidation;
