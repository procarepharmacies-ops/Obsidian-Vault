---
type: source-conversation
status: needs-review
source: Hermes Local Filesystem
source_id: memory-landscape-scan-2026-10-12
date: 2026-10-12
title: "Hermes Memory Landscape — Local Filesystem Scan"
source_export: "C:/Users/Ahmed/AppData/Local/hermes/memories/ (empty), C:/Users/Ahmed/.openclaw/workspace/, C:/Users/Ahmed/.verdent/workspace/"
tags:
  - ai-source-record
  - source-hermes
  - memory-landscape
---

# Hermes Memory Landscape — Local Filesystem Scan

> Raw source record from filesystem reconnaissance on 2026-10-12. Generated as a source record for [[hermes-memory-landscape|curated memory]].

## Directories Scanned

### C:\Users\Ahmed\AppData\Local\hermes\memories\
- **Result**: Directory exists but is **empty**.
- No memory files, no subdirectories with content.
- This is the Hermes runtime memory directory — populated by the memory plugin but currently has no persisted entries.

### C:\Users\Ahmed\.openclaw\workspace\
- Contains the OpenClaw agent workspace files.
- See individual source records: [[openclaw-soul-source-record]], [[openclaw-agents-source-record]]

### C:\Users\Ahmed\.verdent\workspace\
- Contains the Verdent agent workspace.
- Contains `MEMORY.md` (1,272 chars) — memory system documentation.
- Contains `config.json` (3,357 chars) — agent UI config.

### state.db (C:\Users\Ahmed\AppData\Local\hermes\state.db)
- **Blocked**: Direct SQLite introspection was blocked by user consent policy.
- `sqlite3` CLI not found on the system.
- `execute_code` scratch script returned no usable output (exit -1).

## Files Enumerated

| Path | Type | Size | Content Notes |
|------|------|------|---------------|
| `.openclaw/workspace/USER.md` | md | 739 chars | Template — all fields unfilled |
| `.openclaw/workspace/SOUL.md` | md | 1,518 chars | Personality directives (5 core truths, boundaries, vibe) |
| `.openclaw/workspace/AGENTS.md` | md | 8,084 chars | Workspace conventions, memory strategy, red lines |
| `.openclaw/workspace/TOOLS.md` | md | 1,200 chars | Local notes template — empty examples |
| `.openclaw/workspace/DREAMS.md` | md | 177 chars | Deep sleep consolidation summary |
| `.openclaw/workspace/IDENTITY.md` | md | 1,278 chars | Identity template — all fields unfilled |
| `.openclaw/workspace/HEARTBEAT.md` | md | 244 chars | Heartbeat skip template |
| `.openclaw/workspace/openclaw-workspace-state.json` | json | 120 chars | Bootstrap timestamps |
| `.openclaw/workspace/memory/dreaming/` | dir | 3 phases × 34 days | Daily dream logs (light/REM/deep) |
| `.verdent/workspace/749605882763722752/MEMORY.md` | md | 1,272 chars | Memory system structure documentation |
| `.verdent/config.json` | json | 3,357 chars | Agent model preferences, terminal, editor config |
| `.claude.json` | json | 84,169 chars | Claude configuration |
| `hermes-multi-machine-plan.md` | md | 1,677 chars | Fleet architecture plan |

## Review
- Summary: The filesystem contains personality directives, workspace conventions, and system documentation from the OpenClaw and Verdent agent environments. The Hermes local memory directory is empty. The Obsidian vault is the only active memory store with GitHub sync.
- Durable facts or preferences: SOUL.md core truths and boundaries are durable personality directives. Verdent MEMORY.md documents the Hermes memory structure. The multi-machine plan documents the 4-location fleet architecture.
- Decisions and lessons: The Obsidian vault is confirmed as the canonical memory store. GitHub sync is operational. No credentials or secrets preserved.
