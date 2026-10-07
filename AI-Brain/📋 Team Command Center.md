---
type: dashboard
tags: [command-center, team, active]
updated: 2026-10-01
---

# Team Command Center

Task boards live directly in `AI-Brain/`; task queries below scan those notes.

## Ahmed's open tasks
```dataview
TASK
FROM "AI-Brain"
WHERE !completed AND contains(text, "#task") AND page.owner = "Ahmed"
```

## AI queue
```dataview
TASK
FROM "AI-Brain"
WHERE !completed AND contains(text, "#task") AND page.owner = "Gemini"
```

## Recently completed tasks
```dataview
TASK
FROM "AI-Brain"
WHERE completed AND contains(text, "#task")
SORT completion DESC
LIMIT 10
```

## Quick links
- [[📋 Ahmed's Tasks]]
- [[🤖 Gemini's Tasks]]
- [[📖 How We Work Together]]
- [[task_plan]]
- [[progress]]
- [[Dashboards/main-dashboard]]
