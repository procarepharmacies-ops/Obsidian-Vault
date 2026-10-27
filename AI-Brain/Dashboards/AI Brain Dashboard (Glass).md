---
type: dashboard
tags:
  - dashboard
  - glassmorphism
  - ai-brain
cssclasses:
  - glass-dashboard
title: 🧠 AI Brain — Glassmorphism Dashboard
---

# 🧠 AI Brain — Executive Glassmorphism Dashboard

> [!TIP] Interactive React Glassmorphism Dashboard
> Below is your live **React + Glassmorphism Dashboard**. You can interact with tabs, filter concepts, toggle tasks, or click **"Open in Browser"** to launch it full-screen.

<div style="margin-bottom: 12px; display: flex; gap: 8px;">
  <a href="file:///c:/Users/Ahmed/Documents/Obsidian%20Vault/AI-Brain/Dashboards/ai-brain-glass-dashboard.html" class="glass-pill" style="display: inline-block; padding: 6px 14px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; color: #a5b4fc; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3);">
    🌐 Open Fullscreen in Browser ↗
  </a>
  <a href="obsidian://open?vault=Obsidian%20Vault&file=AI-Brain%2FDashboards%2Fmain-dashboard" class="glass-pill" style="display: inline-block; padding: 6px 14px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; color: #34d399; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3);">
    📊 Open Classic Dataview
  </a>
</div>

<iframe src="ai-brain-glass-dashboard.html" width="100%" height="900px" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: #07090e; box-shadow: 0 20px 50px rgba(0,0,0,0.5);"></iframe>

---

## ⚡ Live Vault Telemetry & Review Queue (Native Dataview)

```dataview
TABLE source, date, title
FROM #ai-source-record
WHERE status = "needs-review"
SORT date DESC
LIMIT 10
```
