## Closetly Microservice

FastAPI service powering clothing classification and product search,
using **Groq (Qwen vision)** for image analysis and **SerpAPI
(Google Shopping)** for buyable product results.

## Start the Service

```bash
cd microservice
```
```bash
python -m venv .venv
```

```bash
.venv\Scripts\activate
```

```bash
pip install -r requirements.txt
```

```bash
uvicorn app.main:app --reload
```

The service runs on `http://localhost:8000`. The frontend Search page
(`frontend/pages/search.html`) calls it directly — API keys stay in
`microservice/.env`, never in frontend JavaScript.

The personal stylist also requires a reachable MongoDB instance. With the
default configuration, start MongoDB locally on `localhost:27017`, or set
`MONGODB_URI` to your MongoDB/Atlas connection string. If MongoDB is
unreachable, `/chat` returns HTTP 503 instead of an unhandled server error.

## Environment Variables (`.env`)

| Variable | Purpose |
|---|---|
| `SERPAPI_KEY` | SerpAPI key — https://serpapi.com/ |
| `GROQ_API_KEY` | Groq key (vision model) — https://console.groq.com/keys |
| `CORS_ORIGINS` | Optional JSON list of allowed origins |
| `MONGODB_URI` | MongoDB connection string used for personal wardrobe retrieval |
| `MONGODB_DATABASE` | MongoDB database name (default: `test`, matching the backend URI) |
| `OPENAI_API_KEY` | Optional key for `text-embedding-3-small` wardrobe embeddings |
| `EMBEDDING_MODEL` | Embedding model (default: `text-embedding-3-small`) |

## Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Service status + which keys are configured |
| POST | `/classify` | Classify an image into one of 8 category groups |
| POST | `/search` | Text and/or image → Google Shopping products |
| POST | `/chat` | Authenticated personal stylist response |

### Personal stylist retrieval

The Node backend authenticates `/api/microservice/chat` and forwards the
authenticated user ID in `X-Closetly-User-Id`. FastAPI uses that ID in every
wardrobe query. The LLM receives only safe wardrobe metadata; it never
receives passwords, refresh tokens, API keys, or image payloads.

MongoDB Atlas Vector Search index for `wardrobeitems`:

```json
{
  "name": "wardrobe_embedding",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      { "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" },
      { "type": "filter", "path": "user" }
    ]
  }
}
```

The dimension is for `text-embedding-3-small`. If the model changes, update
`EMBEDDING_DIMENSIONS`, recreate the index, and rerun
`python -m app.embed_wardrobe`.

### POST /search

The one endpoint the Search page needs.

**Request** (`multipart/form-data`):

- `query` (text, optional) — e.g. `"black oversized hoodie"`
- `image` (file, optional) — JPG/PNG/WEBP; the LLM describes it,
  then that description is searched on Google Shopping
- `num_results` (int, optional) — 1–50, default 10

Send `query`, `image`, or both (image wins).

**Response:**

```json
{
  "query": "black oversized hoodie",
  "results": [
    {
      "title": "Veirdo Men Plain Oversized Fit Hoodie",
      "link": "https://…",
      "thumbnail": "https://…",
      "price": "699",
      "old_price": "",
      "source": "Myntra",
      "rating": 4.2,
      "reviews": 315,
      "delivery": "",
      "tag": "",
      "position": 1
    }
  ],
  "total": 10
}
```
