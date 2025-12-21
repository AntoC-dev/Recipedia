"""
Recipe scraper module - Python wrapper for recipe-scrapers library.

This module provides a complete wrapper around the recipe-scrapers Python package,
exposing all public methods as JSON-returning functions for React Native consumption.

All data transformation should be done in the app layer - this module returns
raw data exactly as provided by recipe-scrapers.

Requires: recipe-scrapers[online]>=15.0.0
"""

import json
import re
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

    Returns a dictionary with all recipe-scrapers fields.
    Missing or unsupported fields return None.
    """
    ingredients = _safe_call(scraper.ingredients) or []

    # Try standard keywords extraction, fall back to __NEXT_DATA__ if not found
    keywords = _safe_call(scraper.keywords)
    if not keywords:
        keywords = _extract_keywords_from_next_data(scraper)

    title = _safe_call(scraper.title)
    description = _safe_call(scraper.description)

    # Post-processing for sites with poor Schema.org data (e.g., Marmiton)
    title = _clean_title(title)
    description = _clean_description(description, ingredients)
    keywords = _clean_keywords(keywords, ingredients, title)

    # Try to extract structured ingredients from HTML
    parsed_ingredients = _extract_structured_ingredients(scraper.soup)

    # Try to extract structured instructions with titles from HTML
    instructions_list = _safe_call(scraper.instructions_list)
    parsed_instructions = _extract_structured_instructions(scraper.soup, instructions_list or [])

    # Try standard image extraction, fall back to JSON-LD if not found
    image = _safe_call(scraper.image)
    if not image or 'placeholder' in image.lower():
        image = _extract_image_from_json_ld(scraper.soup) or image

    return {
        # Core recipe data
        "title": title,
        "description": description,
        "ingredients": ingredients,
        "parsedIngredients": parsed_ingredients,
        "ingredientGroups": _safe_call_ingredient_groups(scraper),
        "instructions": _safe_call(scraper.instructions),
        "instructionsList": instructions_list,
        "parsedInstructions": parsed_instructions,

        # Timing (use numeric call to preserve 0 as valid)
        "totalTime": _safe_call_numeric(scraper.total_time),
        "prepTime": _safe_call_numeric(scraper.prep_time),
        "cookTime": _safe_call_numeric(scraper.cook_time),

        # Yield and servings
        "yields": _safe_call(scraper.yields),

        # Media
        "image": image,

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
        "nutrients": _infer_serving_size_from_html(scraper.soup, _safe_call(scraper.nutrients)),
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


def _extract_image_from_json_ld(soup) -> Optional[str]:
    """
    Extract recipe image URL from JSON-LD schema data.

    Falls back to JSON-LD when standard HTML extraction fails.
    Handles various JSON-LD formats: direct Recipe type, @graph arrays,
    and different image formats (string, array, object with url).

    Args:
        soup: BeautifulSoup object of the page

    Returns:
        Image URL string or None if not found/invalid
    """
    try:
        script_tag = soup.find("script", {"type": "application/ld+json"})
        if not script_tag or not script_tag.string:
            return None

        data = json.loads(script_tag.string)

        # Find the Recipe object (direct, in @graph, or in root-level array)
        recipe = None
        if isinstance(data, dict):
            if data.get('@type') == 'Recipe':
                recipe = data
            elif '@graph' in data and isinstance(data['@graph'], list):
                for item in data['@graph']:
                    if isinstance(item, dict) and item.get('@type') == 'Recipe':
                        recipe = item
                        break
        elif isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and item.get('@type') == 'Recipe':
                    recipe = item
                    break

        if not recipe or 'image' not in recipe:
            return None

        image = recipe['image']

        # Handle string format
        if isinstance(image, str):
            return image if 'placeholder' not in image.lower() else None

        # Handle array format (take first non-placeholder)
        if isinstance(image, list) and image:
            first = image[0]
            if isinstance(first, str):
                return first if 'placeholder' not in first.lower() else None
            if isinstance(first, dict) and 'url' in first:
                url = first['url']
                return url if 'placeholder' not in url.lower() else None

        # Handle object format with url field
        if isinstance(image, dict) and 'url' in image:
            url = image['url']
            return url if 'placeholder' not in url.lower() else None

        return None
    except Exception:
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


def _clean_title(title: Optional[str]) -> Optional[str]:
    """
    Clean up recipe title.

    Capitalizes first letter if entire title is lowercase.
    """
    if not title:
        return None
    if title == title.lower():
        return title.capitalize()
    return title


def _clean_description(description: Optional[str], ingredients: List[str]) -> Optional[str]:
    """
    Validate description is not actually ingredients list.

    Some sites (e.g., Marmiton) put ingredients in the description field.
    Returns None if description is mostly ingredients.
    """
    if not description:
        return None
    if not ingredients:
        return description

    cleaned = description.lower()
    for ing in ingredients:
        name = ing.lower().split('(')[0].strip()
        if name:
            cleaned = cleaned.replace(name, '')

    cleaned = ''.join(c for c in cleaned if c.isalnum())

    if len(cleaned) < 20:
        return None

    return description


def _clean_keywords(
    keywords: Optional[List[str]],
    ingredients: List[str],
    title: Optional[str]
) -> Optional[List[str]]:
    """
    Filter keywords to remove ingredients and title.

    Some sites include ingredients and recipe title in keywords.
    """
    if not keywords:
        return None

    ingredient_names = set()
    for ing in ingredients:
        name = ing.lower().split('(')[0].strip()
        if name:
            ingredient_names.add(name)

    title_lower = title.lower() if title else ""

    cleaned = []
    for kw in keywords:
        kw_lower = kw.lower()
        if kw_lower == title_lower:
            continue
        if kw_lower in ingredient_names:
            continue
        cleaned.append(kw)

    return cleaned if cleaned else None


def _infer_serving_size_from_html(soup, nutrients: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Infer serving size when missing by finding per-100g nutrition in HTML.

    Some sites display both per-portion and per-100g nutrition values.
    By comparing them, we can calculate the portion weight.
    """
    if not nutrients:
        return nutrients

    if nutrients.get('servingSize'):
        return nutrients

    per_portion_str = nutrients.get('calories', '')
    per_portion = _extract_numeric_value(per_portion_str)
    if not per_portion:
        return nutrients

    per_100g_kcal = _find_per_100g_calories(soup)
    if not per_100g_kcal or per_100g_kcal <= 0:
        return nutrients

    serving_size = round((per_portion / per_100g_kcal) * 100)
    if serving_size > 0:
        nutrients['servingSize'] = f"{serving_size}g"

    return nutrients


