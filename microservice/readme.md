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

## Environment Variables (`.env`)

| Variable | Purpose |
|---|---|
| `SERPAPI_KEY` | SerpAPI key — https://serpapi.com/ |
| `GROQ_API_KEY` | Groq key (vision model) — https://console.groq.com/keys |
| `CORS_ORIGINS` | Optional JSON list of allowed origins |

## Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Service status + which keys are configured |
| POST | `/classify` | Classify an image into one of 8 category groups |
| POST | `/search` | Text and/or image → Google Shopping products |

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
