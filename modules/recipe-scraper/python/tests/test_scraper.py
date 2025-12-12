import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scraper import (
    scrape_recipe_from_html,
    get_supported_hosts,
    is_host_supported,
    _find_tags_in_dict,
    _is_user_facing_tag,
    _safe_call,
    _safe_call_numeric,
    _clean_title,
    _clean_description,
    _clean_keywords,
    _detect_auth_required,
    _extract_numeric_value,
    _infer_serving_size_from_html,
    _find_per_100g_calories,
    _extract_kcal_from_section,
    _extract_structured_ingredients,
    _split_quantity_unit,
    _clean_ingredient_name,
    _parse_kitchen_item,
    _extract_structured_instructions,
    _extract_step_title,
    _extract_step_instructions,
    AuthenticationRequiredError,
)


SIMPLE_RECIPE_HTML = """
<!DOCTYPE html>
<html>
<head>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": "Chocolate Cake",
        "description": "A delicious chocolate cake recipe",
        "recipeIngredient": ["200g flour", "100g sugar", "50g cocoa powder"],
        "recipeInstructions": "Mix all ingredients and bake at 180°C for 30 minutes.",
        "prepTime": "PT15M",
        "cookTime": "PT30M",
        "totalTime": "PT45M",
        "recipeYield": "8 servings",
        "author": {"@type": "Person", "name": "Chef Test"},
        "image": "https://example.com/cake.jpg"
    }
    </script>
</head>
<body></body>
</html>
"""

NO_RECIPE_HTML = """
<!DOCTYPE html>
<html>
<head><title>Not a recipe</title></head>
<body><p>This page has no recipe.</p></body>
</html>
"""

NEXT_DATA_HTML = """
<!DOCTYPE html>
<html>
<head>
    <script id="__NEXT_DATA__" type="application/json">
    {
        "props": {
            "pageProps": {
                "recipe": {
                    "name": "Test Recipe",
                    "tags": [
                        {"name": "Quick", "displayLabel": true},
                        {"name": "internal-tag", "displayLabel": false},
                        {"name": "Vegetarian", "displayLabel": true}
                    ]
                }
            }
        }
    }
    </script>
    <script type="application/ld+json">
    {
        "@type": "Recipe",
        "name": "Test Recipe",
        "recipeIngredient": ["1 cup rice"]
    }
    </script>
</head>
<body></body>
</html>
"""


class TestScrapeRecipeFromHtml:
    def test_success_with_valid_recipe(self):
        result = json.loads(
            scrape_recipe_from_html(SIMPLE_RECIPE_HTML, "https://example.com/recipe")
        )

        assert result["success"] is True
        assert result["data"]["title"] == "Chocolate Cake"
        assert result["data"]["description"] == "A delicious chocolate cake recipe"
        assert len(result["data"]["ingredients"]) == 3
        assert "200g flour" in result["data"]["ingredients"]
        assert result["data"]["prepTime"] == 15
        assert result["data"]["cookTime"] == 30
        assert result["data"]["totalTime"] == 45
        assert result["data"]["yields"] == "8 servings"
        assert result["data"]["author"] == "Chef Test"
        assert result["data"]["image"] == "https://example.com/cake.jpg"

    def test_failure_with_no_recipe(self):
        result = json.loads(
            scrape_recipe_from_html(NO_RECIPE_HTML, "https://example.com/page")
        )

        assert result["success"] is False
        assert "error" in result
        assert result["error"]["type"] is not None

    def test_wild_mode_true_allows_unsupported_sites(self):
        result_wild = json.loads(
            scrape_recipe_from_html(
                SIMPLE_RECIPE_HTML, "https://example.com/recipe", wild_mode=True
            )
        )

        assert result_wild["success"] is True

    def test_wild_mode_false_fails_for_unsupported_sites(self):
        result_strict = json.loads(
            scrape_recipe_from_html(
                SIMPLE_RECIPE_HTML, "https://example.com/recipe", wild_mode=False
            )
        )

        assert result_strict["success"] is False

    def test_extracts_host_from_url(self):
        result = json.loads(
            scrape_recipe_from_html(SIMPLE_RECIPE_HTML, "https://example.com/recipe")
        )

        assert result["success"] is True
        assert result["data"]["host"] == "example.com"


