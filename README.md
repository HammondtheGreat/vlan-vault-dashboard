# Warp9Net IPAM

A self-hosted IP Address Management tool built with React + Express + MySQL.

## Architecture

```
Nginx (port 4242) → React SPA
    └─ /api/*     → Express API (port 3001)
    └─ /uploads/* → Express static files
MySQL (port 3306) → Data storage
```

## Quick Start (Docker)

```bash
cp deploy/.env.example .env
# Edit .env with your passwords and JWT secret
docker compose up -d
```

Default login: `admin@warp9studios.com` / `admin123`

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, JWT auth
- **Database:** MySQL 8.0
- **Deployment:** Docker Compose, Portainer-friendly

See [deploy/DEPLOY.md](deploy/DEPLOY.md) for full deployment instructions.
