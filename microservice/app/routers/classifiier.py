"""
Closetly Microservice — Classifier router.

POST /classify  →  classify a clothing image into one of 8 categories.
"""

import asyncio
from functools import partial

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.schemas import ClassifyResponse
from app.services.llm_service import classify_image
from app.config import settings

router = APIRouter(tags=["classifier"])


@router.post("/classify", response_model=ClassifyResponse)
async def classify(image: UploadFile = File(...)):
    """
    Classify a clothing image into one of 8 categories:
    Tops, Bottoms, Outerwear, Dresses/Jumpsuits, Footwear,
    Accessories, Ethnic/Traditional Wear, Activewear.
    """
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=503,
            detail="Classifier is unavailable — GROQ_API_KEY not configured.",
        )

    # Read the uploaded image
    image_bytes = await image.read()
    media_type = image.content_type or "image/jpeg"

    # Run the synchronous LLM call in a thread
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        partial(classify_image, image_bytes=image_bytes, media_type=media_type),
    )

    return ClassifyResponse(**result)
