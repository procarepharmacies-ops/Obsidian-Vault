---
type: dashboard
tags:
  - dashboard
  - knowledge-graph
  - ai-brain
title: 🧠 AI Knowledge Graph & Concepts Dashboard
---

# 🧠 Knowledge Graph & Brain Overview

> Interactive overview of concepts, topics, and memory connections across all AI platforms.

---

## 🧭 High-Level Knowledge Map

```dataview
TABLE length(rows) AS "Total Notes", join(unique(file.folder), ", ") AS "Folders"
FROM "AI-Brain"
GROUP BY type
SORT length(rows) DESC
```

---

## 💡 Concept Hubs & Synthesized Insights
```dataview
TABLE description, related_topics, file.mday AS "Last Updated"
FROM "AI-Brain/Concepts"
WHERE type = "concept" OR contains(tags, "concept")
SORT file.mtime DESC
```

---

## 🗂️ Active Topics & Domain Areas
```dataview
TABLE status, priority, file.outlinks AS "Linked Concepts"
FROM "AI-Brain/Topics"
SORT file.name ASC
```

---

## 📥 Ingestion & Source Breakdown
```dataview
TABLE length(rows) AS "Total Records", min(date) AS "Earliest", max(date) AS "Latest"
FROM "AI-Brain/Memories"
WHERE type = "source-record" OR contains(tags, "ai-source-record")
GROUP BY source
SORT length(rows) DESC
```

---

## 🔍 Recent Conversations Needing Review
```dataview
TABLE source, date, title
FROM #ai-source-record
WHERE status = "needs-review"
SORT date DESC
LIMIT 15
```
