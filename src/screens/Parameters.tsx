/**
 * Parameters - Comprehensive app settings and configuration hub
 *
 * A centralized settings screen providing access to all app configuration options
 * including appearance, language, recipe management, and navigation shortcuts.
 * Features organized sections with Material Design components and persistent settings.
 *
 * Key Features:
 * - **Appearance Settings**: Dark mode toggle and language selection
 * - **Recipe Management**: Default persons adjustment and seasonal filtering
 * - **Database Navigation**: Quick access to ingredients and tags management
 * - **App Information**: Version display and about section
 * - **Theme Integration**: Automatic dark/light mode styling
 * - **Internationalization**: Full i18n support with dynamic language switching
 * - **Persistent Settings**: All preferences saved across app sessions
 *
 * Settings Categories:
 * - **Appearance**: Theme and language preferences
 * - **Recipe Defaults**: Portion size and filtering preferences
 * - **Database Management**: Ingredient and tag administration
 * - **Information**: App version and credits
 *
 * Navigation Integration:
 * - Direct navigation to sub-settings screens
 * - Modal presentation for complex settings flows
 * - Integration with bottom tab navigation
 * - Support for deep linking to specific settings
 *
 * State Management:
 * - Context-based theme management (DarkModeContext)
 * - Global season filter state (SeasonFilterContext)
 * - Persistent storage for all user preferences
 * - Real-time updates when settings change
 *
 * UI/UX Features:
 * - Material Design 3 components throughout
 * - Consistent spacing and typography
 * - Accessible design with proper contrast
 * - Smooth transitions and interactions
 * - Section-based organization for easy navigation
 *
 * @example
 * ```typescript
 * // Navigation to Parameters from any screen
 * navigation.navigate('Tabs', { screen: 'Parameters' });
 *
 * // Navigation to sub-settings
 * navigation.navigate('LanguageSettings');
 * navigation.navigate('DefaultPersonsSettings');
 *
 * // The Parameters screen automatically handles:
 * // - Theme context integration
 * // - Settings persistence
 * // - Navigation to sub-screens
 * // - Real-time preference updates
 * ```
 */

import React, { useContext } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Divider, List, Switch, useTheme } from 'react-native-paper';
import { CopilotStep, walkthroughable } from 'react-native-copilot';
import { useSafeCopilot } from '@hooks/useSafeCopilot';
import { useI18n } from '@utils/i18n';
import { useSeasonFilter } from '@context/SeasonFilterContext';
import { useDefaultPersons } from '@context/DefaultPersonsContext';
import { StackScreenNavigation } from '@customTypes/ScreenTypes';
import { useNavigation } from '@react-navigation/native';
import { DarkModeContext } from '@context/DarkModeContext';
import { Icons } from '@assets/Icons';
import Constants from 'expo-constants';
import { TUTORIAL_STEPS } from '@utils/Constants';

/**
 * Parameters screen component - Main app settings and configuration hub
 *
 * @returns JSX element representing the comprehensive settings interface
 */
const CopilotView = walkthroughable(View);

