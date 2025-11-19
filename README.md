# SmartDalali

This repository contains a Django backend (`/backend`) and a React + Vite frontend (`/frontend`).

## Local E2E with Docker Compose

Start both services locally for integration testing:

```bash
docker compose up --build
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173

The backend uses the console email backend in docker-compose. Activation emails will be printed to container logs.

## Frontend tests

Install dev dependencies and run tests:

```bash
cd frontend
npm install
npm run test
```

## Backend tests

See `backend/README.md` for test commands and CI details.
