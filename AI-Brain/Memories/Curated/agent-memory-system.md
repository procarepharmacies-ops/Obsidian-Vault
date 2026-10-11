---
type: memory
status: active
memory_kind: project-context
confidence: high
reviewed: 2026-10-12
tags:
  - ai-memory
  - hermes
  - memory-system
source_notes:
  - "[[AI-Brain/Memories/Verdent/verdent-memory-system-source-record.md]]"
---

# Hermes Memory System Structure

> Curated from `.verdent/workspace/749605882763722752/MEMORY.md` — the Hermes/Verdent memory architecture documentation.

## Directory Structure

The memory system uses a three-layer layout under `memories/`:

```
memories/
├── _index.md              # Index of all memory entries
├── rules/                 # Model directives (auto-loaded)
│   ├── task-dispatch.md    # Framework-managed
│   ├── memory-query.md     # Framework-managed
│   ├── proactivity.md      # User-managed
│   ├── communication.md    # User-managed
│   └── others.md           # User-managed
├── knowledge/             # Accumulated knowledge (search)
│   ├── lessons/            # Experience accumulation
│   ├── code/               # Code analysis results
│   └── projects/           # Project context
└── state/                 # Runtime state
    └── daily/              # Daily work logs
```

## File Conventions

- **Rules files** (`rules/task-dispatch.md`, `rules/memory-query.md`): framework-managed, auto-loaded, overwritten on upgrade
- **User rules** (`rules/proactivity.md`, `rules/communication.md`, `rules/others.md`): user-managed, never overwritten
- **Daily logs**: `state/daily/YYYY-MM-DD.md` — raw logs of what happened
- **Long-term memory**: `MEMORY.md` — curated memories, distilled essence

## Memory Maintenance

Per `AGENTS.md`, every few days:
1. Read recent `memory/YYYY-MM-DD.md` files
2. Identify what's worth keeping long-term
3. Fold it into `MEMORY.md`
4. Remove outdated entries

Daily files are raw notes; `MEMORY.md` is curated wisdom.

## Related

- [[hermes-memory-landscape]]
- [[obsidian-git-setup]]