def _find_per_100g_calories(soup) -> float:
    """
    Search HTML for per-100g calorie value.

    Looks for common patterns:
    - Tab/section with "100g" in id or text
    - Labels like "Énergie", "Calories", "kcal" near "100g"
    """
    for tab_id in ['quantity', '100g', 'per100g']:
        tab = soup.find(id=tab_id)
        if tab:
            kcal = _extract_kcal_from_section(tab)
            if kcal:
                return kcal

    for marker in soup.find_all(string=lambda t: t and '100g' in t.lower()):
        parent = marker.find_parent(['div', 'section', 'table', 'ul'])
        if parent:
            kcal = _extract_kcal_from_section(parent)
            if kcal:
                return kcal

    return 0


def _extract_kcal_from_section(section) -> float:
    """Extract kcal value from a nutrition section."""
    for label_text in ['Énergie (kCal)', 'Énergie (kcal)', 'Calories', 'kcal', 'kCal']:
        label = section.find(string=lambda t: t and label_text in t)
        if label:
            parent = label.find_parent()
            if parent:
                value_elem = parent.find_next_sibling()
                if value_elem:
                    return _extract_numeric_value(value_elem.get_text())
    return 0


def _extract_numeric_value(text: str) -> float:
    """Extract first number from string like '876kCal' -> 876"""
    if not text:
        return 0
    text = text.replace(',', '.').replace(' ', '')
    match = re.search(r'[\d.]+', text)
    return float(match.group()) if match else 0


