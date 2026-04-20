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
 * 2. **Reviewing**: User validates all unknown tags and ingredients inline
 * 3. **Importing**: Saves validated recipes to the database
 * 4. **Complete**: Shows import success message
 * 5. **Error**: Shows error message if import failed
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
import { ScreenWrapper } from '@components/templates/ScreenWrapper';
import { ActivityIndicator, Text } from 'react-native-paper';
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackScreenNavigation, StackScreenParamList } from '@customTypes/ScreenTypes';
import { AppBar } from '@components/organisms/AppBar';
import { ImportErrorMessage } from '@components/molecules/ImportErrorMessage';
import { ImportSkippedWarning } from '@components/molecules/ImportSkippedWarning';
import { ImportSuccessMessage } from '@components/molecules/ImportSuccessMessage';
import { ValidationReviewList } from '@components/organisms/ValidationReviewList';
import { useI18n } from '@utils/i18n';
import { useRecipes } from '@hooks/useRecipes';
import { useImportHistory } from '@hooks/useImportHistory';
import { useTags } from '@hooks/useTags';
import { useIngredients } from '@hooks/useIngredients';
import { useDefaultPersons } from '@context/DefaultPersonsContext';
import { useValidationWorkflow } from '@hooks/useValidationWorkflow';
import { ResolutionMappings } from '@customTypes/ValidationTypes';
import { padding } from '@styles/spacing';

type BulkImportValidationRouteProp = RouteProp<StackScreenParamList, 'BulkImportValidation'>;

const screenId = 'BulkImportValidation';

/**
 * BulkImportValidation screen component
 *
 * Manages the validation and import workflow for bulk recipe import.
 * Presents an inline review list for unknown tags and ingredients,
 * then imports validated recipes to the database.
 *
 * @returns JSX element representing the validation screen
 */
export function BulkImportValidation() {
  const { t } = useI18n();
  const navigation = useNavigation<StackScreenNavigation>();
  const route = useRoute<BulkImportValidationRouteProp>();
  const { providerId, selectedRecipes } = route.params;
  const { addMultipleRecipes } = useRecipes();
  const { removeFromSeenHistory } = useImportHistory();
  const { findSimilarTags } = useTags();
  const { findSimilarIngredients } = useIngredients();
  const { defaultPersons } = useDefaultPersons();

  const handleImportComplete = async (importedUrls: string[]) => {
    await removeFromSeenHistory(providerId, importedUrls);
  };

  const {
    phase,
    initStage,
    validationState,
    importedCount,
    skippedRecipes,
    errorMessage,
    handlers,
  } = useValidationWorkflow(
    selectedRecipes,
    addMultipleRecipes,
    defaultPersons,
    findSimilarTags,
    findSimilarIngredients,
    handleImportComplete
  );

  const handleImport = ({ tagMappings, ingredientMappings }: ResolutionMappings) => {
    for (const [, validatedTag] of tagMappings) {
      handlers.onTagValidated({ id: -1, name: validatedTag.name }, validatedTag);
    }
    for (const [originalName, validatedIngredient] of ingredientMappings) {
      handlers.onIngredientValidated(originalName, validatedIngredient);
    }
    handlers.startImport();
  };

  const getInitStageText = () => {
    switch (initStage) {
      case 'analyzing':
        return t('bulkImport.validation.analyzing');
      case 'matching-ingredients':
        return t('bulkImport.validation.matchingIngredients');
      case 'matching-tags':
        return t('bulkImport.validation.matchingTags');
      case 'ready':
        return t('bulkImport.validation.ready');
      default:
        return t('bulkImport.validation.initializing');
    }
  };

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

  const renderLoadingPhase = (testID: string, text: string) => (
    <View style={styles.centered}>
      <ActivityIndicator size='large' testID={testID} />
      <Text variant='bodyLarge' style={styles.loadingText}>
        {text}
      </Text>
    </View>
  );

  const renderPhaseContent = () => {
    switch (phase) {
      case 'initializing':
        return renderLoadingPhase(screenId + '::InitializingIndicator', getInitStageText());

      case 'importing':
        return renderLoadingPhase(
          screenId + '::ImportingIndicator',
          t('bulkImport.validation.importingRecipes')
        );

      case 'warning':
        return (
          <ImportSkippedWarning
            skippedRecipes={skippedRecipes}
            onContinue={handlers.acknowledgeWarning}
            testID={screenId}
          />
        );

      case 'reviewing':
        return (
          <ValidationReviewList
            testID={screenId}
            rawTags={validationState?.tagsToValidate ?? []}
            rawIngredients={validationState?.ingredientsToValidate ?? []}
            onImport={handleImport}
            recipeCount={selectedRecipes.length}
          />
        );

      case 'complete':
        return (
          <ImportSuccessMessage
            importedCount={importedCount}
            skippedRecipes={skippedRecipes}
            onFinish={handleFinish}
            testID={screenId}
          />
        );

      case 'error':
        return <ImportErrorMessage errorMessage={errorMessage} testID={screenId} />;
    }
  };

  return (
    <ScreenWrapper>
      <AppBar title={t('bulkImport.validation.title')} onGoBack={handleCancel} testID={screenId} />
      <View style={styles.container}>{renderPhaseContent()}</View>
    </ScreenWrapper>
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
