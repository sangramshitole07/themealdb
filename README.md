# TheMealDB Explorer

> Full-stack project: lightweight Web Service API + Responsive Frontend

This repository contains **TheMealDB Explorer** — a small web application that consumes TheMealDB public API and provides a simplified, cached backend plus a responsive frontend UI for searching, browsing, and viewing meal recipes.

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Environment variables](#environment-variables)
5. [Installation](#installation)

   * [Backend (local)](#backend-local)
   * [Frontend (local)](#frontend-local)
6. [Available API endpoints](#available-api-endpoints)
7. [Caching behavior](#caching-behavior)
8. [Running with Redis (optional)](#running-with-redis-optional)
9. [Deployment notes](#deployment-notes)
10. [Troubleshooting](#troubleshooting)
11. [Testing the app](#testing-the-app)
12. [Project structure & extensibility notes](#project-structure--extensibility-notes)
13. [License](#license)

---

## Features

* Backend proxy that simplifies and standardizes TheMealDB endpoints
* Endpoints: search, categories, meals-by-category, random meal, meal detail, cache stats
* **Caching** (in-memory by default; optional Redis) with configurable TTL and max size
* Frontend: Search bar, Category browser, Random meal button, Recipe detail view (ingredients, steps, YouTube embed)
* Responsive UI (mobile + desktop)
* Clear error handling and diagnostic logs

---

## Architecture

* **Backend**: Node.js + TypeScript (Express) or Supabase Edge Function (project contains both patterns). Backend is a single proxy service that calls TheMealDB (`https://www.themealdb.com/api/json/v1/1`) with the public test key `1` and caches responses.
* **Cache**: In-memory LRU cache by default (TTL: 30 minutes, max entries: 1000). Optionally can use Redis.
* **Frontend**: Vite + React (TypeScript) for fast local development and modern UI.

---

## Prerequisites

* Node.js >= 18 (recommended)
* npm or yarn
* (Optional) Redis server if you want Redis-backed caching

---

## Environment variables

Create a `.env` file in the project root(s) for backend and frontend as shown below.

**Backend `.env`**

```
# Backend
PORT=4000
MEALDB_BASE_URL=https://www.themealdb.com/api/json/v1/1
MEALDB_API_KEY=1               # test key provided by TheMealDB
CACHE_TTL_SECONDS=1800         # 30 minutes
CACHE_MAX_ENTRIES=1000
USE_REDIS=false                # true to use Redis
REDIS_URL=redis://localhost:6379
```

**Frontend `.env` (Vite)**

```
VITE_API_BASE=http://localhost:4000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

> **Important:** In earlier iterations the API URL was incorrectly set to `https://www.themealdb.com/api.php`. The correct base for JSON endpoints is `https://www.themealdb.com/api/json/v1/1` — make sure this is set in `MEALDB_BASE_URL`.

---

## Installation

> The repository is split into `backend/` and `frontend/` directories. Run both locally for full functionality.

### Backend (local)

```bash
cd backend
# Install dependencies
npm install

# Development (hot reload)
npm run dev

# Build (production)
npm run build
npm start
```

* Backend default port: `4000` (controlled by `PORT` env var)
* The backend exposes the simplified REST endpoints documented below

### Frontend (local)

```bash
cd frontend
npm install
npm run dev
```

* Vite dev server default port is `5173` (check console). If `VITE_API_BASE` points to the backend (e.g. `http://localhost:4000`), the frontend will call the local API.

---

## Available API endpoints (backend)

> All endpoints follow RESTful practices and return JSON. The backend will forward requests to TheMealDB and cache responses.

* `GET /search?q=<query>`

  * Search meals by name. Example: `/search?q=Arrabiata`

* `GET /categories`

  * Returns the list of meal categories.

* `GET /category?name=<categoryName>`

  * Returns meals in the requested category. Example: `/category?name=Seafood`

* `GET /random`

  * Returns a random meal

* `GET /detail?id=<mealId>`

  * Returns full details (ingredients, instructions, source, YouTube) for a mealId

* `GET /stats`

  * Returns cache stats (hits, misses, current size, configured TTL, max entries). Useful for diagnostics.

### Example `curl` calls

```bash
curl "http://localhost:4000/search?q=chicken"
curl "http://localhost:4000/categories"
curl "http://localhost:4000/category?name=Chicken"
curl "http://localhost:4000/random"
curl "http://localhost:4000/detail?id=52772"
curl "http://localhost:4000/stats"
```

---

## Caching behavior

* **Default**: In-memory LRU with `CACHE_TTL_SECONDS` (default 1800s / 30 minutes) and `CACHE_MAX_ENTRIES` (default 1000)
* Keys are derived from the request path + querystring (e.g. `/search?q=Arrabiata`)
* When `USE_REDIS=true`, the backend uses Redis (single-instance) for caching. Redis TTL mirrors `CACHE_TTL_SECONDS` and eviction is controlled by Redis (`maxmemory` / `volatile-lru` etc.)
* `/stats` endpoint exposes `hits`, `misses`, and `currentEntries` for monitoring

---

## Running with Redis (optional)

1. Start a Redis server locally (or provide a cloud Redis URL):

```bash
# macOS (Homebrew)
brew install redis
brew services start redis

# or using Docker
docker run -p 6379:6379 --name local-redis -d redis
```

2. Set `USE_REDIS=true` and `REDIS_URL=redis://localhost:6379` in backend `.env` and restart the backend.

The backend will automatically connect to Redis and use it for cached responses.

---

## Deployment notes

* **Edge Functions / Supabase Functions**: The project contains a Supabase Edge Function (`supabase/functions/meal-api/index.ts`) if you prefer to run the API as an edge function. When using an Edge Function, ensure `MEALDB_BASE_URL` is set to `https://www.themealdb.com/api/json/v1/1` and that the function environment permits outbound HTTPS requests.

* **Bolt / Hosting**: If publishing to Bolt (or similar), ensure environment variables (Redis, API base) are set in the platform's configuration UI. When deploying to a platform that uses a different base URL for the backend, update `VITE_API_BASE` in the frontend build environment.

---

## Troubleshooting

**Frontend not loading / blank page**

* Confirm frontend dev server is running (`npm run dev`) and check the terminal for the port.
* Open browser console (F12 → Console) and check for network errors when calling `/categories` or `/search`.

**API returning 404 or 502**

* Ensure backend is running on the configured `PORT` and `VITE_API_BASE` points to the backend.
* Confirm `MEALDB_BASE_URL` is `https://www.themealdb.com/api/json/v1/1` (not `.php`).

**Cache not working / stats show zero hits**

* Confirm `CACHE_TTL_SECONDS` and `CACHE_MAX_ENTRIES` are set correctly.
* If using Redis, verify connection string and that Redis is reachable. Check backend logs for connection errors.

**YouTube embed not showing video**

* TheMealDB provides `strYoutube` which is a YouTube URL. We extract the `v` parameter and embed using an `<iframe>`. If the value is empty, the recipe has no linked video.

**CORS issues**

* If the frontend is served from a different origin than the backend, ensure the backend sets appropriate `Access-Control-Allow-Origin` headers (development allows all origins by default).

---

## Testing the app

* Manual: Use the UI to search meals, browse categories, open meal details and press the `"I'm Feeling Hungry"` button.
* Automated: Add simple integration tests that hit the backend endpoints and assert JSON shape. (Suggested: Jest + Supertest for backend.)

---

## Project structure & extensibility notes

A suggested structure (match to the repository you have):

```
/backend
  /src
    server.ts         # Express or edge function handler
    cache.ts          # LRU / Redis cache abstraction
    controllers/      # handlers for each endpoint
    services/         # mealdb client wrapper (handles base URL & key)
/frontend
  /src
    App.tsx
    components/       # Search, CategoryList, MealCard, MealDetail
    services/         # api.ts (talks to local backend)
    styles/           # CSS / Tailwind config
```

**Extensibility ideas**

* Add paginated category listing
* Add user favorites stored in localStorage or backend
* Add offline mode using service workers
* Add analytics for cache performance over time

---

## License

MIT — feel free to reuse and extend.

---

## Contact / Next steps

If you want, I can:

* Generate `docker-compose` to run backend + Redis + frontend locally
* Produce integration tests for the API
* Convert the backend into a full Supabase Edge Function deployable bundle

---
— happy cooking!*
