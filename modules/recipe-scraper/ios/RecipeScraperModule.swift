import ExpoModulesCore
import Foundation

public class RecipeScraperModule: Module {
    public func definition() -> ModuleDefinition {
        Name("RecipeScraper")

        // Start Python initialization in background when module loads
        // This ensures Python is ready by the time user tries to scrape
        OnCreate {
            Task.detached(priority: .background) {
                _ = PythonScraper.shared.isAvailable
            }
        }

        AsyncFunction("scrapeRecipe") { (url: String, wildMode: Bool?) -> String in
            await self.scrapeFromUrl(url, wildMode: wildMode ?? true)
        }

        AsyncFunction("scrapeRecipeFromHtml") { (html: String, url: String, wildMode: Bool?) -> String in
            PythonScraper.shared.scrapeRecipeFromHtml(html: html, url: url, wildMode: wildMode ?? true)
        }

        AsyncFunction("getSupportedHosts") { () -> String in
            PythonScraper.shared.getSupportedHosts()
        }

        AsyncFunction("isHostSupported") { (host: String) -> String in
            PythonScraper.shared.isHostSupported(host: host)
        }

        AsyncFunction("isAvailable") { () -> Bool in
            true
        }

        AsyncFunction("isPythonAvailable") { () -> Bool in
            PythonScraper.shared.isAvailable
        }

        // Pre-warm Python to avoid cold start delays on first scrape
        // Call this early in app lifecycle (e.g., on app launch)
        AsyncFunction("warmup") { () -> String in
            await Task.detached(priority: .background) {
                PythonScraper.shared.warmup()
            }.value
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

            return PythonScraper.shared.scrapeRecipeFromHtml(html: html, url: urlString, wildMode: wildMode)
        } catch {
            return errorJson(type: "NetworkError", message: error.localizedDescription)
        }
    }

    private func errorJson(type: String, message: String) -> String {
        "{\"success\":false,\"error\":{\"type\":\"\(type)\",\"message\":\"\(message.replacingOccurrences(of: "\"", with: "\\\""))\"}}"
    }
}
