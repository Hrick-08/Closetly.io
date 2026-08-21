"""
Closetly Microservice — Pydantic schemas for request / response models.
"""

from pydantic import BaseModel, Field


# ── Classify ────────────────────────────────────────────────────

class ClassifyResponse(BaseModel):
    """Response from POST /classify."""
    category: str = Field(..., description="One of the 8 clothing categories")
    confidence: str = Field(default="medium", description="high, medium, or low")
    reasoning: str = Field(default="", description="Why this category was chosen")


# ── Search Response ─────────────────────────────────────────────

class ShopProduct(BaseModel):
    """A single product result from web search."""
    title: str
    link: str = ""
    thumbnail: str = ""
    price: str = ""
    old_price: str = ""
    source: str = ""
    rating: float | None = None
    reviews: int | None = None
    delivery: str = ""
    tag: str = ""
    position: int = 0


class SearchResponse(BaseModel):
    """Response from POST /search."""
    query: str
    results: list[ShopProduct]
    total: int