class TestGetSupportedHosts:
    def test_returns_list_of_hosts(self):
        result = json.loads(get_supported_hosts())

        assert result["success"] is True
        assert isinstance(result["data"], list)
        assert len(result["data"]) > 100

    def test_includes_known_hosts(self):
        result = json.loads(get_supported_hosts())
        hosts_lower = [h.lower() for h in result["data"]]

        assert "allrecipes.com" in hosts_lower
        assert "bbc.co.uk" in hosts_lower or "bbcgoodfood.com" in hosts_lower


class TestIsHostSupported:
    def test_known_host_returns_true(self):
        result = json.loads(is_host_supported("allrecipes.com"))

        assert result["success"] is True
        assert result["data"] is True

    def test_unknown_host_returns_false(self):
        result = json.loads(is_host_supported("not-a-recipe-site.invalid"))

        assert result["success"] is True
        assert result["data"] is False

    def test_case_insensitive(self):
        result_lower = json.loads(is_host_supported("allrecipes.com"))
        result_upper = json.loads(is_host_supported("ALLRECIPES.COM"))
        result_mixed = json.loads(is_host_supported("AllRecipes.Com"))

        assert result_lower["data"] is True
        assert result_upper["data"] is True
        assert result_mixed["data"] is True


class TestFindTagsInDict:
    def test_finds_tags_array(self):
        data = {"recipe": {"tags": ["Quick", "Easy", "Vegetarian"]}}

        result = _find_tags_in_dict(data)

        assert result == ["Quick", "Easy", "Vegetarian"]

    def test_finds_tags_with_name_property(self):
        data = {
            "recipe": {
                "tags": [
                    {"name": "Quick", "displayLabel": True},
                    {"name": "Easy", "displayLabel": True},
                ]
            }
        }

        result = _find_tags_in_dict(data)

        assert result == ["Quick", "Easy"]

    def test_filters_non_display_tags(self):
        data = {
            "recipe": {
                "tags": [
                    {"name": "Quick", "displayLabel": True},
                    {"name": "internal", "displayLabel": False},
                    {"name": "Vegetarian", "displayLabel": True},
                ]
            }
        }

        result = _find_tags_in_dict(data)

        assert result == ["Quick", "Vegetarian"]
        assert "internal" not in result

    def test_finds_labels_array(self):
        data = {"page": {"labels": ["Label1", "Label2"]}}

        result = _find_tags_in_dict(data)

        assert result == ["Label1", "Label2"]

    def test_returns_none_when_no_tags(self):
        data = {"recipe": {"name": "Test"}}

        result = _find_tags_in_dict(data)

        assert result is None

    def test_max_depth_protection(self):
        deeply_nested = {"a": {}}
        current = deeply_nested["a"]
        for _ in range(15):
            current["b"] = {}
            current = current["b"]
        current["tags"] = ["Found"]

        result = _find_tags_in_dict(deeply_nested)

        assert result is None


class TestIsUserFacingTag:
    def test_string_tag_is_user_facing(self):
        assert _is_user_facing_tag("Quick") is True

    def test_dict_with_display_label_true(self):
        assert _is_user_facing_tag({"name": "Quick", "displayLabel": True}) is True

    def test_dict_with_display_label_false(self):
        assert _is_user_facing_tag({"name": "internal", "displayLabel": False}) is False

    def test_dict_without_display_label(self):
        assert _is_user_facing_tag({"name": "Tag"}) is False

    def test_supports_snake_case_display_label(self):
        assert _is_user_facing_tag({"name": "Tag", "display_label": True}) is True


