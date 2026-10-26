# Ultrapie (`ultrapie.com`) — Master Development Plan

## 1. Vision & Commercial Goals
**Ultrapie** (`ultrapie.com`) is a full-featured commercial SaaS platform enabling any customer to describe an application in natural language, generate high-quality multi-file code, edit it within an in-browser studio (Monaco Editor), view live previews, synchronize seamlessly with GitHub, and publish to immutable static hosting on automatic subdomains (`*.ultrapie.com`) or custom domains with managed TLS.

---

## 2. Core Architecture: Control Plane vs. Execution Plane

### Control Plane (Trusted)
- **Web App**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui.
- **Studio Core**: Monaco Editor (`@monaco-editor/react`), dynamic project tree, live preview iframe, real-time AI diff viewer.
- **API Backend**: NestJS (TypeScript) with Fastify adapter.
- **Database**: PostgreSQL with Prisma ORM and Row-Level Security (RLS).
- **Job Orchestrator**: Redis + BullMQ (managing AI tasks, build jobs, file scanning).
- **AI Gateway**: Provider-agnostic gateway starting with Google Gemini 2.0 / 1.5, extensible to Anthropic, OpenAI, or local models.
- **Git Service**: GitHub App integration with scoped installation tokens and signed webhook handling.
- **Domain Service**: Cloudflare for SaaS (Custom Hostnames) for automatic TLS and edge routing.

### Execution Plane (Untrusted & Isolated)
- **Disposable Build Workers**: Docker containers stripped of privileged capabilities, CPU/memory constrained, no Docker socket access, egress-filtered.
- **Security Quarantine**: ClamAV upload scanner, TruffleHog secret detector, and Trivy vulnerability analyzer.
- **Storage Tiering**:
  - `ultrapie-private-sources`: Encrypted source code, raw ZIPs, internal backups.
  - `ultrapie-quarantine`: Pending user uploads awaiting virus/malware inspection.
  - `ultrapie-public-assets`: Verified user images and public assets served via Cloudflare CDN.
  - `ultrapie-releases`: Immutable static build artifacts served directly to edge routing.

---

## 3. Monorepo Structure

```
ultrapie/
├── apps/
│   ├── web/                  # Next.js 15 Studio & Dashboard (ultrapie.com)
│   ├── api/                  # NestJS Control Plane API
│   ├── worker-ai/            # BullMQ AI prompt & patch orchestrator
│   ├── worker-build/         # Hardened containerized build engine
│   └── worker-scan/          # ClamAV & Trivy quarantine worker
├── packages/
│   ├── ai-core/              # Universal AI Provider contract
│   ├── ai-gemini/            # Google Gemini implementation
│   ├── github/               # GitHub App client & webhook verifier
│   ├── deployment/           # Release builder & rollback controller
│   ├── storage/              # Cloudflare R2 abstraction & presigned URLs
│   ├── domains/              # Cloudflare DNS & Custom Hostnames API
│   ├── auth/                 # Multi-tenant RBAC & JWT/Session management
│   ├── billing/              # Subscription plans & quota limiter
│   ├── shared/               # TypeScript models, DTOs, Zod schemas
│   └── ui/                   # Shared UI component library
├── infrastructure/
│   ├── docker/               # Compose files & hardened worker Dockerfiles
│   ├── reverse-proxy/        # Caddy / Nginx edge configurations
│   ├── monitoring/           # Prometheus, Grafana, Loki configs
│   └── coolify/              # Staging deployment recipes
├── database/
│   ├── schema.prisma         # Prisma schema
│   └── migrations/           # Versioned SQL migrations
└── tests/
    ├── unit/
    ├── integration/
    ├── security/             # Tenant isolation & container escape tests
    └── e2e/                  # Playwright end-to-end test suite
```

---

## 4. 12-Phase Roadmap

1. **Phase 01: Product Specification & Architecture** — Finalize PRD, ADRs, database schema, threat model, API contracts.
2. **Phase 02: Infrastructure Foundation & Monorepo** — Setup Turborepo, PostgreSQL, Redis, BullMQ, Docker Compose, Coolify staging.
3. **Phase 03: Authentication, Tenancy & RBAC** — Multi-tenant schema, organizations, project roles, audit logging.
4. **Phase 04: AI Gateway & Gemini Engine** — Streaming API, structured diffs, patch validator, token & cost calculation.
5. **Phase 05: Ultrapie Web Studio** — Monaco code editor, dynamic file tree, split preview, AI chat, visual diff review.
6. **Phase 06: GitHub App & Git Sync** — App installation, repository creation, commit push, bidirectional synchronization.
7. **Phase 07: Execution Plane & Build Engine** — Disposable build containers, static bundler, immutable release generator, instant rollback.
8. **Phase 08: Cloudflare CDN, R2 Storage & Custom Domains** — Wildcard subdomains (`*.ultrapie.com`), Cloudflare for SaaS, TLS certs.
9. **Phase 09: Defense-in-Depth Security & Scanning** — Upload quarantine, ClamAV, secret detection, egress controls.
10. **Phase 10: Billing, Usage Quotas & Monetization** — Tiered plans (Starter, Pro, Business), hard quota enforcement.
11. **Phase 11: End-to-End Pilot & Dogfooding** — Build the official `ultrapie.com` website in Ultrapie; execute 15/15 acceptance tests.
12. **Phase 12: Controlled Launch & Observability** — Grafana/Loki metrics, OpenTelemetry, incident runbooks, waitlist onboarding.