export function Parameters() {
  const { t, getLocale, getLocaleName } = useI18n();
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);
  const { defaultPersons } = useDefaultPersons();
  const { seasonFilter, setSeasonFilter } = useSeasonFilter();
  const { colors } = useTheme();
  const currentLocale = getLocale();
  const AppVersion = Constants.expoConfig?.version ?? 'N/A';
  const copilotData = useSafeCopilot();

  const { navigate } = useNavigation<StackScreenNavigation>();

  // Navigate to language selection screen
  const handleLanguagePress = () => {
    navigate('LanguageSettings');
  };

  // Navigate to default persons setting screen
  const handlePersonsPress = () => {
    navigate('DefaultPersonsSettings');
  };

  // Navigate to ingredient management screen
  const handleIngredientsPress = () => {
    navigate('IngredientsSettings');
  };

  // Navigate to tag management screen
  const handleTagsPress = () => {
    navigate('TagsSettings');
  };

  const screenId = 'Parameters';
  const sectionId = screenId + '::Section';
  const appearanceId = sectionId + '::Appearance';
  const darkModeId = appearanceId + '::DarkMode';
  const languageId = appearanceId + '::Language';

  const recipeId = sectionId + '::RecipeDefaults';
  const personsId = recipeId + '::Persons';
  const seasonId = recipeId + '::Season';

  const dataId = sectionId + '::Data';
  const ingredientsId = dataId + '::Ingredients';
  const tagsId = dataId + '::Tags';

  const importId = sectionId + '::Import';
  const importFromWebsiteId = importId + '::FromWebsite';

  const aboutId = sectionId + '::About';
  const versionId = aboutId + '::Version';

  /**
   * Recipe Defaults Section - Internal component for recipe management settings
   *
   * Renders the recipe defaults section with default persons and season filter settings.
   * Has direct access to parent component's state and handlers for cleaner implementation.
   */
  function RecipeDefaultsSection() {
    return (
      <List.Section>
        <List.Subheader testID={recipeId + '::SubHeader'}>{t('recipe_defaults')}</List.Subheader>
        <List.Item
          testID={personsId + '::Item'}
          title={t('default_persons')}
          description={`${defaultPersons} ${t('persons')}`}
          left={props => <List.Icon {...props} icon={Icons.groupPeople} />}
          right={props => <List.Icon {...props} icon={Icons.chevronRight} />}
          onPress={handlePersonsPress}
        />
        <Divider testID={recipeId + '::Divider'} />
        <List.Item
          testID={seasonId + '::Item'}
          title={t('default_season_filter')}
          accessible={false}
          left={props => <List.Icon {...props} icon={Icons.plannerUnselectedIcon} />}
          right={() => (
            <Switch
              testID={seasonId + '::Switch'}
              value={seasonFilter}
              onValueChange={setSeasonFilter}
            />
          )}
        />
      </List.Section>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView>
        {/* Appearance Section */}
        <List.Section>
          <List.Subheader testID={appearanceId + '::SubHeader'}>{t('appearance')}</List.Subheader>
          <List.Item
            testID={darkModeId + '::Item'}
            title={t('dark_mode')}
            accessible={false}
            left={props => <List.Icon {...props} icon={Icons.lightDarkTheme} />}
            right={() => (
              <Switch
                testID={darkModeId + '::Switch'}
                value={isDarkMode}
                onValueChange={toggleDarkMode}
              />
            )}
          />
          <Divider testID={appearanceId + '::Divider'} />
          <List.Item
            testID={languageId + '::Item'}
            title={t('language')}
            description={getLocaleName(currentLocale)}
            left={props => <List.Icon {...props} icon={Icons.translate} />}
            right={props => <List.Icon {...props} icon={Icons.chevronRight} />}
            onPress={handleLanguagePress}
          />
        </List.Section>

        {/* Recipe Defaults Section */}
        {copilotData ? (
          <CopilotStep
            text={t('tutorial.parameters.description')}
            order={TUTORIAL_STEPS.Parameters.order}
            name={TUTORIAL_STEPS.Parameters.name}
          >
            <CopilotView testID={screenId + '::Tutorial'}>
              <RecipeDefaultsSection />
            </CopilotView>
          </CopilotStep>
        ) : (
          <RecipeDefaultsSection />
        )}

        {/* Data Management Section */}
        <List.Section>
          <List.Subheader testID={dataId + '::SubHeader'}>{t('data_management')}</List.Subheader>
          <List.Item
            testID={ingredientsId + '::Item'}
            title={t('ingredients')}
            description={t('manage_ingredients_description')}
            left={props => <List.Icon {...props} icon={Icons.apple} />}
            right={props => <List.Icon {...props} icon={Icons.chevronRight} />}
            onPress={handleIngredientsPress}
          />
          <Divider testID={dataId + '::Divider'} />
          <List.Item
            testID={tagsId + '::Item'}
            title={t('tags')}
            description={t('manage_tags_description')}
            left={props => <List.Icon {...props} icon={Icons.tags} />}
            right={props => <List.Icon {...props} icon={Icons.chevronRight} />}
            onPress={handleTagsPress}
          />
        </List.Section>

        {/* Bulk Import Recipes Section */}
        <List.Section>
          <List.Subheader testID={importId + '::SubHeader'}>{t('bulkImport.title')}</List.Subheader>
          <List.Item
            testID={importFromWebsiteId + '::Item'}
            title={t('bulkImport.fromService')}
            description={t('bulkImport.fromServiceDescription')}
            left={props => <List.Icon {...props} icon='web' />}
            right={props => <List.Icon {...props} icon={Icons.chevronRight} />}
            onPress={() => {
              navigate('BulkImportSettings');
            }}
          />
        </List.Section>

        {/* About Section */}
        <List.Section>
          <List.Subheader testID={aboutId + '::SubHeader'}>{t('about')}</List.Subheader>
          <List.Item
            testID={versionId + '::Item'}
            title={t('version')}
            description={AppVersion}
            left={props => <List.Icon {...props} icon={Icons.information} />}
          />
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
}

export default Parameters;
