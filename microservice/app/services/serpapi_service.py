"""
Closetly Microservice — SerpAPI service.

Searches the web for clothing products by name/description using
Google Shopping results via SerpAPI and resolves direct retailer URLs.
"""

import json
import logging

from serpapi import GoogleSearch

from app.config import settings

logger = logging.getLogger(__name__)


def search_products(query: str, num_results: int = 10) -> list[dict]:
    """
    Search Google Shopping for clothing products matching the query.

    Returns products with direct retailer URLs where available.
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

    for idx, item in enumerate(
        shopping_results[:num_results],
        start=1,
    ):
        products.append(
            {
                "title": item.get("title", ""),

                # Google Shopping URL is initially used as fallback.
                "link": item.get(
                    "product_link",
                    item.get("link", ""),
                ),

                "thumbnail": item.get("thumbnail", ""),

                "price": str(
                    item.get(
                        "extracted_price",
                        item.get("price", ""),
                    )
                ),

                "old_price": (
                    str(item.get("extracted_old_price", ""))
                    if item.get("extracted_old_price")
                    else ""
                ),

                "source": item.get("source", ""),
                "rating": item.get("rating"),
                "reviews": item.get("reviews"),
                "delivery": item.get("delivery", ""),
                "tag": item.get("tag", ""),
                "position": idx,

                # IMPORTANT:
                # Keep this internally so we can resolve the
                # actual retailer URL.
                "_immersive_token": item.get(
                    "immersive_product_page_token"
                ),
            }
        )

    # Resolve actual retailer URLs.
    for product in products:
        direct_url = get_direct_product_url(product)

        if direct_url:
            product["link"] = direct_url

        # Don't expose the internal SerpApi token to the frontend.
        product.pop("_immersive_token", None)

    return products


def get_direct_product_url(item: dict) -> str:
    """
    Resolve a Google Shopping result to the actual retailer URL.

    Uses Google Immersive Product API through SerpAPI.
    """

    token = item.get("_immersive_token")

    # If Google did not provide a token, use the existing URL.
    if not token:
        logger.warning(
            "No immersive product token for: %s",
            item.get("title"),
        )
        return item.get("link", "")

    params = {
        "engine": "google_immersive_product",
        "page_token": token,
        "api_key": settings.serpapi_key,
    }

    try:
        logger.info(
            "Resolving direct URL for: %s",
            item.get("title"),
        )

        search = GoogleSearch(params)
        result = search.get_dict()

        # Debug output.
        # logger.info(
        #     "Immersive Product response for %s:\n%s",
        #     item.get("title"),
        #     json.dumps(result, indent=2),
        # )

        direct_url = extract_store_url(
            result,
            item.get("source", ""),
        )

        if direct_url:
            logger.info(
                "Direct URL found: %s",
                direct_url,
            )
            return direct_url

        # logger.warning(
        #     "No direct retailer URL found for: %s",
        #     item.get("title"),
        # )

    except Exception as e:
        logger.warning(
            "Could not resolve direct URL for %s: %s",
            item.get("title"),
            e,
        )

    # Safe fallback.
    return item.get("link", "")


def extract_store_url(
    result: dict,
    original_source: str = "",
) -> str:
    """
    Extract the actual retailer URL from a Google Immersive Product
    response.

    The response structure can differ between products, so this
    searches several common locations recursively.
    """

    original_source = original_source.lower().strip()

    # ---------------------------------------------------------
    # First: look for stores/offers directly.
    # ---------------------------------------------------------

    possible_store_lists = [
        result.get("stores"),
        result.get("offers"),
        result.get("online_sellers"),
        result.get("seller_results"),
    ]

    for stores in possible_store_lists:
        if isinstance(stores, list):
            url = find_best_store_url(
                stores,
                original_source,
            )

            if url:
                return url

    # ---------------------------------------------------------
    # Second: recursively search the complete response.
    # ---------------------------------------------------------

    candidates = []

    collect_url_candidates(
        result,
        candidates,
        original_source,
    )

    # Prefer the original retailer.
    if original_source:
        for candidate in candidates:
            store_name = candidate["store"].lower()

            if (
                original_source in store_name
                or store_name in original_source
            ):
                return candidate["url"]

    # Otherwise use the first retailer URL.
    if candidates:
        return candidates[0]["url"]

    return ""


def find_best_store_url(
    stores: list,
    original_source: str = "",
) -> str:
    """
    Find the best direct URL from a list of retailer offers.
    """

    candidates = []

    for store in stores:
        if not isinstance(store, dict):
            continue

        url = get_url_from_dict(store)

        if not url:
            continue

        store_name = get_store_name(store)

        candidates.append(
            {
                "url": url,
                "store": store_name,
            }
        )

    if not candidates:
        return ""

    # Prefer the retailer Google Shopping originally reported.
    if original_source:
        for candidate in candidates:
            store_name = candidate["store"].lower()

            if (
                original_source in store_name
                or store_name in original_source
            ):
                return candidate["url"]

    return candidates[0]["url"]


def get_url_from_dict(data: dict) -> str:
    """
    Extract a URL from a retailer/store dictionary.
    """

    # Most likely fields first.
    url_fields = [
        "link",
        "url",
        "product_link",
        "merchant_link",
        "offer_link",
        "direct_link",
        "product_url",
        "merchant_url",
    ]

    for field in url_fields:
        value = data.get(field)

        if isinstance(value, str) and value.startswith("http"):
            if not is_google_url(value):
                return value

    # Sometimes URL information is nested.
    nested_fields = [
        "merchant",
        "seller",
        "store",
        "offer",
        "product",
    ]

    for field in nested_fields:
        nested = data.get(field)

        if isinstance(nested, dict):
            url = get_url_from_dict(nested)

            if url:
                return url

    return ""


def get_store_name(data: dict) -> str:
    """
    Extract retailer/store name from a store dictionary.
    """

    fields = [
        "name",
        "store",
        "merchant",
        "seller",
        "source",
        "retailer",
        "merchant_name",
        "store_name",
    ]

    for field in fields:
        value = data.get(field)

        if isinstance(value, str) and value.strip():
            return value.strip()

        if isinstance(value, dict):
            nested_name = get_store_name(value)

            if nested_name:
                return nested_name

    return ""


def collect_url_candidates(
    value,
    candidates: list,
    original_source: str = "",
):
    """
    Recursively search an arbitrary SerpAPI response for retailer URLs.
    """

    if isinstance(value, dict):

        # Check whether this dictionary itself looks like a store.
        url = get_url_from_dict(value)

        if url:
            store_name = get_store_name(value)

            candidates.append(
                {
                    "url": url,
                    "store": store_name,
                }
            )

        for nested_value in value.values():
            collect_url_candidates(
                nested_value,
                candidates,
                original_source,
            )

    elif isinstance(value, list):

        for item in value:
            collect_url_candidates(
                item,
                candidates,
                original_source,
            )


def is_google_url(url: str) -> bool:
    """
    Return True if the URL is still a Google/SerpAPI URL.
    """

    url = url.lower()

    blocked_domains = [
        "google.com",
        "google.co.in",
        "serpapi.com",
    ]

    return any(
        domain in url
        for domain in blocked_domains
    )