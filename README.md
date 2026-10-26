# Ultrapie 🚀

> **Autonomous AI Vibe Coding Studio & Cloud Hosting Platform**  
> Inspired by Google AI Studio and Antigravity. Powered by Google Gemini, React 19, Monaco Editor, and Self-Hosted Coolify VPS.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19.0.0-61dafb.svg)](https://react.dev/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.5.28-black.svg)](https://nextjs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20Lite-4285F4.svg)](https://ai.google.dev/)
[![Coolify](https://img.shields.io/badge/Coolify-Self--Hosted-6B46C1.svg)](https://coolify.io/)

---

## 🌟 Overview

**Ultrapie** is a full-stack, natural-language web application builder and deployment engine. Describe any web application in plain English or French, watch code stream line-by-line in Microsoft Monaco Editor, and interact with the live running React 19 application in real time directly within your browser.

Deploy with a single click to your own self-hosted **Coolify VPS** (`:8000`), export a standalone Vite + React ZIP bundle, or serve globally over **Cloudflare Zero Trust Tunnels**.

---

## ✨ Key Features

### 1. Dual-Mode Google Gemini AI Engine
- **Mode 1: General Intelligence & Reasoning**: Deep, structured markdown responses across computer science, physics, mathematics, philosophy, literature, and general knowledge.
- **Mode 2: Autonomous Application Generation**: Outputs modular `FILE: src/App.tsx` and `FILE: src/index.css` components with Tailwind CSS and Lucide icons.
- **Resilient Multi-Model Quota Fallback**: Automatic failover across `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.8-flash`, and `gemma-4-26b-a4b-it` to bypass rate limits.
- **Bring Your Own Key (BYOK)**: In-studio Settings modal lets users securely store their own Google AI Studio Gemini API key in their browser.

### 2. Live In-Browser Babel Execution
- Zero server-side build lag.
- Transpiles modern TSX / JSX directly in-memory using **Babel Standalone** with `react` and `env` (CommonJS) presets.
- Interactive component state, React hooks (`useState`, `useEffect`), and Lucide icons render instantly in an isolated sandbox iframe.
- Standalone New Tab Blob Popout for inspecting apps in a full browser viewport.

### 3. Microsoft Monaco Editor Studio
- True line-by-line streaming typing pacing.
- Real-time line count counter and active file indicator.
- Switch between **Code View**, **Preview View**, and **Split (Side-by-Side) View**.
- Instant viewport toggles: **Desktop (100%)**, **Tablet (768px)**, and **Mobile (375px)**.

### 4. Enterprise Auth & Master Admin Portal
- Master Owner Admin Hub (`zohodigital.com@gmail.com`) with live MRR tracking, user management directory, and real-time studio build audit stream.
- Credentials authentication and official Google OAuth 2.0 Sign-In.
- Google Cloud OAuth 2.0 4-step setup guide modal with direct client JSON pasting.
- Light Mode / Dark Mode toggle across the landing page and studio.

### 5. Multi-Target Deployment Engine
- **Coolify Self-Hosted VPS**: Directly push applications to Docker containers running on Coolify (`http://localhost:8000`).
- **1-Click Easy Deploy**: Single-click deploy modal for Coolify, Cloudflare, or instant ZIP export.
- **Standalone ZIP Bundle**: Exports complete, runnable Vite + React 19 + Tailwind projects with zero dependencies missing.
- **GitHub Integration**: Connect repositories, commit code, and push releases.

---

## 🏗️ Architecture

```
vibeheberg/
├── apps/
│   ├── web/                    # Next.js 15 Full-Stack Frontend & AI Studio
│   │   ├── src/app/            # App Router (/, /studio, /hosting, /chatbot)
│   │   ├── src/components/     # Studio, Auth, Admin & Hosting Modals
│   │   ├── src/hooks/          # useStudioState, real-time Monaco parser
│   │   └── src/lib/            # Gemini streaming engine & user store
│   └── api/                    # NestJS Control Plane Backend (:4000)
├── packages/
│   ├── shared/                 # Shared TypeScript models and file patches
│   ├── ai-gemini/              # Google GenAI SDK wrapper
│   ├── deployment/             # Coolify and Docker orchestration
│   ├── domains/                # Cloudflare Zero Trust DNS management
│   └── github/                 # GitHub REST API client
└── infrastructure/             # Docker Compose & reverse proxy configs
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0
- (Optional) Docker for Coolify VPS on port 8000

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mrsoutih-dev/ultrapie.git
   cd ultrapie
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment:**
   Create `apps/web/.env.local`:
   ```env
   # Google Gemini API Key (from https://aistudio.google.com/app/apikey)
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

   # App URLs
   NEXT_PUBLIC_APP_URL="http://localhost:3005"
   NEXT_PUBLIC_API_URL="http://localhost:4000"

   # Coolify VPS Integration
   COOLIFY_URL="http://127.0.0.1:8000"
   COOLIFY_TOKEN="YOUR_COOLIFY_API_TOKEN"
   ```

4. **Run the Development Server:**
   ```bash
   pnpm --filter @ultrapie/web dev --port 3005
   ```

5. **Open in Browser:**
   - Landing Page: [http://localhost:3005](http://localhost:3005)
   - AI Vibe Studio: [http://localhost:3005/studio](http://localhost:3005/studio)
   - Coolify Hosting: [http://localhost:3005/hosting](http://localhost:3005/hosting)

---

## 🔒 Security & Best Practices

- API keys and tokens are excluded from version control via `.gitignore`.
- User credentials use salt-hashed PBKDF2 encryption.
- Studio previews execute in sandboxed `<iframe>` contexts with sanitized HTML to prevent script injection.

---

## 📄 License

MIT License © 2026 Ultrapie Inc. All rights reserved.
