/**
 * DefaultPersonsContext - Global default persons count state management
 *
 * React context providing global default persons count state that affects
 * recipe creation, scaling, and display throughout the app. Manages persistent
 * storage of the user's default persons preference and ensures all recipes
 * are scaled to match this value.
 *
 * Key Features:
 * - Global default persons state management
 * - Persistent storage of default persons preference
 * - Integration with recipe scaling system
 * - Type-safe context with proper error handling
 * - Automatic loading of saved preferences
 * - Real-time state synchronization across components
 *
 * @example
 * ```typescript
 * // Using the context in a component
 * import { useDefaultPersons } from '@context/DefaultPersonsContext';
 *
 * function PersonsSettings() {
 *   const { defaultPersons, setDefaultPersons } = useDefaultPersons();
 *
 *   return (
 *     <Slider
 *       value={defaultPersons}
 *       onValueChange={setDefaultPersons}
 *       minimumValue={1}
 *       maximumValue={10}
 *     />
 *   );
 * }
 *
 * // Provider setup (typically in App.tsx)
 * <DefaultPersonsProvider>
 *   <NavigationContainer>
 *     <RootNavigator />
 *   </NavigationContainer>
 * </DefaultPersonsProvider>
 * ```
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getDefaultPersons,
  getDefaultPersonsSync,
  setDefaultPersons as saveDefaultPersons,
} from '@utils/settings';

export interface DefaultPersonsContextType {
  defaultPersons: number;
  setDefaultPersons: (value: number) => Promise<void>;
}

const DefaultPersonsContext = createContext<DefaultPersonsContextType | undefined>(undefined);

export const useDefaultPersons = () => {
  const context = useContext(DefaultPersonsContext);
  if (!context) {
    throw new Error('useDefaultPersons must be used within DefaultPersonsProvider');
  }
  return context;
};

export const DefaultPersonsProvider = ({ children }: { children: React.ReactNode }) => {
  // Seed from the synchronous settings cache so the first render carries the
  // user's saved value when `initSettings` has already warmed it; otherwise
  // the fallback returned by `getDefaultPersonsSync` is used until the async
  // load below resolves.
  const [defaultPersons, setDefaultPersonsState] = useState(() => getDefaultPersonsSync());

  useEffect(() => {
    getDefaultPersons().then(value => {
      setDefaultPersonsState(value);
    });
  }, []);

  const setDefaultPersonsContext = async (value: number) => {
    setDefaultPersonsState(value);
    await saveDefaultPersons(value);
  };

  return (
    <DefaultPersonsContext.Provider
      value={{ defaultPersons, setDefaultPersons: setDefaultPersonsContext }}
    >
      {children}
    </DefaultPersonsContext.Provider>
  );
};
