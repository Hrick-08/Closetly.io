"""Backfill/update wardrobe embeddings.

Run this job after importing wardrobe data and whenever descriptive wardrobe
fields change. It never reads or sends images, credentials, or refresh tokens.
"""

from __future__ import annotations

from openai import OpenAI
from pymongo import MongoClient

from app.config import settings


def item_text(item: dict) -> str:
    color = item.get("color") or {}
    return " ".join(
        str(value)
        for value in (
            item.get("name"),
            item.get("category"),
            " ".join(item.get("tags") or []),
            color.get("primary"),
            color.get("secondary"),
            item.get("brand"),
            item.get("season"),
            item.get("notes"),
        )
        if value
    )


def main() -> None:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required")
    client = OpenAI(api_key=settings.openai_api_key)
    mongo = MongoClient(settings.mongodb_uri)
    collection = mongo[settings.mongodb_database].wardrobeitems

    projection = {
        "_id": 1,
        "name": 1,
        "category": 1,
        "tags": 1,
        "color": 1,
        "brand": 1,
        "season": 1,
        "notes": 1,
    }
    for source in collection.find({}, projection):
        response = client.embeddings.create(
            model=settings.embedding_model,
            input=item_text(source),
            dimensions=settings.embedding_dimensions,
        )
        collection.update_one(
            {"_id": source["_id"]},
            {"$set": {"embedding": response.data[0].embedding}},
        )


if __name__ == "__main__":
    main()
