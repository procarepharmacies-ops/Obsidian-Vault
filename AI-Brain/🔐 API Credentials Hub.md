---
title: API Credentials Hub
tags: [credentials, api, security, reference]
type: credentials-hub
author: Antigravity
---

# 🔐 API Credentials Hub

> **Central reference for all API keys, tokens, and credentials across all projects.**
> Last synced: 2026-08-14

---

## 🗺️ Credential Sources Map

| Project/System | File | Type | Status |
|---|---|---|---|
| Hermes Agent | `C:\Users\Ahmed\AppData\Local\hermes\.env` | LLM + Tools | Active |
| Obsidian Vault | `.env` (vault root) | SQL Server | Active |
| Prospices Finalweb | `.env` (root) | Webhooks | Active |
| ProCare Pharmacy OS | `.env` | SQL + Slack | Active |
| ProCare OS | `.env` | Config paths | Active |
| .config/gemini | `.env` | Gemini CLI | Active |
| .paperclip | `.env` | Agent JWT | Active |
| .openclaw | `.env` | Gateway | Active |

---

## 🤖 LLM API Keys

### Primary LLM Provider (Hermes → OpenRouter)
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
OPENROUTER_API_KEY=***
```

### Google / Gemini
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
GEMINI_API_KEY=***  # Primary (used by Hermes + Gemini CLI)

# File: C:\Users\Ahmed\.config\gemini\.env
GEMINI_API_KEY=***  # Same key, used by local gemini CLI
GEMINI_MODEL=gemini-flash-latest
```

### Anthropic
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
ANTHROPIC_API_KEY=***  # Used by ProCare OS AI assistant

# File: C:\Users\Ahmed\Documents\pharmacy_project\ProCare-OS\.env.example
ANTHROPIC_API_KEY=***  # Available in ProCare OS
```

### Kimi / Moonshot
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
KIMI_API_KEY=***  # (commented out in .env template)
```

---

## 🔧 Tool API Keys

### Firecrawl
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
FIRECRAWL_API_KEY=***

# File: C:\Users\Ahmed\Documents\pharmacy_project\ProCare-OS\.env.example
FIRECRAWL_API_KEY=***  # (commented out)
```

### FAL.ai (Image Generation)
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
FAL_KEY=***
```

### Exa API
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
EXA_API_KEY=***  # Used by Exa web search tool
```

### Parallel AI
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
PARALLEL_API_KEY=***  # (commented out in .env template)
```

---

## 💬 Messaging & Communication

### Slack
```
# File: C:\Users\Ahmed\Documents\procare-pharmacy\.env
SLACK_BOT_TOKEN=***
SLACK_CHANNEL=#pharmacy-alerts

# File: C:\Users\Ahmed\Documents\pharmacy_project\Prospices Finalweb\.env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/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
SLACK_APP_TOKEN=***
```

### WhatsApp
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
WHATSAPP_ENABLED=true
WHATSAPP_MODE=self-chat
WHATSAPP_ALLOWED_USERS=01288385599

# File: C:\Users\Ahmed\Documents\pharmacy_project\ProCare-OS\.env.example
MANAGER_PHONE=***  # (Egyptian number for operational alerts)
WHATSAPP_TOKEN=***  # (commented out)
WHATSAPP_PHONE_ID=***  # (commented out)
```

### Telegram
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
# (All commented out — not currently configured)
# TELEGRAM_BOT_TOKEN=***
# TELEGRAM_ALLOWED_USERS=
# TELEGRAM_HOME_CHANNEL=
```

### Email (SMTP/IMAP)
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
# (All commented out — not currently configured)
# EMAIL_ADDRESS=hermes@gmail.com
# EMAIL_PASSWORD=***  # App password for Gmail
# EMAIL_IMAP_HOST=imap.gmail.com
# EMAIL_SMTP_HOST=smtp.gmail.com
```

---

## 📊 Analytics & Tracking

### PostHog (Antigravity / Cline)
```
# File: C:\Users\Ahmed\.antigravity\extensions/rooveterinaryinc.roo-cline-3.53.0-universal\.env
POSTHOG_API_KEY=phc_jZ...Tesv

