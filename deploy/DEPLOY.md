# Warp9Net IPAM — Self-Hosted Deployment Guide

Deploy the entire IPAM stack (frontend + database + auth + storage) in Portainer using Docker Compose.

## Architecture

```
Internet → Nginx Proxy Manager (SSL :443)
    → ipam-frontend (:4242) — React app served by Nginx
    → kong (:8000) — Supabase API gateway (auth, REST, realtime, storage)
    → db (:5432) — Postgres database
```

## Quick Start

### 1. Generate Secrets

On your server, generate the required secrets:

```bash
# JWT secret (used by all Supabase services)
openssl rand -base64 32

# Secret key base (for Realtime)
openssl rand -base64 48

# Postgres password
openssl rand -base64 24
```

### 2. Generate Supabase API Keys

Go to [jwt.io](https://jwt.io) and create two JWTs using your JWT_SECRET:

**Anon key** payload:
```json
{
  "role": "anon",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 2000000000
}
```

**Service role key** payload:
```json
{
  "role": "service_role",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 2000000000
}
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your generated values
nano .env
```

### 4. Deploy in Portainer

1. In Portainer, go to **Stacks → Add stack**
2. Choose **Upload** and upload the `deploy/` folder, or paste the `docker-compose.yml` content
3. Add your `.env` variables in the **Environment variables** section
4. Click **Deploy the stack**

### 5. Configure Nginx Proxy Manager

Add two proxy hosts:

#### Frontend (the IPAM app)
| Field | Value |
|-------|-------|
| Domain | `ipam.warp9studios.com` |
| Scheme | `http` |
| Forward Host | `ipam-frontend` (or server IP) |
| Forward Port | `4242` |
| SSL | Request new certificate, Force SSL |

#### Supabase API (auth, database, storage)
| Field | Value |
|-------|-------|
| Domain | `api.ipam.warp9studios.com` (or use port-based) |
| Scheme | `http` |
| Forward Host | `kong` (or server IP) |
| Forward Port | `8000` |
| SSL | Request new certificate, Force SSL |
| Custom Nginx | `proxy_set_header Upgrade $http_upgrade;` (for WebSocket/Realtime) |

> **Note:** If you prefer not to use a subdomain for the API, you can access Kong directly on port 8000 and set `VITE_SUPABASE_URL=http://your-server-ip:8000` in the build args.

### 6. Initialize the Database

After first deploy, connect to Postgres and run your schema migrations:

```bash
# Connect to the running Postgres container
docker exec -it deploy-db-1 psql -U postgres

# Then run each migration SQL file from supabase/migrations/
```

Or bulk-import:
```bash
cat supabase/migrations/*.sql | docker exec -i deploy-db-1 psql -U postgres
```

### 7. Create Your First User

Once the stack is running, navigate to `https://ipam.warp9studios.com` and use the signup form to create your account.

## File Structure

```
deploy/
├── docker-compose.yml      # Full stack definition
├── Dockerfile              # Multi-stage build for React frontend
├── .env.example            # Template for environment variables
├── volumes/
│   └── kong/
│       └── kong.yml        # API gateway routing config
└── DEPLOY.md               # This file
```

## Updating the App

To deploy code changes:

```bash
cd deploy
docker compose build ipam-frontend
docker compose up -d ipam-frontend
```

## Backups

Back up your Postgres data:

```bash
docker exec deploy-db-1 pg_dump -U postgres postgres > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

- **Can't log in?** Check that `SITE_URL` matches your actual domain and that GoTrue SMTP settings are configured for email verification.
- **API errors?** Verify `VITE_SUPABASE_URL` in the build args points to your Kong gateway.
- **WebSocket issues?** Ensure Nginx Proxy Manager has WebSocket support enabled for the API proxy host.