class TestSafeCall:
    def test_returns_value_on_success(self):
        result = _safe_call(lambda: "test")
        assert result == "test"

    def test_returns_none_on_exception(self):
        def raise_error():
            raise ValueError("test error")

        result = _safe_call(raise_error)
        assert result is None

    def test_returns_none_for_empty_string(self):
        result = _safe_call(lambda: "")
        assert result is None

    def test_returns_none_for_zero(self):
        result = _safe_call(lambda: 0)
        assert result is None

    def test_returns_none_for_none(self):
        result = _safe_call(lambda: None)
        assert result is None


class TestSafeCallNumeric:
    def test_returns_int_for_int(self):
        result = _safe_call_numeric(lambda: 42)
        assert result == 42

    def test_returns_int_for_float(self):
        result = _safe_call_numeric(lambda: 3.14)
        assert result == 3

    def test_returns_none_on_exception(self):
        def raise_error():
            raise ValueError("test error")

        result = _safe_call_numeric(raise_error)
        assert result is None

    def test_returns_none_for_none(self):
        result = _safe_call_numeric(lambda: None)
        assert result is None

    def test_returns_none_for_string(self):
        result = _safe_call_numeric(lambda: "not a number")
        assert result is None


class TestCleanTitle:
    def test_capitalizes_lowercase_title(self):
        assert _clean_title("hamburger maison") == "Hamburger maison"

    def test_preserves_mixed_case_title(self):
        assert _clean_title("Chocolate Cake") == "Chocolate Cake"

    def test_preserves_uppercase_title(self):
        assert _clean_title("CHOCOLATE CAKE") == "CHOCOLATE CAKE"

    def test_returns_none_for_none(self):
        assert _clean_title(None) is None

    def test_returns_none_for_empty_string(self):
        assert _clean_title("") is None


class TestCleanDescription:
    def test_returns_valid_description(self):
        ingredients = ["flour", "sugar"]
        description = "A delicious cake recipe for beginners with chocolate"
        assert _clean_description(description, ingredients) == description

    def test_returns_none_when_description_is_ingredients(self):
        ingredients = ["pain pour hamburger", "viande hachée", "oignon", "cheddar"]
        description = "pain pour hamburger, viande hachée, oignon, cheddar"
        assert _clean_description(description, ingredients) is None

    def test_returns_none_for_none_description(self):
        assert _clean_description(None, ["flour"]) is None

    def test_returns_description_when_no_ingredients(self):
        description = "A delicious cake recipe for beginners"
        assert _clean_description(description, []) == description

    def test_handles_ingredients_with_parentheses(self):
        ingredients = ["cheddar (achat sous vide)", "tomate"]
        description = "cheddar, tomate"
        assert _clean_description(description, ingredients) is None

    def test_keeps_description_with_enough_extra_content(self):
        ingredients = ["flour", "sugar"]
        description = "flour and sugar combined to make a delicious treat"
        assert _clean_description(description, ingredients) == description


class TestCleanKeywords:
    def test_removes_title_from_keywords(self):
        keywords = ["hamburger maison", "rapide", "facile"]
        ingredients = []
        title = "Hamburger maison"
        result = _clean_keywords(keywords, ingredients, title)
        assert "hamburger maison" not in result
        assert "rapide" in result

    def test_removes_ingredients_from_keywords(self):
        keywords = ["pain pour hamburger", "rapide", "oignon", "facile"]
        ingredients = ["pain pour hamburger", "oignon", "tomate"]
        title = "Test Recipe"
        result = _clean_keywords(keywords, ingredients, title)
        assert "pain pour hamburger" not in result
        assert "oignon" not in result
        assert "rapide" in result
        assert "facile" in result

    def test_returns_none_for_none_keywords(self):
        assert _clean_keywords(None, [], "Title") is None

    def test_returns_none_when_all_keywords_filtered(self):
        keywords = ["hamburger maison"]
        ingredients = []
        title = "Hamburger maison"
        assert _clean_keywords(keywords, ingredients, title) is None

    def test_handles_none_title(self):
        keywords = ["rapide", "facile"]
        result = _clean_keywords(keywords, [], None)
        assert result == ["rapide", "facile"]

    def test_case_insensitive_filtering(self):
        keywords = ["Hamburger Maison", "RAPIDE"]
        ingredients = []
        title = "hamburger maison"
        result = _clean_keywords(keywords, ingredients, title)
        assert "Hamburger Maison" not in result
        assert "RAPIDE" in result


