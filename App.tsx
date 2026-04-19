import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Platform} from 'react-native';
import {PaperProvider} from 'react-native-paper';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {darkTheme, lightTheme} from '@styles/theme';
import AppWrapper from '@components/organisms/AppWrapper';
import {getDarkMode, initSettings, setDarkMode as setDarkModeSetting,} from '@utils/settings';
import * as SplashScreen from 'expo-splash-screen';
import {useFetchFonts} from '@styles/typography';
import {DarkModeContext} from '@context/DarkModeContext';
import {SeasonFilterProvider} from '@context/SeasonFilterContext';
import {DefaultPersonsProvider} from '@context/DefaultPersonsContext';
import {RecipeDatabaseProvider, useRecipeDatabase} from '@context/RecipeDatabaseContext';
import {appLogger} from '@utils/logger';
import {isFirstLaunch} from '@utils/firstLaunch';
import {recipeScraper} from '@app/modules/recipe-scraper';
import {PyodideWebView} from '@app/modules/recipe-scraper/src/ios/PyodideWebView';
import {AuthWebView} from '@app/modules/recipe-scraper/src/ios/AuthWebView';
import {AuthBridge} from '@app/modules/recipe-scraper/src/ios/AuthBridge';

// TODO manage horizontal mode

// TODO search for functions define as const lambda
// TODO search for loops with indices
// TODO assert lambda functions usage
// TODO useMemo for time consuming function

// TODO use eslint-config-expo ?
// TODO replace react-navigation by expo-router

// TODO add special gastronomy (gluten free, lactose, etc)

SplashScreen.preventAutoHideAsync();

function AppContent() {
    const [isAppInitialized, setIsAppInitialized] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const [isFirstLaunchFlag, setIsFirstLaunchFlag] = useState<boolean | null>(null);
    const {isDatabaseReady} = useRecipeDatabase();

    useEffect(() => {
        const initialize = async () => {
            try {
                appLogger.info('Starting app initialization');

                const [, isFirst, isDarkMode] = await Promise.all([
                    initSettings(),
                    isFirstLaunch(),
                    getDarkMode(),
                ]);
                setIsFirstLaunchFlag(isFirst);
                setDarkMode(isDarkMode);
                appLogger.debug('App settings loaded', {isFirst, isDarkMode});

                recipeScraper.waitForReady(10000).catch(err =>
                    appLogger.warn('Python scraper initialization failed', {error: err})
                );

                appLogger.info('App initialization completed successfully');
                setIsAppInitialized(true);
            } catch (error) {
                appLogger.error('App initialization failed', {error});
            }
        };
        initialize();
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
        animation: { scale: animationsDisabled ? 0 : 1 },
    };

    const shouldHideSplash = isAppInitialized && (isFirstLaunchFlag === true || isDatabaseReady);

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
    const [authLoginUrl, setAuthLoginUrl] = useState<string | null>(null);

    useEffect(() => {
        if (Platform.OS !== 'ios') return;
        return AuthBridge.subscribe(() => setAuthLoginUrl(AuthBridge.currentLoginUrl));
    }, []);

    return (
        <RecipeDatabaseProvider>
            <AppContent/>
            {Platform.OS === 'ios' && <PyodideWebView />}
            {Platform.OS === 'ios' && authLoginUrl !== null && <AuthWebView loginUrl={authLoginUrl} />}
        </RecipeDatabaseProvider>
    );
}

export default App;
