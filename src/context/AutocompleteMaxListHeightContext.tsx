/**
 * AutocompleteMaxListHeightContext - Suggestion list height cap for autocomplete inputs.
 *
 * Provided by `AutocompleteFocusScrollView` (recipe form search-field focus mode, see
 * architecture/recipe-form.md) and read by every `AutocompleteBubble` inside it, so the cap
 * reaches the suggestion lists without being threaded through the form fields.
 *
 * @module context/AutocompleteMaxListHeightContext
 */

import { createContext } from 'react';

/** Maximum suggestion list height in pixels; `undefined` (the default, without a provider) means no cap */
export const AutocompleteMaxListHeightContext = createContext<number | undefined>(undefined);
