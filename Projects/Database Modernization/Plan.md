---
tags: [project, database-modernization, procare]
repo: https://github.com/procarepharmacies-ops/database-modernization
local: C:\Users\Ahmed\Code\database-modernization
---

> Board: [[Kanban]] · Log: [[Progress]] · Decisions: [[Decisions]]

# ProCare Database Modernization — Master Plan (step by step)

> **Where this plan will live:**
> - **Vault:** `Projects/Database Modernization/Plan.md`
> - **Repo:** `docs/PLAN.md` in `procarepharmacies-ops/database-modernization`
> - **Daily progress:** `Progress.md`
> - **Daily tasks:** Kanban board `db-modernization` (one card per day)
>
> **Symbols:** ☐ = to do, 👤 = you do it in person at the PC/branch, 🤖 = Claude/Hermes does it from the laptop.

---

## 0. Context
**The setup today:**
- Two pharmacies run the legacy E-Stock app on **SQL Server 2008**.
- **Elsanta (main):** 2 desktops, primary DB `stock` (154k+ bills).
- **Mashala:** its own SQL 2008, replicated to Elsanta.
- **Resources (no purchases):**
  - the laptop (WSL + Hermes, already installed);
  - an old Lenovo (Windows 7; legacy licence locked to its disk; old pre-Elsanta DB);
  - a 5 TB external drive and a 399 GB external drive;
  - Cloudflare + `prospices.net`;
  - one Hikvision NVR in each branch;
  - the Obsidian vault (AI brain) on GitHub.

**Goal:**
- A modern, backed-up, queryable data layer, without breaking the legacy app.
- Everything managed from the laptop and from Discord on the phone.
- Camera-based attendance and analysis.

**Reused, not rebuilt:**
- `architecture/hermes-four-location-setup.md`
- `AI-Brain/Memories/Curated/hermes-fleet-architecture.md`
- `architecture/sql_bridge.md`
- `Pharmacy_Project/data_dictionary.md` and `findings.md` (use `insert_date`, not `bill_date`)
- `Pharmacy_Project/backend` (FastAPI)
- `Procare--system` (dashboard + alert engine)
- `AI-Brain/enable_remote_elsanta.ps1`
- skills: `procare-weekly-roster`, `pharmacy-network-config`

**Golden rules:**
1. The legacy app is the only thing that writes to the live 2008 DB. Hermes and all scripts use the read-only login.
2. Back up before every risky step.
3. Formatting a disk, force-pushing, or rewriting history happens only after your "OK" at that moment.

## 1. Target design
```
Phone (Discord) ──┐
Laptop (WSL, Hermes CLI) ──┼── Tailscale private network ──┐
                                                           │
Lenovo "procare-hub"  (boots Ubuntu Server from 399 GB USB)│
  • 5 TB USB: NAS shares, backups, Win7 image, NVR exports │
  • Hermes gateway 24/7 (Discord bot)                      │
  • Reporting DB  procare_dw  (SQL 2022 Linux / PostgreSQL)│
  • cloudflared → dash.prospices.net (Cloudflare Access)   │
                                                           │
Elsanta PC (SQL 2008 primary) ◄─ replication ─ Mashala PC  │
Elsanta NVR / Mashala NVR (events → attendance) ───────────┘
```
- **Lenovo internal Win7 disk:** never written to. To boot Win7 again, unplug the USB drive.
- **Free tools only:** Tailscale, Ubuntu Pro (5 machines), Cloudflare R2 (10 GB free), Discord, Bitwarden, Clonezilla, restic.

## 2. Repo layout — `database-modernization` (private)
```
CLAUDE.md            rules + pointer to vault project folder
docs/PLAN.md         this plan      docs/PROGRESS.md (mirror of vault)
docs/inventory.md    hardware/network inventory
sql/                 schema snapshots, views, read-only login script
etl/                 Python (pyodbc) 2008 → procare_dw sync + checks
infra/               ubuntu, samba, tailscale, cloudflared, systemd units
hermes/              skills + cron prompts (sales, stock, backups, attendance)
attendance/          NVR ISAPI collector
.env.example         (real .env is git-ignored)
```
**Where the files sync:**
- Local clone: `C:\Users\Ahmed\Code\database-modernization`.
- The vault links to it from `Projects/Database Modernization/`.
- obsidian-git syncs the vault, and the repo is committed and pushed every working day.

---

## PHASE A — Plan & workspace (Days 1–2)

