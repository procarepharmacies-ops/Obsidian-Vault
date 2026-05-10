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
- Always use YAML frontmatter (source, date, tags, type, topic)
- Use WikiLinks `[[concept]]` for all related concepts
- Extract at least 3 key insights
- Place in correct folder per `gemini.md` schema

**File paths:**
- Tasks: `AI-Brain/📋 Ahmed's Tasks.md` and `AI-Brain/🤖 Gemini's Tasks.md`
- Progress: `AI-Brain/progress.md`
- Constitution: `AI-Brain/gemini.md`
- Memories: `AI-Brain/Memories/{source}/`

---

## 📥 Input
```json
{
  "action": "create_note | update_task | log_progress | read_status",
  "content": "string",
  "source": "ChatGPT | Claude | Perplexity | Copilot | Gemini | Manual"
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
