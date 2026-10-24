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
    assistant_model: str = "openai/gpt-oss-120b"
    mongodb_uri: str = ""
    # The backend's Atlas URI does not include a database path, so MongoDB
    # uses its default database name: "test".
    mongodb_database: str = "test"
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    internal_user_header: str = "X-Closetly-User-Id"

    # ── CORS ────────────────────────────────────────────────
    cors_origins: list[str] = ["*"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()