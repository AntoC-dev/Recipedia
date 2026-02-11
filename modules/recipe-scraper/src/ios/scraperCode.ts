/**
 * Python scraper code for Pyodide execution.
 *
 * This module contains the Python recipe scraping code as a string,
 * ready to be executed in Pyodide. It's derived from the shared
 * python/scraper.py but adapted for the Pyodide environment.
 */

export const SCRAPER_PYTHON_CODE = `
import html
import json
import sys
import traceback
from typing import Any, Optional, List, Dict
from urllib.parse import urlparse

DEBUG = True

def _log(level: str, message: str) -> None:
    if DEBUG or level in ('ERROR', 'WARN'):
        print(f"[PyScraper:{level}] {message}", file=sys.stderr)

def _log_debug(message: str) -> None:
    _log('DEBUG', message)

def _log_info(message: str) -> None:
    _log('INFO', message)

def _log_warn(message: str) -> None:
    _log('WARN', message)

def _log_error(message: str, exc: Optional[Exception] = None) -> None:
    _log('ERROR', message)
    if exc and DEBUG:
        _log('ERROR', f"Traceback:\\n{traceback.format_exc()}")

# Import dependencies
try:
    from recipe_scrapers import scrape_html, SCRAPERS
    _log_info(f"recipe_scrapers imported successfully ({len(SCRAPERS)} scrapers available)")
except ImportError as e:
    _log_error(f"Failed to import recipe_scrapers: {e}", e)
    raise

AUTH_URL_PATTERNS = ['/login', '/signin', '/sign-in', '/auth', '/connexion', '/account/login', '/user/login']
AUTH_TITLE_KEYWORDS = ['login', 'sign in', 'connexion', 'se connecter', 'log in', 'anmelden', 'iniciar sesión']

RECIPE_SCHEMA_INDICATORS = [
    '"@type":"recipe"',
    '"@type": "recipe"',
    "'@type':'recipe'",
    "'@type': 'recipe'",
    'itemtype="http://schema.org/recipe"',
    'itemtype="https://schema.org/recipe"',
    "itemtype='http://schema.org/recipe'",
    "itemtype='https://schema.org/recipe'",
]

class AuthenticationRequiredError(Exception):
    def __init__(self, host: str, message: str = "This recipe requires authentication"):
        self.host = host
        self.message = message
        super().__init__(message)

class NoRecipeFoundError(Exception):
    def __init__(self, message: str = "No recipe found on this page"):
        self.message = message
        super().__init__(message)

def _has_recipe_schema(html: str) -> bool:
    lower_html = html.lower()
    for indicator in RECIPE_SCHEMA_INDICATORS:
        if indicator in lower_html:
            return True
    return False

def scrape_recipe_from_html(html: str, url: str, wild_mode: bool = True, final_url: Optional[str] = None) -> str:
    _log_info(f"scrape_recipe_from_html called: url={url}, wild_mode={wild_mode}, html_len={len(html)}")
    try:
        auth_error = _detect_auth_required(html, final_url or url, url)
        if auth_error:
            _log_warn(f"Auth required detected for host: {auth_error.host}")
            raise auth_error

        if wild_mode and not _has_recipe_schema(html):
            _log_warn(f"No recipe schema found in HTML from {url}")
            raise NoRecipeFoundError()

        _log_debug(f"Calling scrape_html with supported_only={not wild_mode}...")
        scraper = scrape_html(html=html, org_url=url, supported_only=not wild_mode)
        _log_debug("scrape_html succeeded, extracting data...")

        data = _extract_all_data(scraper)
        _log_info(f"Scrape successful: title='{data.get('title', 'N/A')}', ingredients={len(data.get('ingredients', []))}")

        return json.dumps({
            "success": True,
            "data": data
        }, ensure_ascii=False)
    except AuthenticationRequiredError as e:
        _log_warn(f"AuthenticationRequiredError: {e.message}")
        return json.dumps({
            "success": False,
            "error": {"type": "AuthenticationRequired", "message": e.message, "host": e.host}
        }, ensure_ascii=False)
    except NoRecipeFoundError as e:
        return json.dumps({
            "success": False,
            "error": {"type": "NoRecipeFoundError", "message": e.message}
        }, ensure_ascii=False)
    except Exception as e:
        _log_error(f"scrape_recipe_from_html failed: {type(e).__name__}: {e}", e)
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

def _unescape(value):
    if value is None:
        return None
    if isinstance(value, str):
        return html.unescape(value)
    if isinstance(value, list):
        return [html.unescape(item) if isinstance(item, str) else item for item in value]
    return value

def _extract_all_data(scraper) -> Dict[str, Any]:
    ingredients = _safe_call(scraper.ingredients) or []

    return {
        "title": _unescape(_safe_call(scraper.title)),
        "description": _unescape(_safe_call(scraper.description)),
        "ingredients": _unescape(ingredients),
        "parsedIngredients": None,
        "ingredientGroups": _safe_call_ingredient_groups(scraper),
        "instructions": _unescape(_safe_call(scraper.instructions)),
        "instructionsList": _unescape(_safe_call(scraper.instructions_list)),
        "parsedInstructions": None,
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
        "keywords": _safe_call(scraper.keywords),
        "dietaryRestrictions": _safe_call(scraper.dietary_restrictions),
        "ratings": _safe_call(scraper.ratings),
        "ratingsCount": _safe_call_numeric(scraper.ratings_count),
        "nutrients": _safe_call(scraper.nutrients),
        "equipment": _safe_call(scraper.equipment),
        "links": _safe_call(scraper.links),
    }

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
                "purpose": _unescape(getattr(group, 'purpose', None)),
                "ingredients": _unescape(getattr(group, 'ingredients', []))
            }
            for group in groups
        ]
    except Exception:
        return None

def _detect_auth_required(html: str, final_url: str, original_url: str) -> Optional[AuthenticationRequiredError]:
    try:
        host = urlparse(original_url).netloc.replace('www.', '')
    except Exception:
        host = ''

    try:
        final_path = urlparse(final_url).path.lower()
        for pattern in AUTH_URL_PATTERNS:
            if pattern in final_path:
                return AuthenticationRequiredError(host)
    except Exception:
        pass

    import re
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if title_match:
        title = title_match.group(1).lower()
        for keyword in AUTH_TITLE_KEYWORDS:
            if keyword in title:
                return AuthenticationRequiredError(host)

    return None

# Signal that scraper is ready
_log_info("Scraper module initialized and ready")
`;
