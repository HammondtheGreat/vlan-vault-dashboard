# Warp9Net IPAM — Deployment Guide

Everything runs in Docker. Three containers: **MySQL**, **API**, **Frontend**.

---

## Step 1: Get the code onto your server

```bash
git clone <your-repo-url> warp9net-ipam
cd warp9net-ipam
```

---

## Step 2: Generate your .env file

```bash
bash setup.sh
```

This creates a `.env` with random database passwords and a JWT secret. You don't need to edit anything — it just works.

---

## Step 3: Start it up

```bash
docker compose up -d
```

That's it. Wait about 30 seconds for MySQL to initialize on first run.

---

## Step 4: Log in

Open `http://your-server-ip:4242` in your browser.

| Field    | Value                        |
|----------|------------------------------|
| Email    | `admin@warp9studios.com`     |
| Password | `admin123`                   |

**⚠️ Change your password immediately** in Settings after logging in.

---

## Deploying in Portainer

1. Go to **Stacks → Add stack**
2. Choose **Repository** and point it at your git repo, or **Upload** and upload the project folder
3. In the **Environment variables** section, add the values from your `.env` file
4. Click **Deploy the stack**
5. Wait ~30 seconds, then visit port `4242`

---

## Updating after code changes

```bash
docker compose build
docker compose up -d
```

Or in Portainer: click your stack → **Editor** → **Update the stack** with "Re-pull and redeploy" checked.

---

## Using a reverse proxy (Nginx Proxy Manager)

If you want HTTPS with a domain name:

| Field        | Value               |
|--------------|---------------------|
| Domain       | `ipam.yourdomain.com` |
| Scheme       | `http`              |
| Forward Host | `ipam-frontend`     |
| Forward Port | `4242`              |
| SSL          | Request new cert, Force SSL |

---

## Backups

```bash
docker exec $(docker ps -qf "name=db") mysqldump -u root -p ipam > backup_$(date +%Y%m%d).sql
```

---

## Restoring a backup

```bash
cat backup_20260415.sql | docker exec -i $(docker ps -qf "name=db") mysql -u root -p ipam
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Can't reach the app | Check container is running: `docker compose ps` |
| Login fails | Check API logs: `docker compose logs api` |
| Database errors | Check MySQL started: `docker compose logs db` |
| "Backend not reachable" on login page | The API container isn't running or isn't healthy yet — wait 30s or check logs |
| Forgot admin password | Connect to MySQL and reset it, or delete the `db-data` volume and redeploy to start fresh |

---

## File structure

```
warp9net-ipam/
├── setup.sh                 ← Run this first
├── docker-compose.yml       ← The whole stack
├── server/
│   ├── Dockerfile           ← API container
│   ├── index.js             ← Express entry point
│   ├── init.sql             ← Database schema + seed user
│   └── routes/              ← All REST endpoints
└── deploy/
    ├── Dockerfile           ← Frontend container (Nginx + React)
    └── .env.example         ← Reference for env vars
```
