import json
import sys
from pathlib import Path
from io import StringIO

sys.path.insert(0, str(Path(__file__).parent.parent))

from scraper import (
    scrape_recipe_from_html,
    get_supported_hosts,
    is_host_supported,
    _safe_call,
    _safe_call_numeric,
    _detect_auth_required,
    _has_recipe_schema,
    _strip_large_scripts,
    _is_scrape_result_incomplete,
    _merge_scrape_results,
    _log_debug,
    _log_info,
    _log_warn,
    _log_error,
    AuthenticationRequiredError,
    NoRecipeFoundError,
)
from recipe_scrapers import scrape_html, SCRAPERS


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

    def test_returns_null_for_parsed_fields(self):
        result = json.loads(
            scrape_recipe_from_html(SIMPLE_RECIPE_HTML, "https://example.com/recipe")
        )

        assert result["success"] is True
        assert result["data"]["parsedIngredients"] is None
        assert result["data"]["parsedInstructions"] is None


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


EXAMPLE_COM_HTML = """
<!DOCTYPE html>
<html>
<head>
    <title>Example Domain</title>
    <meta charset="utf-8" />
    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
</head>
<body>
<div>
    <h1>Example Domain</h1>
    <p>This domain is for use in illustrative examples in documents.</p>
</div>
</body>
</html>
"""


class TestHasRecipeSchema:
    def test_detects_json_ld_recipe_no_space(self):
        html = '<script type="application/ld+json">{"@type":"Recipe"}</script>'
        assert _has_recipe_schema(html) is True

    def test_detects_json_ld_recipe_with_space(self):
        html = '<script type="application/ld+json">{"@type": "Recipe"}</script>'
        assert _has_recipe_schema(html) is True

    def test_detects_microdata_http(self):
        html = '<div itemtype="http://schema.org/Recipe"></div>'
        assert _has_recipe_schema(html) is True

    def test_detects_microdata_https(self):
        html = '<div itemtype="https://schema.org/Recipe"></div>'
        assert _has_recipe_schema(html) is True

    def test_case_insensitive(self):
        html = '<script type="application/ld+json">{"@type":"RECIPE"}</script>'
        assert _has_recipe_schema(html) is True

    def test_returns_false_for_non_recipe_page(self):
        assert _has_recipe_schema(EXAMPLE_COM_HTML) is False

    def test_returns_false_for_no_recipe_html(self):
        assert _has_recipe_schema(NO_RECIPE_HTML) is False

    def test_returns_true_for_recipe_page(self):
        assert _has_recipe_schema(SIMPLE_RECIPE_HTML) is True


class TestNoRecipeFoundError:
    def test_error_has_default_message(self):
        error = NoRecipeFoundError()
        assert error.message == "No recipe found on this page"

    def test_error_custom_message(self):
        error = NoRecipeFoundError("Custom message")
        assert error.message == "Custom message"


class TestScrapeNonRecipePage:
    def test_non_recipe_page_returns_error(self):
        result = json.loads(
            scrape_recipe_from_html(EXAMPLE_COM_HTML, "https://example.com/")
        )

        assert result["success"] is False
        assert result["error"]["type"] == "NoRecipeFoundError"
        assert "No recipe found" in result["error"]["message"]

    def test_non_recipe_page_does_not_crash(self, capsys):
        result = json.loads(
            scrape_recipe_from_html(EXAMPLE_COM_HTML, "https://example.com/")
        )

        captured = capsys.readouterr()
        assert "No recipe schema found" in captured.err
        assert result["success"] is False

    def test_recipe_page_still_works(self):
        result = json.loads(
            scrape_recipe_from_html(SIMPLE_RECIPE_HTML, "https://example.com/recipe")
        )

        assert result["success"] is True
        assert result["data"]["title"] == "Chocolate Cake"


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