def _extract_structured_ingredients(soup) -> Optional[List[Dict[str, str]]]:
    """
    Try to extract structured ingredients from well-formatted HTML.

    Includes both main ingredients and kitchen staples (Dans votre cuisine).

    Returns list of {quantity, unit, name} dicts if structure detected,
    None otherwise (caller should use raw strings).
    """
    ing_list = soup.find('ul', class_='ingredient-list')
    if not ing_list:
        return None

    results = []

    # Extract main ingredients (with quantity/unit in first span)
    for li in ing_list.find_all('li', recursive=False):
        spans = li.find_all('span', recursive=False)
        if len(spans) >= 2:
            qty_unit = spans[0].get_text(strip=True)
            # Use separator to handle nested spans (e.g., "miel" + badge "Bio")
            name = spans[1].get_text(separator=' ', strip=True)

            quantity, unit = _split_quantity_unit(qty_unit)
            results.append({
                'quantity': quantity,
                'unit': unit,
                'name': _clean_ingredient_name(name)
            })
        else:
            return None

    # Extract kitchen staples (Dans votre cuisine)
    kitchen_list = soup.find('ul', class_='kitchen-list')
    if kitchen_list:
        for li in kitchen_list.find_all('li', recursive=False):
            text = li.get_text(strip=True)
            if text:
                quantity, unit, name = _parse_kitchen_item(text)
                results.append({
                    'quantity': quantity,
                    'unit': unit,
                    'name': name
                })

    return results if results else None


def _parse_kitchen_item(text: str) -> tuple:
    """
    Parse kitchen staple items like "2 càs huile d'olive" or "sel".

    Returns (quantity, unit, name) tuple.
    """
    text = text.strip()

    # Try to extract quantity and unit from start
    match = re.match(r'^([\d.,/]+)\s*(\S+)\s+(.+)$', text)
    if match:
        quantity = match.group(1).replace(',', '.')
        unit = match.group(2)
        name = _clean_ingredient_name(match.group(3))
        return (quantity, unit, name)

    # No quantity - just a name like "sel" or "poivre"
    return ('', '', _clean_ingredient_name(text))


def _extract_structured_instructions(soup, instructions_list: List[str]) -> Optional[List[Dict[str, Any]]]:
    """
    Extract structured instructions with step titles from HTML.

    Looks for common patterns where recipe steps are grouped with titles.
    Only returns data when meaningful structure is found (grouped steps with titles).
    Returns None if no structure found - the converter will use instructionsList directly.
    """
    # Common container IDs and classes for recipe instructions
    container_ids = ['preparation-steps', 'recipe-steps', 'instructions', 'method', 'directions']
    container_classes = ['recipe-steps', 'instructions', 'method', 'directions', 'preparation']

    # Try to find a container with step groups
    container = None
    for container_id in container_ids:
        container = soup.find('div', id=container_id)
        if container:
            break

    if not container:
        for container_class in container_classes:
            container = soup.find('div', class_=container_class)
            if container:
                break

    if not container:
        return None

    # Look for step groups: divs containing a title element and instruction list
    results = []
    # Exact class names that indicate a step container
    step_classes = {'step', 'toggle', 'instruction', 'etape', 'step-instructions'}

    def is_step_container(tag):
        if tag.name != 'div':
            return False
        classes = set(cls.lower() for cls in tag.get('class', []))
        return bool(classes & step_classes)

    for step_div in container.find_all(is_step_container):
        title = _extract_step_title(step_div)
        instructions = _extract_step_instructions(step_div)

        if instructions:
            results.append({"title": title, "instructions": instructions})

    return results if results else None


