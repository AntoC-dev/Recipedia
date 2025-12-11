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
