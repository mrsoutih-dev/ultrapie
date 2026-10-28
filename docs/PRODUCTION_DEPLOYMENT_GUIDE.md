# Ultrapie / VibeHeberg — Production Deployment & Operations Guide

This guide provides instructions for deploying the **Ultrapie** (`ultrapie.com`) and **VibeHeberg** (`vibeheberg.com`) fullstack platform to production using our turnkey Docker Compose stack, Caddy automated TLS reverse-proxy, and disaster recovery engine.

---

## Architecture Overview

```
                      INTERNET / USERS
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   https://ultrapie.com             https://*.ultrapie.com
   https://vibeheberg.com           (Instant Edge Subdomains)
            │                                 │
            └────────────────┬────────────────┘
                             ▼
              [ Caddy v2 Ingress Reverse Proxy ]
                 (Auto ACME / Wildcard TLS)
                             │
                             ▼
             [ Next.js 15 Web & Edge Runner ]
                       (Port 3000)
                             │
           ┌─────────────────┴─────────────────┐
           ▼                                   ▼
[ PostgreSQL 16 Cluster ]            [ Redis 7.2 Cache ]
  (Port 5432 - Data Tier)              (Port 6379 - Cache)
           │                                   │
           └─────────────────┬─────────────────┘
                             ▼
              [ Automated Disaster Recovery ]
                 (Hourly Point-in-Time R2)
```

---

## 1. Domain & DNS Configuration

In your Cloudflare or DNS provider console, configure the following records pointing to your server's public IP:

| Type | Host / Name | Target / IPv4 | Proxy Status |
|:---:|:---:|:---:|:---:|
| **A** | `@` (`ultrapie.com`) | `YOUR_SERVER_IP` | DNS Only (or Proxied) |
| **A** | `*` (`*.ultrapie.com`) | `YOUR_SERVER_IP` | DNS Only (for ACME TLS) |
| **A** | `@` (`vibeheberg.com`) | `YOUR_SERVER_IP` | DNS Only (or Proxied) |
| **A** | `*` (`*.vibeheberg.com`) | `YOUR_SERVER_IP` | DNS Only (for ACME TLS) |

---

## 2. Environment Variables

Create a `.env.production` file in your root workspace:

```bash
# Secrets & Security
SESSION_SECRET=your_32_byte_cryptographically_secure_session_secret
GEMINI_API_KEY=your_production_google_gemini_api_key

# Databases (Docker internal hostnames)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=generate_strong_postgres_password_here
POSTGRES_DB=ultrapie_production
REDIS_PASSWORD=generate_strong_redis_password_here

# Coolify VPS Integration
COOLIFY_URL=http://coolify:8000
COOLIFY_API_KEY=your_coolify_bearer_token
```

---

## 3. Launching the Production Stack

Run the stack in detached mode:

```bash
docker compose -f infrastructure/docker-compose.prod.yml --env-file .env.production up -d
```

### Check Container Health:
```bash
docker compose -f infrastructure/docker-compose.prod.yml ps
```

All 5 services (`reverse-proxy`, `web`, `postgres`, `redis`, `coolify`) will report `healthy`.

---

## 4. Disaster Recovery & Zero Data Loss Drills

The platform includes an automated disaster recovery engine with SHA-256 integrity checks:

### Run Live Drill:
```bash
pnpm tsx scripts/backup_restore_drill.ts
```

### Trigger via REST API:
```bash
curl -X POST https://ultrapie.com/api/backups \
  -H "Content-Type: application/json" \
  -d '{"action": "run_drill"}'
```

### Trigger via UI:
Navigate to `https://ultrapie.com/hosting` and click the **"Backups & DR"** button in the top navigation bar to create instant encrypted snapshots or run one-click recovery drills.

---

## 5. Useful Administrative Commands

- **Stream Live Logs**:
  ```bash
  docker compose -f infrastructure/docker-compose.prod.yml logs -f web
  ```
- **Inspect Reverse Proxy TLS Certificates**:
  ```bash
  docker compose -f infrastructure/docker-compose.prod.yml logs reverse-proxy
  ```
- **Run Vitest Test Suite**:
  ```bash
  pnpm vitest run
  ```
