---
type: manual
tags: [team, workflow, rules]
updated: 2026-05-09
---

# 📖 How Ahmed & Gemini Work Together

> This is our **team operating manual**. Read it once. Refer back when confused.

---

## 🏗️ The Team Structure

| Role | Who | Does What |
|------|-----|-----------|
| **Executor** | Ahmed 👤 | Real-world actions, approvals, exports, decisions |
| **Architect** | Gemini 🤖 | Code, research, file creation, structure, automation |

**The Golden Rule:**
> Ahmed provides the **raw materials** (data, accounts, approvals).
> Gemini provides the **processing** (code, files, pipelines, analysis).

---

## ✅ How To Mark Tasks Done

### In Obsidian (Ahmed's Tasks)
Change `- [ ]` to `- [x]`:
```
Before: - [ ] Install plugins
After:  - [x] Install plugins ✅ 2026-05-09
```

> **Tip:** In Obsidian, click the checkbox directly to toggle it!

### Telling Me (Gemini) You're Done
Just say in our chat:
> *"I finished the plugin install"* or *"Plugins are done ✅"*

I'll update my tracking files and proceed to the next step.

---

## 🔄 Our Session Workflow

Every time we work together:

**Ahmed starts by saying:**
> "Let's work on [project name]" or "Continue where we left off"

**I (Gemini) will:**
1. Check `task_plan.md` → current phase
2. Check `progress.md` → what was done last session
3. Check `🤖 Gemini's Tasks.md` → my queue
4. **Execute** what I can immediately
5. **Report** what I need from you
6. **Update** `progress.md` at end of session

---

## 📬 How To Request New Tasks

**Say it in plain English. I'll handle the rest.**

Examples:
> *"Add a task to build a search dashboard in Obsidian"*
> *"I want to track my ProSpices project here too"*
> *"Remind me to export Claude conversations every Sunday"*

I will:
- Add it to the correct task file (Ahmed's or Gemini's)
- Assign a priority
- Update `task_plan.md` if it's a major phase

---

## 🚦 Status System

| Symbol | Meaning |
|--------|---------|
| 🔴 In Progress | Actively being worked on RIGHT NOW |
| 🟡 Queued | Next in line, ready to start |
| 🟢 Backlog | Important but not urgent |
| ✅ Done | Completed — marked with date |
| ⏳ Blocked | Waiting for something (dependency noted) |
| ❌ Cancelled | No longer needed |

---

## 📁 File Map (Where Everything Lives)

```
AI-Brain/
├── 📋 Team Command Center.md   ← Start here every session
├── 📋 Ahmed's Tasks.md          ← YOUR to-do list
├── 🤖 Gemini's Tasks.md         ← MY to-do list  
├── 📖 How We Work Together.md   ← This file
├── task_plan.md                 ← Master project phases
├── progress.md                  ← Session log
├── findings.md                  ← Research discoveries
├── gemini.md                    ← Memory schemas and workflow specification
├── _Inbox/                      ← Untouched AI exports for review
├── Memories/                    ← Source records and curated memories
├── Templates/                   ← Note templates
├── Dashboards/                  ← Dataview views
├── tools/                       ← Python automation scripts
└── memory-workflow.md           ← Import, review, and curation steps
```

---

## ⚡ Quick Commands (Say These To Me)

| You say... | I do... |
|------------|---------|
| `"Status update"` | I summarize all current tasks and blockers |
| `"What do I need to do?"` | I list only Ahmed's pending tasks |
| `"What are you working on?"` | I explain my current queue |
| `"Mark [task] as done"` | I update the files |
| `"New task: [description]"` | I add and assign it |
| `"What's blocking us?"` | I list all ⏳ blocked items |

---

## 🔁 Weekly Review (Recommended)

Every week, say: **"Weekly review"**

I will:
1. Summarize everything completed this week
2. Highlight what's overdue
3. Propose the plan for next week
4. Update `progress.md` with a week summary
