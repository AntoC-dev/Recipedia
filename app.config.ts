import type {ConfigContext, ExpoConfig} from "expo/config";

const pkg = require("./package.json");

function toIdentifierSegment(slug: string): string {
    // Convert slug to a valid identifier segment: lowercase, remove non-alphanumerics, start with a letter
    const compact = slug.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return compact.replace(/^[^a-z]+/, "");
}

function toSlug(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function versionToCode(version: string): number {
    const parts = version.split('.').map(Number);
    const major = parts[0] || 0;
    const minor = parts[1] || 0;
    const patch = parts[2] || 0;
    return major * 10000 + minor * 100 + patch;
}

const configuredName = toSlug(pkg.name);
const appId = `com.${toIdentifierSegment(pkg.name)}`;

// iOS is being republished under a new App Store identity, so the store build
// uses a distinct bundle id (`<appId>.ios`). Only the `production` EAS profile
// gets that id; every other build (Maestro E2E, dev, simulator) keeps the plain
// `appId`, identical to Android.
//
// Why: Maestro identifies the app solely by bundle id and the E2E flows hardcode
// a single `appId: 'com.recipedia'` shared across both platforms. If the iOS test
// build also carried the `.ios` suffix, Maestro would try to launch a bundle id
// that isn't installed and every iOS suite would fail. Gating the suffix to store
// builds keeps the test bundle id aligned with Android, so the flows stay
// platform-agnostic and any single flow can be run directly without extra env.
//
// Test builds are simulator-only and never submitted, so reusing `com.recipedia`
// for them cannot collide with the published `com.recipedia.ios` App Store app.
const isStoreBuild = process.env.EAS_BUILD_PROFILE === 'production';
const iosAppId = isStoreBuild ? `${appId}.ios` : appId;

const primaryColorLight = '#006D38';
const primaryColorDark = '#79DB95';

export default ({config}: ConfigContext): ExpoConfig => {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        ...config,
        name: configuredName,
        slug: configuredName,
        version: pkg.version,
        orientation: "portrait",
        icon: "./src/assets/app/icon.png",
        userInterfaceStyle: "automatic",
        splash: {
            image: './src/assets/app/splash_light.png',
            resizeMode: 'cover',
            backgroundColor: primaryColorLight,
            dark: {
                image: './src/assets/app/splash_dark.png',
                backgroundColor: primaryColorDark,
            },
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: iosAppId,
            buildNumber: pkg.version,
            infoPlist: {
                "ITSAppUsesNonExemptEncryption": false,
                "NSCameraUsageDescription": "Recipedia uses the camera so you can take a photo of a dish and attach it to a recipe (for example, when creating or editing a recipe).",
                "NSPhotoLibraryUsageDescription": "Recipedia uses your photo library so you can choose an existing photo and set it as a recipe image (for example, selecting a picture for a new recipe)."
            }
        },
        android: {
            versionCode: versionToCode(pkg.version),
            adaptiveIcon: {
                foregroundImage: './src/assets/app/adaptative_icon.png',
                backgroundColor: primaryColorLight,
            },
            package: appId,
            permissions: ['android.permission.CAMERA'],
        },
        plugins: [
            'expo-image',
            'expo-localization',
            'expo-sqlite',
            'expo-mail-composer',
            'expo-background-task',
            [
                'expo-asset',
                {
                    assets: [
                        './src/assets/app',
                        './src/assets/images',
                    ],
                },
            ],
            'expo-font',
            [
                'expo-build-properties',
                {
                    android: {
                        compileSdkVersion: 36,
                        targetSdkVersion: 36,
                        buildToolsVersion: '36.0.0',
                    },
                    ios: {
                        deploymentTarget: '18.0',
                    },
                },
            ],
            './modules/recipe-scraper/plugin/build/index.js',
        ],
        extra: {
            eas: {
                projectId: '247331ab-7746-4b0a-bb72-353045160518',
            },
        },
        owner: 'antoc',
        // Reduce build overhead for development
        updates: isProduction ? {} : {
            enabled: false
        },
        experiments: {
            reactCompiler: true,
        },
    };
};
