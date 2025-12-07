# 🍳 Recipedia

A React Native recipe management app built with Expo that allows users to add, search, and manage recipes with OCR
capabilities for extracting recipe information from images.

<div align="center">

[![Version](https://img.shields.io/badge/version-0.7.0-blue.svg)](package.json)
[![React Native](https://img.shields.io/badge/React%20Native-0.76.9-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~52.0.42-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

## ✨ Features

- 📱 **Cross-platform**: Built with React Native and Expo for iOS and Android
- 🔍 **Smart Search**: Fuzzy search for recipes and ingredients using Fuse.js
- 📸 **OCR Integration**: Extract recipe information from images using ML Kit text recognition
- 🌍 **Multi-language**: Full internationalization support (English & French)
- 🌙 **Dark Mode**: Complete dark/light theme support
- 🗃️ **Local Storage**: SQLite database for offline functionality
- 🛒 **Shopping Lists**: Convert recipe ingredients to shopping lists
- 🏷️ **Smart Filtering**: Filter recipes by ingredients, tags, time, and seasonality
- 📅 **Seasonal Awareness**: Track ingredient seasonality for better meal planning

## 📷 Screenshots

| Home Screen   | Recipe View   | Search & Filters | Shopping List |
|---------------|---------------|------------------|---------------|
| *Coming soon* | *Coming soon* | *Coming soon*    | *Coming soon* |

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- For Android: [Android Studio](https://developer.android.com/studio) with Android SDK
- For iOS: [Xcode](https://developer.apple.com/xcode/) (macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AntoC-dev/Recipedia.git
   cd Recipedia
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your platform**
    - **Android**: `npm run dev:android`
    - **iOS**: `npm run dev:ios`

## 🏗️ Project Architecture

Recipedia follows a well-structured architecture with clear separation of concerns:

```
src/
├── components/          # Reusable UI components (Atomic Design)
│   ├── atomic/         # Basic components (buttons, inputs)
│   ├── molecules/      # Composite components
│   └── organisms/      # Complex components
├── screens/            # App screens
├── navigation/         # Navigation configuration
├── context/           # React Context providers
├── utils/             # Utility functions and database
├── styles/            # Theme and styling
├── translations/      # i18n translations
└── customTypes/       # TypeScript type definitions
```

### Key Technologies

- **Framework**: React Native with Expo
- **Database**: SQLite with expo-sqlite
- **Navigation**: React Navigation v6
- **State Management**: React Context + Hooks
- **UI Library**: React Native Paper for design system
- **Internationalization**: i18next
- **Search**: Fuse.js for fuzzy search
- **OCR**: @react-native-ml-kit/text-recognition
- **Testing**: Jest + React Native Testing Library + Maestro (E2E)

## 📖 Documentation

### For Users

- [Installation Guide](docs/installation.md)
- [User Manual](docs/user-guide.md)
- [FAQ](docs/faq.md)

### For Developers

- **[API Documentation](https://AntoC-dev.github.io/Recipedia/)** - Complete TypeScript API reference
- [Contributing Guidelines](CONTRIBUTING.md)
- [Testing Guide](docs/testing.md)
- [CI/CD Setup](docs/ci-setup.md)

### API Documentation

The project maintains comprehensive API documentation generated with TypeDoc, covering all components, utilities, and
types. The documentation is automatically published to GitHub Pages and includes:

- **Component Documentation**: All atomic, molecular, and organism components
- **Utility Functions**: Database operations, file management, and helper functions
- **Type Definitions**: Complete TypeScript interfaces and types
- **Source Code**: Direct links to GitHub source files
- **Examples**: Usage examples and code snippets

**Documentation Commands:**

```bash
npm run docs:build    # Generate documentation
npm run docs:clean    # Clean documentation build
```

**Viewing Documentation:**

- **Online**: [https://AntoC-dev.github.io/Recipedia/](https://AntoC-dev.github.io/Recipedia/)
- **Local**: Run `npm run docs:build` then open `docs/index.html`

## 🧪 Testing

Recipedia includes comprehensive testing at multiple levels:

### Unit Tests

```bash
npm run test:unit           # Run all unit tests
npm run test:unit:watch     # Run tests in watch mode
npm run test:unit:coverage  # Run with coverage report
```

### End-to-End Tests

```bash
npm run test:e2e:android    # Run E2E tests on Android
npm run workflow:build-test:android  # Full cycle
```

### Test Coverage

- **Unit Tests**: Components, utilities, and business logic
- **E2E Tests**: Complete user workflows using Maestro

## 🔧 Development

### Available Scripts

| Command                      | Description                    |
|------------------------------|--------------------------------|
| `npm start`                  | Start Expo development server  |
| `npm run dev:android`        | Run on Android device/emulator |
| `npm run dev:ios`            | Run on iOS device/simulator    |
| `npm run build:test:android` | Build Android APK              |
| `npm run build:test:ios`     | Build iOS app                  |
| `npm run test:unit`          | Run unit tests                 |
| `npm run test:e2e:android`   | Run E2E tests                  |
| `npm run release`            | Create semantic release        |

### Code Style

The project follows strict TypeScript and React Native best practices:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Atomic Design** for component architecture
- **Feature-first** folder structure

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/123-amazing-feature`)
3. Make your changes
4. Run tests (`npm run test:unit`)
5. Commit your changes (`git commit -m 'feat(#123): add amazing feature'`)
6. Push to the branch (`git push origin feature/123-amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow the existing code style and patterns
- Add unit tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Use semantic commit messages with issue numbers

## 🐛 Bug Reports & Feature Requests

Please use [GitHub Issues](https://github.com/AntoC-dev/Recipedia/issues) to:

- Report bugs
- Request new features
- Ask questions about usage

### Bug Report Template

When reporting bugs, please include:

- Device and OS version
- App version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

## 📱 Device Support

### Minimum Requirements

- **iOS**: iOS 13.0+
- **Android**: Android 6.0+ (API level 23+)

### Tested Devices

- iOS: Not yet, to come
- Android: Various devices with Android 14.0+

## 🔐 Privacy & Security

- **Local Data**: All recipes are stored locally on your device
- **No Cloud Sync**: Your data stays on your device
- **Camera Permissions**: Only used for OCR recipe scanning
- **No Analytics**: No user tracking or data collection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Expo](https://expo.dev/) for the amazing development platform
- [React Native](https://reactnative.dev/) team for the framework
- [React Native Paper](https://reactnativepaper.com/) for the UI components
- [ML Kit](https://developers.google.com/ml-kit) for OCR capabilities
- All contributors who help make this project better

## 📞 Support

- **Documentation**: Check our [docs folder](docs/)
- **Issues**: [GitHub Issues](https://github.com/AntoC-dev/Recipedia/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AntoC-dev/Recipedia/discussions)

---

<div align="center">

**Made with ❤️ by the Recipedia team**

[⭐ Star this repo](https://github.com/AntoC-dev/Recipedia) • [🐛 Report bug](https://github.com/AntoC-dev/Recipedia/issues) • [✨ Request feature](https://github.com/AntoC-dev/Recipedia/issues)

</div>
