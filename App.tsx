import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {darkTheme, lightTheme} from '@styles/theme';
import AppWrapper from '@components/organisms/AppWrapper';
import {ErrorBoundary} from '@components/organisms/ErrorBoundary';
import {getDarkMode, initSettings, setDarkMode as setDarkModeSetting,} from '@utils/settings';
import * as SplashScreen from 'expo-splash-screen';
import {useFetchFonts} from '@styles/typography';
import {DarkModeContext} from '@context/DarkModeContext';
import {SeasonFilterProvider} from '@context/SeasonFilterContext';
import {DefaultPersonsProvider} from '@context/DefaultPersonsContext';
import {appLogger} from '@utils/logger';
import {isFirstLaunch} from '@utils/firstLaunch';
import {ScraperProvider} from '@app/modules/recipe-scraper';
import {RecipeDatabase} from '@utils/RecipeDatabase';
import {init as initFileSystem} from '@utils/FileGestion';
import {cleanupOrphanedImages} from '@utils/FileGestion';
import {unregisterLegacyBackgroundTasks} from '@utils/legacyTaskCleanup';

// TODO manage horizontal mode

// TODO search for functions define as const lambda
// TODO search for loops with indices
// TODO assert lambda functions usage
// TODO useMemo for time consuming function

// TODO use eslint-config-expo ?
// TODO replace react-navigation by expo-router

// TODO add special gastronomy (gluten free, lactose, etc)

SplashScreen.preventAutoHideAsync();

const ORPHAN_CLEANUP_DELAY_MS = 3 * 60 * 1000;

function AppContent() {
    const [isAppInitialized, setIsAppInitialized] = useState(false);
    const [isDatabaseReady, setIsDatabaseReady] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [isFirstLaunchFlag, setIsFirstLaunchFlag] = useState<boolean | null>(null);

    useEffect(() => {
        let cleanupTimerId: ReturnType<typeof setTimeout>;

        const initialize = async () => {
            try {
                appLogger.info('Starting app initialization');

                void unregisterLegacyBackgroundTasks();

                initFileSystem();

                const db = RecipeDatabase.getInstance();
                await db.init();
                setIsDatabaseReady(true);
                appLogger.debug('Database initialized');

                const [, isFirst, isDarkMode] = await Promise.all([
                    initSettings(),
                    isFirstLaunch(),
                    getDarkMode(),
                ]);
                setIsFirstLaunchFlag(isFirst);
                setDarkMode(isDarkMode);
                appLogger.debug('App settings loaded', {isFirst, isDarkMode});

                cleanupTimerId = setTimeout(() => {
                    cleanupOrphanedImages(db.get_recipes().map(r => r.image_Source)).catch(err =>
                        appLogger.warn('Orphan image cleanup failed', {error: err})
                    );
                }, ORPHAN_CLEANUP_DELAY_MS);

                appLogger.info('App initialization completed successfully');
                setIsAppInitialized(true);
            } catch (error) {
                appLogger.error('App initialization failed', {error});
            }
        };
        initialize();

        return () => clearTimeout(cleanupTimerId);
    }, []);

    const toggleDarkMode = async () => {
        const newValue = !darkMode;
        try {
            await setDarkModeSetting(newValue);
            setDarkMode(newValue);
        } catch (error) {
            appLogger.error('Failed to toggle dark mode', {error});
        }
    };

    const animationsDisabled = process.env.EXPO_PUBLIC_DISABLE_ANIMATIONS === 'true';
    const theme = {
        ...(darkMode ? darkTheme : lightTheme),
        animation: {scale: animationsDisabled ? 0 : 1},
    };

    const shouldHideSplash = isAppInitialized && isDatabaseReady;

    const onLayoutRootView = async () => {
        if (shouldHideSplash) {
            if (isFirstLaunchFlag) {
                appLogger.debug('Hiding splash screen - first launch, WelcomeScreen ready');
            } else {
                appLogger.debug('Hiding splash screen - database data ready');
            }
            await SplashScreen.hideAsync();
        }
    };

    if (!shouldHideSplash) {
        appLogger.debug('Showing splash screen', {
            isAppInitialized,
            isFirstLaunchFlag,
            isDatabaseReady,
        });
        return null;
    }

    return (
        <DefaultPersonsProvider>
            <SeasonFilterProvider>
                <DarkModeContext.Provider
                    value={{
                        isDarkMode: darkMode,
                        toggleDarkMode,
                    }}
                >
                    <PaperProvider theme={theme}>
                        <SafeAreaProvider>
                            <NavigationContainer onReady={onLayoutRootView}>
                                <AppWrapper/>
                            </NavigationContainer>
                        </SafeAreaProvider>
                    </PaperProvider>
                </DarkModeContext.Provider>
            </SeasonFilterProvider>
        </DefaultPersonsProvider>
    );
}

export function App() {
    useFetchFonts();

    return (
        <SafeAreaProvider>
            <ErrorBoundary>
                <ScraperProvider>
                    <AppContent/>
                </ScraperProvider>
            </ErrorBoundary>
        </SafeAreaProvider>
    );
}

export default App;
