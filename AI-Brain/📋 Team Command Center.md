---
type: dashboard
tags: [command-center, team, active]
updated: 2026-05-09
---

# 🚀 Team Command Center

> **We operate as a team.** Ahmed = Executor. Gemini = Architect & Researcher.
> This is our shared mission control. Check this file every session.

---

## 🔴 ACTIVE RIGHT NOW

```dataview
TABLE status, owner, due
FROM "AI-Brain/Tasks"
WHERE status = "🔴 In Progress"
SORT due ASC
```

---

## 👤 Ahmed's To-Do (Your Actions)

> These are tasks **only you can do** — they require your hands, accounts, or decisions.

```dataview
TABLE priority, due, project
FROM "AI-Brain/Tasks"
WHERE owner = "Ahmed" AND status != "✅ Done"
SORT priority ASC
```

---

## 🤖 Gemini's To-Do (My Actions)

> Tasks I will execute autonomously — writing code, building files, researching.

```dataview
TABLE priority, due, project
FROM "AI-Brain/Tasks"
WHERE owner = "Gemini" AND status != "✅ Done"
SORT priority ASC
```

---

## ✅ Recently Completed

```dataview
TABLE owner, completed, project
FROM "AI-Brain/Tasks"
WHERE status = "✅ Done"
SORT completed DESC
LIMIT 10
```

---

## 📊 Project Health

```dataview
TABLE length(rows) AS "Total Tasks", length(filter(rows, (r) => r.status = "✅ Done")) AS "Done"
FROM "AI-Brain/Tasks"
GROUP BY project
```

---

## 🔗 Quick Links

- [[📋 Ahmed's Tasks]] — Your personal to-do list
- [[🤖 Gemini's Tasks]] — What I'm working on
- [[📖 How We Work Together]] — Team operating manual
- [[task_plan.md]] — Master project plan
- [[progress.md]] — Session progress log
