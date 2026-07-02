# Hermes — ProCare AI Hub

Hermes is a unified AI messaging hub, pharmacy operations automation platform, and personal task runner built for ProCare Pharmacy. It combines the power of multiple AI providers (Claude, Gemini) with purpose-built pharmacy workflows and a clean desktop UI.

---

## Modules

### 1. AI Messaging Hub (`core/ai_hub.py`)
Routes messages between Claude (Anthropic) and Gemini (Google) with automatic provider selection. Stores all conversations in a local SQLite database.

### 2. ProCare Pharmacy Operations (`core/pharmacy.py`)
Automates refill requests, patient notifications, and daily reporting. Integrates with pharmacy webhooks or runs in demo/mock mode.

### 3. Personal Task Runner (`core/task_runner.py`)
Priority-based task management with due-date alerts and scheduled checks. Priorities: 1=Urgent, 2=High, 3=Medium, 4=Low.

### 4. Python CLI (`cli/app.py`)
Beautiful terminal UI built with Typer and Rich. Full access to all Hermes features from the command line.

### 5. Desktop App (`desktop/`)
Tauri + Vite desktop application with a dark ProCare-branded UI. Chat, Pharmacy, and Tasks panels.

---

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm (for desktop app)
- Rust (for Tauri desktop app)

### Python CLI Setup

```bash
# Clone / navigate to the hermes directory
cd /path/to/hermes

# Run the install script (Linux/macOS)
bash scripts/install.sh

# Or on Windows (PowerShell)
./scripts/install.ps1

# Or manually:
pip install -e .

# Copy and fill in your environment variables
cp .env.example ~/.hermes/.env

# Initialize Hermes (creates DB, directories)
hermes init
```

### Desktop App Setup

```bash
cd desktop
npm install
npm run tauri dev    # development
npm run tauri build  # production build
```

---

## Configuration

Copy `.env.example` to `~/.hermes/.env` and fill in:

```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
HERMES_DB_PATH=~/.hermes/hermes.db
HERMES_LOG_LEVEL=INFO
PHARMACY_NAME=ProCare Pharmacy
PHARMACY_WEBHOOK_URL=https://your-webhook-url (optional)
```

---

## Usage Examples

### System Status
```bash
hermes status
```

### AI Chat
```bash
# Auto-select provider
hermes chat

# Use Claude specifically
hermes chat --provider claude

# Use Gemini with a named session
hermes chat --provider gemini --session morning-standup
```

### Pharmacy Operations
```bash
# Create a refill request
hermes pharmacy refill --patient P001 --med "Metformin 500mg" --qty 90

# List pending refills
hermes pharmacy list-pending

# Mark a refill as filled
hermes pharmacy fill REFILL-001

# Daily summary
hermes pharmacy summary
```

### Task Management
```bash
# Add a task
hermes task add --title "Call insurance" --desc "Verify coverage for patient P042" --priority 1 --due 2026-06-05

# List all tasks
hermes task list

# List only pending urgent tasks
hermes task list --status pending --priority 1

# Complete a task
hermes task done 3

# Show overdue tasks
hermes task overdue
```

---

## Architecture

```
hermes/
├── core/
│   ├── config.py        # Pydantic settings (loads .env)
│   ├── database.py      # Async SQLite via aiosqlite
│   ├── ai_hub.py        # Multi-provider AI routing
│   ├── pharmacy.py      # ProCare pharmacy automation
│   └── task_runner.py   # Task management
├── cli/
│   └── app.py           # Typer + Rich CLI
├── desktop/
│   ├── index.html       # Tauri frontend UI
│   ├── src/main.js      # Frontend JavaScript
│   ├── vite.config.js   # Vite build config
│   └── src-tauri/       # Rust/Tauri backend
├── scripts/
│   ├── install.sh       # Linux/macOS setup
│   └── install.ps1      # Windows setup
├── .env.example
├── requirements.txt
└── setup.py
```

---

## License

Proprietary — ProCare Pharmacies. All rights reserved.
