# Translation System Documentation

## Overview

The Recipedia app uses a modular translation system based on i18n-js and
expo-localization. The system is organized to make translations more
maintainable by grouping related translations into separate files.

## Structure

The translation system is organized as follows:

```
src/translations/
├── README.md
├── en/                 # English translations
│   ├── alerts.ts       # Alert-related translations
│   ├── common.ts       # Common action and message translations
│   ├── filters.ts      # Filter-related translations
│   ├── index.ts        # Combines all English translations
│   ├── ingredientTypes.ts # Ingredient type translations
│   ├── navigation.ts   # Navigation-related translations
│   ├── parameters.ts   # Parameters screen translations
│   ├── recipe.ts       # Recipe-related translations
│   ├── seasons.ts      # Season names translations
│   └── shopping.ts     # Shopping-related translations
├── fr/                 # French translations (same structure as English)
├── en.ts               # Main English translation file (imports from en/index.ts)
└── fr.ts               # Main French translation file (imports from fr/index.ts)
```

## How to Use

### In Components

To use translations in your components, import the `useI18n` hook from
`@utils/i18n`:

```typescript
import {useI18n} from '@utils/i18n';

const MyComponent = () => {
    const {t} = useI18n();

    return (
        <Text>{t('home')
}
    </Text>
)
    ;
};
```

### Changing Language

To change the current language:

```typescript
const { setLocale } = useI18n();
setLocale('fr'); // Change to French
```

### Getting Current Language

To get the current language:

```typescript
const { getLocale } = useI18n();
const currentLanguage = getLocale();
```

## Adding a New Translation Key

1. Identify the appropriate category file for your translation
2. Add the key and translation to both language files (en and fr)
3. Use the key in your component with the `t` function

## Adding a New Language

1. Create a new directory for the language (e.g., `de/` for German)
2. Copy the structure from the English directory
3. Translate all keys
4. Create a main file (e.g., `de.ts`) that imports from the index
5. Update the `LANGUAGE_NAMES` object in `src/utils/i18n.ts`

## Testing

The translation system has comprehensive tests:

- `tests/unit/utils/i18n.test.tsx`: Tests the i18n utility functions
- `tests/unit/translations/translations.test.tsx`: Tests the modular translation
  structure

Run the tests with:

```bash
pnpm exec jest tests/unit/utils/i18n.test.tsx tests/unit/translations/translations.test.tsx
```
