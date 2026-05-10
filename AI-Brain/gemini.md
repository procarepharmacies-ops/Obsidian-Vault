# 🧠 Project Constitution — Obsidian AI Brain (Karpathy-Style)

> This file is LAW. Only update when schemas change, rules are added, or architecture is modified.

---

## 📌 North Star
Build a **personal knowledge graph** inside Obsidian that aggregates AI conversation memories from Perplexity, Claude, ChatGPT, Copilot, and Gemini — structured as an interconnected, searchable, graph-navigable "Second Brain."

---

## 🗂️ Data Schema

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

### Output: Obsidian Note (Markdown)
```markdown
---
source: ChatGPT
date: 2026-05-09
tags: [ai-memory, topic-tag, source-chatgpt]
type: ai-conversation
topic: "Topic extracted from conversation"
---

# 🗣️ [Conversation Title]

## 💡 Key Insights
- Bullet distilled insights

## 🔗 Linked Concepts
- [[Concept A]]
- [[Concept B]]

## 📝 Raw Summary
> Condensed version of the full conversation

## 🏷️ Metadata
- **Source:** ChatGPT
- **Date:** 2026-05-09
- **Original ID:** abc123
```

---

## 🏛️ Architectural Invariants

1. **One note per conversation** — never merge conversations into one file
2. **All notes use YAML frontmatter** — required for Dataview queries
3. **All concept links use `[[WikiLinks]]`** — required for graph view
4. **Tags always include** `source-*` and `ai-memory` 
5. **Folder structure is sacred** — see Architecture section
6. **No raw dump notes** — every note must have at least Key Insights extracted

---

## 📁 Obsidian Vault Folder Structure

```
AI-Brain/
├── 📥 _Inbox/           # Raw unprocessed exports land here
├── 🧠 Memories/
│   ├── ChatGPT/
│   ├── Claude/
│   ├── Perplexity/
│   ├── Copilot/
│   └── Gemini/
├── 💡 Concepts/         # Atomic idea notes (Zettelkasten-style)
├── 🗂️ Topics/           # Topic hub notes that link memories
├── 📊 Dashboards/       # Dataview query dashboards
├── ⚙️ Templates/        # Note templates
└── gemini.md            # This file
```

---

## 🔧 Behavioral Rules

- **DO** always extract at least 3 key insights per memory note
- **DO** always link to at least 1 existing Concept note
- **DO NOT** delete raw exports until the processed note is verified
- **DO NOT** use generic titles like "Conversation 1"
- **DO** use descriptive titles like "Claude — Building RAG Systems 2026-05-09"

---

## 🔌 Required Obsidian Plugins

| Plugin | Purpose |
|--------|---------|
| Dataview | Query and dashboard views |
| Templater | Automate note creation from templates |
| Graph View (built-in) | Visual brain map |
| Tag Wrangler | Manage tags at scale |
| QuickAdd | Fast capture workflow |
| Canvas (built-in) | Karpathy-style visual boards |

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
