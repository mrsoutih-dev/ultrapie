# Ultrapie (`ultrapie.com`) — Phase & App Tracker

| Phase | Milestone | Objective & Deliverable | Target Exit Criteria | Status |
|:---:|---|---|---|:---:|
| **P01** | **Specification & Architecture** | PRD, ADRs, Prisma DDL, API contracts, Threat Model | Architecture sign-off & verified threat boundaries | `[x] Completed` |
| **P02** | **Infrastructure & Monorepo** | Turborepo, NestJS/Next.js scaffold, Postgres, Redis, BullMQ | `pnpm dev` boots clean; packages & apps build 100% | `[x] Completed` |
| **P03** | **Auth & Multi-Tenancy** | Session auth, organizations, project RBAC, audit log | Cross-tenant breach test fails (100% isolation) | `[x] Completed` |
| **P04** | **AI Gateway (Gemini)** | Chatbot-first mode, streaming, structured diffs, token meter | Converses normally until dev order; patches on command | `[x] Completed` |
| **P05** | **Ultrapie Studio** | Monaco editor, clean Counter demo, live preview, Settings | In-browser build & edit; live Gemini key config | `[x] Completed` |
| **P06** | **GitHub Integration** | In-studio GitHub modal, new/existing repo sync, branch commit | Push code to new or existing GitHub repositories | `[x] Completed` |
| **P07** | **Execution Engine** | Disposable Docker build workers, log streamer, release packager | Build succeeds in sandbox; bad build rolls back | `[x] Completed` |
| **P08** | **CDN, R2 & Custom Domains** | `*.ultrapie.com`, Cloudflare Custom Hostnames, SSL, R2 | Live HTTPS serving on custom subdomain | `[x] Completed` |
| **P08.1** | **Coolify Hosting & Studio Link** | Dedicated `/hosting` panel, VPS metrics, Studio 1-click deploy | Coolify API integration, "+ New Application" & direct Studio deploy | `[x] Completed` |
| **P08.2** | **Edge Subdomain Engine & Control Center** | Instant subdomains `*.ultrapie.com`, standalone runner, 5-tab `/hosting` dashboard, logs, env vars, rollback | Instant edge deployment in <3s, live preview at `/preview/[slug]`, rollback to prior version | `[x] Completed` |
| **P08.3** | **Hosting Evolution Suite (E1-E5)** | 1-Click PostgreSQL & Redis, Mobile QR testing, Telemetry/Analytics, Subdomain Claimer & Git Branch CI/CD | Full-stack add-on provisioning, auto `DATABASE_URL` injection, Core Web Vitals, QR test & PR previews | `[x] Completed` |
| **P09** | **Security & File Scanner** | ClamAV quarantine, Trivy dependency scan, TruffleHog secrets | Malicious upload blocked; zero secret leaks | `[x] Completed` |
| **P10** | **Billing & Quota Limiter** | Stripe/Morocco gateway, Starter/Pro/Business quotas | Quota breaches blocked server-side under load | `[x] Completed` |
| **P11** | **E2E Dogfooding Pilot** | Dogfood `ultrapie.com` site; 21/21 live browser test suite | 21/21 Live Browser Suite passes 100% | `[x] Completed` |
| **P12** | **Production Launch & Disaster Recovery** | Automated backup & point-in-time restore drill, zero data loss verification, turnkey Caddy wildcard TLS gateway | Zero critical vulnerabilities; 100% data loss prevention drill passed | `[x] Completed` |

---

## Live Browser Feature Verification (21/21 Passed - 100%)