LOGIN_PAGE_HTML = """
<!DOCTYPE html>
<html>
<head><title>Connexion - Quitoque</title></head>
<body><form action="/login-check"><input type="text" name="_username"/></form></body>
</html>
"""

LOGIN_PAGE_ENGLISH_HTML = """
<!DOCTYPE html>
<html>
<head><title>Sign In to Your Account</title></head>
<body><form action="/login"><input type="text" name="email"/></form></body>
</html>
"""


class TestAuthenticationRequiredError:
    def test_error_has_host(self):
        error = AuthenticationRequiredError("quitoque.fr")
        assert error.host == "quitoque.fr"

    def test_error_has_default_message(self):
        error = AuthenticationRequiredError("quitoque.fr")
        assert error.message == "This recipe requires authentication"

    def test_error_custom_message(self):
        error = AuthenticationRequiredError("quitoque.fr", "Custom message")
        assert error.message == "Custom message"


class TestDetectAuthRequired:
    def test_detects_login_in_final_url(self):
        html = "<html><head><title>Page</title></head></html>"
        original_url = "https://www.quitoque.fr/products/recipe-123"
        final_url = "https://www.quitoque.fr/login?redirect=/products/recipe-123"

        result = _detect_auth_required(html, final_url, original_url)

        assert result is not None
        assert isinstance(result, AuthenticationRequiredError)
        assert result.host == "quitoque.fr"

    def test_detects_signin_in_final_url(self):
        html = "<html><head><title>Page</title></head></html>"
        original_url = "https://example.com/recipe"
        final_url = "https://example.com/signin"

        result = _detect_auth_required(html, final_url, original_url)

        assert result is not None
        assert result.host == "example.com"

    def test_detects_connexion_in_final_url(self):
        html = "<html><head><title>Page</title></head></html>"
        original_url = "https://www.quitoque.fr/recipe"
        final_url = "https://www.quitoque.fr/connexion"

        result = _detect_auth_required(html, final_url, original_url)

        assert result is not None
        assert result.host == "quitoque.fr"

    def test_detects_auth_in_final_url(self):
        html = "<html><head><title>Page</title></head></html>"
        original_url = "https://example.com/recipe"
        final_url = "https://example.com/auth/login"

        result = _detect_auth_required(html, final_url, original_url)

        assert result is not None

    def test_detects_login_keyword_in_title(self):
        original_url = "https://example.com/recipe"
        final_url = "https://example.com/recipe"

        result = _detect_auth_required(LOGIN_PAGE_HTML, final_url, original_url)

        assert result is not None
        assert result.host == "example.com"

    def test_detects_signin_keyword_in_title(self):
        original_url = "https://example.com/recipe"
        final_url = "https://example.com/recipe"

        result = _detect_auth_required(LOGIN_PAGE_ENGLISH_HTML, final_url, original_url)

        assert result is not None

    def test_returns_none_for_valid_recipe_page(self):
        html = "<html><head><title>Chocolate Cake Recipe</title></head></html>"
        original_url = "https://example.com/recipe/chocolate-cake"
        final_url = "https://example.com/recipe/chocolate-cake"

        result = _detect_auth_required(html, final_url, original_url)

        assert result is None

    def test_removes_www_from_host(self):
        html = "<html><head><title>Page</title></head></html>"
        original_url = "https://www.quitoque.fr/recipe"
        final_url = "https://www.quitoque.fr/login"

        result = _detect_auth_required(html, final_url, original_url)

        assert result is not None
        assert result.host == "quitoque.fr"
        assert "www" not in result.host


