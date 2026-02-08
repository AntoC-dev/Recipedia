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
    _log_debug,
    _log_info,
    _log_warn,
    _log_error,
    AuthenticationRequiredError,
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