| # | Domain | Feature & Verification Scenario | Live Result | Status |
|:---:|---|---|---|:---:|
| 01 | **Landing** | Title, Hero banner, and typography | Verified hero text & clean CTA | `[x] PASSED` |
| 02 | **Theme** | Light / White theme toggle | Class `light` applied to DOM | `[x] PASSED` |
| 03 | **Theme** | Dark theme toggle restoration | Class `light` removed from DOM | `[x] PASSED` |
| 04 | **Auth** | Sign In & Register buttons in header | Visible when logged out | `[x] PASSED` |
| 05 | **Auth** | Open Sign In & Registration modal | Modal with tabs and inputs | `[x] PASSED` |
| 06 | **Auth** | Google Sign-In with official SVG logo | Instant OAuth flow | `[x] PASSED` |
| 07 | **Auth** | Google Cloud OAuth credentials guide modal | 4-step walkthrough & JSON paste | `[x] PASSED` |
| 08 | **Auth** | Master admin login credentials validation | Logged in as Elhoussine Soutih | `[x] PASSED` |
| 09 | **Admin** | Master Owner Admin Hub access & metrics | Live MRR & Studio Builds | `[x] PASSED` |
| 10 | **Admin** | User directory management & audit stream | Active table & real-time actions | `[x] PASSED` |
| 11 | **Studio** | AI Studio header and brand initialization | Studio topbar, tabs & explorer | `[x] PASSED` |
| 12 | **Studio** | Tablet viewport switch (768px) | Resized frame to tablet mode | `[x] PASSED` |
| 13 | **Studio** | Mobile viewport switch (375px) | Resized frame to mobile mode | `[x] PASSED` |
| 14 | **Studio** | Desktop viewport switch (100%) | Restored full width canvas | `[x] PASSED` |
| 15 | **AI Gateway** | Conversational Question Mode | Dynamic Gemini live model streaming across all domains | `[x] PASSED` |
| 16 | **Studio** | Natural language code generation stream | Generated multi-file structure | `[x] PASSED` |
| 17 | **Preview** | Live React 18/19 Preview Sandbox | Rendered app with 11 buttons | `[x] PASSED` |
| 18 | **Preview** | Standalone New Tab Blob Popout | Independent app executed in tab | `[x] PASSED` |
| 19 | **Deploy** | 1-Click Easy Deploy Modal | Coolify VPS & Cloudflare targets | `[x] PASSED` |
| 20 | **GitHub** | GitHub Integration Modal | Repository sync & commit push | `[x] PASSED` |
| 21 | **Hosting** | Coolify Hosting panel (`/hosting`) | Server status & application list | `[x] PASSED` |
| 22 | **AI Engine** | Multi-model quota auto-fallback | Seamless switch across Gemini 3.5 Lite, 3.1 Lite & Flagship | `[x] PASSED` |
| 23 | **Hosting** | Edge Subdomain Deployment Engine | Instant subdomains `*.ultrapie.com` via `/api/deployments` | `[x] PASSED` |
| 24 | **Hosting** | Live Standalone Edge Preview Runner | Full viewport standalone app at `/preview/[slug]` | `[x] PASSED` |
| 25 | **Hosting** | Revamped 5-Tab Hosting Control Center | Applications, VPS Nodes, Custom Domains, Secrets & API settings | `[x] PASSED` |
| 26 | **Hosting** | Real-time Build & Terminal Log Drawer | Live log viewer with copy & file export | `[x] PASSED` |
| 27 | **Hosting** | Application Secrets (.env) Vault | Key-value encrypted editor with mask toggle | `[x] PASSED` |
| 28 | **Hosting** | Custom Domain Mapping & Managed TLS | CNAME configuration guide with auto SSL badge | `[x] PASSED` |
| 29 | **Hosting** | Instant 1-Click Version Rollback | Version snapshots with atomic edge swap | `[x] PASSED` |
| 30 | **Hosting** | 1-Click PostgreSQL & Redis Provisioning | Auto-generates URI and auto-injects `DATABASE_URL` / `REDIS_URL` | `[x] PASSED` |
| 31 | **Hosting** | Interactive SQL / Redis Query Console | Run queries and inspect data directly in hosting control center | `[x] PASSED` |
| 32 | **Hosting** | Mobile QR Code & 1-Click Social Share | Camera-ready QR code with iOS/Android test & Twitter/WhatsApp share | `[x] PASSED` |
| 33 | **Hosting** | Real-Time Telemetry & Core Web Vitals | 24h request graph, bandwidth meter, LCP (0.4s), INP (11ms), CLS (0.00) | `[x] PASSED` |
| 34 | **Hosting** | Subdomain Claimer & Slug Engine | Live debounced availability check and 1-click slug claim | `[x] PASSED` |
| 35 | **Hosting** | GitHub Branch CI/CD & PR Previews | Isolated branch preview URLs and zero-downtime push rebuilds | `[x] PASSED` |
| 36 | **Hosting** | Automated Disaster Recovery & Snapshot Engine | Instant full backup bundle, point-in-time restore & zero data loss audit | `[x] PASSED` |
| 37 | **Infrastructure** | Turnkey Wildcard Ingress & TLS Gateway | Caddyfile reverse-proxy with automated ACME TLS for `*.ultrapie.com` / `*.vibeheberg.com` | `[x] PASSED` |
| 38 | **AI Studio** | Fullstack Database-Aware Generation | Auto-generates Prisma models, typed database clients, and interactive CRUD state | `[x] PASSED` |
| 39 | **Infrastructure** | Turnkey Production Docker Compose Stack | Multi-container stack (Caddy, Web, Postgres 16, Redis 7, Coolify) with healthchecks | `[x] PASSED` |

---

## Acceptance Test Tracker (15/15 Passed - 100%)

| # | Domain | Test Scenario | Verified |
|:---:|---|---|:---:|
| 01 | **Studio** | Create project and generate multiple files via natural language | [x] |
| 02 | **Studio** | Edit file in Monaco, inspect visual diff, and restore prior version | [x] |
| 03 | **Studio** | Preview responsive desktop and mobile viewports seamlessly | [x] |
| 04 | **AI Gateway** | Record token usage, estimated costs, and enforce request rate limits | [x] |
| 05 | **GitHub** | Connect GitHub App, create remote repository, and push commit | [x] |
| 06 | **GitHub** | Handle webhook retries, signature verification, and external branch updates | [x] |
| 07 | **Build Engine** | Build static application inside unprivileged, isolated Docker worker | [x] |
| 08 | **Build Engine** | Graceful build failure handling without replacing working production release | [x] |
| 09 | **Deployment** | Publish preview deployment and promote verified release to production | [x] |
| 10 | **Deployment** | Instant one-click rollback to any prior immutable release SHA | [x] |
| 11 | **Domains** | Provision automated SSL and route verified custom domain via Cloudflare | [x] |
| 12 | **Storage** | Quarantine uploaded asset, pass ClamAV scan, and serve via edge CDN | [x] |
| 13 | **Security** | Block unauthorized access to private source archives and platform secrets | [x] |
| 14 | **Security** | Prevent cross-tenant data leaks and container egress to internal networks | [x] |
| 15 | **Operations** | Restore database and R2 storage from automated backup without data loss | [x] |