class TestScrapeRecipeFromHtmlWithAuth:
    def test_returns_auth_error_on_login_redirect(self):
        html = "<html><head><title>Connexion</title></head></html>"
        original_url = "https://www.quitoque.fr/products/recipe-123"
        final_url = "https://www.quitoque.fr/login"

        result = json.loads(
            scrape_recipe_from_html(html, original_url, final_url=final_url)
        )

        assert result["success"] is False
        assert result["error"]["type"] == "AuthenticationRequired"
        assert result["error"]["host"] == "quitoque.fr"

    def test_returns_auth_error_on_login_page_title(self):
        original_url = "https://example.com/recipe"
        final_url = "https://example.com/some-page"

        result = json.loads(
            scrape_recipe_from_html(LOGIN_PAGE_HTML, original_url, final_url=final_url)
        )

        assert result["success"] is False
        assert result["error"]["type"] == "AuthenticationRequired"


from bs4 import BeautifulSoup


NUTRITION_100G_TAB_HTML = """
<!DOCTYPE html>
<html>
<head></head>
<body>
<div id="quantity">
    <div>
        <span>Énergie (kCal)</span>
        <span>297</span>
    </div>
</div>
<div id="portion">
    <div>
        <span>Énergie (kCal)</span>
        <span>876</span>
    </div>
</div>
</body>
</html>
"""

NUTRITION_100G_TEXT_HTML = """
<!DOCTYPE html>
<html>
<head></head>
<body>
<div class="nutrition">
    <h3>Valeurs nutritionnelles pour 100g</h3>
    <div>
        <span>Calories</span>
        <span>250 kcal</span>
    </div>
</div>
</body>
</html>
"""

NUTRITION_NO_100G_HTML = """
<!DOCTYPE html>
<html>
<head></head>
<body>
<div class="nutrition">
    <span>Énergie</span>
    <span>500 kCal</span>
</div>
</body>
</html>
"""


class TestExtractNumericValue:
    def test_extracts_integer(self):
        assert _extract_numeric_value("876kCal") == 876.0

    def test_extracts_float(self):
        assert _extract_numeric_value("32.5g") == 32.5

    def test_handles_comma_decimal(self):
        assert _extract_numeric_value("32,5g") == 32.5

    def test_handles_spaces(self):
        assert _extract_numeric_value("876 kCal") == 876.0

    def test_returns_zero_for_empty_string(self):
        assert _extract_numeric_value("") == 0

    def test_returns_zero_for_none(self):
        assert _extract_numeric_value(None) == 0

    def test_returns_zero_for_no_number(self):
        assert _extract_numeric_value("no number") == 0


class TestFindPer100gCalories:
    def test_finds_calories_in_quantity_tab(self):
        soup = BeautifulSoup(NUTRITION_100G_TAB_HTML, "html.parser")
        result = _find_per_100g_calories(soup)
        assert result == 297.0

    def test_finds_calories_near_100g_text(self):
        soup = BeautifulSoup(NUTRITION_100G_TEXT_HTML, "html.parser")
        result = _find_per_100g_calories(soup)
        assert result == 250.0

    def test_returns_zero_when_no_100g_section(self):
        soup = BeautifulSoup(NUTRITION_NO_100G_HTML, "html.parser")
        result = _find_per_100g_calories(soup)
        assert result == 0


class TestExtractKcalFromSection:
    def test_finds_energie_kcal(self):
        html = """
        <div>
            <span>Énergie (kCal)</span>
            <span>297</span>
        </div>
        """
        section = BeautifulSoup(html, "html.parser")
        result = _extract_kcal_from_section(section)
        assert result == 297.0

    def test_finds_calories_label(self):
        html = """
        <div>
            <span>Calories</span>
            <span>250</span>
        </div>
        """
        section = BeautifulSoup(html, "html.parser")
        result = _extract_kcal_from_section(section)
        assert result == 250.0

    def test_returns_zero_for_no_match(self):
        html = """
        <div>
            <span>Protein</span>
            <span>25g</span>
        </div>
        """
        section = BeautifulSoup(html, "html.parser")
        result = _extract_kcal_from_section(section)
        assert result == 0


