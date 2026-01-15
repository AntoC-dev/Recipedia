"""
Recipe scraper module - Python wrapper for recipe-scrapers library.

This module provides a wrapper around the recipe-scrapers Python package,
returning raw recipe data for React Native consumption.

Custom enhancements (tag extraction, structured ingredients, serving size inference)
are now handled in TypeScript for consistency across all platforms.

Requires: recipe-scrapers[online]>=15.0.0
"""

import json
from typing import Any, Optional, List, Dict
from urllib.parse import urlparse

import requests
from recipe_scrapers import scrape_html, SCRAPERS


AUTH_URL_PATTERNS = ['/login', '/signin', '/sign-in', '/auth', '/connexion', '/account/login', '/user/login']
AUTH_TITLE_KEYWORDS = ['login', 'sign in', 'connexion', 'se connecter', 'log in', 'anmelden', 'iniciar sesión']


class AuthenticationRequiredError(Exception):
    """Raised when a recipe page requires authentication."""
    def __init__(self, host: str, message: str = "This recipe requires authentication"):
        self.host = host
        self.message = message
        super().__init__(message)


def scrape_recipe(url: str, wild_mode: bool = True) -> str:
    """
    Scrape a recipe from URL, returning all available data.

    Uses scrape_html with online=True to fetch and parse the recipe.
    Detects authentication-protected pages and returns specific error.

    Args:
        url: Recipe page URL to scrape.
        wild_mode: If True, attempt to scrape unsupported sites using schema.org.

    Returns:
        JSON string with success/error result containing all recipe data.
    """
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, allow_redirects=True, timeout=30)
        response.raise_for_status()

        auth_error = _detect_auth_required(response.text, response.url, url)
        if auth_error:
            raise auth_error

        scraper = scrape_html(html=response.text, org_url=url, supported_only=not wild_mode)
        return json.dumps({
            "success": True,
            "data": _extract_all_data(scraper)
        }, ensure_ascii=False)
    except AuthenticationRequiredError as e:
        return json.dumps({
            "success": False,
            "error": {"type": "AuthenticationRequired", "message": e.message, "host": e.host}
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": {"type": type(e).__name__, "message": str(e)}
        }, ensure_ascii=False)


def scrape_recipe_from_html(html: str, url: str, wild_mode: bool = True, final_url: Optional[str] = None) -> str:
    """
    Scrape a recipe from HTML content.

    Args:
        html: HTML content of the recipe page.
        url: Original URL (used for host detection).
        wild_mode: If True, attempt to scrape using schema.org.
        final_url: The final URL after redirects (for auth detection).

    Returns:
        JSON string with success/error result containing all recipe data.
    """
    try:
        auth_error = _detect_auth_required(html, final_url or url, url)
        if auth_error:
            raise auth_error

        scraper = scrape_html(html=html, org_url=url, supported_only=not wild_mode)
        return json.dumps({
            "success": True,
            "data": _extract_all_data(scraper)
        }, ensure_ascii=False)
    except AuthenticationRequiredError as e:
        return json.dumps({
            "success": False,
            "error": {"type": "AuthenticationRequired", "message": e.message, "host": e.host}
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": {"type": type(e).__name__, "message": str(e)}
        }, ensure_ascii=False)


