"""
Closetly — FastAPI Microservice

Provides clothing image classification and web search for finding
clothing products, powered by Qwen 3.6 (Groq) and SerpAPI.
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import search, classifiier, response

# ── Logging ─────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-7s │ %(name)s │ %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan ────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Closetly microservice starting up")

    if not settings.serpapi_key:
        logger.warning("SERPAPI_KEY is not set — /search will return 503")
    else:
        logger.info("SerpAPI key configured ✓")

    if not settings.groq_api_key:
        logger.warning("GROQ_API_KEY is not set — /classify and image search will return 503")
    else:
        logger.info("Groq API key configured ✓")

    yield

    logger.info("Closetly microservice shutting down")


# ── App ─────────────────────────────────────────────────────────
app = FastAPI(
    title="Closetly Microservice",
    description="Classify clothing images and search for products.",
    version="0.2.0",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────
app.include_router(search.router)
app.include_router(classifiier.router)
app.include_router(response.router)


# ── Health check ────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "closetly-microservice",
        "search_available": bool(settings.serpapi_key),
        "classifier_available": bool(settings.groq_api_key),
    }
