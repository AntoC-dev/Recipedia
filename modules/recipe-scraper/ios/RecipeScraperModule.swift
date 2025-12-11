import ExpoModulesCore
import Foundation

public class RecipeScraperModule: Module {
    /// Whether to use Python scraper (true) or Swift schema.org fallback (false)
    private var usePythonScraper: Bool {
        // Check if Python is available
        return PythonScraper.shared.isAvailable
    }

    public func definition() -> ModuleDefinition {
        Name("RecipeScraper")

        AsyncFunction("scrapeRecipe") { (url: String, wildMode: Bool?) -> String in
            await self.scrapeFromUrl(url, wildMode: wildMode ?? true)
        }

        AsyncFunction("scrapeRecipeFromHtml") { (html: String, url: String, wildMode: Bool?) -> String in
            self.scrapeFromHtml(html, url: url, wildMode: wildMode ?? true)
        }

        AsyncFunction("getSupportedHosts") { () -> String in
            if self.usePythonScraper {
                return PythonScraper.shared.getSupportedHosts()
            }
            // Fallback: Swift parser supports all sites via schema.org
            return "{\"success\":true,\"data\":[]}"
        }

        AsyncFunction("isHostSupported") { (host: String) -> String in
            if self.usePythonScraper {
                return PythonScraper.shared.isHostSupported(host: host)
            }
            // Fallback: Swift parser supports all sites via schema.org
            return "{\"success\":true,\"data\":false}"
        }

        AsyncFunction("isAvailable") { () -> Bool in
            return true
        }

        AsyncFunction("isPythonAvailable") { () -> Bool in
            return self.usePythonScraper
        }
    }

    private func scrapeFromUrl(_ urlString: String, wildMode: Bool) async -> String {
        guard let url = URL(string: urlString) else {
            return errorJson(type: "InvalidURLError", message: "Invalid URL: \(urlString)")
        }

        do {
            let (data, response) = try await URLSession.shared.data(from: url)

            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                return errorJson(type: "NetworkError", message: "Failed to fetch URL")
            }

            guard let html = String(data: data, encoding: .utf8) else {
                return errorJson(type: "EncodingError", message: "Could not decode HTML as UTF-8")
            }

            return scrapeFromHtml(html, url: urlString, wildMode: wildMode)
        } catch {
            return errorJson(type: "NetworkError", message: error.localizedDescription)
        }
    }

    private func scrapeFromHtml(_ html: String, url: String, wildMode: Bool) -> String {
        // Try Python scraper first if available
        if usePythonScraper {
            return PythonScraper.shared.scrapeRecipeFromHtml(html: html, url: url, wildMode: wildMode)
        }

        // Fallback to Swift schema.org parser
        let parser = SchemaRecipeParser()
        let result = parser.parse(html: html, url: url)

        do {
            let jsonData = try JSONSerialization.data(withJSONObject: result, options: [])
            return String(data: jsonData, encoding: .utf8) ?? errorJson(type: "SerializationError", message: "Failed to serialize result")
        } catch {
            return errorJson(type: "SerializationError", message: error.localizedDescription)
        }
    }

    private func errorJson(type: String, message: String) -> String {
        return "{\"success\":false,\"error\":{\"type\":\"\(type)\",\"message\":\"\(message.replacingOccurrences(of: "\"", with: "\\\""))\"}}"
    }
}
