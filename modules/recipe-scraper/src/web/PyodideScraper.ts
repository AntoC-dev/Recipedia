/**
 * Python-based recipe scraper using Pyodide (WebAssembly).
 *
 * This provides the same recipe-scrapers functionality as Android/iOS
 * by running Python in the browser via WebAssembly.
 */

import type {ScraperResult} from '../types';

// Pyodide types - we use dynamic import so types are minimal
interface PyodideInterface {
    loadPackage(packages: string[]): Promise<void>;
    runPythonAsync(code: string): Promise<unknown>;
    globals: {
        get(name: string): unknown;
        set(name: string, value: unknown): void;
    };
}

type LoadPyodideFunc = (options?: {indexURL?: string}) => Promise<PyodideInterface>;

// Python scraper code - embedded as string for web bundling
const SCRAPER_PY_CODE = `
"""
Recipe scraper module - Python wrapper for recipe-scrapers library.
"""

import json
from typing import Any, Optional, List, Dict

from recipe_scrapers import scrape_html, SCRAPERS


def scrape_recipe(url: str, wild_mode: bool = True) -> str:
    try:
        scraper = scrape_html(html=None, org_url=url, online=True, wild_mode=wild_mode)
        return json.dumps({
            "success": True,
            "data": _extract_all_data(scraper)
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": {"type": type(e).__name__, "message": str(e)}
        }, ensure_ascii=False)


def scrape_recipe_from_html(html: str, url: str, wild_mode: bool = True) -> str:
    try:
        scraper = scrape_html(html=html, org_url=url, wild_mode=wild_mode)
        return json.dumps({
            "success": True,
            "data": _extract_all_data(scraper)
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": {"type": type(e).__name__, "message": str(e)}
        }, ensure_ascii=False)


def get_supported_hosts() -> str:
    try:
        hosts = list(SCRAPERS.keys())
        return json.dumps({
            "success": True,
            "data": hosts
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": {"type": type(e).__name__, "message": str(e)}
        }, ensure_ascii=False)


def is_host_supported(host: str) -> str:
    try:
        supported = host.lower() in (h.lower() for h in SCRAPERS.keys())
        return json.dumps({
            "success": True,
            "data": supported
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": {"type": type(e).__name__, "message": str(e)}
        }, ensure_ascii=False)


def _extract_all_data(scraper) -> Dict[str, Any]:
    keywords = _safe_call(scraper.keywords)
    if not keywords:
        keywords = _extract_keywords_from_next_data(scraper)

    return {
        "title": _safe_call(scraper.title),
        "description": _safe_call(scraper.description),
        "ingredients": _safe_call(scraper.ingredients) or [],
        "ingredientGroups": _safe_call_ingredient_groups(scraper),
        "instructions": _safe_call(scraper.instructions),
        "instructionsList": _safe_call(scraper.instructions_list),
        "totalTime": _safe_call_numeric(scraper.total_time),
        "prepTime": _safe_call_numeric(scraper.prep_time),
        "cookTime": _safe_call_numeric(scraper.cook_time),
        "yields": _safe_call(scraper.yields),
        "image": _safe_call(scraper.image),
        "host": _safe_call(scraper.host),
        "canonicalUrl": _safe_call(scraper.canonical_url),
        "siteName": _safe_call(scraper.site_name),
        "author": _safe_call(scraper.author),
        "language": _safe_call(scraper.language),
        "category": _safe_call(scraper.category),
        "cuisine": _safe_call(scraper.cuisine),
        "cookingMethod": _safe_call(scraper.cooking_method),
        "keywords": keywords,
        "dietaryRestrictions": _safe_call(scraper.dietary_restrictions),
        "ratings": _safe_call(scraper.ratings),
        "ratingsCount": _safe_call_numeric(scraper.ratings_count),
        "nutrients": _safe_call(scraper.nutrients),
        "equipment": _safe_call(scraper.equipment),
        "links": _safe_call(scraper.links),
    }


def _extract_keywords_from_next_data(scraper) -> Optional[List[str]]:
    try:
        script_tag = scraper.soup.find("script", {"id": "__NEXT_DATA__"})
        if not script_tag or not script_tag.string:
            return None
        data = json.loads(script_tag.string)
        tags = _find_tags_in_dict(data)
        return tags if tags else None
    except Exception:
        return None


def _is_user_facing_tag(tag: Any) -> bool:
    if not isinstance(tag, dict):
        return True
    if tag.get('displayLabel') is True or tag.get('display_label') is True:
        return True
    return False


def _find_tags_in_dict(data: Any, depth: int = 0) -> Optional[List[str]]:
    if depth > 10:
        return None
    if isinstance(data, dict):
        for key in ['tags', 'labels']:
            if key in data and isinstance(data[key], list):
                tags = data[key]
                result = []
                for tag in tags:
                    if not _is_user_facing_tag(tag):
                        continue
                    if isinstance(tag, str) and tag:
                        result.append(tag)
                    elif isinstance(tag, dict) and 'name' in tag and tag['name']:
                        result.append(tag['name'])
                if result:
                    return result
        for value in data.values():
            found = _find_tags_in_dict(value, depth + 1)
            if found:
                return found
    elif isinstance(data, list):
        for item in data:
            found = _find_tags_in_dict(item, depth + 1)
            if found:
                return found
    return None


def _safe_call(method) -> Optional[Any]:
    try:
        result = method()
        if result is None:
            return None
        if result == 0 and not isinstance(result, bool):
            return None
        if result == "":
            return None
        return result
    except Exception:
        return None


def _safe_call_numeric(method) -> Optional[int]:
    try:
        result = method()
        if result is None:
            return None
        if isinstance(result, (int, float)):
            return int(result)
        return None
    except Exception:
        return None


def _safe_call_ingredient_groups(scraper) -> Optional[List[Dict[str, Any]]]:
    try:
        groups = scraper.ingredient_groups()
        if not groups:
            return None
        return [
            {
                "purpose": getattr(group, 'purpose', None),
                "ingredients": getattr(group, 'ingredients', [])
            }
            for group in groups
        ]
    except Exception:
        return None
`;

