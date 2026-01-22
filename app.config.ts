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
        notification: {
            icon: './src/assets/app/notification_icon.png',
        },
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
            bundleIdentifier: appId,
            buildNumber: pkg.version,
            infoPlist: {
                "ITSAppUsesNonExemptEncryption": false,
                "NSCameraUsageDescription": "This app needs camera access to take photos of recipes",
                "NSPhotoLibraryUsageDescription": "This app needs photo library access to select recipe images"
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
            edgeToEdgeEnabled: true,
        },
        plugins: [
            'expo-localization',
            'expo-sqlite',
            [
                'expo-asset',
                {
                    assets: ['./src/assets/app', './src/assets/images'],
                },
            ],
            'expo-font',
            [
                'expo-build-properties',
                {
                    android: {
                        compileSdkVersion: 35,
                        targetSdkVersion: 35,
                        buildToolsVersion: '35.0.0',
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
