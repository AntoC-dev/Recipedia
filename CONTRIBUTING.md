# Contributing to Recipedia

Thank you for your interest in contributing to Recipedia! This guide will help you get started with contributing to this
React Native recipe management app.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Code Style and Standards](#code-style-and-standards)
- [Issue Guidelines](#issue-guidelines)

## 🤝 Code of Conduct

This project follows a Code of Conduct to ensure a welcoming environment for all contributors. Please be respectful,
inclusive, and collaborative.

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)

For mobile development:

- **Android**: [Android Studio](https://developer.android.com/studio) with Android SDK
- **iOS**: [Xcode](https://developer.apple.com/xcode/) (macOS only)

### First Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Recipedia.git
   cd Recipedia
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/Recipedia.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start development server**:
   ```bash
   npm start
   ```

## 🏗️ Development Setup

### Running the App

```bash
# Start Expo development server
npm start

# Run on Android
npm run dev:android

# Run on iOS
npm run dev:ios
```

### Database Development

The app uses SQLite for local storage. The database is managed through the `RecipeDatabase` singleton class.

- Database operations should always be async
- Use the provided `databaseLogger` for database operation logging
- Test database operations thoroughly

### Development Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run dev:android         # Run on Android
npm run dev:ios             # Run on iOS

# Code Quality
npm run quality             # Check all quality gates
npm run lint                # ESLint check
npm run lint:fix            # ESLint auto-fix
npm run format              # Format with Prettier
npm run format:check        # Check formatting
npm run typecheck           # TypeScript check

# Testing
npm run test:unit           # Run unit tests
npm run test:unit:watch     # Run tests in watch mode
npm run test:unit:coverage  # Run with coverage
npm run test:e2e:android    # Run E2E tests

# Documentation
npm run docs:build          # Generate API documentation
npm run docs:clean          # Clean documentation build

# Building
npm run build:test:android  # Build Android APK
npm run build:test:ios      # Build iOS app

# Release
npm run release            # Semantic release
```

## 📁 Project Structure

Understanding the project structure is crucial for effective contributions:

```
src/
├── components/             # UI Components (Atomic Design)
│   ├── atomic/             # Basic components (buttons, inputs)
│   ├── molecules/          # Composite components
│   └── organisms/          # Complex components
├── screens/                # App screens
├── navigation/             # Navigation configuration
├── context/                # React Context providers
├── utils/                  # Utilities and database logic
├── styles/                 # Styling and theming
├── translations/           # i18n translations
└── customTypes/            # TypeScript definitions

tests/
├── unit/                   # Unit tests
├── e2e/                    # End-to-end tests
├── mocks/                  # Test mocks
└── data/                   # Test data
```

### Component Architecture

We follow **Atomic Design** principles:

- **Atomic**: Basic building blocks (buttons, inputs, images)
- **Molecules**: Groups of atoms (cards, input groups)
- **Organisms**: Complex UI sections (search bars, recipe sections)

## 📝 Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements**
- 🧪 **Tests**
- 🎨 **UI/UX improvements**
- 🌍 **Translations**
- ⚡ **Performance improvements**

### Contribution Workflow

1. **Check existing issues** before starting work
2. **Create an issue** for new features or major changes
3. **Get approval** from maintainers before implementing large changes
4. **Create a feature branch** from `main`
5. **Implement your changes** following our guidelines
6. **Add tests** for new functionality
7. **Update documentation** as needed
8. **Submit a pull request**

### Branch Naming

Use descriptive branch names that include the issue number:

```bash
feature/123-recipe-import-export
bugfix/456-search-crash-android
docs/789-api-documentation
refactor/321-database-optimization
```

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All quality checks pass (`npm run quality:check`)
- [ ] All tests pass (`npm run test:unit`)
- [ ] New functionality includes tests
- [ ] Documentation is updated (JSDoc comments and examples)
- [ ] API documentation builds without warnings (`npm run docs:build`)
- [ ] Commit messages follow semantic conventions
- [ ] No merge conflicts with main branch
- [ ] Pre-commit hooks are set up and working

### PR Template

When creating a PR, please include:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing

- [ ] Unit tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed

## Screenshots (if applicable)

Before/after screenshots for UI changes

## Breaking Changes

List any breaking changes and migration steps
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Testing** on multiple devices if UI changes
4. **Approval** from at least one maintainer
5. **Merge** by maintainers

## 🧪 Testing Requirements

### Unit Tests

All new functionality must include unit tests:

```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Watch mode during development
npm run test:unit:watch
```

### Test Guidelines

- **Components**: Test rendering, props, and user interactions
- **Utilities**: Test all public functions and edge cases
- **Database**: Mock database operations in unit tests
- **Coverage**: Aim for >80% code coverage

### E2E Tests

For significant UI changes, consider adding E2E tests:

```bash
npm run test:e2e:android
```

E2E tests use Maestro and test complete user workflows.

## 🎨 Code Style and Standards

### Automated Code Quality

The project enforces code quality through:

- **Pre-commit hooks**: Automatic formatting and linting on commit
- **ESLint**: Code linting with React Native and TypeScript rules
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict type checking
- **Conventional commits**: Enforced commit message format

### TypeScript

- Use strict TypeScript configuration
- Define proper types for all functions and components
- Avoid `any` type usage
- Use path aliases from `tsconfig.json`
- All code must pass `npm run typecheck`

### Code Formatting

- **Automatic**: Pre-commit hooks format code automatically
- **Manual**: Run `npm run format` to format all files
- **Validation**: `npm run format:check` validates formatting
- **Configuration**: See `.prettierrc.js` for settings

### React Native / React

- Use functional components with hooks
- Follow React Native best practices
- Use proper prop types and default props
- Implement proper error boundaries

### Styling

- Use `react-native-paper` for UI components and theming
- Follow existing theme structure
- Support both light and dark modes
- Use responsive design principles

### Database

- All database operations must be async
- Use proper error handling
- Log operations with `databaseLogger`
- Follow database schema patterns

### Internationalization

- All user-facing text must be internationalized
- Add translations to both `en/` and `fr/` folders
- Use proper i18next patterns
- Test language switching

### Code Examples

#### Component Structure

```typescript
import React from 'react';
import {View} from 'react-native';
import {Text, useTheme} from 'react-native-paper';

interface MyComponentProps {
    title: string;
    onPress?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({title, onPress}) => {
    const {colors} = useTheme();

    return (
        <View style = {
    {
        padding: 16, backgroundColor
    :
        colors.surface
    }
}>
    <Text variant = "titleLarge"
    style = {
    {
        color: colors.onSurface
    }
}>
    {
        title
    }
    </Text>
    < /View>
)
    ;
};
```

#### Database Operations

```typescript
import {RecipeDatabase} from '@utils/RecipeDatabase';
import {databaseLogger} from '@utils/logger';

export const addRecipe = async (recipe: Recipe): Promise<void> => {
    try {
        const db = RecipeDatabase.getInstance();
        await db.addRecipe(recipe);
        databaseLogger.info('Recipe added successfully', {recipeId: recipe.id});
    } catch (error) {
        databaseLogger.error('Failed to add recipe', {error, recipe});
        throw error;
    }
};
```

### Commit Messages

Use semantic commit messages that include the issue number:

```
feat(#123): add recipe export functionality
fix(#456): resolve search crash on Android
docs(#789): update API documentation
style(#101): improve recipe card layout
refactor(#321): optimize database queries
test(#654): add unit tests for search functionality
```

## 🐛 Issue Guidelines

### Bug Reports

When reporting bugs, include:

- **Environment**: Device, OS version, app version
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Logs**: Any relevant error messages

### Feature Requests

For feature requests, include:

- **Use case**: Why is this feature needed?
- **Description**: Detailed description of the feature
- **Mockups**: UI mockups if applicable
- **Implementation ideas**: If you have suggestions

### Issue Labels

We use labels to categorize issues:

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Documentation improvements
- `good-first-issue`: Good for newcomers
- `help-wanted`: Extra attention needed
- `priority-high`: High priority issue

## 🔧 Development Tips

### Debugging

- Use React Native Debugger for debugging
- Enable remote debugging in Expo
- Use console logs with appropriate log levels
- Test on both iOS and Android

### Performance

- Use `React.memo` for expensive components
- Optimize large lists with FlashList
- Profile app performance regularly
- Monitor bundle size

### Database Best Practices

- Use transactions for multiple operations
- Implement proper error handling
- Log all database operations
- Test database migrations thoroughly

## 📚 Documentation Maintenance

### API Documentation

The project uses **TypeDoc** to generate comprehensive API documentation that is automatically published to GitHub
Pages. All contributors must maintain documentation quality.

#### Documentation Requirements

**For New Components/Functions:**

- [ ] Add comprehensive JSDoc comments to all exported functions, classes, and components
- [ ] Include `@param` descriptions for all parameters
- [ ] Include `@returns` description for return values
- [ ] Add `@example` usage examples for complex components
- [ ] Document all TypeScript interfaces and types

**For Existing Code Changes:**

- [ ] Update JSDoc comments when modifying function signatures
- [ ] Update examples when changing component APIs
- [ ] Ensure TypeScript types are properly exported
- [ ] Test documentation generation locally

#### Documentation Commands

```bash
# Generate and test documentation
npm run docs:build          # Build API documentation
npm run docs:clean          # Clean documentation files
open docs/index.html         # View local documentation
```

#### Documentation Standards

1. **Component Documentation Example:**

```typescript
/**
 * CustomButton - Reusable button component with theme integration
 *
 * A themed button component that provides consistent styling and behavior
 * across the application. Supports multiple variants and icon integration.
 *
 * @example
 * ```typescript
 * <CustomButton
 *   title="Save Recipe"
 *   variant="primary"
 *   icon="save"
 *   onPress={() => saveRecipe()}
 *   testID="save-button"
 * />
 * ```

*/
export function CustomButton({
title,
variant = 'primary',
icon,
onPress,
testID
}: CustomButtonProps) {
// Implementation
}

```

2. **Function Documentation Example:**
```typescript
/**
 * Calculates scaled ingredient quantities for different serving sizes
 *
 * Takes a base recipe quantity and scales it proportionally to match
 * the target number of servings while maintaining proper ratios.
 *
 * @param originalQuantity - The original recipe quantity
 * @param originalServings - Number of servings in original recipe
 * @param targetServings - Desired number of servings
 * @returns Scaled quantity for the target serving size
 * 
 * @example
 * ```typescript
 * const scaled = scaleQuantity("2 cups", 4, 6); // Returns "3 cups"
 * ```

*/
export function scaleQuantity(
originalQuantity: string,
originalServings: number,
targetServings: number
): string {
// Implementation
}

```

#### Quality Assurance

- **Zero Warnings Policy**: Documentation builds must complete without warnings
- **TypeScript Integration**: All types must be properly exported and documented
- **Source Links**: Documentation includes direct links to GitHub source files
- **Examples Required**: Complex components and utilities must include usage examples

#### Documentation Publishing

The documentation is automatically published to GitHub Pages at:
- **Live Documentation**: [https://AntoC-dev.github.io/Recipedia/](https://AntoC-dev.github.io/Recipedia/)

Updates are published automatically when changes are merged to the main branch.

## 🌍 Internationalization

### Adding Translations

1. Add keys to `src/translations/en/index.ts`
2. Add corresponding translations to `src/translations/fr/index.ts`
3. Use `useTranslation` hook in components
4. Test language switching

### Translation Guidelines

- Use clear, concise language
- Maintain consistency across translations
- Consider cultural differences
- Test text length in different languages

## 📚 Resources

### Documentation

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/)
- [i18next Documentation](https://www.i18next.com/)

### Tools

- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [Maestro](https://maestro.mobile.dev/) for E2E testing

## ❓ Getting Help

If you need help:

1. Check existing documentation
2. Search existing issues
3. Ask in GitHub Discussions
4. Create a new issue with the `help-wanted` label

## 🎉 Recognition

Contributors will be recognized:

- Listed in the project README
- Mentioned in release notes
- Given appropriate GitHub repository permissions for regular contributors

Thank you for contributing to Recipedia! 🍳
