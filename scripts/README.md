---
type: scripts-guide
tags: [commands, terminal, setup]
updated: 2026-06-05
platform: RHEL (Red Hat Enterprise Linux)
---

# ⚡ Terminal Command Center

> **How it works:** Copy any command below → paste in your RHEL terminal → get results.
> Obsidian and terminal stay in sync automatically (same files on disk).

---

## 🔧 Prerequisites (RHEL — run once)

```bash
# Install curl and jq (required by scripts)
sudo dnf install -y curl jq

# Install Node.js (required for MCP servers)
sudo dnf install -y nodejs npm

# Make all scripts executable
chmod +x /home/ahmed/Obsidian-Vault/scripts/*.sh
```

---

## 🚀 Step 1 — First Time Setup (Run Once)

### Install All Obsidian Plugins
```bash
cd /home/ahmed/Obsidian-Vault/scripts
bash 01-install-plugins.sh
```
> After this: Open Obsidian → Settings ⚙️ → Community Plugins → toggle ON each plugin

---

## 📊 Step 2 — Check Status Any Time

### See All Tasks + Plugin Status
```bash
cd /home/ahmed/Obsidian-Vault/scripts
bash 02-check-status.sh
```

---

## ✅ Step 3 — Mark Tasks Done

### Mark a task done (from terminal)
```bash
cd /home/ahmed/Obsidian-Vault/scripts
bash 03-mark-done.sh "Install plugins"
```
> Replace `"Install plugins"` with any task name (partial match works)

### Or just toggle the checkbox in Obsidian — both stay synced!

---

## 🔄 How Sync Works

```
Obsidian Vault (disk)
        ↕  (same files)
  Terminal Scripts
        ↕  (same files)  
    Gemini (me)
```

> **Everything reads/writes the same `.md` files on disk.**
> No extra sync needed — it's always one source of truth.

---

## 📁 Scripts Location

```
/home/ahmed/Obsidian-Vault/
└── scripts/
    ├── 01-install-plugins.sh        ← Install core 4 plugins
    ├── 02-check-status.sh           ← Check all tasks + plugins
    ├── 03-mark-done.sh              ← Mark task complete
    ├── 04-install-power-plugins.sh  ← Install 15 power plugins
    ├── 05-install-antigravity-mcp.sh← Install Gemini MCP servers
    ├── 06-add-brave-search.sh       ← Add Brave Search MCP
    ├── 07-add-duckduckgo-search.sh  ← Add DuckDuckGo MCP (no key needed)
    └── README.md                    ← This file
```

---

## ⚡ Quick Copy Commands

**Open scripts folder in terminal:**
```bash
cd /home/ahmed/Obsidian-Vault/scripts
```

**Install core plugins (run once):**
```bash
bash 01-install-plugins.sh
```

**Install power plugins (15 more):**
```bash
bash 04-install-power-plugins.sh
```

**Install Antigravity MCP servers:**
```bash
bash 05-install-antigravity-mcp.sh
```

**Add Brave Search (needs API key):**
```bash
bash 06-add-brave-search.sh YOUR_API_KEY
```

**Add DuckDuckGo Search (free, no key):**
```bash
bash 07-add-duckduckgo-search.sh
```

**Check status:**
```bash
bash 02-check-status.sh
```

**Mark done:**
```bash
bash 03-mark-done.sh "task name here"
```