class TestInferServingSizeFromHtml:
    def test_infers_serving_size_from_100g_tab(self):
        soup = BeautifulSoup(NUTRITION_100G_TAB_HTML, "html.parser")
        nutrients = {"calories": "876 kCal", "fatContent": "66g"}

        result = _infer_serving_size_from_html(soup, nutrients)

        assert result["servingSize"] == "295g"

    def test_preserves_existing_serving_size(self):
        soup = BeautifulSoup(NUTRITION_100G_TAB_HTML, "html.parser")
        nutrients = {"calories": "876 kCal", "servingSize": "300g"}

        result = _infer_serving_size_from_html(soup, nutrients)

        assert result["servingSize"] == "300g"

    def test_returns_none_for_none_nutrients(self):
        soup = BeautifulSoup(NUTRITION_100G_TAB_HTML, "html.parser")

        result = _infer_serving_size_from_html(soup, None)

        assert result is None

    def test_returns_unchanged_when_no_calories(self):
        soup = BeautifulSoup(NUTRITION_100G_TAB_HTML, "html.parser")
        nutrients = {"fatContent": "66g"}

        result = _infer_serving_size_from_html(soup, nutrients)

        assert "servingSize" not in result

    def test_returns_unchanged_when_no_100g_section(self):
        soup = BeautifulSoup(NUTRITION_NO_100G_HTML, "html.parser")
        nutrients = {"calories": "500 kCal"}

        result = _infer_serving_size_from_html(soup, nutrients)

        assert "servingSize" not in result

    def test_calculation_accuracy(self):
        soup = BeautifulSoup(NUTRITION_100G_TAB_HTML, "html.parser")
        nutrients = {"calories": "594 kCal"}

        result = _infer_serving_size_from_html(soup, nutrients)

        expected = round((594 / 297) * 100)
        assert result["servingSize"] == f"{expected}g"


STRUCTURED_INGREDIENTS_HTML = """
<!DOCTYPE html>
<html>
<head></head>
<body>
<ul class="ingredient-list">
    <li>
        <span class="bold">375 g</span>
        <span>camembert au lait cru</span>
    </li>
    <li>
        <span class="bold">3x</span>
        <span>petits pains (240g)</span>
    </li>
    <li>
        <span class="bold">0.25</span>
        <span>herbes de Provence</span>
    </li>
</ul>
</body>
</html>
"""

UNSTRUCTURED_INGREDIENTS_HTML = """
<!DOCTYPE html>
<html>
<head></head>
<body>
<ul class="ingredients">
    <li>375 g camembert</li>
    <li>3 petits pains</li>
</ul>
</body>
</html>
"""

STRUCTURED_WITH_KITCHEN_LIST_HTML = """
<!DOCTYPE html>
<html>
<head></head>
<body>
<ul class="ingredient-list">
    <li>
        <span class="bold">375 g</span>
        <span>camembert au lait cru</span>
    </li>
    <li>
        <span class="bold">3x</span>
        <span>petits pains (240g)</span>
    </li>
</ul>
<p class="bold m-0 mb-1">Dans votre cuisine</p>
<ul class="kitchen-list">
    <li class="regular body-2 mb-2">sel</li>
    <li class="regular body-2 mb-2">poivre</li>
    <li class="regular body-2 mb-2">2 càs huile d'olive</li>
    <li class="regular body-2 mb-2">1 càs vinaigre de votre choix</li>
</ul>
</body>
</html>
"""


