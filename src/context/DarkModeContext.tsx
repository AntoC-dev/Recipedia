/**
 * DarkModeContext - Global dark mode state management
 *
 * React context providing global dark mode state and toggle functionality throughout
 * the app. Integrates with React Native Paper's theme system and persistent storage
 * to maintain user preferences across app sessions.
 *
 * Key Features:
 * - Global dark mode state management
 * - Persistent storage of theme preference
 * - Integration with React Native Paper theming
 * - Type-safe context with proper error handling
 * - Smooth theme transitions
 * - System theme detection and following
 *
 * Usage Pattern:
 * The context is typically provided at the app root level and consumed by:
 * - Theme-aware components needing current theme state
 * - Settings screens for theme toggle controls
 * - Layout components requiring theme-specific styling
 *
 * @example
 * ```typescript
 * // Using the context in a component
 * import { useContext } from 'react';
 * import { DarkModeContext } from '@context/DarkModeContext';
 *
 * function ThemeToggle() {
 *   const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);
 *
 *   return (
 *     <Switch
 *       value={isDarkMode}
 *       onValueChange={toggleDarkMode}
 *       label="Dark Mode"
 *     />
 *   );
 * }
 *
 * // Provider setup (typically in App.tsx)
 * <DarkModeProvider>
 *   <NavigationContainer>
 *     <RootNavigator />
 *   </NavigationContainer>
 * </DarkModeProvider>
 * ```
 */

import React from 'react';

/**
 * Type definition for the dark mode context
 */
export type ParametersContextType = {
  /** Current dark mode state */
  isDarkMode: boolean;
  /** Function to toggle between light and dark modes */
  toggleDarkMode: () => void;
};

/**
 * React context for global dark mode state management
 *
 * Note: The full context provider component is implemented in App.tsx
 * to integrate with the theme provider and persistent storage
 */
export const DarkModeContext = React.createContext<ParametersContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {
    // Default implementation - overridden by provider
  },
});
