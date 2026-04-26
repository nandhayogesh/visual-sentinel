## Visual Sentinel

Visual Sentinel analyzes suspicious URLs using multiple threat intelligence checks and streams real-time progress to the UI.

### Tech Stack

- Frontend: React + Vite (`visual-sentinel/`)
- Backend API: Express (`visual-sentinel/server/`)
- Queue and job state: Redis + BullMQ
- Real-time transport: Server-Sent Events (`/api/stream/:jobId`)

## Required API Keys and Environment Variables

### Backend (`server/.env`)

Required:
- `URLSCAN_API_KEY`
- `VIRUSTOTAL_API_KEY`
- `SAFEBROWSING_API_KEY`

Optional:
- `PHISHTANK_APP_KEY` (service exists but is optional in default flow)

Infrastructure:
- `REDIS_URL` (recommended for production), or `REDIS_HOST` + `REDIS_PORT` + optional `REDIS_PASSWORD` and `REDIS_DB`

App settings:
- `PORT` (default `3001`)
- `CORS_ORIGIN` (default `http://localhost:8080`)
- `BODY_LIMIT` (default `32kb`)
- `RATE_LIMIT_WINDOW_MS` (default `900000`)
- `RATE_LIMIT_MAX` (default `60`)
- `WORKER_CONCURRENCY` (default `2`)

Template file: `server/.env.example`

### Frontend production env (`.env.production`)

- `VITE_API_URL` (public backend URL, example: `https://api.visual-sentinel.yourdomain.com`)

## Local Development (Simple Setup)

1. Install frontend dependencies:
   - `npm install`
2. Install backend dependencies:
   - `cd server && npm install`
3. Start Redis (local Docker example):
   - `docker run --name visual-sentinel-redis -p 6379:6379 -d redis:7`
4. Configure backend env:
   - Copy `server/.env.example` to `server/.env`
   - Fill required API keys and Redis settings
5. Run backend API:
   - `cd server && npm run dev`
6. Run worker:
   - `cd server && npm run worker`
7. Run frontend:
   - `npm run dev`

Frontend runs on `http://localhost:8080`, backend on `http://localhost:3001`.

## Real-Time Flow (Current)

1. Frontend submits URL to `POST /api/analyze`
2. API creates durable job in Redis and enqueues task
3. Worker processes analyzer pipeline and writes progress to Redis
4. Frontend listens to `GET /api/stream/:jobId` for live updates
5. Fallback polling uses `GET /api/status/:jobId`

## Production Deployment Checklist

- Deploy three components:
  - Frontend static app
  - Backend API service
  - Backend worker service
- Provision managed Redis and set `REDIS_URL`
- Add required API keys only to backend secret manager
- Set frontend `VITE_API_URL` to backend public URL
- Restrict `CORS_ORIGIN` to frontend domain
- Keep `server/.env` out of commits and rotate exposed keys if leaked

## One-URL Smoke Test

1. Check backend health:
   - `GET /api/health`
   - Confirm `keys.urlscan`, `keys.virustotal`, `keys.safebrowsing` are `true`
   - Confirm `infrastructure.jobsStore.ok` and `infrastructure.queue.ok` are `true`
2. Submit analysis:
   - `POST /api/analyze` with `{ "url": "github.com" }`
   - Save returned `jobId`
3. Verify stream:
   - Open `GET /api/stream/:jobId`
   - Expect `snapshot`, multiple `progress`, and final `complete` events
4. Verify status endpoint:
   - `GET /api/status/:jobId`
   - Expect final analysis result once complete

