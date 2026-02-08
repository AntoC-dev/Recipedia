import ExpoModulesCore
import Foundation

/**
 * Minimal iOS native module for RecipeScraper.
 *
 * On iOS, Python recipe scraping is handled by Pyodide in a WebView (TypeScript side).
 * This module provides only the `isAvailable()` check for backward compatibility.
 */
public class RecipeScraperModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RecipeScraper")

        AsyncFunction("isAvailable") { () -> Bool in
            // iOS uses Pyodide WebView for Python, not native Python
            // Return false to indicate native Python is not available
            false
        }

        AsyncFunction("isPythonAvailable") { () -> Bool in
            // Python availability is managed by Pyodide on iOS
            // This always returns false; actual check happens via PyodideBridge
            false
        }
    }
}
