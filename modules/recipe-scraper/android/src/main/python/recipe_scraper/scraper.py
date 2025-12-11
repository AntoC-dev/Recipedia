"""
Recipe scraper module - Python wrapper for recipe-scrapers library.

This module provides a complete wrapper around the recipe-scrapers Python package,
exposing all public methods as JSON-returning functions for React Native consumption.

All data transformation should be done in the app layer - this module returns
raw data exactly as provided by recipe-scrapers.

Requires: recipe-scrapers[online]>=15.0.0
"""

import json
from typing import Any, Optional, List, Dict

from recipe_scrapers import scrape_html, SCRAPERS


def scrape_recipe(url: str, wild_mode: bool = True) -> str:
    """
    Scrape a recipe from URL, returning all available data.

    Uses scrape_html with online=True to fetch and parse the recipe.

    Args:
        url: Recipe page URL to scrape.
        wild_mode: If True, attempt to scrape unsupported sites using schema.org.

    Returns:
        JSON string with success/error result containing all recipe data.
    """
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
    """
    Scrape a recipe from HTML content.

    Args:
        html: HTML content of the recipe page.
        url: Original URL (used for host detection).
        wild_mode: If True, attempt to scrape using schema.org.

    Returns:
        JSON string with success/error result containing all recipe data.
    """
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

    Returns a dictionary with all recipe-scrapers fields.
    Missing or unsupported fields return None.
    """
    # Try standard keywords extraction, fall back to __NEXT_DATA__ if not found
    keywords = _safe_call(scraper.keywords)
    if not keywords:
        keywords = _extract_keywords_from_next_data(scraper)

    return {
        # Core recipe data
        "title": _safe_call(scraper.title),
        "description": _safe_call(scraper.description),
        "ingredients": _safe_call(scraper.ingredients) or [],
        "ingredientGroups": _safe_call_ingredient_groups(scraper),
        "instructions": _safe_call(scraper.instructions),
        "instructionsList": _safe_call(scraper.instructions_list),

        # Timing (use numeric call to preserve 0 as valid)
        "totalTime": _safe_call_numeric(scraper.total_time),
        "prepTime": _safe_call_numeric(scraper.prep_time),
        "cookTime": _safe_call_numeric(scraper.cook_time),

        # Yield and servings
        "yields": _safe_call(scraper.yields),

        # Media
        "image": _safe_call(scraper.image),

        # Metadata
        "host": _safe_call(scraper.host),
        "canonicalUrl": _safe_call(scraper.canonical_url),
        "siteName": _safe_call(scraper.site_name),
        "author": _safe_call(scraper.author),
        "language": _safe_call(scraper.language),

        # Categorization
        "category": _safe_call(scraper.category),
        "cuisine": _safe_call(scraper.cuisine),
        "cookingMethod": _safe_call(scraper.cooking_method),
        "keywords": keywords,
        "dietaryRestrictions": _safe_call(scraper.dietary_restrictions),

        # Ratings
        "ratings": _safe_call(scraper.ratings),
        "ratingsCount": _safe_call_numeric(scraper.ratings_count),

        # Additional data
        "nutrients": _safe_call(scraper.nutrients),
        "equipment": _safe_call(scraper.equipment),
        "links": _safe_call(scraper.links),
    }


def _extract_keywords_from_next_data(scraper) -> Optional[List[str]]:
    """
    Fallback: Extract keywords/tags from __NEXT_DATA__ script if available.

    Many Next.js sites store recipe tags in this embedded JSON.
    This is a generic fallback that works for any Next.js site.
    """
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
    """
    Determine if a tag should be shown to users.

    Only includes tags that are explicitly marked for display:
    1. displayLabel / display_label field must be True
    2. Plain string tags (no metadata) are passed through

    Tags without display_label or with False are filtered out.
    """
    if not isinstance(tag, dict):
        return True  # Plain strings pass through

    # Only include tags explicitly marked for display (both naming conventions)
    if tag.get('displayLabel') is True or tag.get('display_label') is True:
        return True

    return False


def _find_tags_in_dict(data: Any, depth: int = 0) -> Optional[List[str]]:
    """
    Recursively search for tags/labels arrays in nested dict.

    Looks for common field names: 'tags', 'labels'.
    Handles both string arrays and objects with 'name' field.
    Filters out internal/marketing tags.
    """
    if depth > 10:  # Prevent infinite recursion
        return None

    if isinstance(data, dict):
        # Check for common tag field names
        for key in ['tags', 'labels']:
            if key in data and isinstance(data[key], list):
                tags = data[key]
                # Extract tag names, filtering out internal tags
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

        # Recurse into nested dicts
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
    """
    Safely call a scraper method, returning None on failure.

    Some methods may not be implemented for all websites
    or may raise exceptions for missing data.
    """
    try:
        result = method()
        # Handle None explicitly
        if result is None:
            return None
        # Handle falsy values that should be None (0, empty string for non-numeric fields)
        # But preserve valid 0 values for numeric fields like time
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
