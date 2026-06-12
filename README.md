# GitHub Repository Insights

A fullstack repository analytics dashboard for exploring GitHub projects, technical health, API usage and repository risk.

**Live demo:** https://git-hub-repository-insights-dashboa.vercel.app/  
**GitHub:** https://github.com/Adellaghmari/GitHub-Repository-Insights-Dashboard

## Overview

GitHub Repository Insights is built for reviewing public GitHub repositories in a more structured way. Instead of only looking at stars or the latest commit, the app brings together repository metadata, activity, language usage, issue signals, documentation quality and risk indicators in one dashboard.

The project is designed as a developer analytics tool. It uses live GitHub data through a backend API, stores saved analysis in PostgreSQL and presents the results in a clean technical interface. The goal is to show how I think about API integration, backend service layers, data modeling, caching, scoring logic and frontend presentation.

## What you can do

- Search public GitHub repositories through the GitHub REST API
- Open a repository report with health score, activity signals and risk labels
- Review language breakdowns and technical metadata
- Compare repositories side by side with a decision summary
- Save repository analysis when PostgreSQL is connected
- Monitor GitHub rate limits, backend health and cache status
- Use the Risk Center to identify stale, high risk or poorly maintained repositories
- See graceful fallback states when API limits or connection issues happen

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Recharts
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL with Neon
- **External API:** GitHub REST API
- **Deployment:** Vercel, Render, Neon

## How the app works

The frontend never calls GitHub directly. Search requests, repository reports and comparisons all go through the backend. The backend handles GitHub API calls, rate limit checks, health score calculation, caching and database persistence.

When a repository is analyzed, the backend collects live GitHub data, calculates a health score and returns a structured report to the frontend. If PostgreSQL is connected, the result can be saved and reused through the cache logic.

## Health scoring

Repositories are scored from 0 to 100 using signals such as:

- Recent activity
- Stars, forks and watchers
- Issue ratio and maintenance signals
- Documentation and license presence
- Topics, description and repository metadata
- Risk signals such as stale activity or missing license

**Labels:** Healthy, Stable, Needs Attention, High Risk

## Caching and persistence

When `DATABASE_URL` is configured, repository analysis can be stored in PostgreSQL. Cached results are reused when they are still fresh, which reduces unnecessary GitHub API calls and makes the app more stable during repeated demos.

Without a database, the app still works as a live GitHub analysis tool, but saved repositories and persistence features are limited.

## API and backend focus

The backend is intentionally separated from the frontend to keep external API logic in one place. This makes it easier to handle rate limits, protect API tokens, normalize GitHub responses and keep the frontend focused on presentation.

Important endpoints include:

- `GET /api/health`
- `GET /api/monitor`
- `GET /api/dashboard`
- `GET /api/search/repositories`
- `GET /api/repositories/:owner/:repo`
- `GET /api/repositories/:owner/:repo/insights`
- `POST /api/repositories/:owner/:repo/save`
- `POST /api/compare`
- `GET /api/risk-center`

## Local setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The backend runs on http://localhost:3001

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend runs on http://localhost:5173

## Environment variables

**Backend:**

- `PORT`
- `DATABASE_URL`
- `GITHUB_TOKEN`
- `FRONTEND_URL`
- `NODE_ENV`

**Frontend:**

- `VITE_API_URL`

For local development, `VITE_API_URL` should point to http://localhost:3001

For deployment, `VITE_API_URL` should point to the Render backend URL.

## Database setup

1. Create a PostgreSQL database in Neon.
2. Add the connection string as `DATABASE_URL`.
3. Run the database schema from `database/schema.sql`.
4. Start the backend and verify `/api/health`.

## Deployment

- Frontend is deployed on Vercel.
- Backend is deployed on Render.
- Database is hosted on Neon.

The production frontend uses `VITE_API_URL` to reach the Render backend.  
The backend uses `FRONTEND_URL` for CORS.  
`GITHUB_TOKEN` is optional but recommended for higher GitHub API rate limits.

Uptime monitoring can target the backend health endpoint at `/api/health`.

## Recruiter walkthrough

1. Start on Overview to understand what the tool does.
2. Search for react and open facebook/react.
3. Review the repository health score, language breakdown and risk signals.
4. Compare facebook/react with vercel/next.js.
5. Open API Monitor to see rate limits, database state and backend health.
6. Save a repository if PostgreSQL is connected.
7. Visit Risk Center to see how technical risk is surfaced.

## What this project demonstrates

- Fullstack architecture with a separate frontend and backend
- Live external API integration
- REST API design
- PostgreSQL persistence and caching
- Health scoring logic
- Rate limit handling
- Technical dashboard UI
- Error states and fallback handling
- Developer focused product thinking
