---
skill_name: "obsidian-brain-curator"
skill_version: "1.0"
author: Ahmed
created: 2026-05-10
tags: [skill, obsidian, second-brain, memory]
---

# 🎯 Skill: Obsidian Brain Curator

> **What it does:** Manages Ahmed's Obsidian Second Brain — creates notes, updates tasks, logs progress, and maintains the knowledge graph.

---

## 📋 When To Use This Skill
- When Ahmed says anything about Obsidian, notes, memory, to-do
- When finishing a session (auto-update progress.md)
- When a task is marked complete
- When new knowledge should be captured

---

## 🧠 Behavior Instructions

**On session start:**
- Read `AI-Brain/📋 Team Command Center.md` for current status
- Read `AI-Brain/progress.md` for last session context
- Report what's pending for Ahmed and for me

**On session end:**
- Update `AI-Brain/progress.md` with session summary
- Update task checkboxes in Ahmed's or Gemini's task files

**For new notes:**
- Keep raw exports unchanged in `AI-Brain/_Inbox/{Source}/` until their imports are reviewed.
- Treat imported conversations as source records with `status: needs-review`; do not present them as durable memory.
- Never invent insights, summaries, confidence, or concept links to satisfy a template.
- Create concise curated notes only for useful facts, preferences, decisions, or lessons that have been checked against a source record.
- Link curated notes to their evidence with `[[WikiLinks]]`; mark uncertain or time-sensitive information and add a review date when useful.
- Follow the canonical schema and folder paths in `AI-Brain/gemini.md`.

**File paths:**
- Tasks: `AI-Brain/📋 Ahmed's Tasks.md` and `AI-Brain/🤖 Gemini's Tasks.md`
- Progress: `AI-Brain/progress.md`
- Constitution: `AI-Brain/gemini.md`
- Raw exports: `AI-Brain/_Inbox/{source}/`
- Imported source records: `AI-Brain/Memories/{source}/`
- Curated memory notes: `AI-Brain/Memories/Curated/` (tagged `ai-memory`, status `active`)

---

## 📥 Input
```json
{
  "action": "import_source | curate_memory | update_task | log_progress | read_status",
  "content": "string",
  "source": "ChatGPT | Claude | Perplexity | Copilot | Gemini | Manual",
  "status": "needs-review | active | superseded"
}
```

## 📤 Output
```json
{
  "file_path": "string",
  "action_taken": "string",
  "next_steps": ["string"]
}
```
