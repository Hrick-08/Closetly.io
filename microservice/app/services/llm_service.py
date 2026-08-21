"""
Closetly Microservice — LLM service (Qwen 3.6 27B via Groq).

Provides image classification and description using the OpenAI-compatible
Groq API with the qwen/qwen3.6-27b vision model.
"""

import base64
import json
import logging
import re

from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)

# ── Categories ──────────────────────────────────────────────────
CATEGORIES = [
    "Tops",
    "Bottoms",
    "Outerwear",
    "Dresses/Jumpsuits",
    "Footwear",
    "Accessories",
    "Ethnic/Traditional Wear",
    "Activewear",
]

CATEGORY_DESCRIPTIONS = """
1. Tops — t-shirts, shirts, blouses, sweaters, hoodies
2. Bottoms — jeans, trousers, shorts, skirts
3. Outerwear — jackets, coats, blazers
4. Dresses/Jumpsuits — one-piece items
5. Footwear — sneakers, boots, sandals, formal shoes
6. Accessories — bags, belts, hats, scarves, jewelry
7. Ethnic/Traditional Wear — kurtas, sarees, lehengas, sherwanis, etc.
8. Activewear — gym/athletic wear, sports clothing
""".strip()

MODEL = "qwen/qwen3.6-27b"


def _get_client() -> OpenAI:
    """Create an OpenAI-compatible client pointed at Groq."""
    return OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=settings.groq_api_key,
    )


def _image_to_data_url(image_bytes: bytes, media_type: str = "image/jpeg") -> str:
    """Convert raw image bytes to a base64 data URL."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{media_type};base64,{b64}"


def _strip_think_tags(text: str) -> str:
    """Remove <think>...</think> blocks from model output."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


def _extract_json(text: str) -> dict | None:
    """Try to extract a JSON object from text that may contain extra content."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to find JSON object within the text
    match = re.search(r"\{[^{}]*\}", text, flags=re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    return None


# ── Classify ────────────────────────────────────────────────────

def classify_image(image_bytes: bytes, media_type: str = "image/jpeg") -> dict:
    """
    Classify a clothing image into one of the 8 categories.

    Returns:
        dict with 'category', 'confidence', and 'reasoning'.
    """
    client = _get_client()
    data_url = _image_to_data_url(image_bytes, media_type)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url},
                    },
                    {
                        "type": "text",
                        "text": (
                            "/no_think\n"
                            "You are a fashion item classifier. "
                            "Classify this clothing item into EXACTLY ONE of these 8 categories:\n\n"
                            f"{CATEGORY_DESCRIPTIONS}\n\n"
                            "Respond with ONLY a JSON object with these keys:\n"
                            '  "category": one of the 8 category names exactly as listed above,\n'
                            '  "confidence": "high", "medium", or "low",\n'
                            '  "reasoning": a one-sentence explanation.\n\n'
                            "No markdown, no code fences, no explanation outside the JSON."
                        ),
                    },
                ],
            },
        ],
        temperature=0.2,
        max_tokens=1024,
    )

    raw = response.choices[0].message.content.strip()
    logger.info("Classify raw response: %s", raw[:300])

    # Strip think tags and code fences
    raw = _strip_think_tags(raw)
    if raw.startswith("```"):
        raw = raw.strip("`").removeprefix("json").strip()

    # Parse JSON
    result = _extract_json(raw)
    if result is None:
        logger.warning("LLM returned unparseable response for classify: %s", raw)
        result = {
            "category": "Tops",
            "confidence": "low",
            "reasoning": raw[:200],
        }

    # Validate category is one of our 8
    if result.get("category") not in CATEGORIES:
        logger.warning("LLM returned unknown category: %s", result.get("category"))
        for cat in CATEGORIES:
            if cat.lower() in result.get("category", "").lower():
                result["category"] = cat
                break

    return result


# ── Describe ────────────────────────────────────────────────────

def describe_image(image_bytes: bytes, media_type: str = "image/jpeg") -> str:
    """
    Generate a concise text description of a clothing item in an image,
    suitable for use as a search query.

    Returns:
        A short description string (e.g. "navy blue slim-fit denim jacket for men").
    """
    client = _get_client()
    data_url = _image_to_data_url(image_bytes, media_type)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url},
                    },
                    {
                        "type": "text",
                        "text": (
                            "/no_think\n"
                            "You are a fashion search assistant. "
                            "Generate a SHORT, specific search query (max 10-12 words) that someone "
                            "would type into a shopping site to find this exact clothing item.\n\n"
                            "Focus on: type of garment, color, pattern, material, style, and gender if obvious.\n"
                            "Example outputs:\n"
                            '  "navy blue slim fit denim trucker jacket men"\n'
                            '  "red floral print maxi dress women"\n'
                            '  "white leather low-top sneakers unisex"\n\n'
                            "Respond with ONLY the search query text, nothing else."
                        ),
                    },
                ],
            },
        ],
        temperature=0.2,
        max_tokens=512,
    )

    description = response.choices[0].message.content.strip()
    logger.info("Describe raw response: %s", description[:200])
    description = _strip_think_tags(description)
    description = description.strip('"')
    return description
