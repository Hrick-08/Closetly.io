"""Optional embedding provider used by MongoDB Atlas Vector Search."""

from __future__ import annotations

from openai import OpenAI

from app.config import settings

_client: OpenAI | None = None


def embed(text: str) -> list[float] | None:
    global _client
    if not settings.openai_api_key:
        return None
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    response = _client.embeddings.create(
        model=settings.embedding_model,
        input=text,
        dimensions=settings.embedding_dimensions,
    )
    return response.data[0].embedding
