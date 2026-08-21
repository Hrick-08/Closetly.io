"""
Closetly Microservice — SerpAPI service.

Searches the web for clothing products by name/description using
Google Shopping results via SerpAPI.
"""

import logging
from serpapi import GoogleSearch

from app.config import settings

logger = logging.getLogger(__name__)


def search_products(query: str, num_results: int = 10) -> list[dict]:
    """
    Search Google Shopping for clothing products matching the query.

    Args:
        query: Cloth name / description (e.g. "blue denim jacket men").
        num_results: Max number of results to return.

    Returns:
        List of product dicts with title, link, thumbnail, price, source, snippet.
    """
    if not settings.serpapi_key:
        logger.warning("SERPAPI_KEY not set — returning empty results")
        return []

    params = {
        "engine": "google_shopping",
        "q": query,
        "num": num_results,
        "api_key": settings.serpapi_key,
        "hl": "en",
        "gl": "in",
        "location": "India",
    }

    try:
        search = GoogleSearch(params)
        data = search.get_dict()
    except Exception as e:
        logger.error("SerpAPI request failed: %s", e)
        return []

    shopping_results = data.get("shopping_results", [])

    products = []
    for idx, item in enumerate(shopping_results[:num_results], start=1):
        products.append(
            {
                "title": item.get("title", ""),
                "link": item.get("product_link", item.get("link", "")),
                "thumbnail": item.get("thumbnail", ""),
                "price": str(item.get("extracted_price", item.get("price", ""))),
                "old_price": str(item.get("extracted_old_price", "")) if item.get("extracted_old_price") else "",
                "source": item.get("source", ""),
                "rating": item.get("rating"),
                "reviews": item.get("reviews"),
                "delivery": item.get("delivery", ""),
                "tag": item.get("tag", ""),
                "position": idx,
            }
        )

    return products
