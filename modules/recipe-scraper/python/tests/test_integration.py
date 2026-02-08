"""
Integration tests for the recipe scraper module.

These tests verify that known recipe URLs can be scraped successfully.
They require network access and are marked with pytest.mark.online.

Run with: pytest tests/test_integration.py -v
Skip online tests: pytest tests/ -v -m "not online"
"""

import json
import sys
from pathlib import Path

import pytest
import requests

sys.path.insert(0, str(Path(__file__).parent.parent))

from scraper import scrape_recipe_from_html, is_host_supported


KNOWN_RECIPE_URLS = [
    {
        "url": "https://www.marmiton.org/recettes/recette_gateau-au-chocolat-fondant-rapide_166352.aspx",
        "host": "marmiton.org",
        "expected_title_contains": "chocolat",
    },
    {
        "url": "https://www.bbcgoodfood.com/recipes/easy-chocolate-cake",
        "host": "bbcgoodfood.com",
        "expected_title_contains": "chocolate",
    },
    {
        "url": "https://www.simplyrecipes.com/recipes/perfect_chocolate_chip_cookies/",
        "host": "simplyrecipes.com",
        "expected_title_contains": "chocolate",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
}


def fetch_page(url: str) -> tuple[str, str]:
    response = requests.get(url, headers=HEADERS, timeout=30, allow_redirects=True)
    response.raise_for_status()
    return response.text, response.url


@pytest.mark.online
class TestKnownRecipeUrls:
    @pytest.mark.parametrize(
        "recipe",
        KNOWN_RECIPE_URLS,
        ids=[r["host"] for r in KNOWN_RECIPE_URLS],
    )
    def test_scrape_known_recipe_url(self, recipe):
        try:
            html, final_url = fetch_page(recipe["url"])
        except requests.RequestException as e:
            pytest.skip(f"Could not fetch {recipe['url']}: {e}")

        result = json.loads(
            scrape_recipe_from_html(html, recipe["url"], final_url=final_url)
        )

        assert result["success"] is True, f"Failed to scrape {recipe['url']}: {result.get('error')}"
        assert result["data"]["title"] is not None
        assert recipe["expected_title_contains"].lower() in result["data"]["title"].lower()
        assert result["data"]["host"] == recipe["host"]
        assert result["data"]["ingredients"] is not None
        assert len(result["data"]["ingredients"]) > 0


@pytest.mark.online
class TestHostSupport:
    @pytest.mark.parametrize(
        "host",
        ["allrecipes.com", "marmiton.org", "bbcgoodfood.com", "ricetta.it", "750g.com"],
    )
    def test_known_hosts_are_supported(self, host):
        result = json.loads(is_host_supported(host))

        assert result["success"] is True
        assert result["data"] is True, f"Host {host} should be supported"


@pytest.mark.online
class TestScraperDoesNotCrash:
    SMOKE_TEST_URLS = [
        "https://www.ricette.com/torta-al-cioccolato/",
        "https://www.taste.com.au/recipes/easy-chocolate-cake/b9a4b9ed-80a8-458f-84d0-60f8c8e2b776",
    ]

    @pytest.mark.parametrize("url", SMOKE_TEST_URLS)
    def test_scraper_returns_result_without_crashing(self, url):
        try:
            html, final_url = fetch_page(url)
        except requests.RequestException as e:
            pytest.skip(f"Could not fetch {url}: {e}")

        result = json.loads(
            scrape_recipe_from_html(html, url, final_url=final_url)
        )

        assert "success" in result
        if result["success"]:
            assert result["data"] is not None
        else:
            assert result["error"] is not None
