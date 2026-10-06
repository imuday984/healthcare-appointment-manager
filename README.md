# Multi-Agentic RAG Customer Support System (Travel Demo)

## Project overview
This repository now includes a complete college-demo travel support platform with:
- FastAPI backend (deterministic workflow router + tools + approvals + SQLite)
- React + Vite + Tailwind frontend dashboard
- Qdrant-based semantic RAG pipeline
- Seeded mock travel data for reliable demonstration

## Architecture
User → Primary Assistant → Intent Classification → Specialized Agent (Flight/Hotel/Car/Excursion) → Tool/RAG → Safe/Sensitive Check → Human Approval (for sensitive) → SQLite transaction → Response

## Tech stack
- Backend: Python 3.11+, FastAPI, SQLAlchemy, SQLite
- AI: OpenAI API + embeddings (demo deterministic embedding fallback when API key absent)
- Vector DB: Qdrant (local embedded by default, remote URL supported)
- Frontend: React, Vite, Tailwind CSS

## Project structure
- `backend/app/` – API, agents, graph, tools, rag, database, schemas, services
- `backend/data/knowledge/` – policy and FAQ documents
- `backend/scripts/index_documents.py` – indexing script
- `frontend/src/` – dashboard and chat UI
- `tests/` – backend tests
- `requirements.txt` – Python dependencies
- `.env.example` – environment variables template

## Setup
1. Create and activate Python 3.11+ virtualenv
2. Install backend dependencies:
   - `pip install -r requirements.txt`
3. Install frontend dependencies:
   - `cd frontend && npm install`
4. Copy env:
   - `cp .env.example .env`

## Environment variables
Key values in `.env.example`:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `EMBEDDING_MODEL`
- `QDRANT_URL`, `QDRANT_API_KEY`, `QDRANT_COLLECTION`
- `DATABASE_URL`
- `DEMO_MODE`
- `CORS_ORIGINS`
- `VITE_API_URL`

## Qdrant setup
- Default demo mode uses local embedded Qdrant storage under `backend/data/qdrant_local`.
- To use hosted Qdrant, set `QDRANT_URL` and `QDRANT_API_KEY`.

## RAG indexing
- Run: `PYTHONPATH=backend python backend/scripts/index_documents.py`
- This loads markdown docs, chunks with `chunk_size=300`, `chunk_overlap=20`, embeds, and writes to Qdrant.

## Database setup
- SQLite is auto-initialized on backend startup.
- Demo data includes:
  - Bookings: `FL-1001`, `HT-2001`, `CAR-3001`
  - Mock flights/hotels/cars/excursions

## Run backend
- `PYTHONPATH=backend uvicorn app.main:app --reload --port 8000`
- Health: `GET http://localhost:8000/api/health`

## Run frontend
- `cd frontend && npm run dev`
- Open `http://localhost:5173`

## API endpoints
- `GET /api/health`
- `POST /api/chat`
- `GET /api/conversations`
- `GET /api/conversations/{id}`
- `GET /api/bookings`
- `GET /api/bookings/{id}`
- `GET /api/approvals`
- `POST /api/approvals/{id}/approve`
- `POST /api/approvals/{id}/reject`
- `GET /api/rag/status`
- `POST /api/rag/search`
- `GET /api/flights`
- `GET /api/hotels`
- `GET /api/cars`
- `GET /api/excursions`

## Demo scenarios
Try these prompts in AI Chat:
- Find flights from Chennai to Delhi
- Find hotels in Goa
- What is the cancellation policy?
- Cancel my flight FL-1001
- Change my flight FL-1001
- Plan a 5 day trip to Kerala
- Find a rental car in Mumbai

## Human-in-the-loop
Sensitive actions (book/update/cancel) create approval requests in SQLite and do not execute immediately. Approval/Rejection is enforced server-side before any transaction.

## Testing
- Run: `pytest`
- Covers routing, tool search, RAG retrieval, approval flow, transaction approval/rejection, ownership validation, and cancellation.

## Deployment
- Backend: deploy FastAPI service (set env vars securely)
- Frontend: deploy Vite build
- Use managed Qdrant + persistent DB for production

## Limitations
- Demo intent/entity extraction uses deterministic routing fallback for reliability.
- Hosted OpenAI responses are not required for local demo mode.
- Mock inventory and policy docs are intentionally curated for viva/demo clarity.
