---
type: dashboard
tags: [dashboard]
---

# 📊 AI Brain Dashboard

## 🧠 All Memories by Date
```dataview
TABLE source, topic, date
FROM #ai-memory
SORT date DESC
```

## 📦 Memories by Source
```dataview
TABLE length(rows) AS "Count"
FROM #ai-memory
GROUP BY source
```

## 🔥 Recent (Last 30 Days)
```dataview
LIST title
FROM #ai-memory
WHERE date >= date(today) - dur(30 days)
SORT date DESC
```