### Day 1 — Put the plan where you can reach it
1. ☐ 🤖 Install the GitHub CLI in WSL: `sudo apt install gh`, then `gh auth login`. 👤 You approve in the browser.
2. ☐ 🤖 Create the private repo: `gh repo create procarepharmacies-ops/database-modernization --private`.
3. ☐ 🤖 Clone it to `C:\Users\Ahmed\Code\database-modernization`, then add the folder layout, `CLAUDE.md`, `.gitignore` and `.env.example`.
4. ☐ 🤖 Copy this plan to `docs/PLAN.md` and to vault `Projects/Database Modernization/Plan.md`.
5. ☐ 🤖 Create the vault notes `Progress.md` (daily log template) and `Decisions.md`.
6. ☐ 🤖 Create the Kanban board `db-modernization` with one card per day.
7. ☐ 🤖 Commit and push both the repo and the vault. 👤 Open Obsidian and check the project folder appears.
- **Done when:** the plan opens from Obsidian on the laptop and from GitHub on the phone.

### Day 2 — Inventory everything
1. ☐ 👤 On each PC (Elsanta ×2, Mashala, Lenovo), run `winver` and `systeminfo`, and read the CPU, RAM and free disk space.
2. ☐ 👤 Open SSMS → `SELECT @@VERSION` on Elsanta and Mashala. Note the edition (Express or Standard) and the DB size.
3. ☐ 👤 Note the NVR models (sticker or web UI → Device Info) and the number and model of cameras.
4. ☐ 👤 Note the router model and admin IP at each branch, and the internet speed.
5. ☐ 🤖 Write everything into `docs/inventory.md` and the vault.
- **Decision:** if the Lenovo has under 4 GB RAM, the reporting DB becomes PostgreSQL instead of SQL Server 2022.

---

## PHASE B — Security (Days 3–5)
> Moved here at your request. Until it's done, the public repos and open ports stay a risk.

### Day 3 — Close the GitHub leak
1. ☐ 👤 GitHub → `Obsidian-Vault` → Settings → Change visibility → **Private**. Do the same for `Procare--system`.
2. ☐ 👤 Turn on 2FA for GitHub and for the Microsoft account.
3. ☐ 👤 Install Bitwarden (free) and store all passwords there.
4. ☐ 👤 Change the passwords for the Microsoft account, the Windows users, SQL `sa` and `ahmedibrahim`, and UltraViewer. Save the new ones only in Bitwarden.
5. ☐ 🤖 Update the local `.env` files with the new SQL password and test the dashboard.

### Day 4 — Private network (Tailscale)
1. ☐ 👤 Make a free Tailscale account and install it on the laptop (Windows), your phone, the Elsanta PC and the Mashala PC.
2. ☐ 🤖 Install Tailscale inside WSL too. Name the machines `laptop`, `elsanta`, `mashala`.
3. ☐ 👤 Test RDP to `elsanta` over Tailscale, then to `mashala`.
4. ☐ 🤖 Test SQL from the laptop: `Test-NetConnection elsanta -Port 1433`.
5. ☐ 👤 On each Huawei router: delete the port-forward rules for 3389, 445, 135, 139 and 1433, and turn off UPnP.
6. ☐ 🤖 Check from outside that those ports are closed.

### Day 5 — Clean history & guardrails
1. ☐ 🤖 Remove the secret files and lines from both repos and add them to `.gitignore`.
2. ☐ 🤖 Rewrite git history with `git filter-repo`. 👤 You give the OK before the force-push.
3. ☐ 🤖 Add a `gitleaks` pre-commit hook to all three repos and run `gitleaks detect`, which should come back clean.
4. ☐ 🤖 Create the read-only SQL login `hermes_ro` (`db_datareader` on `stock`) with the script in `sql/`. 👤 You run it in SSMS.

---

## PHASE C — Remote control & backups (Days 6–9)

### Day 6 — SSH into both branches
1. ☐ 👤 On Elsanta, run `enable_remote_elsanta.ps1`. It will be revised to allow SSH from Tailscale only.
2. ☐ 👤 Same on Mashala.
3. ☐ 🤖 Copy the laptop SSH key to both, and add `ssh elsanta` and `ssh mashala` to `~/.ssh/config`.
4. ☐ 🤖 Test: `ssh elsanta hostname` and `ssh mashala hostname`.

### Day 7 — Hermes on the laptop
1. ☐ 🤖 Run `hermes doctor` and fix any problems.
2. ☐ 🤖 Point Hermes at the branches through its `ssh` backend (profiles `elsanta` and `mashala`).
3. ☐ 👤 Create a private Discord server and a bot (Developer Portal), and copy the token.
4. ☐ 🤖 Run `hermes gateway setup`, choose Discord, and allow only your Discord user ID.
5. ☐ 👤 From the phone, send "hello". The bot should answer.

