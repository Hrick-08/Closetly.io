<div align="center">

```
 ██████╗██╗      ██████╗ ███████╗███████╗████████╗██╗  ██╗   ██╗
██╔════╝██║     ██╔═══██╗██╔════╝██╔════╝╚══██╔══╝██║  ╚██╗ ██╔╝
██║     ██║     ██║   ██║███████╗█████╗     ██║   ██║   ╚████╔╝ 
██║     ██║     ██║   ██║╚════██║██╔══╝     ██║   ██║    ╚██╔╝  
╚██████╗███████╗╚██████╔╝███████║███████╗   ██║   ███████╗██║   
 ╚═════╝╚══════╝ ╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝   
```

# Closetly
### The All-in-One Fashion App
*Catalog your closet, find your look, build your outfit — with an AI stylist that actually knows your wardrobe.*

[![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-ML_Service-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Qdrant](https://img.shields.io/badge/Qdrant-VectorDB-DC244C?style=flat-square)](https://qdrant.tech)
[![CLIP](https://img.shields.io/badge/CLIP-Embeddings-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/research/clip)
[![Tailwind](https://img.shields.io/badge/Tailwind-Styling-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---



## Overview

Closetly is a unified fashion platform that lets you catalog your closet, find matching pieces from reference images, shop for items you don't own, build and visualize outfits, and chat with an AI fashion agent grounded in your actual wardrobe.

Built as a Full Stack MERN + ML semester project.

---

## Features

- **Closet Cataloging** — Upload photos of your clothes; items are automatically tagged (category, color, pattern) using CLIP-based classification.
- **Visual Search** — Upload a reference/inspo image and find matching pieces already in your closet, powered by CLIP embeddings and vector similarity search.
- **Shop the Look** — For pieces you don't own, find buyable matches online from the same reference image, re-ranked by visual similarity.
- **Outfit Builder & Visualizer** — Drag-and-drop canvas to compose outfits from your closet, scored for compatibility.
- **RAG Fashion Agent** — Chat with an AI stylist that knows your closet, saved outfits, and general fashion knowledge.

---

## Tech Stack

**Frontend**
- React (Vite)
- Tailwind CSS
- `@dnd-kit` / `react-dnd` for the outfit canvas

**Backend**
- Node.js + Express (auth, CRUD, orchestration)
- Python + FastAPI (ML microservice: embeddings, search, scoring, RAG)

**Database & Storage**
- MongoDB (users, closet items, outfits, chat history)
- Qdrant (vector embeddings)
- Cloudinary / AWS S3 (image storage)

**ML / AI**
- CLIP (OpenCLIP) for image embeddings and zero-shot tagging
- SerpAPI for shop-the-look product search
- RAG pipeline + LLM API for the fashion chat agent

---

## Architecture

```
React Client ──▶ Node/Express API ──▶ MongoDB
                        │
                        ▼
              Python FastAPI (ML) ──▶ Qdrant (vectors)
                        │
                        ▼
                  LLM API (RAG agent)
```

Node handles auth, CRUD, and orchestration. Python handles all ML work (CLIP inference, vector search, product matching, RAG) and is called internally by the Node API.

---

## Project Structure

```
closetly/
├── frontend/            # React frontend
├── backend/            # Node/Express API
├── microservice/        # Python FastAPI microservice to search for the products and classify the clothes
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB instance (local or Atlas)
- Qdrant instance (local or cloud)
- SerpAPI key
- LLM API key (OpenAI/Gemini/etc.)

### 1. Clone the repo
```bash
git clone https://github.com/<your-org>/closetly.git
cd closetly
```

### 2. Backend (Node)
```bash
cd backend
npm install
cp .env.example .env   # fill in required values
npm run dev
```

### 3. Microservice (Python)
```bash
cd microservice
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Each service needs its own `.env`. Key variables for `server/.env`:

```
MONGO_URI=
JWT_SECRET=
CLOUDINARY_URL=
ML_SERVICE_URL=http://localhost:8000
```

Key variables for `microservice/.env`:

```
QDRANT_URL=
LLM_API_KEY=
SERPAPI_KEY=
```

---

## API Overview

**Node/Express**
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/closet` | List closet items |
| POST | `/api/closet` | Upload + auto-tag a closet item |
| DELETE | `/api/closet/:id` | Remove a closet item |
| POST | `/api/search/reference` | Visual search against closet |
| POST | `/api/shop/lookup` | Shop-the-look search |
| POST | `/api/outfits` | Save an outfit |
| GET | `/api/outfits` | List saved outfits |
| POST | `/api/chat` | Message the RAG fashion agent |

**Python/FastAPI**
| Method | Route | Description |
|---|---|---|
| POST | `/embed` | Generate CLIP embedding + suggested tags |
| POST | `/search` | Visual similarity search over closet |
| POST | `/shop-lookup` | Product search from a reference image |
| POST | `/score` | Outfit compatibility score |
| POST | `/rag` | RAG-based fashion advice |
| GET | `/health` | Service status |
| POST | `/classify` | Classify a clothing image into 8 categories |
| POST | `/search` | Text **or image** → Google Shopping products |

---

## Roadmap

- [ ] Closet upload + auto-tagging
- [ ] Visual search from reference images
- [ ] Shop-the-look web search
- [ ] Outfit builder + compatibility scoring
- [ ] RAG fashion agent
- [ ] Virtual try-on (stretch goal)
- [ ] Weather-aware outfit suggestions (stretch goal)
- [ ] Social features — share outfits, follow closets (stretch goal)

---
