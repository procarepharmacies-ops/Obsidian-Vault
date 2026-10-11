---
type: source-conversation
status: needs-review
source: Verdent MEMORY.md
source_id: verdent-memory-2026-07-30
date: 2026-07-30
title: "Verdent Memory System — Directory Structure & Conventions"
source_export: "C:/Users/Ahmed/.verdent/workspace/749605882763722752/MEMORY.md"
tags:
  - ai-source-record
  - source-verdent
  - memory-system
---

# Verdent Memory System — Directory Structure & Conventions

> Source record for [[agent-memory-system|curated memory]].

## Transcript

### Memory System Structure

Location: `memories/`
Structure: `_index.md` (index), `rules/` (model directives), `knowledge/` (accumulated knowledge), `state/` (runtime state)

**Rules files** (`rules/task-dispatch.md`, `rules/memory-query.md`): framework-managed, auto-loaded, overwritten on upgrade
**User rules** (`rules/proactivity.md`, `rules/communication.md`, `rules/others.md`): user-managed, never overwritten

### Memory Files Reference

| Directory | Purpose | Examples |
|-----------|---------|---------|
| `rules/` | Model directives (auto-loaded) | `task-dispatch.md`, `memory-query.md`, `proactivity.md` |
| `knowledge/lessons/` | Experience accumulation (search) | `manager-lessons.md` |
| `knowledge/code/` | Code analysis results | `hotfiles-{date}.json` |
| `knowledge/projects/` | Project context | `relations.json` |
| `state/daily/` | Daily work logs | `2026-04-10.md` |

## Review
- Summary: Verdent's MEMORY.md documents a structured, layered memory system with rules, knowledge, and state directories, following the pattern of framework-managed vs user-managed files.
- Durable facts or preferences: The `rules/` directory pattern (auto-loaded vs user-managed) and the distinction between daily logs and long-term curated memory align with Hermes' own memory philosophy.
- Decisions and lessons: When integrating Hermes memory into the Obsidian vault, use a similar `rules/knowledge/state` structure within the vault's memory sections.