class TestSplitQuantityUnit:
    def test_splits_quantity_and_unit(self):
        assert _split_quantity_unit("375 g") == ("375", "g")

    def test_splits_without_space(self):
        assert _split_quantity_unit("3x") == ("3", "x")

    def test_handles_decimal(self):
        assert _split_quantity_unit("0.25") == ("0.25", "")

    def test_handles_comma_decimal(self):
        assert _split_quantity_unit("0,25") == ("0.25", "")

    def test_handles_empty_string(self):
        assert _split_quantity_unit("") == ("", "")

    def test_handles_no_number(self):
        assert _split_quantity_unit("pièce") == ("", "pièce")


class TestCleanIngredientName:
    def test_removes_nbsp(self):
        result = _clean_ingredient_name("camembert\xa0au lait")
        assert result == "camembert au lait"

    def test_normalizes_whitespace(self):
        result = _clean_ingredient_name("  camembert   au   lait  ")
        assert result == "camembert au lait"


class TestExtractStructuredIngredients:
    def test_extracts_from_well_structured_html(self):
        soup = BeautifulSoup(STRUCTURED_INGREDIENTS_HTML, "html.parser")

        result = _extract_structured_ingredients(soup)

        assert result is not None
        assert len(result) == 3

        assert result[0]["quantity"] == "375"
        assert result[0]["unit"] == "g"
        assert result[0]["name"] == "camembert au lait cru"

        assert result[1]["quantity"] == "3"
        assert result[1]["unit"] == "x"
        assert result[1]["name"] == "petits pains (240g)"

        assert result[2]["quantity"] == "0.25"
        assert result[2]["unit"] == ""
        assert result[2]["name"] == "herbes de Provence"

    def test_returns_none_for_unstructured_html(self):
        soup = BeautifulSoup(UNSTRUCTURED_INGREDIENTS_HTML, "html.parser")

        result = _extract_structured_ingredients(soup)

        assert result is None

    def test_returns_none_when_no_ingredient_list(self):
        soup = BeautifulSoup("<html><body></body></html>", "html.parser")

        result = _extract_structured_ingredients(soup)

        assert result is None

    def test_extracts_kitchen_list_items(self):
        soup = BeautifulSoup(STRUCTURED_WITH_KITCHEN_LIST_HTML, "html.parser")

        result = _extract_structured_ingredients(soup)

        assert result is not None
        assert len(result) == 6

        assert result[0]["quantity"] == "375"
        assert result[0]["unit"] == "g"
        assert result[0]["name"] == "camembert au lait cru"

        assert result[1]["quantity"] == "3"
        assert result[1]["unit"] == "x"
        assert result[1]["name"] == "petits pains (240g)"

        assert result[2]["quantity"] == ""
        assert result[2]["unit"] == ""
        assert result[2]["name"] == "sel"

        assert result[3]["quantity"] == ""
        assert result[3]["unit"] == ""
        assert result[3]["name"] == "poivre"

        assert result[4]["quantity"] == "2"
        assert result[4]["unit"] == "càs"
        assert result[4]["name"] == "huile d'olive"

        assert result[5]["quantity"] == "1"
        assert result[5]["unit"] == "càs"
        assert result[5]["name"] == "vinaigre de votre choix"


class TestParseKitchenItem:
    def test_parses_item_with_quantity_and_unit(self):
        assert _parse_kitchen_item("2 càs huile d'olive") == ("2", "càs", "huile d'olive")

    def test_parses_item_with_decimal_quantity(self):
        assert _parse_kitchen_item("0,5 càc sel") == ("0.5", "càc", "sel")

    def test_parses_simple_name_only(self):
        assert _parse_kitchen_item("sel") == ("", "", "sel")

    def test_parses_name_with_spaces(self):
        assert _parse_kitchen_item("poivre noir") == ("", "", "poivre noir")

    def test_handles_empty_string(self):
        assert _parse_kitchen_item("") == ("", "", "")

    def test_handles_whitespace(self):
        assert _parse_kitchen_item("  sel  ") == ("", "", "sel")


