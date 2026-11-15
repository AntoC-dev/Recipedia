import { useCopilot } from 'react-native-copilot';

/**
 * Safe wrapper for useCopilot hook that handles cases where CopilotProvider is not available
 *
 * The try-catch pattern around useCopilot() is intentional for graceful degradation
 * when CopilotProvider is not available. React Compiler treats this as a conditional
 * hook call, but it's a valid error boundary pattern for optional context providers.
 *
 * @returns Copilot hook data or null if provider is not available
 */
export function useSafeCopilot() {
  try {
    // Intentional try-catch around hook for graceful degradation
    // when CopilotProvider is not in the component tree.
    return useCopilot();
  } catch {
    return null;
  }
}