class TestLogging:
    def test_log_debug_does_not_raise(self, capsys):
        _log_debug("test debug message")
        captured = capsys.readouterr()
        assert "DEBUG" in captured.err
        assert "test debug message" in captured.err

    def test_log_info_does_not_raise(self, capsys):
        _log_info("test info message")
        captured = capsys.readouterr()
        assert "INFO" in captured.err
        assert "test info message" in captured.err

    def test_log_warn_does_not_raise(self, capsys):
        _log_warn("test warn message")
        captured = capsys.readouterr()
        assert "WARN" in captured.err
        assert "test warn message" in captured.err

    def test_log_error_does_not_raise(self, capsys):
        _log_error("test error message")
        captured = capsys.readouterr()
        assert "ERROR" in captured.err
        assert "test error message" in captured.err

    def test_log_error_with_exception(self, capsys):
        try:
            raise ValueError("test exception")
        except ValueError as e:
            _log_error("error with exception", e)
        captured = capsys.readouterr()
        assert "ERROR" in captured.err
        assert "test exception" in captured.err


FIXTURES_DIR = Path(__file__).parent / "fixtures"

HELLOFRESH_URL = "https://www.hellofresh.fr/recipes/keftas-de-boeuf-and-semoule-aux-epices-66e83b9e7dfc60d59bf5f913"
QUITOQUE_URL = "https://www.quitoque.fr/recettes/tartare-de-lentilles-blondes-mangue-et-salade-dalgues"


class TestStripLargeScripts:
    def test_removes_next_data_script(self):
        html = '<html><script id="__NEXT_DATA__" type="application/json">{"huge":"data"}</script><p>content</p></html>'
        result = _strip_large_scripts(html)
        assert "__NEXT_DATA__" not in result
        assert "<p>content</p>" in result

    def test_preserves_ld_json_scripts(self):
        html = '<script type="application/ld+json">{"@type":"Recipe"}</script>'
        result = _strip_large_scripts(html)
        assert 'application/ld+json' in result

    def test_preserves_html_without_next_data(self):
        result = _strip_large_scripts(SIMPLE_RECIPE_HTML)
        assert result == SIMPLE_RECIPE_HTML

    def test_handles_multiline_next_data(self):
        html = '<script id="__NEXT_DATA__" type="application/json">\n{"big":\n"json"}\n</script><p>ok</p>'
        result = _strip_large_scripts(html)
        assert "__NEXT_DATA__" not in result
        assert "<p>ok</p>" in result


class TestIsScrapeResultIncomplete:
    def test_complete_result(self):
        data = {"title": "Cake", "ingredients": ["flour", "sugar"]}
        assert _is_scrape_result_incomplete(data) is False

    def test_missing_title_with_ingredients(self):
        data = {"title": None, "ingredients": ["flour"]}
        assert _is_scrape_result_incomplete(data) is False

    def test_title_with_no_ingredients(self):
        data = {"title": "Cake", "ingredients": []}
        assert _is_scrape_result_incomplete(data) is False

    def test_no_title_no_ingredients(self):
        data = {"title": None, "ingredients": []}
        assert _is_scrape_result_incomplete(data) is True

    def test_no_title_missing_ingredients_key(self):
        data = {"title": None}
        assert _is_scrape_result_incomplete(data) is True


class TestMergeScrapeResults:
    def test_prefers_full_non_null_values(self):
        full = {"title": "Full Title", "totalTime": 70, "ingredients": ["a"]}
        stripped = {"title": "Stripped Title", "totalTime": 40, "ingredients": ["b"]}
        merged = _merge_scrape_results(full, stripped)
        assert merged["title"] == "Full Title"
        assert merged["totalTime"] == 70
        assert merged["ingredients"] == ["a"]

    def test_fills_none_from_stripped(self):
        full = {"title": None, "totalTime": 70, "ingredients": []}
        stripped = {"title": "From Stripped", "totalTime": 40, "ingredients": ["flour"]}
        merged = _merge_scrape_results(full, stripped)
        assert merged["title"] == "From Stripped"
        assert merged["totalTime"] == 70
        assert merged["ingredients"] == ["flour"]

    def test_keeps_none_when_both_none(self):
        full = {"title": None, "category": None}
        stripped = {"title": "Title", "category": None}
        merged = _merge_scrape_results(full, stripped)
        assert merged["title"] == "Title"
        assert merged["category"] is None