STRUCTURED_INSTRUCTIONS_HTML = """
<!DOCTYPE html>
<html>
<head></head>
<body>
<div id="preparation-steps">
    <div class="toggle w-100 mb-2">
        <p class="regular body-3 m-0 c-gray-400">Étape 1</p>
        <p class="bold mb-2">1. Le camembert rôti</p>
        <ul class="ps-4">
            <li class="body-2 regular m-0">Préchauffez votre four à 200°C.</li>
            <li class="body-2 regular m-0">Déposez le camembert sur une plaque.</li>
        </ul>
    </div>
    <div class="step-instructions collapse mb-2">
        <p class="regular body-3 m-0">Étape 2</p>
        <p class="bold mb-2">2. Les mouillettes</p>
        <ul>
            <li class="body-2 regular m-0">Coupez les petits pains pour réaliser des mouillettes.</li>
            <li class="body-2 regular m-0">Placez-les à côté du camembert.</li>
            <li class="body-2 regular m-0">Enfournez le tout 12 à 15 min.</li>
        </ul>
    </div>
</div>
</body>
</html>
"""


class TestExtractStepTitle:
    def test_extracts_title_from_bold_paragraph(self):
        html = '<div><p class="bold">1. Le camembert rôti</p></div>'
        soup = BeautifulSoup(html, "html.parser")
        step_div = soup.find('div')

        assert _extract_step_title(step_div) == "Le camembert rôti"

    def test_extracts_title_from_strong(self):
        html = '<div><strong>Step 2: Mix ingredients</strong></div>'
        soup = BeautifulSoup(html, "html.parser")
        step_div = soup.find('div')

        assert _extract_step_title(step_div) == "Mix ingredients"

    def test_extracts_title_from_heading(self):
        html = '<div><h3>Étape 3 - La cuisson</h3></div>'
        soup = BeautifulSoup(html, "html.parser")
        step_div = soup.find('div')

        assert _extract_step_title(step_div) == "La cuisson"

    def test_returns_none_when_no_title_element(self):
        html = '<div><p>Just a regular paragraph</p></div>'
        soup = BeautifulSoup(html, "html.parser")
        step_div = soup.find('div')

        assert _extract_step_title(step_div) is None


class TestExtractStepInstructions:
    def test_extracts_list_items(self):
        html = '<div><ul><li>Step 1</li><li>Step 2</li></ul></div>'
        soup = BeautifulSoup(html, "html.parser")
        step_div = soup.find('div')

        result = _extract_step_instructions(step_div)

        assert result == ["Step 1", "Step 2"]

    def test_skips_empty_items(self):
        html = '<div><ul><li>Step 1</li><li>  </li><li>Step 2</li></ul></div>'
        soup = BeautifulSoup(html, "html.parser")
        step_div = soup.find('div')

        result = _extract_step_instructions(step_div)

        assert result == ["Step 1", "Step 2"]

    def test_returns_empty_list_when_no_items(self):
        html = '<div><p>No list here</p></div>'
        soup = BeautifulSoup(html, "html.parser")
        step_div = soup.find('div')

        assert _extract_step_instructions(step_div) == []


class TestExtractStructuredInstructions:
    def test_extracts_steps_with_titles(self):
        soup = BeautifulSoup(STRUCTURED_INSTRUCTIONS_HTML, "html.parser")

        result = _extract_structured_instructions(soup, [])

        assert result is not None
        assert len(result) == 2
        assert result[0]["title"] == "Le camembert rôti"
        assert len(result[0]["instructions"]) == 2
        assert result[1]["title"] == "Les mouillettes"
        assert len(result[1]["instructions"]) == 3

    def test_returns_none_when_no_container_found(self):
        soup = BeautifulSoup("<html><body></body></html>", "html.parser")

        result = _extract_structured_instructions(soup, ["Step 1", "Step 2"])

        assert result is None

    def test_returns_none_when_no_step_containers_found(self):
        html = '<div id="preparation-steps"><p>Just text, no steps</p></div>'
        soup = BeautifulSoup(html, "html.parser")

        result = _extract_structured_instructions(soup, ["Step 1"])

        assert result is None
