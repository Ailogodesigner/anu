# Cavrix Cloud Discord Bot & Enterprise Management Dashboard

An enterprise-grade Discord management and technical support bot paired with an executive web dashboard built specifically for Cavrix Cloud VPS hosting and infrastructure operations.

Built strictly according to specifications:
1. **Discord Management & Support Bot**: Powered by Node.js, TypeScript, discord.js v14, persistent ticket channels, button & modal interactions, slash commands, and an AI diagnostic assistant with human escalation.
2. **Enterprise Management Dashboard**: Powered by Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM, and secure Discord OAuth2 sessions.

---

## 🎨 Enterprise Design Specifications

The web dashboard implements an enterprise dark aesthetic:
- **Background**: `#0B0F19`
- **Cards & Surfaces**: `#161F30` and `#1E293B`
- **Typography & High-Contrast Text**: `#F8FAFC`
- **Brand Accents**: `#06B6D4` (Cyan) and `#00F5D4` (Mint)
- **Status Accents**: `#10B981` (Success), `#F59E0B` (Warning), `#EF4444` (Critical)
- Restrained micro-animations, real-time Discord dark UI faithful embed preview, and responsive layouts.

---

## 🏗️ Architecture & Module Breakdown

```
anu-web-bot/
├── prisma/
│   ├── schema.prisma             # SQLite schema for instant local dev & tests
│   ├── schema.postgresql.prisma  # Production PostgreSQL schema with indexes
│   └── seed.ts                   # Realistic VPS hosting seed data & articles
├── src/
│   ├── app/                      # Next.js App Router & REST API Routes
│   │   ├── api/                  # Backend endpoints (RBAC, Tickets, AI, Embeds, etc.)
│   │   ├── dashboard/            # 10 Dedicated Executive Dashboard Modules
│   │   │   ├── page.tsx          # 1. Overview & Live Health Telemetry
│   │   │   ├── tickets/          # 2. Ticket Queue & Conversation Drawer
│   │   │   ├── ai/               # 3. AI Support Config & Knowledge Base
│   │   │   ├── embeds/           # 4. Visual Embed Builder & Live Preview
│   │   │   ├── announcements/    # 5. Announcement Scheduler & Dual-Staff Approval
│   │   │   ├── calculators/      # 6. Hosting Calculator & Safe AST Math
│   │   │   ├── staff/            # 7. Staff Roles, Workload & Status Toggles
│   │   │   ├── config/           # 8. Server Channel IDs, Roles & Rate Limits
│   │   │   ├── audit-logs/       # 9. Privileged Action Stream & Analytics
│   │   │   └── diagnostics/      # 10. Gateway Latency, DB Ping & Secret Audit
│   │   └── login/                # Discord OAuth2 Login & Dev Access Mode
│   ├── bot/                      # Independent Discord Bot Service
│   │   ├── commands/             # Slash commands (/ticket, /calc, /kb, /status)
│   │   ├── handlers/             # Interactive button handlers (Claim, Escalate, Close)
│   │   ├── discordService.ts     # Discord REST & Gateway dispatch helper
│   │   └── index.ts              # Bot process entrypoint & message sync
│   ├── lib/                      # Shared Backend Services
│   │   ├── ai/                   # Provider-independent AI + local rule fallback
│   │   ├── auth.ts               # Discord OAuth2, JWT sessions & RBAC
│   │   ├── calculator/           # Safe mathematical AST parser (No eval)
│   │   ├── escalation.ts         # Escalation engine & duplicate suppression
│   │   ├── queue/                # Persistent scheduled job queue worker
│   │   ├── transcripts.ts        # Readable HTML & Markdown transcript generator
│   │   └── prisma.ts             # Prisma Client singleton
│   └── tests/                    # Vitest automated test suite
```

---

## 🛡️ Non-Destructive Policy & Enterprise Security

- **Strict Server-Side RBAC**: Every privileged endpoint verifies session validity and checks user role hierarchy (`ADMIN` > `SUPPORT_LEAD` > `SUPPORT_AGENT` > `VIEWER`).
- **Safe Math Evaluation**: The VPS pricing calculator parses arithmetic using a strict recursive-descent AST parser. Zero usage of `eval()`, `Function()`, or unsafe RegExp execution.
- **Privacy & Non-Hallucination Guardrails**:
  - The AI assistant is forbidden from requesting customer passwords or private SSH keys.
  - The AI never invents fictitious server access, imaginary IPs, or fabricated hosting metrics.
  - Standardized diagnostic workflows for SSH port 22 refusals, UFW/iptables lockouts, MTR packet loss, and kernel OOM killer events.
- **No Destructive Commands**: Hidden mass bans, mass kicks, server wipes, role deletions, and database wipes are strictly excluded from both the bot commands and the dashboard API.
- **Persistent Audit Logging**: Consequential actions (ticket claims, resolutions, escalations, config changes, announcement scheduling) are recorded immutably in the database.

---

## 🚀 Quick Start & Local Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(See Environment Variables table below for details)*

### 3. Initialize Database & Seed Sample Data
```bash
# Push database schema
npm run prisma:push

# Populate realistic VPS tickets, staff roster, knowledge base docs, and templates
npm run prisma:seed
```

### 4. Run the Test Suite
```bash
npm run test
```
All 13 automated tests across `calculator`, `escalation`, `auth`, and `aiFallback` will execute and pass.

### 5. Launch the Web Dashboard
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
*Note: In development mode, the dashboard features a one-click Staff Role Switcher (`Admin`, `Support Lead`, `Support Agent`) so you can explore all 10 modules immediately before connecting Discord credentials.*

### 6. Launch the Independent Discord Bot Process
In a separate terminal:
```bash
npm run bot
```
*(If `DISCORD_BOT_TOKEN` is not yet configured, the bot process will start in Standby mode, running background queue processing and diagnostics safely without crashing).*

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Database connection string (PostgreSQL in production or `file:./dev.db` for SQLite) |
| `SESSION_SECRET` | Yes | 64-character secret used to sign session JWTs |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL of dashboard (e.g. `http://localhost:3000`) |
| `DISCORD_BOT_TOKEN` | Production | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Production | Application Client ID from Discord Developer Portal |
| `DISCORD_CLIENT_SECRET` | Production | Application Secret for Discord OAuth2 |
| `DISCORD_GUILD_ID` | Production | Target Discord Server Snowflake ID |
| `DISCORD_REDIRECT_URI` | Production | OAuth2 callback (`http://localhost:3000/api/auth/callback/discord`) |
| `ADMIN_DISCORD_IDS` | Recommended | Comma-separated Discord User IDs granted initial ADMIN access |
| `GEMINI_API_KEY` | Optional | Google Gemini API key (Falls back to built-in rule engine if unset) |
| `OPENAI_API_KEY` | Optional | OpenAI API key |

> **IMPORTANT NOTICE:** The Discord bot requires valid Discord Developer credentials (`DISCORD_BOT_TOKEN` and `DISCORD_CLIENT_ID`) before it can connect to a live Discord guild. In local development without credentials, the dashboard is fully functional, using realistic seeded data and developer session simulation.

---

## 📦 Production Deployment (PostgreSQL + Docker)

### Switching to PostgreSQL in Production
1. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Run database migration:
   ```bash
   npx prisma migrate deploy
   ```
3. Build and launch:
   ```bash
   npm run build
   npm run start
   ```

### Running Bot & Dashboard with PM2
```bash
# Start Next.js Dashboard
pm2 start npm --name "vps-dashboard" -- run start

# Start Discord Bot Process
pm2 start npm --name "vps-bot" -- run bot
```