def _extract_step_title(step_div) -> Optional[str]:
    """
    Extract step title from a step container.

    Looks for common title patterns: bold paragraphs, headings, etc.
    Removes leading numbers like "1. " or "Étape 1:".
    """
    # Try common title patterns
    title_elem = (
        step_div.find('p', class_='bold') or
        step_div.find('strong') or
        step_div.find(['h2', 'h3', 'h4', 'h5', 'h6'])
    )

    if not title_elem:
        return None

    title = title_elem.get_text(strip=True)
    # Remove leading patterns like "1. ", "Étape 1:", "Step 2 -"
    title = re.sub(r'^(\d+[\.\:\-\s]+|[Éé]tape\s*\d*[\.\:\-\s]*|Step\s*\d*[\.\:\-\s]*)', '', title, flags=re.IGNORECASE)
    title = title.strip()

    return title if title else None


def _extract_step_instructions(step_div) -> List[str]:
    """Extract instruction texts from list items within a step container."""
    instructions = []
    for li in step_div.find_all('li'):
        text = li.get_text(strip=True)
        if text:
            instructions.append(text)
    return instructions


def _split_quantity_unit(text: str) -> tuple:
    """
    Split quantity and unit from combined string.

    Examples:
        "375 g" → ("375", "g")
        "3x" → ("3", "x")
        "0.25" → ("0.25", "")
        "20 ml" → ("20", "ml")
    """
    text = text.strip()
    if not text:
        return ('', '')

    match = re.match(r'^([\d.,/]+)\s*(.*)$', text)
    if match:
        quantity = match.group(1).replace(',', '.')
        unit = match.group(2).strip()
        return (quantity, unit)

    return ('', text)


def _clean_ingredient_name(name: str) -> str:
    """
    Clean ingredient name by removing extra whitespace and normalizing.

    Preserves parenthetical content as it may contain useful info (e.g., "240g").
    """
    name = name.replace('\xa0', ' ')
    name = ' '.join(name.split())
    return name.strip()


def _detect_auth_required(html: str, final_url: str, original_url: str) -> Optional[AuthenticationRequiredError]:
    """
    Detect if a page requires authentication.

    Checks for:
    1. Redirect to login URL
    2. Login keywords in page title
    """
    original_parsed = urlparse(original_url)
    final_parsed = urlparse(final_url)
    host = original_parsed.netloc.replace('www.', '')

    final_path = final_parsed.path.lower()
    for pattern in AUTH_URL_PATTERNS:
        if pattern in final_path:
            return AuthenticationRequiredError(host)

    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if title_match:
        title = title_match.group(1).lower()
        for keyword in AUTH_TITLE_KEYWORDS:
            if keyword in title:
                return AuthenticationRequiredError(host)

    return None


def scrape_recipe_authenticated(url: str, username: str, password: str, wild_mode: bool = True) -> str:
    """
    Scrape a recipe from an authentication-protected URL.

    Logs into the site using provided credentials and scrapes the recipe.

    Args:
        url: Recipe page URL to scrape.
        username: Username/email for authentication.
        password: Password for authentication.
        wild_mode: If True, attempt to scrape unsupported sites using schema.org.

    Returns:
        JSON string with success/error result containing all recipe data.
    """
    try:
        parsed = urlparse(url)
        host = parsed.netloc.replace('www.', '')

        handler = _get_login_handler(host)
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
        session.headers.update({'User-Agent': 'Mozilla/5.0'})

        if not handler.login(session, username, password):
            return json.dumps({
                "success": False,
                "error": {
                    "type": "AuthenticationFailed",
                    "message": "Login failed. Please check your credentials.",
                    "host": host
                }
            }, ensure_ascii=False)

        response = session.get(url, allow_redirects=True, timeout=30)
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


def _get_login_handler(host: str):
    """Get the login handler for a specific host."""
    from . import auth
    return auth.get_handler(host)