### Day 8 — Nightly backups
1. ☐ 🤖 Write `infra/backup_stock.ps1`: `BACKUP DATABASE stock` with compression where the edition allows, plus a date-stamped file name.
2. ☐ 👤 Add it to Task Scheduler at 02:00 on Elsanta and on Mashala.
3. ☐ 👤 Run it once by hand and check the `.bak` file is there.
4. ☐ 🤖 Copy the backups to the laptop / 399 GB drive for now. This copy moves to the hub in Phase D.

### Day 9 — Prove backups work + morning report
1. ☐ 🤖 Restore last night's Elsanta `.bak` on the laptop (SQL Express or Docker) as `stock_test`.
2. ☐ 🤖 Compare row counts with the live DB.
3. ☐ 🤖 Add a Hermes cron job: every day at 08:00, "Backups OK? sizes, dates", posted to Discord.

---

## PHASE D — Lenovo becomes "procare-hub" (Days 10–15)

### Day 10 — Prepare the drives (careful)
1. ☐ 👤 Copy anything you need off the **399 GB** drive, which will be erased.
2. ☐ 👤 Check what's on the **5 TB** drive. Existing files stay, and we add folders.
3. ☐ 🤖 Make a Clonezilla USB and an Ubuntu Server 24.04 USB. A spare USB stick of 8 GB or more is enough. If you don't have one, the laptop can do it with Ventoy on the 399 GB drive temporarily.
4. ☐ 👤 Lenovo BIOS: check that it can boot from USB and note the boot-menu key.

### Day 11 — Save Windows 7 forever
1. ☐ 👤 Boot Clonezilla → device-image → save the whole internal disk to the 5 TB drive in `win7-image/`.
2. ☐ 👤 Check the image (Clonezilla offers this at the end).
3. ☐ 🤖 Record the image date and size in the vault.

### Day 12 — Install Ubuntu on the 399 GB drive
1. ☐ 👤 Boot the Ubuntu installer. Target the **399 GB USB drive only**; do not touch the internal disk.
2. ☐ 👤 Set user `procare`, hostname `procare-hub`, and turn on OpenSSH.
3. ☐ 🤖 Over SSH:
   - `sudo pro attach` (free token);
   - unattended-upgrades;
   - Livepatch;
   - `ufw` deny-incoming;
   - Tailscale;
   - `smartmontools`.
4. ☐ 🤖 Stop Ubuntu from auto-mounting the internal Win7 disk.

### Day 13 — NAS on the 5 TB drive
1. ☐ 🤖 Mount the 5 TB drive at `/srv/data` using its UUID in fstab.
2. ☐ 🤖 Create the folders `backups/`, `shared/`, `nvr-exports/`, `win7-image/`.
3. ☐ 🤖 Set up Samba shares reachable over Tailscale only.
4. ☐ 👤 Map `\\procare-hub\shared` as a drive on the branch PCs and the laptop.

### Day 14 — Backups to the hub + off-site
1. ☐ 🤖 Change the branch backup jobs to copy to `\\procare-hub\backups`.
2. ☐ 🤖 Keep 7 daily, 4 weekly and 12 monthly copies, plus a second copy on the 399 GB `/backup-mirror`.
3. ☐ 👤 Create a free Cloudflare R2 bucket. 🤖 Set up restic encrypted off-site backups of the latest weekly copy.

### Day 15 — Move the Discord bot to the hub (24/7)
1. ☐ 🤖 Install Hermes on the hub and copy the config.
2. ☐ 🤖 Run `hermes gateway install --start-now --start-on-login` and `loginctl enable-linger procare`.
3. ☐ 🤖 Stop the gateway on the laptop. The laptop stays the CLI seat.
4. ☐ 👤 Turn the laptop off and message the bot. It should still answer.

---

## PHASE E — Modern reporting database (Days 16–21)

### Day 16 — Install the reporting DB
1. ☐ 🤖 Install SQL Server 2022 Express for Linux on the hub, or PostgreSQL if RAM is low (decided on Day 2).
2. ☐ 🤖 Restore the latest Elsanta `.bak` as `stock_copy` and check that it opens.

### Day 17 — Map the old schema
1. ☐ 🤖 Export all tables, columns, keys and row counts to `sql/schema_2008.md`.
2. ☐ 🤖 Extend `data_dictionary.md`: sales, stock, products, expiry, customers, employees.

### Day 18 — Design `procare_dw`
1. ☐ 🤖 Create clean tables:
   - `dim_branch`, `dim_product`, `dim_employee`;
   - `fact_sales`, `fact_sales_line`, `fact_stock_daily`;
   - `attendance`.
2. ☐ 🤖 Write the design down in `Decisions.md`.

### Days 19–20 — Sync job
1. ☐ 🤖 Build `etl/sync.py`. Every 15 minutes it reads new rows (by `insert_date`) from Elsanta and Mashala using `hermes_ro` and writes them to `procare_dw`.
2. ☐ 🤖 Run it on a systemd timer on the hub, with logs in `/srv/data/logs`.

