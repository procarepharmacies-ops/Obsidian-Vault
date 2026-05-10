---
type: guide
tags: [skills, antigravity, setup]
updated: 2026-05-10
---

# ⚡ Skills Directory — How It Works

> Skills are **behavior instructions** for Gemini AI.
> You write them here in Obsidian → I read them via the Filesystem MCP → I act accordingly.

---

## 🗂️ What's In This Folder

| File                         | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `⚙️ TEMPLATE - New Skill.md` | Copy this to create a new skill              |
| `blast-protocol.md`          | Enforces B.L.A.S.T. workflow on all projects |
| `obsidian-brain-curator.md`  | Manages your Second Brain notes and tasks    |

---

## 🔄 How Skills Flow Into Antigravity

```
You write skill in           Filesystem MCP         Gemini reads &
skills/ folder         →     exposes the file   →   applies the rules
(Obsidian)                   to Antigravity          in conversations
```

**Paths Antigravity can now access:**
- `C:\Users\Ahmed\Documents\Obsidian Vault\` ← Your vault (skills live here)
- `C:\Users\Ahmed\.gemini\antigravity\knowledge\` ← Built-in knowledge items
- `C:\Users\Ahmed\.gemini\antigravity\brain\` ← Conversation memory

---

## ✍️ How to Create a New Skill

1. **Copy the template:**
   Duplicate `⚙️ TEMPLATE - New Skill.md` → rename it

2. **Fill in the 6 sections:**
   - `skill_name` in the frontmatter
   - When to use it
   - Behavior instructions (DO / NEVER)
   - Input/Output JSON schema
   - An example

3. **Tell me it exists:**
   > "I created a new skill: [skill name]. Read it from the skills folder."

4. **I'll apply it immediately** — no restart needed.

---

## 💡 Skill Ideas To Build Next

| Skill | What it would do |
|-------|-----------------|
| `daily-review.md` | Guide me through your daily Obsidian review routine |
| `prospices-intelligence.md` | Rules for ProSpices competitive research |
| `code-review.md` | My code review style and checklist |
| `email-writer.md` | Your tone and format for professional emails |
| `meeting-notes.md` | Template and capture flow for meeting notes |

---

## 📁 Skills Folder Structure

```
skills/
├── ⚙️ TEMPLATE - New Skill.md    ← Start here
├── blast-protocol.md              ← B.L.A.S.T. enforcement
├── obsidian-brain-curator.md      ← Second Brain management
└── README.md                      ← This file
```

---

## 🔑 Key Rule

> **Skills are BEHAVIOR, not data.**
> A skill tells me HOW to act, not WHAT to know.
> (Knowledge items in `.gemini/antigravity/knowledge/` are the WHAT.)
