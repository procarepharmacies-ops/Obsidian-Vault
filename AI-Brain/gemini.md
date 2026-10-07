# 🧠 AI Brain Data and Workflow Specification

> This is the canonical source for memory schemas, folder paths, and import/review rules. Project-wide behavioral guidance lives in [[claude.md]].

---

## 📌 North Star
Build a private, searchable, user-controlled knowledge base that preserves AI conversation sources and turns only reviewed, reusable information into durable memory. Use links where they clarify relationships; graph density is not a success measure.

---

## 🗂️ Memory Model and Data Schema

The system keeps three distinct layers:

1. **Raw exports** in `AI-Brain/_Inbox/{Source}/` are the untouched source of truth. Never delete an export as part of import.
2. **Source records** in `AI-Brain/Memories/{Source}/` preserve imported conversation transcripts and source metadata. They start with `status: needs-review` and are not trusted as durable personal memory until reviewed.
3. **Curated memory notes** in `AI-Brain/Memories/Curated/` use `type: memory`, `status: active`, and `#ai-memory`. They contain concise, verified facts, preferences, decisions, or lessons, with a link to one or more source records. Correct or supersede stale notes instead of silently accumulating conflicting claims.

Curated memory property conventions: `status` starts as `draft`, becomes `active` after review, and can become `superseded`; `memory_kind` is one of `fact`, `preference`, `decision`, `lesson`, or `project-context`; `confidence` is `high`, `medium`, or `low` and describes the evidence, not model certainty. Leave either blank when the reviewer cannot assign it responsibly. `reviewed` records the last review date; use `review_after` only when a future review is useful.

Concept and topic notes are optional navigation aids. A source record must never invent a concept link to satisfy a numeric quota.

### Input: Raw AI Memory Export
```json
{
  "source": "ChatGPT | Claude | Perplexity | Copilot | Gemini",
  "exported_at": "ISO-8601 timestamp",
  "conversation_id": "string",
  "title": "string",
  "messages": [
    {
      "role": "user | assistant",
      "content": "string",
      "timestamp": "ISO-8601 | null"
    }
  ]
}
```

### Output: Source Record (Markdown)
```markdown
---
type: source-conversation
status: needs-review
source: ChatGPT
source_id: "conversation-id"
date: 2026-05-09
title: "Conversation title"
source_export: "AI-Brain/_Inbox/ChatGPT/conversations.json"
tags: [ai-source-record, source-chatgpt]
---

# 🗣️ [Conversation Title]

## Review
- Summary: pending human review
- Durable facts or preferences: pending human review
- Decisions and lessons: pending human review

## Transcript
Imported messages, with speaker labels.

## 🏷️ Metadata
- **Source:** ChatGPT
- **Date:** 2026-05-09
- **Original ID:** abc123
```

---

## 🏛️ Architectural Invariants

1. One source record per conversation; include a stable source ID in its filename and frontmatter.
2. All generated notes use valid YAML frontmatter and stable, documented property names.
3. Source records use `ai-source-record` and `source-*`; curated memory notes use `ai-memory`. Do not tag unreviewed imports as curated memory.
4. Keep source exports unchanged in `_Inbox` until import and review are complete.
5. Never fabricate summaries, insights, confidence, or links. Mark unreviewed fields as pending review.
6. Importers must preview with `--dry-run`, refuse collisions by default, and replace only when `--overwrite` is explicitly supplied.
7. Curated memories must cite/link their source record and include review status; add expiry/review dates for facts likely to change.

---

## 📁 Obsidian Vault Folder Structure

```
AI-Brain/
├── _Inbox/               # Untouched exports, grouped by source
├── Memories/             # Imported source records, grouped by source
│   ├── ChatGPT/
│   ├── Claude/
│   ├── Perplexity/
│   ├── Copilot/
│   ├── Gemini/
│   └── Curated/           # Reviewed durable memories
├── Concepts/             # Optional concept notes
├── Topics/               # Optional topic hubs
├── Dashboards/            # Dataview dashboards
├── Templates/             # Source-record and curated-memory templates
└── gemini.md              # Canonical data and workflow specification
```

---

## 🔧 Behavioral Rules

- **DO** mark every import `needs-review` until a human reviews it.
- **DO** preserve original export files and record their relative paths.
- **DO** create concise curated notes only for information useful beyond the original conversation.
- **DO** distinguish facts, user preferences, decisions, and tentative suggestions.
- **DO NOT** describe extractive text as a verified insight or summary.
- **DO NOT** delete raw exports as part of parsing.
- **DO NOT** force concept links or a minimum insight count.

---

## 🔌 Supporting Obsidian Features

| Plugin | Purpose |
|--------|---------|
| Dataview | Required by the current dashboard queries |
| Templater | Optional template value insertion |
| Graph View (built-in) | Explore explicit note links |
| Tag Wrangler | Optional bulk tag maintenance |
| QuickAdd | Optional capture shortcuts |
| Canvas (built-in) | Optional visual boards |

---

## 📅 Maintenance Log

| Date | Change |
|------|--------|
| 2026-05-09 | Initial constitution created |
| 2026-05-10 | Skill Sync schemas integrated |

---

## ⚡ Obsidian Skill Sync (Extension)

### 🧭 PURPOSE
Define the invariants and schemas for syncing Obsidian skills to Antigravity.

### 🗂️ DATA SCHEMAS

#### Obsidian Skill Frontmatter
```yaml
---
skill_name: string
trigger_keywords: [string]
description: string
input_schema: object
output_schema: object
---
```

#### Antigravity Knowledge Item Structure
- **Path:** `C:\Users\Ahmed\.gemini\antigravity\knowledge\{skill_name}\`
- **Artifacts:** `artifacts/skill.md`
- **Metadata:** `metadata.json`

### 🏗️ ARCHITECTURAL INVARIANTS
1. **Source of Truth:** Obsidian Vault (`skills/` directory) is the source of truth for skill definitions.
2. **Global Registry:** All synced skills must be appended to the table in `C:\Users\Ahmed\.gemini\antigravity\gemini.md`.
3. **Atomic Sync:** Each skill sync must be verified by checking the existence of its artifact and metadata.
