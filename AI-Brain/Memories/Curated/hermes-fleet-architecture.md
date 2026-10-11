---
type: memory
status: active
memory_kind: project-context
confidence: high
reviewed: 2026-10-12
tags:
  - ai-memory
  - hermes
  - fleet
  - infrastructure
source_notes:
  - "[[AI-Brain/Memories/Hermes/hermes-fleet-source-record.md]]"
---

# Hermes Fleet — Four-Location Architecture

> Curated from `hermes-multi-machine-plan.md` and vault `architecture/hermes-four-location-setup.md`.

## Network Topology

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

## Central Memory

All 4 locations share the same Obsidian vault (`C:\Users\Ahmed\Documents\Obsidian Vault`) synced via GitHub:
- obsidian-git plugin auto-commits every 30 minutes
- The vault serves as the single source of truth for memory
- Each location's Hermes agent reads from the vault via the `obsidian` skill

## Hub Setup

On both hub machines (Location 1 and Location 3):

```bash
hermes gateway start --port 9119 --host 0.0.0.0
```

## Worker Setup

On each worker machine (Location 2 and Location 4):

```bash
hermes gateway connect <HUB_IP>:9119
```

## Kanboard Orchestration

```bash
hermes kanban init
hermes kanban start --profile claude,codex
```

## Cross-LAN Sync

```bash
# On LAN-A Hub (Location 1)
hermes cron create --name "sync-to-lan-b" \
  --schedule "*/5 * * * *" \
  --prompt "Sync kanban task status from LAN-A to LAN-B hub at <LAN-B-HUB-IP>:9119"
```

## Port Summary

| Service | Port | Location |
|---------|------|----------|
| Hermes Gateway | 9119 | Hub machines (Loc 1, 3) |
| ProCare OS Frontend | 3000 | Hub machines |
| ProCare OS Backend | 8000 | Hub machines |
| SQL Server | 1433 | Pharmacy servers |
| Obsidian Sync | — | All (GitHub) |

## Connection Mapping

| Branch | Server | Port |
|--------|--------|------|
| ELSANTA | 196.202.93.37 | 1433 |
| MASHALA | 192.168.1.2 | 1433 |

## Status

- **Laptop Hub**: ✅ Done — Hermes installed, SSH key configured, `run_on.sh` in place
- **Location 1 (Elsanta Hub)**: ⚪ TODO — needs RDP access, install Hermes + OpenSSH + Gateway 9119
- **Location 3 (Mashala Hub)**: ⚪ TODO — needs RDP access, install Hermes + OpenSSH + Gateway 9119
- **Location 2 (Elsanta Worker)**: ⛔ BLOCKED — needs power-on first
- **Location 4 (Mashala Worker)**: ⛔ BLOCKED — needs power-on first

## Related

- [[obsidian-git-setup]]
- [[hermes-memory-landscape]]
