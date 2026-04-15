# Warp9Net IPAM — Self-Hosted Deployment Guide

Deploy the IPAM stack (React frontend + Node API + MySQL) using Docker Compose in Portainer.

## Architecture

```
Internet → Nginx Proxy Manager (SSL :443)
    → ipam-frontend (:4242) — React app + reverse proxy to API
    → api (:3001) — Express REST API
    → db (:3306) — MySQL database
```

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
nano .env
```

Generate a JWT secret:
```bash
openssl rand -base64 32
```

### 2. Deploy in Portainer

1. In Portainer, go to **Stacks → Add stack**
2. Upload the project or paste `docker-compose.yml`
3. Add your `.env` variables
4. Click **Deploy the stack**

### 3. First Login

Navigate to your IPAM URL and log in with:
- **Email:** `admin@warp9studios.com`
- **Password:** `admin123`

> ⚠️ Change this password immediately after first login.

### 4. Configure Nginx Proxy Manager

| Field | Value |
|-------|-------|
| Domain | `ipam.yourdomain.com` |
| Scheme | `http` |
| Forward Host | `ipam-frontend` |
| Forward Port | `4242` |
| SSL | Request new certificate, Force SSL |

## File Structure

```
project/
├── docker-compose.yml      # 3-container stack
├── deploy/
│   ├── Dockerfile          # Multi-stage React build + Nginx
│   └── .env.example        # Environment template
├── server/
│   ├── Dockerfile          # Node API container
│   ├── index.js            # Express entry point
│   ├── init.sql            # MySQL schema + seed data
│   └── routes/             # REST endpoints
```

## Updating

```bash
docker compose build
docker compose up -d
```

## Backups

```bash
docker exec ipam-db mysqldump -u root -p ipam > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

- **Can't log in?** Verify the API container is running: `docker logs ipam-api`
- **Database errors?** Check MySQL started cleanly: `docker logs ipam-db`
- **Uploads missing?** Ensure the `uploads` volume is mounted correctly
