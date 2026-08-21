"""
Closetly Microservice — Configuration

Reads environment variables from .env via pydantic-settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings, loaded from environment / .env file."""

    # ── SerpAPI ─────────────────────────────────────────────
    serpapi_key: str = ""

    # ── Groq (Qwen 3.6 27B for vision) ─────────────────────
    groq_api_key: str = ""

    # ── CORS ────────────────────────────────────────────────
    cors_origins: list[str] = ["*"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