# File: C:\Users\Ahmed\.antigravity\extensions/saoudrizwan.claude-dev-3.82.0-universal/.env.example
# (All commented out — placeholder config)
# TELEMETRY_SERVICE_API_KEY=***
# ERROR_SERVICE_API_KEY=***
```

---

## ☁️ Cloud Services

### Himeres (Photon Project)
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
PHOTON_PROJECT_ID=f9c09520-d42d-4272-91fb-2cf955cdc876
PHOTON_PROJECT_SECRET=***
PHOTON_ALLOWED_USERS=+201****5599
PHOTON_HOME_CHANNEL=+201****5599
```

### Minimax
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
# (Commented out)
# MINIMAX_API_KEY=***
```

---

## 🏥 ProCare Pharmacy System

### SQL Server (Vault-Level)
```
# File: C:\Users\Ahmed\Documents\Obsidian Vault\.env
SQL_SERVER=196.202.93.37,1433
SQL_USER=ahmedibrahim
SQL_PASSWORD=***
SQL_DATABASE=stock

# File: C:\Users\Ahmed\Documents\Obsidian Vault\Pharmacy_Project\.env
SQL_SERVER=196.202.93.37,1433
SQL_USER=ahmedibrahim
SQL_PASSWORD=***
SQL_DATABASE=stock
```

### SQL Server (ProCare-OS connections.json)
```
# File: C:\Users\Ahmed\Documents\pharmacy_project\ProCare-OS\config\connections.json
# eStock source (Elsanta branch):
#   Server: 196.202.93.37,1433
#   Database: stock
#   Username: REPLACE_WITH_READONLY_LOGIN
#   Password: REPLACE_ME
# eStock source (Mashala branch):
#   Server: 192.168.1.2,1433
#   Database: stock
#   Username: REPLACE_WITH_READONLY_LOGIN
#   Password: REPLACE_ME
# ProCare database:
#   Server: 192.168.1.2
#   Database: ProCare (Windows Auth for laptop, SQL Auth for production)
```

### GitHub
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
# (Commented out — gh CLI auth used instead)
# GITHUB_TOKEN=***
# GitHub App credentials (for bot identity on PRs)
# GITHUB_APP_ID=***
# GITHUB_APP_PRIVATE_KEY_PATH=***
# GITHUB_APP_INSTALLATION_ID=***
```

---

## 🔧 Development & Infrastructure

### Paperclip JWT Secret
```
# File: C:\Users\Ahmed\.paperclip\instances\default\.env
PAPERCLIP_AGENT_JWT_SECRET=27c214...6581
```

### Hermes Internal
```
# File: C:\Users\Ahmed\AppData\Local\hermes\.env
SUDO_PASSWORD=***
TERMINAL_ENV=local
BROWSERBASE_PROXIES=true
TERMINAL_TIMEOUT=60
TERMINAL_LIFETIME_SECONDS=300
```

### Claude/Cline Extensions
```
# File: C:\Users\Ahmed\.antigravity\extensions\rooveterinaryinc.roo-cline-3.53.0-universal\.env
TELEMETRY_SERVICE_API_KEY=***
ERROR_SERVICE_API_KEY=***
```

---

## 🎯 Credential Status Summary

### Active & In Use
- **GEMINI_API_KEY** — Primary LLM (Hermes + Gemini CLI)
- **OPENROUTER_API_KEY** — LLM router
- **FIRECRAWL_API_KEY** — Web scraping tool
- **FAL_KEY** — Image generation
- **PHOTON_PROJECT_ID/SECRET** — Hermes Photon project
- **POSTHOG_API_KEY** — Cline telemetry
- **SQL credentials** — ProCare pharmacy DB access
- **SLACK_BOT_TOKEN** — ProCare alerts
- **WHATSAPP tokens** — Hermes self-chat + ProCare alerts
- **PAPERCLIP_AGENT_JWT_SECRET** — Paperclip agent

### Available But Not Configured
- EXA_API_KEY, PARALLEL_API_KEY, KIMI_API_KEY, MINIMAX_API_KEY
- TELEGRAM_BOT_TOKEN, EMAIL credentials
- GITHUB_TOKEN (gh CLI used instead)

### Placeholder/Replace
- ProCare-OS connections.json: `REPLACE_ME` / `REPLACE_WITH_READONLY_LOGIN`
- Prospices Finalweb Slack: `***` (partial mask)

---

## 🔗 Linked Resources
- [[AI-Brain/🤖 Antigravity MCP Guide]]
- [[AI-Brain/📋 Team Command Center]]
- [[architecture/sql_bridge]]
- [[Pharmacy_Project/claude.md]]