/**
 * Render-phase change detection used to reset local state when a prop or
 * context value changes, without an effect.
 *
 * @module useResetOnChange
 */

import { useState } from 'react';

/**
 * Runs `onChange` synchronously during render whenever any entry in `deps`
 * changes, compared shallowly with `Object.is` against the previous render.
 *
 * This is React's "adjusting state while rendering" pattern: it replaces a
 * `useEffect` that only mirrors props into state, avoiding the extra commit and
 * the `react-hooks/set-state-in-effect` lint rule. `onChange` typically calls
 * one or more state setters and reads the new values from the enclosing scope.
 * It does not fire on the initial render.
 *
 * @param deps - Values to watch; pass them as a fresh array each render, like
 *   a `useEffect` dependency list.
 * @param onChange - Callback fired once per change of `deps`.
 */
export function useResetOnChange(deps: readonly unknown[], onChange: () => void): void {
  const [prev, setPrev] = useState(deps);

  if (prev.length !== deps.length || deps.some((dep, i) => !Object.is(dep, prev[i]))) {
    setPrev(deps);
    onChange();
  }
}
