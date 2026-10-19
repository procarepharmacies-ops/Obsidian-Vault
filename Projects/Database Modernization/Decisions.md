---
tags: [decisions, database-modernization]
---
# Decisions — Database Modernization

| Date | Decision | Why |
|---|---|---|
| 2026-10-20 | Keep legacy E-Stock + SQL 2008 running; build a modern reporting DB (`procare_dw`) next to it | Legacy app works well; replacing it is out of scope |
| 2026-10-20 | No hardware purchases. Lenovo boots Ubuntu Server from the 399 GB USB drive; 5 TB drive = NAS + backups | Maximize existing resources |
| 2026-10-20 | Lenovo internal Win7 disk is never written to (imaged to 5 TB first) | Legacy licence is locked to that disk |
| 2026-10-20 | Tailscale for all remote access; close router port forwards | No open ports to the internet |
| 2026-10-20 | Security phase runs after plan and inventory (Days 3–5) | Owner's priority choice |
| 2026-10-20 | Discord bot answers owner only for now | Least access first |