// Pyodide CDN URL
const PYODIDE_CDN_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/';

export class PyodideScraper {
    private pyodide: PyodideInterface | null = null;
    private initPromise: Promise<void> | null = null;
    private initError: Error | null = null;

    /**
     * Check if Pyodide is initialized and ready to use.
     */
    get isReady(): boolean {
        return this.pyodide !== null && this.initError === null;
    }

    /**
     * Check if Pyodide failed to initialize.
     */
    get hasFailed(): boolean {
        return this.initError !== null;
    }

    /**
     * Initialize Pyodide and load required packages.
     * This is called lazily on first use.
     */
    async initialize(): Promise<void> {
        if (this.pyodide) return;
        if (this.initError) throw this.initError;
        if (this.initPromise) return this.initPromise;

        this.initPromise = this.doInit();
        return this.initPromise;
    }

    /**
     * Start initialization in background without waiting.
     * Use this to pre-warm Pyodide while user is doing other things.
     */
    preload(): void {
        if (!this.pyodide && !this.initPromise && !this.initError) {
            this.initPromise = this.doInit();
            this.initPromise.catch(() => {
                // Error is stored in initError, ignore here
            });
        }
    }

    private async doInit(): Promise<void> {
        try {
            // Dynamically import Pyodide from CDN
            const loadPyodide = await this.loadPyodideScript();

            // Initialize Pyodide
            this.pyodide = await loadPyodide({
                indexURL: PYODIDE_CDN_URL,
            });

            // Load pre-built binary packages from Pyodide
            await this.pyodide.loadPackage(['lxml', 'beautifulsoup4']);

            // Install pure Python packages via micropip
            await this.pyodide.runPythonAsync(`
import micropip
await micropip.install(['recipe-scrapers[online]>=15.0.0', 'extruct>=0.17.0'])
            `);

            // Load our scraper module
            await this.pyodide.runPythonAsync(SCRAPER_PY_CODE);
        } catch (error) {
            this.initError = error instanceof Error ? error : new Error(String(error));
            this.pyodide = null;
            throw this.initError;
        }
    }

    private async loadPyodideScript(): Promise<LoadPyodideFunc> {
        // Check if already loaded globally
        if (typeof window !== 'undefined' && (window as unknown as {loadPyodide?: LoadPyodideFunc}).loadPyodide) {
            return (window as unknown as {loadPyodide: LoadPyodideFunc}).loadPyodide;
        }

        // Dynamically load Pyodide script
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${PYODIDE_CDN_URL}pyodide.js`;
            script.async = true;

            script.onload = () => {
                const loadPyodide = (window as unknown as {loadPyodide?: LoadPyodideFunc}).loadPyodide;
                if (loadPyodide) {
                    resolve(loadPyodide);
                } else {
                    reject(new Error('Pyodide script loaded but loadPyodide not found'));
                }
            };

            script.onerror = () => {
                reject(new Error('Failed to load Pyodide script'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Scrape a recipe from HTML using Python recipe-scrapers.
     */
    async scrapeFromHtml(html: string, url: string, wildMode = true): Promise<ScraperResult> {
        await this.initialize();

        if (!this.pyodide) {
            return {
                success: false,
                error: {type: 'InitializationError', message: 'Pyodide not initialized'},
            };
        }

        try {
            // Pass data to Python via globals
            this.pyodide.globals.set('_html', html);
            this.pyodide.globals.set('_url', url);
            this.pyodide.globals.set('_wild_mode', wildMode);

            // Call the scraper
            const result = await this.pyodide.runPythonAsync(`
scrape_recipe_from_html(_html, _url, _wild_mode)
            `);

            return JSON.parse(result as string) as ScraperResult;
        } catch (error) {
            return {
                success: false,
                error: {
                    type: 'PythonError',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }

    /**
     * Get list of supported hosts from Python recipe-scrapers.
     */
    async getSupportedHosts(): Promise<ScraperResult> {
        await this.initialize();

        if (!this.pyodide) {
            return {
                success: false,
                error: {type: 'InitializationError', message: 'Pyodide not initialized'},
            };
        }

        try {
            const result = await this.pyodide.runPythonAsync('get_supported_hosts()');
            return JSON.parse(result as string) as ScraperResult;
        } catch (error) {
            return {
                success: false,
                error: {
                    type: 'PythonError',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }

    /**
     * Check if a host is supported by Python recipe-scrapers.
     */
    async isHostSupported(host: string): Promise<ScraperResult> {
        await this.initialize();

        if (!this.pyodide) {
            return {
                success: false,
                error: {type: 'InitializationError', message: 'Pyodide not initialized'},
            };
        }

        try {
            this.pyodide.globals.set('_host', host);
            const result = await this.pyodide.runPythonAsync('is_host_supported(_host)');
            return JSON.parse(result as string) as ScraperResult;
        } catch (error) {
            return {
                success: false,
                error: {
                    type: 'PythonError',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
    }
}

// Singleton instance for reuse across scraping calls
export const pyodideScraper = new PyodideScraper();
