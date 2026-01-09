import Foundation
#if canImport(PythonKit)
import PythonKit
#endif

/// Bridge class for calling Python recipe-scrapers from Swift.
/// Uses PythonKit to interface with the embedded Python runtime.
/// Note: PythonKit is optional - if not available, isAvailable returns false
/// and the module falls back to the Swift SchemaRecipeParser.
public class PythonScraper {
    public static let shared = PythonScraper()

    #if canImport(PythonKit)
    private var scraper: PythonObject?
    private var isInitialized = false
    private var initializationError: Error?
    private let initLock = NSLock()

    private init() {}

    private func findResourceBundle() -> Bundle? {
        let bundleNames = [
            "RecipeScraper_RecipeScraperPython",
            "RecipeScraperPython",
            "RecipeScraper"
        ]

        for name in bundleNames {
            if let url = Bundle.main.url(forResource: name, withExtension: "bundle"),
               let bundle = Bundle(url: url) {
                return bundle
            }

            if let frameworkBundle = Bundle(identifier: "expo.modules.recipescraper"),
               let url = frameworkBundle.url(forResource: name, withExtension: "bundle"),
               let bundle = Bundle(url: url) {
                return bundle
            }
        }

        return Bundle.main
    }

    private func initializePython() throws {
        initLock.lock()
        defer { initLock.unlock() }

        if isInitialized { return }

        if let error = initializationError {
            throw error
        }

        do {
            try doInitializePython()
            isInitialized = true
        } catch {
            initializationError = error
            throw error
        }
    }

    private func doInitializePython() throws {
        // Find PythonStdlib.bundle
        guard let stdlibBundleUrl = Bundle.main.url(forResource: "PythonStdlib", withExtension: "bundle"),
              let stdlibBundle = Bundle(url: stdlibBundleUrl) else {
            throw PythonScraperError.moduleNotFound("PythonStdlib.bundle")
        }

        let stdlibPath = stdlibBundle.bundlePath

        setenv("PYTHONHOME", stdlibPath, 1)
        setenv("PYTHONPATH", stdlibPath, 1)
        setenv("PYTHONNOUSERSITE", "1", 1)

        let sys = try Python.attemptImport("sys")

        let dynloadPath = (stdlibPath as NSString).appendingPathComponent("lib-dynload")
        if FileManager.default.fileExists(atPath: dynloadPath) {
            sys.path.insert(0, PythonObject(dynloadPath))
        }

        sys.path.insert(0, PythonObject(stdlibPath))

        // Find PythonPackages.bundle
        if let packagesBundleUrl = Bundle.main.url(forResource: "PythonPackages", withExtension: "bundle"),
           let packagesBundle = Bundle(url: packagesBundleUrl) {
            sys.path.insert(0, PythonObject(packagesBundle.bundlePath))
        }

        scraper = try Python.attemptImport("recipe_scraper.scraper")
    }

    public func scrapeRecipe(url: String, wildMode: Bool = true) -> String {
        do {
            try initializePython()
            guard let scraper = scraper else {
                return errorJson(type: "InitializationError", message: "Python scraper not initialized")
            }

            let result = scraper.scrape_recipe(url, wildMode)
            return String(result) ?? errorJson(type: "ConversionError", message: "Failed to convert Python result")
        } catch {
            return errorJson(type: "PythonError", message: error.localizedDescription)
        }
    }

    public func scrapeRecipeFromHtml(html: String, url: String, wildMode: Bool = true) -> String {
        do {
            try initializePython()
            guard let scraper = scraper else {
                return errorJson(type: "InitializationError", message: "Python scraper not initialized")
            }

            let result = scraper.scrape_recipe_from_html(html, url, wildMode)
            return String(result) ?? errorJson(type: "ConversionError", message: "Failed to convert Python result")
        } catch {
            return errorJson(type: "PythonError", message: error.localizedDescription)
        }
    }

    public func getSupportedHosts() -> String {
        do {
            try initializePython()
            guard let scraper = scraper else {
                return errorJson(type: "InitializationError", message: "Python scraper not initialized")
            }

            let result = scraper.get_supported_hosts()
            return String(result) ?? errorJson(type: "ConversionError", message: "Failed to convert Python result")
        } catch {
            return errorJson(type: "PythonError", message: error.localizedDescription)
        }
    }

    public func isHostSupported(host: String) -> String {
        do {
            try initializePython()
            guard let scraper = scraper else {
                return errorJson(type: "InitializationError", message: "Python scraper not initialized")
            }

            let result = scraper.is_host_supported(host)
            return String(result) ?? errorJson(type: "ConversionError", message: "Failed to convert Python result")
        } catch {
            return errorJson(type: "PythonError", message: error.localizedDescription)
        }
    }

    public var isAvailable: Bool {
        do {
            try initializePython()
            return scraper != nil
        } catch {
            return false
        }
    }

    private func errorJson(type: String, message: String) -> String {
        let escapedMessage = message.replacingOccurrences(of: "\"", with: "\\\"")
        return "{\"success\":false,\"error\":{\"type\":\"\(type)\",\"message\":\"\(escapedMessage)\"}}"
    }

    #else
    // PythonKit not available - provide stub implementation

    private init() {}

    public func scrapeRecipe(url: String, wildMode: Bool = true) -> String {
        return errorJson(type: "NotAvailable", message: "Python scraper not available on this platform")
    }

    public func scrapeRecipeFromHtml(html: String, url: String, wildMode: Bool = true) -> String {
        return errorJson(type: "NotAvailable", message: "Python scraper not available on this platform")
    }

    public func getSupportedHosts() -> String {
        return "{\"success\":true,\"data\":[]}"
    }

    public func isHostSupported(host: String) -> String {
        return "{\"success\":true,\"data\":false}"
    }

    public var isAvailable: Bool {
        return false
    }

    private func errorJson(type: String, message: String) -> String {
        let escapedMessage = message.replacingOccurrences(of: "\"", with: "\\\"")
        return "{\"success\":false,\"error\":{\"type\":\"\(type)\",\"message\":\"\(escapedMessage)\"}}"
    }
    #endif
}

enum PythonScraperError: Error, LocalizedError {
    case bundleNotFound
    case pythonNotInitialized
    case moduleNotFound(String)

    var errorDescription: String? {
        switch self {
        case .bundleNotFound:
            return "Could not find the RecipeScraper bundle"
        case .pythonNotInitialized:
            return "Python runtime not initialized"
        case .moduleNotFound(let name):
            return "Python module not found: \(name)"
        }
    }
}
