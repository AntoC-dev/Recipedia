# E2E Testing Guide for Recipedia

This guide provides comprehensive documentation for AI agents and developers
working with End-to-End (E2E) tests in the Recipedia React Native app using
Maestro.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [TestID Conventions](#testid-conventions)
- [File Types](#file-types)
- [Adding New Tests](#adding-new-tests)
- [Editing Existing Tests](#editing-existing-tests)
- [Reusability Patterns](#reusability-patterns)
- [OCR Testing Patterns](#ocr-testing-patterns)
- [Platform-Specific Testing](#platform-specific-testing)
- [Language Support](#language-support)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Overview

Recipedia uses **Maestro** for E2E testing. Maestro is a mobile UI testing
framework that uses YAML configuration files to define test flows.

### Key Commands

```bash
# Build and test in one command (runs all suites)
npm run workflow:build-test:android

# Run a specific test suite (from tests/e2e/ directory)
cd tests/e2e
maestro test . --config=settings.yaml
maestro test . --config=search.yaml
maestro test . --config=ocr.yaml

# Run individual test case directly
maestro test cases/settings/26_dark_mode.yaml

# Run specific feature directory
maestro test cases/search/
```

### Current Test Organization

Tests are organized into **test suites**, each with its own configuration file
at the root of `tests/e2e/`:

- **app-init.yaml** - App launch, onboarding, FAB menu
- **search.yaml** - Search bar and filters
- **recipe-view.yaml** - Recipe display and viewing
- **recipe-create.yaml** - Recipe creation manual entry
- **ocr.yaml** - OCR-based recipe creation (camera and gallery)
- **shopping.yaml** - Shopping list functionality
- **settings.yaml** - App parameters and preferences (dark mode, language,
  season filter)
- **tags-db.yaml** - Tag database management
- **ingredients-db.yaml** - Ingredient database management
- **duplicates.yaml** - Duplicate detection and validation

Each suite configuration file defines which test cases to run and their
execution order using the `flows` and `executionOrder` directives.

## Architecture

The E2E test architecture follows a hierarchical structure that promotes
reusability and maintainability following Maestro best practices.

```
tests/e2e/
├── {suite}.yaml                   # Test suite configuration (app-init, search, ocr, etc.)
├── cases/                         # Test case implementations
│   ├── {feature}/                # Feature-specific test cases
│   │   └── {test_name}.yaml      # Individual test case (e.g., 26_dark_mode.yaml)
├── flows/                         # Reusable action sequences
│   ├── {feature}/                # Feature-specific flows
│   │   └── {action}.yaml         # Reusable flow
├── asserts/                       # UI state verifications
│   ├── {screen}/                 # Screen-specific assertions
│   │   ├── common/               # Common reusable assertions
│   │   ├── en/                   # English-specific assertions
│   │   └── fr/                   # French-specific assertions
└── assets/                        # Test data (for OCR tests)
```

### Design Principles

1. **Suite-Based Organization**: Tests are organized into suites, each with its
   own configuration file
2. **Isolated Test Cases**: Each test case runs independently with its own app
   launch
3. **Feature Organization**: Test cases grouped by feature in `cases/`
   subdirectories
4. **Configured Execution**: Suite config files control test discovery and
   execution order
5. **Separation of Concerns**: Test cases orchestrate reusable flows and
   assertions
6. **Reusability**: Common actions and assertions are extracted into separate
   files
7. **Language Independence**: Language-specific assertions are separated
8. **Platform Awareness**: Android and iOS implementations are conditionally
   executed

## Directory Structure

### Suite Configuration Files (Root Level)

Each test suite has its own configuration file at the root of `tests/e2e/` that
defines which test cases to run and their execution order.

**Example**: `settings.yaml`

```yaml
flows:
  - cases/settings/*

executionOrder:
  flowsOrder:
    - '26 - Dark Mode Toggle Flow'
    - '27 - Language Switch Flow'
    - '28 - Season Filter Toggle Flow'
    - '29 - Season Filter Edge Cases Flow'
    - '30 - Default Persons Setting Flow'
```

**Available Suite Configurations**:

- `app-init.yaml` - Application initialization tests
- `search.yaml` - Search and filtering tests
- `recipe-view.yaml` - Recipe viewing tests
- `recipe-create.yaml` - Manual recipe creation tests
- `ocr.yaml` - OCR-based recipe creation tests
- `shopping.yaml` - Shopping list tests
- `settings.yaml` - Settings and preferences tests
- `tags-db.yaml` - Tag database tests
- `ingredients-db.yaml` - Ingredient database tests
- `duplicates.yaml` - Duplicate detection tests

### Test Case Files (Cases Directory)

Individual test cases in `cases/{feature}/` subdirectories. Each test case:

- Starts with `launchApp` or `runFlow: setupTest.yaml` for isolation
- Uses numbered naming convention (e.g., `26_dark_mode.yaml`)
- Has descriptive names in the YAML metadata

**Example**: `cases/settings/26_dark_mode.yaml`

```yaml
name: '26 - Dark Mode Toggle Flow'
appId: 'com.recipedia'
tags:
  - settings
---
- runFlow:
    file: '../../flows/setupTest.yaml'
    label: 'Setup - Launch app and wait for ready'

- runFlow:
    file: '../../cases/settings/darkModeToggle.yaml'
    label: 'Action - Toggle dark mode and verify'
```

### Cases Directory

Complete test scenarios that represent user journeys. Cases combine flows and
assertions to test specific functionality.

**Structure**:

```
cases/
├── bottomButtons/         # FAB menu expansion/collapse
├── filters/              # Search filtering by ingredients/tags
├── launchApp/            # Initial app launch scenarios
├── parameters/           # Settings screen interactions
├── recipeAdding/         # Recipe creation flows
│   ├── manual/          # Manual recipe entry
│   └── validation/      # Form validation tests
├── recipeRendering/      # Recipe display scenarios
├── searchBar/            # Search bar interactions
└── shopping/             # Shopping list operations
```

### Flows Directory

Reusable sequences of actions that can be composed into larger test scenarios.
Flows should be atomic and focused on a single feature.

**Structure**:

```
flows/
├── navigation/           # Screen navigation helpers
├── parameters/          # Settings interactions
│   └── language/        # Language switching flows
├── Recipe/              # Recipe-related flows
│   └── Adding/         # Recipe creation flows
│       ├── Manual/     # Manual input flows
│       ├── OCR/        # OCR-based input flows
│       │   ├── android/  # Android-specific OCR
│       │   ├── Camera/   # Camera mode OCR
│       │   └── Gallery/  # Gallery mode OCR
│       ├── en/         # English-specific flows
│       └── fr/         # French-specific flows
├── Search/              # Search-related flows
│   └── Filters/        # Filter manipulation flows
└── Shopping/            # Shopping list flows
    ├── en/             # English-specific flows
    └── fr/             # French-specific flows
```

### Asserts Directory

UI state verification files. Assertions check that the UI displays the expected
elements and data.

**Structure**:

```
asserts/
├── Alerts/              # Alert dialog assertions
│   ├── en/             # English alert messages
│   └── fr/             # French alert messages
├── BottomTabs/          # Bottom navigation assertions
├── Home/                # Home screen assertions
│   └── common/         # Reusable home assertions
├── Modal/               # Modal dialog assertions
├── Parameters/          # Settings screen assertions
│   └── language/       # Language-specific parameter checks
├── Recipe/              # Recipe screen assertions
│   ├── common/         # Reusable recipe assertions
│   ├── Edit/           # Edit mode assertions
│   ├── OCR/            # OCR mode assertions
│   └── ReadOnly/       # Read-only mode assertions
│       └── en/         # English recipe content
├── Search/              # Search screen assertions
│   ├── SearchBar/      # Search bar state
│   └── en/             # English search assertions
│       └── Filters/    # Filter state assertions
└── Shopping/            # Shopping list assertions
```

## TestID Conventions

The app uses a **consistent hierarchical TestID pattern** that makes elements
easy to locate in tests.

### Pattern

```
{Screen|Component}::{Element}[::{Type|Modifier}]
```

### Examples

```yaml
# Screen-level elements
id: "SearchScreen::SearchBar"
id: "SearchScreen::RecipeCards::0"
id: "BottomTabs::Home"

# Component-level elements
id: "RecipeTitle::Text"
id: "RecipeTitle::CustomTextInput"
id: "RecipeTitle::OpenModal::RoundButton"

# Indexed elements (for lists)
id: "RecipeIngredients::0::QuantityInput::NumericTextInput"
id: "Modal::List#2::SquareButton::Image"

# Button types
id: "BackButton::RoundButton"
id: "ExpandButton::RoundButton"
id: "RecipeValidate-text"  # Text button
```

### TestID Best Practices

1. **Be Specific**: Use the full hierarchy to avoid ambiguity
2. **Use Indices**: For list items, include the index (`::0`, `::1`, `#2`)
3. **Include Type**: Append element type when multiple elements share a name
   (`::RoundButton`, `::CustomTextInput`)
4. **Consistency**: Follow the established pattern for new components

## File Types

### 1. Test Suite Files

**Purpose**: Orchestrate multiple test cases into a coherent test suite
**Location**: Root of `tests/e2e/` **Naming**: `{number}_{feature}.yaml`

**Structure**:

```yaml
appId: 'com.recipedia'
name: 'Descriptive test suite name'
---
- launchApp # Reset app state

- runFlow:
    file: 'cases/feature/testCase.yaml'
    label: 'Description of what this case tests'
# Additional test cases...
```

### 2. Case Files

**Purpose**: Complete test scenarios representing user journeys **Location**:
`cases/{feature}/` **Naming**: `{action}.yaml` (camelCase)

**Structure**:

```yaml
appId: 'com.recipedia'
---
# Navigation
- tapOn:
    id: 'BottomTabs::Search'
    label: 'Navigate to Search screen'

# Action
- tapOn:
    id: 'SearchScreen::SearchBar'
    label: 'Focus on search bar'

# Assertion
- runFlow:
    file: '../../asserts/Search/en/assertSearchScreen.yaml'
    label: 'Verify search screen state'

# Cleanup
- tapOn:
    id: 'BottomTabs::Home'
    label: 'Return to Home'
```

### 3. Flow Files

**Purpose**: Reusable sequences of actions **Location**: `flows/{feature}/`
**Naming**: `{action}.yaml` (camelCase)

**Structure**:

```yaml
appId: 'com.recipedia'
---
# Focused on a single action or sequence
- tapOn:
    id: 'SomeButton::RoundButton'
    label: 'Perform specific action'

- runFlow:
    file: '../common/helper.yaml'
    label: 'Use shared helper'

# Can accept environment variables
- runFlow:
    file: 'subFlow.yaml'
    env:
      PARAM_NAME: value
    label: 'Parameterized flow'
```

### 4. Assert Files

**Purpose**: Verify UI state and content **Location**: `asserts/{screen}/`
**Naming**: Descriptive names indicating what's being asserted

**Structure**:

```yaml
appId: 'com.recipedia'
---
# Positive assertions
- assertVisible:
    id: 'Element::ID'
    label: 'Description of expected state'

- assertVisible:
    text: 'Expected Text'
    label: 'Text content is displayed'

# Negative assertions
- assertNotVisible:
    id: 'Element::ID'
    label: 'Element should not be visible'

# Text pattern matching
- assertVisible:
    text: "[\\s\\S]+" # Regex for non-empty text
    label: 'Content is present'
```

## Adding New Tests

### Adding a New Test Suite

1. **Create suite configuration file** at the root of `tests/e2e/`:
   `{suite-name}.yaml`
2. **Define test discovery** using `flows` directive
3. **Define execution order** using `executionOrder.flowsOrder` (optional)
4. **Update CI workflow** to include the new suite in the matrix

**Example**: Creating a new favorites test suite `favorites.yaml`

```yaml
flows:
  - cases/favorites/*

executionOrder:
  flowsOrder:
    - '40 - Add to Favorites Flow'
    - '41 - Remove from Favorites Flow'
    - '42 - View Favorites List Flow'
```

**Then add to `.github/workflows/build-test.yml`**:

```yaml
strategy:
  matrix:
    suite:
      [
        'app-init',
        'search',
        'recipe-view',
        'recipe-create',
        'shopping',
        'settings',
        'tags-db',
        'ingredients-db',
        'duplicates',
        'ocr',
        'favorites',
      ]
```

### Adding a New Test Case to Existing Suite

1. **Choose appropriate feature directory** in `cases/` or create a new one
2. **Create test case file** with numbered name: `{number}_{test_name}.yaml`
3. **Add test name** to the suite's `executionOrder.flowsOrder` list
4. **Structure the test**: Setup → Action → Cleanup

**Example**: Creating `cases/favorites/40_add_to_favorites.yaml`

```yaml
name: '40 - Add to Favorites Flow'
appId: 'com.recipedia'
tags:
  - favorites
---
- runFlow:
    file: '../../flows/setupTest.yaml'
    label: 'Setup - Launch app and wait for ready'

- runFlow:
    file: '../../cases/favorites/addToFavorites.yaml'
    label: 'Action - Add recipe to favorites'
```

### Adding a Reusable Case Flow

1. **Create case directory** if needed: `cases/{feature}/`
2. **Create case file**: `cases/{feature}/{action}.yaml` (use camelCase)
3. **Structure the test**: Navigate → Act → Assert → Cleanup

**Example**: `cases/favorites/addToFavorites.yaml`

```yaml
appId: 'com.recipedia'
---
# Navigate to recipe
- tapOn:
    id: 'BottomTabs::Search'
    label: 'Navigate to Search'

- tapOn:
    id: 'SearchScreen::RecipeCards::0'
    label: 'Open first recipe'

# Perform action
- tapOn:
    id: 'Recipe::FavoriteButton::RoundButton'
    label: 'Tap favorite button'

# Assert result
- runFlow:
    file: '../../asserts/Recipe/favoriteAdded.yaml'
    label: 'Verify recipe marked as favorite'

# Cleanup
- tapOn:
    id: 'BackButton::RoundButton'
    label: 'Return to search'
```

### Adding a New Flow

1. **Identify reusable action sequence**
2. **Create flow file** in appropriate directory
3. **Keep it focused** on single responsibility
4. **Add clear labels** for debugging

**Example**: `flows/favorites/toggleFavorite.yaml`

```yaml
appId: 'com.recipedia'
---
- tapOn:
    id: 'Recipe::FavoriteButton::RoundButton'
    label: 'Toggle favorite state'

- runFlow:
    file: '../../asserts/Alerts/en/favoriteToggled.yaml'
    label: 'Verify favorite toggle alert'
```

### Adding New Assertions

1. **Determine scope**: Screen-specific or common?
2. **Choose location**: `asserts/{screen}/` or `asserts/{screen}/common/`
3. **Consider language**: Need en/fr variants?
4. **Create assertion file**

**Example**: `asserts/Recipe/favoriteAdded.yaml`

```yaml
appId: 'com.recipedia'
---
- assertVisible:
    id: 'Recipe::FavoriteButton::RoundButton'
    label: 'Favorite button is visible'

- assertVisible:
    text: '󰋑' # Filled heart icon
    label: 'Favorite button shows filled heart'

- assertVisible:
    id: 'Recipe::FavoriteIndicator'
    label: 'Favorite indicator is displayed'
```

## Editing Existing Tests

### Best Practices for Editing

1. **Understand the hierarchy**: Know if you're editing a suite, case, flow, or
   assert
2. **Check dependencies**: Search for files that reference the one you're
   editing
3. **Maintain consistency**: Follow existing patterns and naming
4. **Update related files**: If changing a flow, update all cases that use it
5. **Test locally**: Run affected tests before committing

### Finding File Usage

```bash
# Find all references to a file
grep -r "fileName.yaml" tests/e2e --include="*.yaml"

# Find files referencing a specific TestID
grep -r "TestID::Name" tests/e2e --include="*.yaml"
```

### Common Edit Scenarios

#### Updating a TestID Reference

When the app's TestID changes, update all test files:

```bash
# Find all occurrences
grep -r "OldTestID" tests/e2e --include="*.yaml"

# Update manually or with sed (be careful!)
find tests/e2e -name "*.yaml" -exec sed -i '' 's/OldTestID/NewTestID/g' {} +
```

#### Adding a Step to Existing Flow

**Before**:

```yaml
- tapOn:
    id: 'Button::RoundButton'
    label: 'Tap button'

- runFlow:
    file: 'assert.yaml'
```

**After**:

```yaml
- tapOn:
    id: 'Button::RoundButton'
    label: 'Tap button'

# New steps with animation waits
- waitForAnimationToEnd:
    label: 'Wait for keyboard animation'

- pressKey: enter

- waitForAnimationToEnd:
    label: 'Wait for keyboard to dismiss'

- runFlow:
    file: 'assert.yaml'
```

#### Updating Assertion Text

When UI text changes:

```yaml
# Old
- assertVisible:
    text: 'Add to Cart'

# New
- assertVisible:
    text: 'Add to Menu' # Updated text
```

## Reusability Patterns

### Common Assertion Flows

Extract repeated assertions into common files for reusability.

**Example**: Recipe common buttons

**File**: `asserts/Recipe/common/buttonsReadOnly.yaml`

```yaml
appId: 'com.recipedia'
---
- assertVisible:
    id: 'BackButton::RoundButton'
    label: 'Back button is displayed'

- assertVisible:
    id: 'RecipeValidate-text'
    text: 'Add to the menu'
    label: 'Add recipe button is displayed'

- assertVisible:
    id: 'RecipeDelete::RoundButton'
    label: 'Delete button is displayed'
```

**Usage**:

```yaml
- runFlow:
    file: '../common/buttonsReadOnly.yaml'
    label: 'Assert common ReadOnly buttons'
```

### Environment Variables

Pass parameters to flows for flexibility.

**Flow**: `flows/navigation/openRecipe.yaml`

```yaml
appId: 'com.recipedia'
---
- tapOn:
    id: 'SearchScreen::RecipeCards::${RECIPE_INDEX}'
    label: 'Open recipe at index ${RECIPE_INDEX}'
```

**Usage**:

```yaml
- runFlow:
    file: 'flows/navigation/openRecipe.yaml'
    env:
      RECIPE_INDEX: 0
    label: 'Open first recipe'
```

### Conditional Execution

Execute different flows based on conditions.

**Platform-specific**:

```yaml
- runFlow:
    file: 'android/androidFlow.yaml'
    when:
      platform: Android

- runFlow:
    file: 'iOS/iOSFlow.yaml'
    when:
      platform: iOS
```

**Custom conditions**:

```yaml
- evalScript: ${output.needsValidation = true}

- runFlow:
    file: 'validate.yaml'
    when:
      true: ${output.needsValidation}
```

## OCR Testing Patterns

OCR (Optical Character Recognition) tests have special patterns due to Android
MediaStore behavior and the complexity of image-based input.

### The Gallery Ordering Problem

**Issue**: When multiple images are added to Android gallery in quick succession
(within ~500ms), they may receive similar timestamps, causing unpredictable
"Recent" sorting.

**Solution**: Add media **on-demand** (right before selection) and always select
index 0 (most recent).

### OCR Test Architecture

```
OCR Testing Flow:
1. Expand FAB menu (if needed)
2. Open OCR Camera or Gallery
3. For each field:
   a. Add media file to device gallery
   b. Tap OCR button for field
   c. Select most recent from gallery (index 0)
   d. Select from app modal using counter
   e. Increment modal counter
```

### Key OCR Files

**Android Media Addition**: `flows/Recipe/Adding/OCR/android/addMedia.yaml`

- Adds media file to device gallery
- Uses conditional logic to select correct file path
- Waits 500ms for Android MediaStore to index

**Gallery Selection**: `flows/Recipe/Adding/OCR/android/selectFromGallery.yaml`

- Selects most recent image from Android gallery (index 0)
- Validates without cropping

**Modal Selection with Counter**:
`flows/Recipe/Adding/OCR/android/selectMostRecentFromModal.yaml`

- Opens app's image selection modal
- Uses `modalImageCounter` to select correct image
- Increments counter for next field

### OCR Field Pattern

Each OCR field (title, description, ingredients, etc.) follows this pattern:

```yaml
appId: 'com.recipedia'
---
# Tap OCR button for this field
- tapOn:
    id: 'RecipeField::OpenModal::RoundButton'
    label: 'Tap on OCR button of recipe field'

# Add media file
- runFlow:
    file: ../android/addMedia.yaml
    env:
      FIELD_NAME: fieldName # Used to select correct image
    when:
      platform: Android
# TODO iOS

# Select from gallery and modal using counter
- runFlow:
    file: ../android/selectMostRecentFromModal.yaml
    label: 'Select field from modal for OCR'
    when:
      platform: Android
# TODO iOS
```

### Modal Counter Pattern

The modal counter tracks which image to select from the app's internal modal.

**Initialization** (in `ocrImage.yaml`):

```yaml
# After first image selection
- evalScript: ${output.modalImageCounter = 1}
```

**Usage** (in `selectMostRecentFromModal.yaml`):

```yaml
# Select using current counter value
- tapOn:
    id: 'Modal::List#${output.modalImageCounter}::SquareButton::Image'
    label: 'Select picture ${output.modalImageCounter} from app modal'

# Increment for next field
- evalScript: ${output.modalImageCounter = output.modalImageCounter + 1}
```

### Adding New OCR Recipe Assets

To add new OCR test recipes:

1. **Create asset directory**: `assets/{recipeName}/`
2. **Add images**: Place images for each field (image.jpg, title.jpg,
   ingredients.jpg, etc.)
3. **Update addMedia.yaml**: Add conditional blocks for new recipe

```yaml
# New recipe paths
- runFlow:
    when:
      true: ${RECIPE_NAME == "newRecipe" && FIELD_NAME == "image"}
    commands:
      - addMedia:
          - '../../../../../../assets/newRecipe/image.jpg'

- runFlow:
    when:
      true: ${RECIPE_NAME == "newRecipe" && FIELD_NAME == "title"}
    commands:
      - addMedia:
          - '../../../../../../assets/newRecipe/title.jpg'
# Add more fields...
```

4. **Create assertion file**: `asserts/Recipe/OCR/{recipeName}.yaml`
5. **Create test flow**: Add to `9_recipeAddingOCR.yaml`

### Camera vs Gallery OCR

**Gallery Mode** (`OCR/Gallery/`):

- Opens gallery from FAB menu
- User already on empty recipe screen
- First field (ocrImage) opens gallery button

**Camera Mode** (`OCR/Camera/`):

- Opens camera from FAB menu
- Already on empty recipe screen, no gallery button needed
- First field (ocrImage) special case: screen already open
- Reuses Gallery flows for all other fields

**Camera ocrImage.yaml** (special case):

```yaml
# No gallery button tap needed - screen already open

- runFlow:
    file: ../android/addMedia.yaml
    env:
      FIELD_NAME: image
    when:
      platform: Android

- tapOn:
    id: 'RecipeImage::RoundButton'
    label: 'Tap on OCR button'

- runFlow:
    file: ../android/selectFromGallery.yaml
    when:
      platform: Android

# Select first image from modal (index 0, not using counter yet)
- tapOn:
    id: 'Modal::List#0::SquareButton::Image'
    label: 'Select first image from app modal'

# Initialize counter for subsequent fields
- evalScript: ${output.modalImageCounter = 1}
```

### Maestro addMedia Limitation

**Important**: The `addMedia` command does NOT support variable substitution.

**This won't work**:

```yaml
- addMedia:
    - '${ASSET_PATH}' # Variable NOT supported
```

**This works**:

```yaml
# Use conditional logic with hardcoded paths
- runFlow:
    when:
      true: ${RECIPE_NAME == "hellofresh" && FIELD_NAME == "image"}
    commands:
      - addMedia:
          - '../../../../../../assets/aiguillettesTeriyaki/image.jpg'
```

## Platform-Specific Testing

### Current Status

- **Android**: Fully implemented and tested
- **iOS**: Prepared with TODO comments, awaiting implementation

### Conditional Platform Execution

Use `when: platform:` to execute platform-specific flows:

```yaml
- runFlow:
    file: 'android/androidSpecificFlow.yaml'
    when:
      platform: Android
    label: 'Android-specific implementation'

# TODO iOS
- runFlow:
    file: 'iOS/iOSSpecificFlow.yaml'
    when:
      platform: iOS
    label: 'iOS-specific implementation'
```

### Platform-Specific Directory Structure

```
flows/Recipe/Adding/OCR/
├── android/              # Android-specific implementations
│   ├── addMedia.yaml
│   ├── selectFromGallery.yaml
│   ├── selectMostRecentFromModal.yaml
│   ├── takePhoto.yaml
│   └── validateWithoutCropping.yaml
└── iOS/                  # iOS implementations (TODO)
    └── (pending implementation)
```

### Adding iOS Support

When implementing iOS support:

1. **Create iOS directory**: `flows/{feature}/iOS/`
2. **Implement iOS-specific flows**: Adapt Android patterns
3. **Remove TODO comments**: Replace with actual iOS implementation
4. **Test on iOS device**: Verify flows work correctly
5. **Update documentation**: Note any iOS-specific quirks

## Language Support

The app supports English and French with language-specific test assertions.

### Language-Specific Directories

```
asserts/
├── Alerts/
│   ├── en/              # English alert messages
│   └── fr/              # French alert messages
├── Home/
│   ├── en/              # English home screen
│   └── fr/              # French home screen
├── Search/
│   ├── en/              # English search UI
│   └── fr/              # French search UI
└── Shopping/
    ├── en/              # English shopping list
    └── fr/              # French shopping list
```

### Language Testing Pattern

**Language Switch Test** (`cases/parameters/languageChange.yaml`):

```yaml
# Switch to French
- runFlow:
    file: '../../flows/parameters/language/switchToFrench.yaml'
    label: 'Switch language to French'

# Verify French translations
- runFlow:
    file: '../../flows/parameters/language/homeIsTranslated.yaml'
    label: 'Verify Home screen in French'

- runFlow:
    file: '../../flows/parameters/language/searchIsTranslated.yaml'
    label: 'Verify Search screen in French'

# Switch back to English
- runFlow:
    file: '../../flows/parameters/language/switchToEnglish.yaml'
    label: 'Switch language back to English'
```

### Adding New Language Support

1. **Create language directories**: `asserts/{screen}/{langCode}/`
2. **Create translated assertions**: Duplicate English files with translations
3. **Add language switch flow**:
   `flows/parameters/language/switchTo{Language}.yaml`
4. **Add verification flows**:
   `flows/parameters/language/{screen}IsTranslated.yaml`
5. **Update language test**: Add new language to
   `cases/parameters/languageChange.yaml`

## Common Patterns

### Navigation Pattern

```yaml
# Navigate to screen
- tapOn:
    id: 'BottomTabs::ScreenName'
    label: 'Navigate to ScreenName'

# Perform action
# ...

# Return to previous screen
- tapOn:
    id: 'BackButton::RoundButton'
    label: 'Return to previous screen'

# Or return to specific screen
- tapOn:
    id: 'BottomTabs::Home'
    label: 'Return to Home'
```

### Scroll Pattern

```yaml
# Scroll until element is visible
- scrollUntilVisible:
    element:
      id: 'Element::ID'
    direction: DOWN # or UP
    speed: 60
    centerElement: true # Optional
    label: 'Scroll to element'
```

### Input Pattern

```yaml
# Tap on input field
- tapOn:
    id: 'Input::CustomTextInput'
    label: 'Focus on input field'

# Enter text
- inputText:
    text: 'Sample text'
    label: 'Enter text'

# Dismiss keyboard with animation waits
- waitForAnimationToEnd:
    label: 'Wait for keyboard animation'

- pressKey: enter

- waitForAnimationToEnd:
    label: 'Wait for keyboard to dismiss'
```

**Note**: Always wrap keyboard dismissal commands with `waitForAnimationToEnd`
before and after:

- **Before**: Ensures keyboard animation is complete before dismissing
- **After**: Ensures keyboard dismissal animation completes before next
  interaction
- This prevents race conditions where Maestro taps on the wrong element while
  keyboard is animating

**Modal Dialogs (ItemDialog, NoteEditDialog, UrlInputDialog)**: For single-line
inputs in modal dialogs, use platform-specific keyboard dismissal. The iOS
keyboard shows "Done" button (via `returnKeyType="done"` on CustomTextInput):

```yaml
# Enter text in modal
- inputText:
    text: 'Item name'
    label: 'Enter item name'

- waitForAnimationToEnd:
    label: 'Wait for keyboard animation'

# Platform-specific keyboard dismissal
- runFlow:
    when:
      platform: Android
    commands:
      - hideKeyboard:
          label: 'Dismiss keyboard on Android'

- runFlow:
    when:
      platform: iOS
    commands:
      - tapOn:
          id: 'Done'
          label: 'Tap Done key to dismiss keyboard on iOS'

- waitForAnimationToEnd:
    label: 'Wait for keyboard to dismiss'
```

This approach is more reliable than `pressKey: enter` for iOS modals, where the
enter key press can be flaky on CI simulators. Android continues to use
`hideKeyboard` which works reliably.

**Non-Modal Single-Line Inputs**: For inputs on regular screens (not in modals),
`pressKey: enter` can still be used but may be replaced with the
platform-specific approach if flakiness is observed.

**Exception 1 - Autocomplete Fields**: For tag and ingredient name inputs that
show autocomplete dropdowns, use `hideKeyboard` on **Android only**:

```yaml
# Type partial text to trigger autocomplete
- inputText:
    text: 'RecipeT'
    label: 'Enter partial tag name'

# Dismiss keyboard on Android only (iOS handled case-by-case)
- runFlow:
    when:
      platform: Android
    commands:
      - hideKeyboard:
          label: 'Dismiss keyboard on Android'

# Verify autocomplete dropdown is visible
- assertVisible:
    id: 'RecipeTags::List::0::AutocompleteItem::RecipeTag'
    label: 'Autocomplete item is displayed'

# Manually select from dropdown
- tapOn:
    id: 'RecipeTags::List::0::AutocompleteItem::RecipeTag'
    label: 'Select from autocomplete dropdown'
```

Using `pressKey: enter` on autocomplete fields will auto-select the first
suggestion instead of allowing manual selection from the dropdown. iOS
autocomplete keyboard dismissal is handled case-by-case when test failures
occur.

**Exception 2 - Multiline Text Inputs**: For title, description, and preparation
fields that support multiline text, tap on a nearby section header label to
dismiss the keyboard:

```yaml
# Title field - tap on Description label
- tapOn:
    id: 'RecipeTitle::CustomTextInput'
    label: 'Focus on title input'

- inputText:
    text: 'My Recipe Title'
    label: 'Enter title'

- tapOn:
    id: 'RecipeDescription::Text'
    label: 'Tap on description label to dismiss keyboard'

# Description field - tap on Tags header
- tapOn:
    id: 'RecipeDescription::CustomTextInput'
    label: 'Focus on description input'

- inputText:
    text: 'Recipe description'
    label: 'Enter description'

- tapOn:
    id: 'RecipeTags::HeaderText'
    label: 'Tap on tags header to dismiss keyboard'

# Preparation content - tap on Time label
- tapOn:
    id: 'RecipePreparation::EditableStep::0::TextInputContent::CustomTextInput'
    label: 'Focus on preparation content'

- inputText:
    text: 'Preparation instructions'
    label: 'Enter preparation'

- tapOn:
    id: 'RecipeTime::Text'
    label: 'Tap on time label to dismiss keyboard'
```

For multiline inputs, `pressKey: enter` adds a newline character instead of
dismissing the keyboard, so we tap on section headers to dismiss safely.

**Exception 3 - SearchBar**: For the SearchBar component, use `hideKeyboard`
instead of `pressKey: enter`:

```yaml
# Type in SearchBar
- tapOn:
    id: 'SearchScreen::SearchBar'
    label: 'Open SearchBar'

- inputText:
    text: 'E2E'
    label: 'Enter search text'

# Dismiss keyboard WITHOUT submitting search
- hideKeyboard:
    label: 'Dismiss keyboard'
```

Using `pressKey: enter` on SearchBar validates/submits the search text instead
of just dismissing the keyboard. `hideKeyboard` works correctly for SearchBar on
both platforms.

**Important**: If you tap on SearchBar **without entering text** (to open the
dropdown without typing), the keyboard doesn't appear on iOS. In this case, use
`hideKeyboard` on **Android only**:

```yaml
# Tap SearchBar to open dropdown (no text input)
- tapOn:
    id: 'SearchScreen::SearchBar'
    label: 'Focus on search bar to open dropdown'

# Dismiss keyboard on Android only (iOS doesn't show keyboard)
- runFlow:
    when:
      platform: Android
    commands:
      - hideKeyboard:
          label: 'Dismiss keyboard on Android'
```

**Closing SearchBar Dropdown**: Following Material Design pattern, the SearchBar
close icon (RightIcon) is visible when:

- Search has text content (clears text and closes dropdown)
- Search is active/focused even without text (closes dropdown)

This provides consistent cross-platform behavior for closing the dropdown:

```yaml
# Open search dropdown
- tapOn:
    id: 'SearchScreen::SearchBar'
    label: 'Open search dropdown'

# Close dropdown with icon (works on both platforms)
- tapOn:
    id: 'SearchScreen::SearchBar::RightIcon'
    label: 'Close dropdown'
```

The icon replaces platform-specific approaches:

- ❌ OLD: `pressKey: "BACK"` (Android only)
- ❌ OLD: `tapOn: point: "50%,95%"` (fragile coordinates on iOS)
- ✅ NEW: Tap close icon (works on both platforms)

### List Item Selection Pattern

```yaml
# Select item by index
- tapOn:
    id: 'List::Item::${INDEX}'
    label: 'Select item at index ${INDEX}'

# Or specific index
- tapOn:
    id: 'RecipeCards::0'
    label: 'Select first recipe card'
```

### Wait Pattern

```yaml
# Wait for element to appear
- extendedWaitUntil:
    visible: 'Element::ID'
    timeout: 5000 # milliseconds
    label: 'Wait for element to appear'

# Wait for element to disappear
- extendedWaitUntil:
    visible: 'Element::ID'
    timeout: 5000
    optional: true # Don't fail if not found
    label: 'Wait for element to disappear'
```

### Modal Pattern

```yaml
# Open modal
- tapOn:
    id: 'OpenModal::RoundButton'
    label: 'Open modal'

# Interact with modal content
- tapOn:
    id: 'Modal::ConfirmButton'
    label: 'Confirm action'

# Modal usually closes automatically, but can close manually
- pressKey: 'BACK'
```

## Troubleshooting

### Common Issues and Solutions

#### Issue: Test fails with "Element not found"

**Possible causes**:

1. **TestID changed in app**: Update test files with new TestID
2. **Element not visible**: Add scrollUntilVisible before assertion
3. **Timing issue**: Add extendedWaitUntil before interaction
4. **Wrong screen**: Verify navigation steps are correct

**Solution**:

```yaml
# Add wait before assertion
- extendedWaitUntil:
    visible: 'Element::ID'
    timeout: 3000
    label: 'Wait for element'

# Then assert or interact
- assertVisible:
    id: 'Element::ID'
```

#### Issue: File path not found

**Error**: `Flow file does not exist: path/to/file.yaml`

**Cause**: Incorrect relative path in runFlow

**Solution**:

- Count directory levels carefully
- Use `../` to go up one level
- Verify file exists at expected location

```yaml
# If current file is: cases/feature/test.yaml
# And target is: flows/feature/flow.yaml

# Wrong:
file: "flows/feature/flow.yaml"  # Absolute path doesn't work

# Correct:
file: "../../flows/feature/flow.yaml"  # Relative from current location
```

#### Issue: OCR test shows wrong recipe data

**Cause**: Gallery ordering issue - wrong image selected

**Solution**:

- Verify `addMedia` is called before selection
- Check `modalImageCounter` is properly incremented
- Ensure selecting index 0 from gallery (most recent)
- Verify correct RECIPE_NAME and FIELD_NAME env variables

#### Issue: Platform-specific test not running

**Symptom**: Test skipped or runs wrong platform code

**Solution**:

```yaml
# Ensure correct platform condition
- runFlow:
    file: 'android/flow.yaml'
    when:
      platform: Android # Capital A
    label: 'Android flow'
```

#### Issue: Variable not substituted

**Symptom**: `${VARIABLE_NAME}` appears literally instead of value

**Causes**:

1. **Environment variable not passed**: Add `env:` block to runFlow
2. **Maestro limitation**: Some commands don't support variables (e.g.,
   addMedia)

**Solution**:

```yaml
# Pass environment variable
- runFlow:
    file: 'targetFlow.yaml'
    env:
      VARIABLE_NAME: value
    label: 'Flow with parameter'

# For addMedia, use conditional logic instead
- runFlow:
    when:
      true: ${RECIPE_NAME == "value"}
    commands:
      - addMedia:
          - 'hardcoded/path.jpg'
```

#### Issue: Test fails intermittently

**Possible causes**:

1. **Timing issues**: Add waits/delays
2. **Animation interference**: Wait for animations to complete
3. **State from previous test**: Ensure proper cleanup
4. **Gallery ordering**: For OCR tests, verify media addition timing

**Solutions**:

```yaml
# Add explicit waits
- extendedWaitUntil:
    visible: 'Element::ID'
    timeout: 5000

# Reset app state between tests
- launchApp # In test suite file
```

### Debugging Tips

1. **Add verbose labels**: Every action should have a descriptive label

   ```yaml
   - tapOn:
       id: 'Button::ID'
       label: 'Descriptive label explaining what this does'
   ```

2. **Test incrementally**: Add one step at a time and test
3. **Use Maestro Studio**: Visual test recorder to verify selectors

   ```bash
   maestro studio
   ```

4. **Check Maestro logs**: Look for detailed error messages
5. **Verify TestIDs in app**: Use React Native Debugger to inspect elements
6. **Test in isolation**: Run single test file to isolate issues
   ```bash
   maestro test tests/e2e/path/to/test.yaml
   ```

### Getting Help

- **Maestro Documentation**: https://maestro.mobile.dev/
- **Project Issues**: Check TODOs in test files for known limitations
- **Test Output**: Maestro provides detailed step-by-step output on failure

## Best Practices Summary

1. ✅ **Run tests by suite** using `maestro test . --config={suite}.yaml` from
   `tests/e2e/`
2. ✅ **Always add descriptive labels** to every action
3. ✅ **Use common assertion flows** to reduce duplication
4. ✅ **Follow TestID conventions** consistently
5. ✅ **Add TODO comments** for pending iOS implementations
6. ✅ **Test one thing per case** - keep tests focused
7. ✅ **Use relative paths correctly** in runFlow
8. ✅ **Add waits for dynamic content** to prevent flakiness
9. ✅ **Clean up after tests** - return to known state
10. ✅ **Pass parameters via env** for reusable flows
11. ✅ **Keep flows atomic** - single responsibility
12. ✅ **Update all references** when changing shared files
13. ✅ **Test locally** before committing changes
14. ✅ **Document complex patterns** with comments
15. ✅ **Use platform conditionals** for platform-specific code
16. ✅ **For OCR: add media on-demand**, always select index 0
17. ✅ **Update suite config** when adding new test cases

---

**Last Updated**: 2026-01-09

**Key Changes**:

- **SearchBar close icon (Material Design pattern)**: SearchBar now shows close
  icon when search is active (even without text), providing consistent
  cross-platform behavior for closing dropdown. Replaced platform-specific
  approaches (`pressKey: "BACK"` on Android, coordinate taps on iOS) with icon
  tap. Updated 2 code files, 1 unit test file, 6 E2E assertion files, 2 E2E test
  files.
- **hideKeyboard after tapOn (without inputText)**: Made Android-only because
  iOS doesn't show keyboard when tapping without typing (3 search tests updated:
  1_open_close.yaml, 2_scroll_independence.yaml, 4_direct_click.yaml)
- **SearchBar keyboard dismissal**: SearchBar now uses `hideKeyboard` instead of
  `pressKey: enter` to avoid submitting the search (12 files updated)
- **Platform-specific autocomplete keyboard dismissal**: Autocomplete fields
  (tags/ingredients) now use `hideKeyboard` on Android only, iOS failures
  handled case-by-case (4 files updated)
- **Multiline text input pattern**: Title, description, and preparation fields
  now tap on nearby section labels (RecipeDescription::Text,
  RecipeTags::HeaderText, RecipeTime::Text) to dismiss keyboard instead of
  `pressKey: enter` (4 files updated)
- Reasoning: `pressKey: enter` on SearchBar submits search; on autocomplete
  auto-selects first suggestion; on multiline inputs adds newlines
- Regular inputs (quantity, time, single-line) continue to use
  `waitForAnimationToEnd` + `pressKey: enter` + `waitForAnimationToEnd`
- Added `waitForAnimationToEnd` before and after all `pressKey: enter` commands
  (83 files updated earlier today)
- This prevents race conditions where Maestro taps on wrong elements during
  keyboard animations
- Previously replaced all `hideKeyboard` commands with `pressKey: enter` (54
  files)
- `hideKeyboard` doesn't work reliably with React Native Paper's Portal-based
  dialogs, but is necessary for Android autocomplete use cases
- `pressKey: enter` works consistently for regular single-line inputs

**Previous Update** (2025-11-10): Restructured test execution to use suite-based
configuration files at the root of `tests/e2e/`. Each suite (app-init, search,
ocr, settings, etc.) has its own YAML config that defines test discovery and
execution order. Tests run one suite at a time using
`maestro test . --config={suite}.yaml`.

**Maintainer**: Development Team

**Questions**: Refer to CLAUDE.md for additional project conventions
