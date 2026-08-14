---
tags: [hermes, session-log, fleet, dashboard, router, AP-mode]
date: 2026-08-14
type: conversation
related: [[Ahmed's Tasks]] [[Hermes Fleet Plan]]
---

# 2026-08-14 — Hermes Setup, Dashboard Fix & STC Router AP Conversion

> Session summary: multi-machine Hermes plan, dashboard IPC-bridge fix, and converting the STC LTE router to an Access Point.

## 1. Hermes Multi-Machine Fleet Plan (deferred to tomorrow)
- Architecture: **one account, one memory** on the laptop (the "hub"); 4 machines are **SSH-reachable workers**.
- Full prompts: `C:\Users\Ahmed\hermes-multi-machine-plan.md`.
- Kanban board **`hermes-fleet`** (11 steps). Deferred to tomorrow.

## 2. Dashboard "Desktop IPC bridge is unavailable" — FIXED
- Root cause: orphaned `hermes dashboard` process holding port 9119 → new launches failed `Errno 10048`, IPC bridge couldn't reconnect.
- Fix: `netstat -ano | grep ':9119'` → `taskkill /PID <n> /F` → `hermes dashboard --skip-build --no-open --port 9119`. Verified `/api/health` + `/api/status` = 200.
- Desktop backend (port 57654) also recovered.

## 3. STC Router → Access Point (TASK DONE)
- Huawei E5172 LTE Gateway @ `192.168.1.40` (admin/admin). AP mode, static IP kept, DHCP disabled.
- Backup caveat: .cfg not saveable via headless browser → manual backup still TODO.
- Task `t_cfeadfbc` marked completed.

## 4. Kanban (default board)
- ✅ `t_cfeadfbc` done. ⚠️ `t_7117a356`, `t_67af9612`, `t_1e88cc95` blocked (dispatcher crash).

## Commands
```bash
netstat -ano | grep ':9119'
taskkill /PID <n> /F
hermes dashboard --skip-build --no-open --port 9119
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9119/api/health
hermes kanban --board default complete t_cfeadfbc
```
