package expo.modules.recipescraper

import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo native module that bridges Python recipe-scrapers to React Native.
 *
 * This module uses Chaquopy to embed a Python runtime and call the
 * recipe-scrapers library to extract structured recipe data from URLs.
 *
 * All methods return JSON strings that can be parsed on the JS side.
 */
class RecipeScraperModule : Module() {
    companion object {
        private var pythonInitialized = false
    }

    override fun definition() = ModuleDefinition {
        Name("RecipeScraper")

        /**
         * Scrape a recipe from a URL.
         * @param url The recipe page URL to scrape.
         * @param wildMode If true, attempt to scrape unsupported sites using schema.org.
         * @return JSON string with success/error result containing recipe data.
         */
        AsyncFunction("scrapeRecipe") { url: String, wildMode: Boolean? ->
            ensurePythonStarted()
            val py = Python.getInstance()
            val scraperModule = py.getModule("recipe_scraper.scraper")
            scraperModule.callAttr("scrape_recipe", url, wildMode ?: true).toString()
        }

        /**
         * Scrape a recipe from HTML content.
         * @param html The HTML content of the recipe page.
         * @param url The original URL (used for host detection).
         * @param wildMode If true, attempt to scrape using schema.org.
         * @return JSON string with success/error result containing recipe data.
         */
        AsyncFunction("scrapeRecipeFromHtml") { html: String, url: String, wildMode: Boolean? ->
            ensurePythonStarted()
            val py = Python.getInstance()
            val scraperModule = py.getModule("recipe_scraper.scraper")
            scraperModule.callAttr("scrape_recipe_from_html", html, url, wildMode ?: true).toString()
        }

        /**
         * Get list of all supported recipe website hosts.
         * @return JSON string with list of supported host domains.
         */
        AsyncFunction("getSupportedHosts") {
            ensurePythonStarted()
            val py = Python.getInstance()
            val scraperModule = py.getModule("recipe_scraper.scraper")
            scraperModule.callAttr("get_supported_hosts").toString()
        }

        /**
         * Check if a specific host is supported.
         * @param host Domain to check (e.g., "allrecipes.com").
         * @return JSON string with boolean result.
         */
        AsyncFunction("isHostSupported") { host: String ->
            ensurePythonStarted()
            val py = Python.getInstance()
            val scraperModule = py.getModule("recipe_scraper.scraper")
            scraperModule.callAttr("is_host_supported", host).toString()
        }

        /**
         * Check if the Python scraper is available on this platform.
         * @return true if available, false otherwise.
         */
        AsyncFunction("isAvailable") {
            try {
                ensurePythonStarted()
                true
            } catch (e: Exception) {
                false
            }
        }

        /**
         * Scrape a recipe from an authentication-protected URL.
         * @param url The recipe page URL to scrape.
         * @param username Username/email for authentication.
         * @param password Password for authentication.
         * @param wildMode If true, attempt to scrape unsupported sites using schema.org.
         * @return JSON string with success/error result containing recipe data.
         */
        AsyncFunction("scrapeRecipeAuthenticated") { url: String, username: String, password: String, wildMode: Boolean? ->
            ensurePythonStarted()
            val py = Python.getInstance()
            val scraperModule = py.getModule("recipe_scraper.scraper")
            scraperModule.callAttr("scrape_recipe_authenticated", url, username, password, wildMode ?: true).toString()
        }

        /**
         * Get list of hosts that support authentication.
         * @return JSON string with list of host domains supporting auth.
         */
        AsyncFunction("getSupportedAuthHosts") {
            ensurePythonStarted()
            val py = Python.getInstance()
            val authModule = py.getModule("recipe_scraper.auth")
            authModule.callAttr("get_supported_auth_hosts").toString()
        }
    }

    private fun ensurePythonStarted() {
        if (!pythonInitialized) {
            synchronized(this) {
                if (!pythonInitialized) {
                    if (!Python.isStarted()) {
                        val context = appContext.reactContext
                            ?: throw IllegalStateException("React context is null")
                        Python.start(AndroidPlatform(context))
                    }
                    pythonInitialized = true
                }
            }
        }
    }
}
