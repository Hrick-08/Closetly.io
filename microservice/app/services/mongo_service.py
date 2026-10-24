"""MongoDB access for the personal stylist.

MongoDB remains the source of truth. This module deliberately returns only
safe wardrobe fields and never exposes user credentials or image payloads.
"""

from __future__ import annotations

from functools import lru_cache
import re
from typing import Any

from bson import ObjectId
from pymongo import MongoClient

from app.config import settings


@lru_cache(maxsize=1)
def _client() -> MongoClient:
    return MongoClient(settings.mongodb_uri, serverSelectionTimeoutMS=3000)


def _database():
    return _client()[settings.mongodb_database]


def _user_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise ValueError("Invalid authenticated user id")
    return ObjectId(value)


def get_user_preferences(user_id: str) -> dict[str, Any]:
    user = _database().users.find_one(
        {"_id": _user_id(user_id)},
        {"_id": 0, "preferences": 1},
    )
    return (user or {}).get("preferences") or {}


def get_wardrobe_items(
    user_id: str,
    *,
    query: str = "",
    categories: list[str] | None = None,
    limit: int = 80,
) -> list[dict[str, Any]]:
    filters: dict[str, Any] = {"user": _user_id(user_id)}
    if categories:
        filters["category"] = {"$in": categories}
    if query:
        terms = [term for term in re.findall(r"[A-Za-z0-9]+", query.lower()) if len(term) >= 3]
        if terms:
            filters["$or"] = [
                {field: re.compile(re.escape(term), re.IGNORECASE)}
                for term in terms
                for field in (
                    "name",
                    "category",
                    "tags",
                    "brand",
                    "season",
                    "notes",
                    "color.primary",
                    "color.secondary",
                )
            ]

    projection = {
        "_id": 1,
        "name": 1,
        "category": 1,
        "tags": 1,
        "color": 1,
        "brand": 1,
        "season": 1,
        "wearCount": 1,
        "lastWorn": 1,
        "notes": 1,
    }
    return list(
        _database().wardrobeitems.find(filters, projection)
        .sort([("wearCount", 1), ("createdAt", -1)])
        .limit(limit)
    )


def vector_search(
    user_id: str,
    embedding: list[float],
    *,
    limit: int = 40,
) -> list[dict[str, Any]]:
    pipeline = [
        {
            "$vectorSearch": {
                "index": "wardrobe_embedding",
                "path": "embedding",
                "queryVector": embedding,
                "numCandidates": max(limit * 10, 100),
                "limit": limit,
                "filter": {"user": _user_id(user_id)},
            }
        },
        {"$addFields": {"retrievalScore": {"$meta": "vectorSearchScore"}}},
        {
            "$project": {
                "_id": 1,
                "name": 1,
                "category": 1,
                "tags": 1,
                "color": 1,
                "brand": 1,
                "season": 1,
                "wearCount": 1,
                "lastWorn": 1,
                "notes": 1,
                "retrievalScore": 1,
            }
        },
    ]
    return list(_database().wardrobeitems.aggregate(pipeline))
