"""Authenticated personal fashion stylist endpoint."""

import asyncio
import logging
from functools import partial

from fastapi import APIRouter, Header, HTTPException
from groq import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    GroqError,
    NotFoundError,
    RateLimitError,
)
from pymongo.errors import PyMongoError
from pydantic import BaseModel, Field, field_validator

from app.config import settings
from app.services.mongo_service import get_user_preferences
from app.services.stylist_service import generate_answer

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Assistant"])

VALID_ROLES = {"user", "assistant"}


class ChatMessage(BaseModel):
    role: str
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, value: str) -> str:
        if value not in VALID_ROLES:
            raise ValueError("role must be user or assistant")
        return value


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    preferences: dict = Field(default_factory=dict)


class OutfitItem(BaseModel):
    itemId: str
    role: str
    name: str
    category: str
    imageUrl: str | None = None


class Outfit(BaseModel):
    name: str
    items: list[OutfitItem]
    reason: str = ""
    stylingTips: list[str] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: str
    outfits: list[Outfit] = Field(default_factory=list)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    x_closetly_user_id: str | None = Header(default=None, alias=settings.internal_user_header),
) -> ChatResponse:
    if not x_closetly_user_id:
        raise HTTPException(status_code=401, detail="Authenticated user is required.")
    if not settings.groq_api_key:
        raise HTTPException(status_code=503, detail="Assistant is unavailable.")

    try:
        stored_preferences = await asyncio.to_thread(
            get_user_preferences, x_closetly_user_id
        )
        preferences = {**stored_preferences, **payload.preferences}
        answer = await asyncio.to_thread(
            generate_answer,
            payload.message,
            [turn.model_dump() for turn in payload.history],
            x_closetly_user_id,
            preferences,
        )
        return ChatResponse(**answer)
    except ValueError as error:
        raise HTTPException(status_code=401, detail=str(error)) from error
    except PyMongoError as error:
        logger.error("MongoDB unavailable for personal stylist: %s", error)
        raise HTTPException(
            status_code=503,
            detail="Personal stylist is unavailable because wardrobe storage cannot be reached.",
        ) from error
    except AuthenticationError as error:
        logger.error("Groq authentication failed in /chat: %s", error)
        raise HTTPException(status_code=500, detail="Assistant is misconfigured.") from error
    except NotFoundError as error:
        logger.error("Groq model unavailable in /chat: %s", error)
        raise HTTPException(status_code=500, detail="Assistant model is unavailable.") from error
    except RateLimitError as error:
        logger.warning("Groq rate limit hit in /chat: %s", error)
        raise HTTPException(status_code=429, detail="Assistant is rate-limited right now.") from error
    except BadRequestError as error:
        logger.error("Groq rejected /chat: %s", error)
        raise HTTPException(status_code=400, detail="Assistant rejected the request.") from error
    except (APIConnectionError, APITimeoutError) as error:
        logger.error("Could not reach Groq in /chat: %s", error)
        raise HTTPException(status_code=504, detail="Could not reach the assistant service.") from error
    except GroqError as error:
        logger.error("Groq request failed in /chat: %s", error)
        raise HTTPException(status_code=502, detail="Assistant request failed.") from error