class TestHelloFreshLargeHtml:
    """Regression tests for HelloFresh pages with large __NEXT_DATA__ blobs (~3.9 MB).

    On Android (Chaquopy), libxml2 2.9.8 silently fails to parse large HTML,
    causing extruct to miss JSON-LD schema data. The retry-with-stripped-HTML
    fallback recovers schema fields while preserving time data from the first parse.
    """

    @staticmethod
    def _scrape_fixture():
        fixture_path = FIXTURES_DIR / "hellofresh_fr.html"
        html = fixture_path.read_text(encoding="utf-8")
        return json.loads(scrape_recipe_from_html(html, HELLOFRESH_URL))

    def test_scrape_succeeds(self):
        result = self._scrape_fixture()
        assert result["success"] is True

    def test_extracts_title(self):
        result = self._scrape_fixture()
        assert result["data"]["title"] is not None
        assert "kefta" in result["data"]["title"].lower()

    def test_extracts_ingredients(self):
        result = self._scrape_fixture()
        assert len(result["data"]["ingredients"]) > 0

    def test_extracts_instructions(self):
        result = self._scrape_fixture()
        instructions = result["data"]["instructionsList"] or []
        assert len(instructions) > 0

    def test_extracts_time(self):
        result = self._scrape_fixture()
        assert result["data"]["totalTime"] is not None
        assert result["data"]["totalTime"] > 0

    def test_extracts_yields(self):
        result = self._scrape_fixture()
        assert result["data"]["yields"] is not None

    def test_extracts_image(self):
        result = self._scrape_fixture()
        assert result["data"]["image"] is not None
        assert result["data"]["image"].startswith("http")


class TestQuitoqueHtml:
    """Tests for Quitoque (small HTML, no retry needed)."""

    @staticmethod
    def _scrape_fixture():
        fixture_path = FIXTURES_DIR / "quitoque_fr.html"
        html = fixture_path.read_text(encoding="utf-8")
        return json.loads(scrape_recipe_from_html(html, QUITOQUE_URL))

    def test_scrape_succeeds(self):
        result = self._scrape_fixture()
        assert result["success"] is True

    def test_extracts_title(self):
        result = self._scrape_fixture()
        assert result["data"]["title"] is not None
        assert "tartare" in result["data"]["title"].lower()

    def test_extracts_ingredients(self):
        result = self._scrape_fixture()
        assert len(result["data"]["ingredients"]) > 0

    def test_extracts_instructions(self):
        result = self._scrape_fixture()
        instructions = result["data"]["instructionsList"] or []
        assert len(instructions) > 0

    def test_extracts_time(self):
        result = self._scrape_fixture()
        assert result["data"]["totalTime"] is not None
        assert result["data"]["totalTime"] > 0

    def test_extracts_image(self):
        result = self._scrape_fixture()
        assert result["data"]["image"] is not None
        assert result["data"]["image"].startswith("http")


class TestModuleInitialization:
    def test_recipe_scrapers_imported(self):
        from scraper import SCRAPERS
        assert len(SCRAPERS) > 100

    def test_scrape_html_imported(self):
        from scraper import scrape_html
        assert callable(scrape_html)

    def test_scrape_recipe_from_html_logs_on_call(self, capsys):
        scrape_recipe_from_html(SIMPLE_RECIPE_HTML, "https://example.com/recipe")
        captured = capsys.readouterr()
        assert "scrape_recipe_from_html called" in captured.err
