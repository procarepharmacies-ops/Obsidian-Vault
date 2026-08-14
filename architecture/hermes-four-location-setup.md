---
title: Hermes Four-Location Setup
tags: [hermes, fleet, networking, multi-site, setup]
type: sop
author: Antigravity
---

# 🌐 Hermes Four-Location Network Setup

> **Goal:** Connect Hermes Dashboard agents across 4 locations — 2 on LAN-A, 2 on LAN-B.
> Last updated: 2026-08-14

---

## 🏗️ Network Topology

```
LAN-A (Elsanta Pharmacy — 196.202.93.37)
├── Location 1: Main pharmacy server (Windows 10/11)
│   └── Role: ProCare OS primary + Hermes Dashboard
├── Location 2: Pharmacy workstation
│   └── Role: Hermes Kanboard worker (claude + codex)

LAN-B (Mas-hala Pharmacy — 192.168.1.2)
├── Location 3: Mas-hala branch server
│   └── Role: ProCare OS replica + Hermes Dashboard
└── Location 4: Mas-hala workstation
    └── Role: Hermes Kanboard worker (claude + codex)
```

---

## 🎯 Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │  Central Memory (Obsidian Vault)    │
                    │  GitHub: procarepharmacies-ops/     │
                    │  Synced via obsidian-git plugin     │
                    └──────────────┬──────────┬───────────┘
                              │           │
                    SSH Tunnel    SSH Tunnel
                    (9119)         (9119)
                    │           │
        ┌───────────▼─┐    ┌───▼──────────┐
        │  LAN-A Hub  │    │  LAN-B Hub   │
        │  (Hermes    │    │  (Hermes     │
        │  Dashboard) │    │  Dashboard)  │
        └──┬──┬───────┘    └───┬──┬───────┘
           │  │                │  │
      Worker Worker Worker Worker
      Loc 1  Loc 2  Loc 3  Loc 4
```

---

## 🛠️ Setup Steps

### Step 1: Configure Gateway Mode on Hub Machines

On both hub machines (Location 1 and Location 3), start the Hermes Gateway:

```bash
hermes gateway start --port 9119 --host 0.0.0.0
```

This allows workers from the same LAN to connect.

### Step 2: Configure Worker Machines

On each worker machine (Location 2 and Location 4), set the gateway endpoint:

```bash
hermes gateway connect <HUB_IP>:9119
```

- **Location 2:** `hermes gateway connect <LAN-A-HUB-IP>:9119`
- **Location 4:** `hermes gateway connect <LAN-B-HUB-IP>:9119`

### Step 3: Configure Kanboard Orchestration

On each hub, enable the kanban worker:

```bash
hermes kanban init
hermes kanban start --profile claude,codex
```

Workers at all 4 locations will pull tasks from their local hub's kanban board.

### Step 4: Cross-LAN Task Sync

Use Hermes cron jobs to sync task status between hubs:

```bash
# On LAN-A Hub (Location 1)
hermes cron create --name "sync-to-lan-b" \
  --schedule "*/5 * * * *" \
  --prompt "Sync kanban task status from LAN-A to LAN-B hub at <LAN-B-HUB-IP>:9119"

# On LAN-B Hub (Location 3)  
# (similar, sync to LAN-A)
```

### Step 5: Shared Obsidian Vault

All 4 locations use the same Obsidian vault (`C:\Users\Ahmed\Documents\Obsidian Vault`)
synced via GitHub:
- The `obsidian-git` plugin auto-commits every 10 minutes
- The vault serves as the single source of truth for memory
- Each location's Hermes agent reads from the vault via the `obsidian` skill

---

## 📋 Location Assignments (Template)

### Location 1 — Elsanta Pharmacy (Hub)
```yaml
location: elsanta-pharmacy
lan: lan-a
role: hub
machine: elsanta-pharmacy-pc
ip: 196.202.93.37
hermes_profile: default
tasks: [procare-os-maintenance, bupa-awards, inventory-monitoring]
```

### Location 2 — Elsanta Workstation
```yaml
location: elsanta-work
lan: lan-a
role: worker
machine: elsanta-workstation
hermes_profile: worker
tasks: [backend-dev, frontend-dev, testing]
```

### Location 3 — Mas-hala Pharmacy (Hub)
```yaml
location: mashala-pharmacy
lan: lan-b
role: hub
machine: mashala-pharmacy-pc
ip: 192.168.1.2
hermes_profile: default
tasks: [procare-os-replica, inventory-sync, reporting]
```

### Location 4 — Mas-hala Workstation
```yaml
location: mashala-work
lan: lan-b
role: worker
machine: mashala-workstation
hermes_profile: worker
tasks: [backend-dev, frontend-dev, testing]
```

---

## 🔧 Configuration Files

### `connections.json` Branch Mapping
The `connections.json` already maps both branch servers:
- `elsanta` → `196.202.93.37,1433` → ELSANTA branch
- `mashala` → `192.168.1.2,1433` → MASHALA branch

### Port Summary
| Service | Port | Location |
|---|---|---|
| Hermes Gateway | 9119 | Hub machines (Loc 1, 3) |
| ProCare OS Frontend | 3000 | Hub machines |
| ProCare OS Backend | 8000 | Hub machines |
| SQL Server | 1433 | Pharmacy servers |
| Obsidian Sync | — | All (GitHub) |

---

## 🔗 Related
- [[🔐 API Credentials Hub]]
- [[AI-Brain/🤖 Antigravity MCP Guide]]
- [[Pharmacy_Project/claude.md]]