def get_supported_hosts() -> str:
    """
    Get list of all supported recipe website hosts.

    Returns:
        JSON string with list of supported host domains.
    """
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
    """
    Check if a specific host is supported.

    Args:
        host: Domain to check (e.g., "allrecipes.com").

    Returns:
        JSON string with boolean result.
    """
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
    """
    Extract all available data from a scraper instance.

    Returns raw data from recipe-scrapers without custom enhancements.
    Custom enhancements are applied in TypeScript for cross-platform consistency.
    """
    ingredients = _safe_call(scraper.ingredients) or []

    return {
        # Core recipe data (raw, no post-processing)
        "title": _safe_call(scraper.title),
        "description": _safe_call(scraper.description),
        "ingredients": ingredients,
        "parsedIngredients": None,  # TypeScript applies enhancements
        "ingredientGroups": _safe_call_ingredient_groups(scraper),
        "instructions": _safe_call(scraper.instructions),
        "instructionsList": _safe_call(scraper.instructions_list),
        "parsedInstructions": None,  # TypeScript applies enhancements

        # Timing (use numeric call to preserve 0 as valid)
        "totalTime": _safe_call_numeric(scraper.total_time),
        "prepTime": _safe_call_numeric(scraper.prep_time),
        "cookTime": _safe_call_numeric(scraper.cook_time),

        # Yield and servings
        "yields": _safe_call(scraper.yields),

        # Media (raw, TypeScript handles fallbacks)
        "image": _safe_call(scraper.image),

        # Metadata
        "host": _safe_call(scraper.host),
        "canonicalUrl": _safe_call(scraper.canonical_url),
        "siteName": _safe_call(scraper.site_name),
        "author": _safe_call(scraper.author),
        "language": _safe_call(scraper.language),

        # Categorization (raw, TypeScript handles cleaning)
        "category": _safe_call(scraper.category),
        "cuisine": _safe_call(scraper.cuisine),
        "cookingMethod": _safe_call(scraper.cooking_method),
        "keywords": _safe_call(scraper.keywords),
        "dietaryRestrictions": _safe_call(scraper.dietary_restrictions),

        # Ratings
        "ratings": _safe_call(scraper.ratings),
        "ratingsCount": _safe_call_numeric(scraper.ratings_count),

        # Additional data (raw, TypeScript handles enhancements)
        "nutrients": _safe_call(scraper.nutrients),
        "equipment": _safe_call(scraper.equipment),
        "links": _safe_call(scraper.links),
    }


def _safe_call(method) -> Optional[Any]:
    """
    Safely call a scraper method, returning None on failure.

    Some methods may not be implemented for all websites
    or may raise exceptions for missing data.
    """
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
    """
    Safely call a scraper method that returns a numeric value.

    Preserves 0 as a valid value (e.g., 0 minutes prep time).
    """
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
    """
    Safely extract ingredient groups, converting to serializable format.
    """
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


def _detect_auth_required(html: str, final_url: str, original_url: str) -> Optional[AuthenticationRequiredError]:
    """
    Detect if a page requires authentication.

    Checks for common login page patterns:
    1. URL path contains auth patterns (e.g., /login, /signin)
    2. Page title contains login keywords

    Args:
        html: Page HTML content.
        final_url: URL after redirects.
        original_url: Originally requested URL.

    Returns:
        AuthenticationRequiredError if login detected, None otherwise.
    """
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


# ============================================================================
# Authentication Module
# ============================================================================

def scrape_recipe_authenticated(url: str, username: str, password: str, wild_mode: bool = True) -> str:
    """
    Scrape a recipe from an authentication-protected URL.

    Logs into the site using provided credentials and scrapes the recipe.
    Only supports sites with registered login handlers.

    Args:
        url: Recipe page URL to scrape.
        username: Username/email for authentication.
        password: Password for authentication.
        wild_mode: If True, attempt to scrape unsupported sites using schema.org.

    Returns:
        JSON string with success/error result containing all recipe data.
    """
    try:
        host = urlparse(url).netloc.replace('www.', '')

        from auth import get_handler
        handler = get_handler(host)

        if not handler:
            return json.dumps({
                "success": False,
                "error": {
                    "type": "UnsupportedAuthSite",
                    "message": f"Authentication not supported for {host}",
                    "host": host
                }
            }, ensure_ascii=False)

        session = requests.Session()

        if not handler.login(session, username, password):
            return json.dumps({
                "success": False,
                "error": {
                    "type": "AuthenticationFailed",
                    "message": "Login failed - please check your credentials",
                    "host": host
                }
            }, ensure_ascii=False)

        response = session.get(url, headers={'User-Agent': 'Mozilla/5.0'}, allow_redirects=True, timeout=30)
        response.raise_for_status()

        scraper = scrape_html(html=response.text, org_url=url, supported_only=not wild_mode)
        return json.dumps({
            "success": True,
            "data": _extract_all_data(scraper)
        }, ensure_ascii=False)

    except Exception as e:
        return json.dumps({
            "success": False,
            "error": {"type": type(e).__name__, "message": str(e)}
        }, ensure_ascii=False)


def get_supported_auth_hosts() -> str:
    """
    Get list of hosts that support authentication.

    Returns:
        JSON string with list of host domains that have login handlers.
    """
    try:
        from auth import get_supported_hosts as auth_hosts
        return json.dumps({
            "success": True,
            "data": auth_hosts()
        }, ensure_ascii=False)
    except Exception as e:
        return json.dumps({
            "success": False,
            "error": {"type": type(e).__name__, "message": str(e)}
        }, ensure_ascii=False)
