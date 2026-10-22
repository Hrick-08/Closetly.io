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

[![HTML](https://img.shields.io/badge/HTML-Frontend-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS-Styling-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-ML_Service-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Groq](https://img.shields.io/badge/Groq-Qwen_LLM-F55036?style=flat-square)](https://groq.com)
[![SerpAPI](https://img.shields.io/badge/SerpAPI-Product_Search-4285F4?style=flat-square)](https://serpapi.com)

</div>

---



## Overview

Closetly is a fashion platform that lets you catalog your wardrobe, classify clothing images, search for products by text or image, and chat with an AI fashion assistant.

Built as a full-stack JavaScript and Python semester project.

---

## Features

- **Closet Cataloging** — Upload photos of your clothes; items are classified into clothing categories using Qwen vision through Groq.
- **Product Search** — Search for clothing by text or image and find buyable matches from Google Shopping through SerpAPI.
- **AI Fashion Assistant** — Chat with an AI assistant powered by the connected microservice.

---

## Tech Stack

**Frontend**
- HTML5
- CSS3
- Vanilla JavaScript

**Backend**
- Node.js 18+ + Express (authentication, wardrobe CRUD, validation, and microservice proxy)
- Mongoose for MongoDB data access
- JWT and bcryptjs for authentication and password hashing
- Multer for image uploads
- Helmet, CORS, and express-rate-limit for API security

**Database & Image Storage**
- MongoDB (users, wardrobe items, and image metadata)
- Base64 image data URLs stored in MongoDB

**ML / AI**
- FastAPI Python microservice
- Groq API with the Qwen vision model for clothing classification and image descriptions
- SerpAPI Google Shopping for product search
- OpenAI Python SDK as the OpenAI-compatible client for Groq

---

## Architecture

```
HTML/CSS/JS Client ──▶ Node/Express API ──▶ MongoDB
                              │
                              ▼
                    Python FastAPI Microservice
                       │                 │
                       ▼                 ▼
                 Groq / Qwen          SerpAPI
```

The Node API handles authentication, wardrobe CRUD, uploads, and proxying. The Python service handles clothing classification, image descriptions, and product search.

---

## Project Structure

```
closetly/
├── frontend/            # HTML, CSS, and vanilla JavaScript frontend
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
- SerpAPI key
- Groq API key

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
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend (HTML/CSS/JavaScript)
```bash
cd frontend
python -m http.server 3000
```

### Environment Variables

Each service needs its own `.env`. Key variables for `backend/.env`:

```
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
MICROSERVICE_URL=http://localhost:8000
```

Key variables for `microservice/.env`:

```
SERPAPI_KEY=
GROQ_API_KEY=
CORS_ORIGINS=["http://localhost:3000"]
```

---

## API Overview

**Node/Express**
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/wardrobe/items` | List wardrobe items |
| POST | `/api/wardrobe/items/upload` | Upload a wardrobe item |
| DELETE | `/api/wardrobe/items/:id` | Remove a wardrobe item |
| POST | `/api/microservice/search` | Search products by text |
| POST | `/api/microservice/search/image` | Search products by image |
| POST | `/api/microservice/classify` | Classify a clothing image |
| POST | `/api/microservice/chat` | Message the AI assistant |

**Python/FastAPI**
| Method | Route | Description |
|---|---|---|
| GET | `/health` | Service status |
| POST | `/classify` | Classify a clothing image into 8 categories |
| POST | `/search` | Text **or image** → Google Shopping products |

---

## Roadmap

- [x] Closet upload + AI classification
- [x] Product search from text or images
- [x] AI fashion assistant
- [ ] Virtual try-on (stretch goal)
- [ ] Weather-aware outfit suggestions (stretch goal)
- [ ] Social features — share outfits, follow closets (stretch goal)

---
