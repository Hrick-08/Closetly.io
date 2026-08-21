"""
Closetly Microservice — Search router.

POST /search  →  search the web for clothing products.
  - Send a text query  →  searches Google Shopping directly.
  - Upload an image   →  LLM describes the image, then searches with that description.
  - Send both         →  image description is used (query is ignored).
"""

import asyncio
from functools import partial
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.schemas import SearchResponse, ShopProduct
from app.services.serpapi_service import search_products
from app.services.llm_service import describe_image
from app.config import settings

router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search(
    query: Optional[str] = Form(default=None),
    num_results: int = Form(default=10, ge=1, le=50),
    image: Optional[UploadFile] = File(default=None),
):
    """
    Search the web for clothing products.

    - **Text search**: send `query` form field with a cloth name/description.
    - **Image search**: upload an `image` — the LLM describes it, then
      searches Google Shopping with that description.
    - If both are provided, the image description is used.
    """
    if not settings.serpapi_key:
        raise HTTPException(
            status_code=503,
            detail="Search is unavailable — SERPAPI_KEY not configured.",
        )

    search_query = None

    # ── Image path: describe the image first ────────────────────
    if image is not None:
        if not settings.groq_api_key:
            raise HTTPException(
                status_code=503,
                detail="Image search is unavailable — GROQ_API_KEY not configured.",
            )

        image_bytes = await image.read()
        media_type = image.content_type or "image/jpeg"

        loop = asyncio.get_running_loop()
        search_query = await loop.run_in_executor(
            None,
            partial(describe_image, image_bytes=image_bytes, media_type=media_type),
        )

    # ── Text path ───────────────────────────────────────────────
    elif query:
        search_query = query

    if not search_query:
        raise HTTPException(
            status_code=400,
            detail="Provide either a 'query' text or upload an 'image'.",
        )

    # ── Search Google Shopping ──────────────────────────────────
    loop = asyncio.get_running_loop()
    raw_results = await loop.run_in_executor(
        None,
        partial(search_products, query=search_query, num_results=num_results),
    )

    results = [ShopProduct(**item) for item in raw_results]

    return SearchResponse(
        query=search_query,
        results=results,
        total=len(results),
    )
