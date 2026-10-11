---
type: memory
status: active
memory_kind: project-context
confidence: high
reviewed: 2026-10-12
tags:
  - ai-memory
  - hermes
  - memory-landscape
  - project-context
source_notes:
  - "[[AI-Brain/Memories/Hermes/memory-landscape-source-record.md]]"
---

# Hermes Memory Landscape — Consolidated

> Durable record of all local memory sources discovered during the 2026-10-12 reconstruction, with their current state and canonical resolution.

## Canonical Memory Store

| Layer | Location | Provider | Status |
|-------|----------|----------|--------|
| **Primary (canonical)** | `C:\Users\Ahmed\Documents\Obsidian Vault` | Obsidian vault + obsidian-git | ✅ Active, GitHub-synced |
| **Runtime (empty)** | `C:\Users\Ahmed\AppData\Local\hermes\memories\` | Hermes local | ⚪ Exists but empty |
| **Blocked** | `C:\Users\Ahmed\AppData\Local\hermes\state.db` | SQLite | ⛔ Not accessible (no consent) |

## Local Memory Sources Found

### 1. OpenClaw Workspace (`.openclaw/workspace/`)

| File | Size | Status |
|------|------|--------|
| `USER.md` | 739 chars | Template — fields unfilled |
| `SOUL.md` | 1,518 chars | **Active** — personality directives |
| `AGENTS.md` | 8,084 chars | **Active** — workspace conventions |
| `TOOLS.md` | 1,200 chars | Template — local notes placeholder |
| `DREAMS.md` | 177 chars | Active — deep-sleep consolidation log |
| `IDENTITY.md` | 1,278 chars | Template — identity unfilled |
| `HEARTBEAT.md` | 244 chars | Template — heartbeat skip instruction |
| `openclaw-workspace-state.json` | 120 chars | Bootstrap state |
| `memory/dreaming/` | 3 phases × 34 days | Dream logs (light/REM/deep) |

### 2. Verdent Workspace (`.verdent/workspace/`)

| File | Size | Status |
|------|------|--------|
| `MEMORY.md` | 1,272 chars | **Active** — memory system documentation |
| `config.json` | 3,357 chars | **Active** — agent UI config (model preferences, terminal, editor) |

### 3. Hermes App (`AppData\Local\hermes`)

| Path | Purpose | Status |
|------|---------|--------|
| `config.yaml` | Main config (102,568 chars) | Source of truth for providers/settings |
| `hermes_constants.py` | Constants & defaults (72,578 chars) | Reference |
| `hermes-agent/AGENTS.md` | Hermes agent guide (5,437 chars) | Reference |
| `hermes-agent/plugins/memory/` | Memory plugin source (31,169 chars) | Reference |
| `hermes-agent/tools/memory_tool.py` | Memory tool (27,857 chars) | Reference |
| `hermes-agent/agent/memory_provider.py` | Provider abstraction (11,816 chars) | Reference |
| `memories/` | Runtime memory directory | ⚪ Empty |
| `state.db` | SQLite state database | ⛔ Not introspected (no consent) |
| `gateway.lifecycle.json` | Gateway lifecycle state | Reviewed |
| `.skills_prompt_snapshot.json` | Active skills manifest | Reviewed |

## Dream Consolidation History

OpenClaw's `memory/dreaming/` directory ran daily consolidation cycles from **2026-08-03 to 2026-09-14** across three phases:
- **Light sleep**: Daily activity summary (mostly "No notable updates")
- **REM sleep**: Pattern reflection and candidate truth extraction
- **Deep sleep**: Promotion of candidates into durable `MEMORY.md`

The system reported **0 candidates promoted** through the final recorded cycle (2026-09-14). The `events.jsonl` log (117 entries) records all dream completion events.

## Key Integrations

- **`OBSIDIAN_VAULT_PATH`** is set in Hermes `.env` → points to `C:\Users\Ahmed\Documents\Obsidian Vault`
- **obsidian-git plugin** syncs the vault to `github.com:procarepharmacies-ops/Obsidian-Vault.git` every 30 min
- **OpenClaw** uses the vault as its long-term memory store via `AGENTS.md` directives
- **Verdent** documents the Hermes memory structure (`rules/`, `knowledge/`, `state/` layout)
- **Hermes fleet** (4-location setup) shares the vault as the single source of truth across all machines

## Decision: Obsidian Vault as Canonical Store

The Obsidian vault is designated the canonical/default memory store because:
1. ✅ GitHub sync provides durable, multi-device, version-controlled persistence
2. ✅ The `gemini.md` constitution defines a 3-layer memory model (raw → source → curated)
3. ✅ obsidian-git plugin provides hands-free auto-commit/push every 30 minutes
4. ✅ Local memory files from `.openclaw/` and `.verdent/` contain personality directives and structure specs worth preserving as curated notes