### Day 21 — Trust checks
1. ☐ 🤖 Build `etl/checks.py`: row counts and daily revenue per branch, legacy versus `procare_dw`.
2. ☐ 🤖 Hermes posts ✅/❌ to Discord every night.

---

## PHASE F — Dashboard & phone (Days 22–25)

### Day 22 — Point the dashboard at the new DB
1. ☐ 🤖 Switch the existing FastAPI/React dashboard (`Pharmacy_Project`, `Procare--system`) to `procare_dw`.
2. ☐ 🤖 Run it on the hub as a service.

### Day 23 — Publish it safely
1. ☐ 🤖 Set up the `cloudflared` tunnel on the hub so `dash.prospices.net` reaches the dashboard.
2. ☐ 👤 Cloudflare Zero Trust → Access → allow only your email (one-time code).
3. ☐ 👤 Open it on the phone.

### Day 24 — Bot skills
1. ☐ 🤖 Add Hermes skills, in Arabic and English:
   - "مبيعات النهارده" (today's sales);
   - "النواقص" (low stock);
   - "الصلاحية خلال 60 يوم" (expiring within 60 days);
   - "مقارنة الفروع" (branch comparison).
2. ☐ 👤 Test each one from the phone.

### Day 25 — Scheduled reports + DR drill
1. ☐ 🤖 Set up a 21:00 daily summary and a Friday weekly report to Discord.
2. ☐ 🤖 Disaster-recovery drill: restore a branch DB from the NAS and then from R2. Write down how long each takes.

---

## PHASE G — NVR attendance & analysis (Days 26–30)

### Day 26 — Check the NVRs
1. ☐ 👤 NVR web UI: firmware, and whether the cameras support face recognition or people counting.
2. ☐ 🤖 Over Tailscale, turn on ISAPI or event upload to the hub. Change the default NVR passwords.
3. ☐ 👤 Give staff a consent form for face/attendance data (Egypt PDPL 151/2020).

### Days 27–28 — Attendance collector
1. ☐ 🤖 Build `attendance/collector.py`. It reads face-match or door/zone events into `procare_dw.attendance`.
2. ☐ 👤 Enrol staff faces on the NVR, if the cameras support it.
3. ☐ 🤖 Join attendance with `Employee` / `Employee_daily_time` and feed it into `procare-weekly-roster`.

### Day 29 — Analysis
1. ☐ 🤖 Compare people counts per hour with sales per hour for each branch.
2. ☐ 🤖 Turn that into a staffing suggestion in the weekly report.

### Day 30 — Alerts
1. ☐ 🤖 Discord alerts for: late or absent staff, NVR or camera offline, branch PC offline, backup missing.

---

## PHASE H — Live database upgrade decision (Days 31–33)

### Day 31 — Test the legacy app on modern SQL
1. ☐ 🤖 Restore `stock` on a SQL 2022 test instance, using compat level 100.
2. ☐ 👤 Point one E-Stock client at it (the laptop or a spare PC). Test a sale, a return, a purchase and a stock check.

### Day 32 — Decide
- **Pass:** write the weekend cut-over runbook: Elsanta first, then Mashala, rebuild replication, with rollback to the 2008 `.bak`.
- **Fail:** keep 2008 private behind Tailscale. `procare_dw` stays the modern layer.

### Day 33 — Handover
1. ☐ 🤖 Final docs: runbooks (backup, restore, add a branch, bot commands) in the repo and the vault.

---

## Verification checklist (end of each phase)
- **A:** the plan is visible in Obsidian and on GitHub (phone).
- **B:**
  - both repos return 404 when signed out;
  - no 3389, 445 or 1433 visible from the internet;
  - `gitleaks detect` is clean.
- **C:** `ssh elsanta`, `ssh mashala` work; the Discord bot answers; the restored `stock_test` row counts match.
- **D:**
  - `ssh procare-hub` works;
  - the NAS drive is mapped on the PCs;
  - backups are on the hub and in R2;
  - the bot answers with the laptop off.
- **E:** daily revenue in `procare_dw` matches legacy for 7 days in a row.
- **F:** `dash.prospices.net` asks for a login and shows live numbers.
- **G:** a test employee's arrival shows in `attendance` within 5 minutes.
- **H:** a written go/no-go decision and runbook.

## Assumptions
- 1–3 h/day, about 33 working days. More hours each day means fewer days, in the same order.
- The Discord bot answers the owner only. Read-only staff access can come later.
- There are no purchases. A USB stick for installers is assumed. If none, use Ventoy on the 399 GB drive before it becomes the OS drive.

## Out of scope
Replacing the legacy E-Stock app, and writing to the live 2008 database.
