"""
Closetly Microservice - Assistant Router

Simple conversational endpoint that forwards user input to Groq's
chat completion API and returns the model's reply. Meant as a
lightweight in-app assistant (style tips, quick Q&A, etc.).
"""

import logging

from fastapi import APIRouter, HTTPException
from groq import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    Groq,
    GroqError,
    NotFoundError,
    RateLimitError,
)
from pydantic import BaseModel, Field, field_validator

from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Assistant"])

# Text model used for the assistant. The vision model (Qwen, via
# groq_api_key) is used elsewhere for image classification - this
# is a separate, text-only completion model.
ASSISTANT_MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = (
    "You are Closetly's in-app assistant. You help users with quick "
    "questions about fashion, styling, and using the app. Keep replies "
    "very short, friendly, and to the point. Do not use Markdown formatting "
    "like asterisks, bullet points, or headers - reply in plain text only."
)

VALID_ROLES = {"user", "assistant"}

# Client is created lazily so a missing API key doesn't crash startup -
# main.py already logs a warning for that case.
_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        if not settings.groq_api_key:
            raise HTTPException(
                status_code=503,
                detail="Assistant unavailable: GROQ_API_KEY is not configured.",
            )
        _client = Groq(api_key=settings.groq_api_key)
    return _client


# --- Schemas ------------------------------------------------------

class ChatMessage(BaseModel):
    """One turn of prior conversation, for optional multi-turn context."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError(f"role must be one of {sorted(VALID_ROLES)}, got '{v}'")
        return v


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="The user's latest message")
    history: list[ChatMessage] = Field(
        default_factory=list,
        description="Optional prior turns, oldest first, for context",
    )


class ChatResponse(BaseModel):
    response: str


# --- Route ----------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    """Send a user message (with optional history) to Groq and return the reply."""
    client = _get_client()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for turn in payload.history:
        messages.append({"role": turn.role, "content": turn.content})
    messages.append({"role": "user", "content": payload.message})

    try:
        completion = client.chat.completions.create(
            model=ASSISTANT_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=512,
        )

    except AuthenticationError as e:
        # Bad/revoked GROQ_API_KEY - a config problem, not the user's fault.
        logger.error("Groq authentication failed in /chat: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Assistant is misconfigured (authentication failed). Check GROQ_API_KEY.",
        ) from e

    except NotFoundError as e:
        # Usually means the model name is wrong or has been decommissioned.
        logger.error("Groq model not found in /chat (model=%s): %s", ASSISTANT_MODEL, e)
        raise HTTPException(
            status_code=500,
            detail=f"Assistant model '{ASSISTANT_MODEL}' is unavailable. It may have been deprecated.",
        ) from e

    except RateLimitError as e:
        # Free/developer tier limits hit.
        logger.warning("Groq rate limit hit in /chat: %s", e)
        raise HTTPException(
            status_code=429,
            detail="Assistant is rate-limited right now. Please try again in a moment.",
        ) from e

    except BadRequestError as e:
        # Malformed request to Groq (bad role, empty content, etc.).
        logger.error("Groq rejected the request in /chat: %s", e)
        raise HTTPException(
            status_code=400,
            detail="Assistant rejected the request - check the message/history format.",
        ) from e

    except (APIConnectionError, APITimeoutError) as e:
        # Network-level failure reaching Groq (no internet, DNS, timeout).
        logger.error("Could not reach Groq in /chat: %s", e)
        raise HTTPException(
            status_code=504,
            detail="Could not reach the assistant service. Check your internet connection.",
        ) from e

    except GroqError as e:
        # Catch-all for any other Groq SDK error not covered above.
        logger.error("Unhandled Groq API error in /chat: %s", e)
        raise HTTPException(status_code=502, detail="Assistant request failed.") from e

    reply = completion.choices[0].message.content or ""
    return ChatResponse(response=reply.strip())