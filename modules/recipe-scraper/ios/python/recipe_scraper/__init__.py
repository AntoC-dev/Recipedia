"""
Recipe scraper module for Recipedia.
Provides on-device recipe extraction using the recipe-scrapers library.
"""

from .scraper import scrape_recipe

__all__ = ['scrape_recipe']
