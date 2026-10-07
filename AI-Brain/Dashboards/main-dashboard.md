---
type: dashboard
tags: [dashboard]
---

# AI Brain

## Review queue
```dataview
TABLE source, source_id, date, title
FROM #ai-source-record
WHERE status = "needs-review"
SORT date DESC
```

## Curated memories
```dataview
TABLE memory_kind, confidence, reviewed, review_after, source_records
FROM #ai-memory
WHERE status = "active"
SORT reviewed DESC
```

## Source records by platform
```dataview
TABLE length(rows) AS "Source records"
FROM #ai-source-record
GROUP BY source
SORT source ASC
```

## Recently reviewed memories
```dataview
LIST
FROM #ai-memory
WHERE reviewed >= date(today) - dur(30 days)
SORT reviewed DESC
LIMIT 20
```
