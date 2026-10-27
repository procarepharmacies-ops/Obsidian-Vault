# 🛰️ SOP: Obsidian 2-Way Git Sync System (Hybrid Architecture)

> **Version:** 2.1.0  
> **Status:** ACTIVE  
> **Sync Cadence:** Every 2 hours (Pull on Startup + Auto Commit/Push every 120m)  
> **Architecture:** A.N.T. Hybrid (Obsidian-Git Plugin + Deterministic Python CLI `tools/git_sync.py`)

---

## 🏗️ 1. Architecture Overview

To guarantee deterministic 2-way sync across multiple devices (Windows desktop, laptops, mobile) without collisions or manual intervention, the vault employs a **Hybrid Sync Model**:

1. **In-App Layer (Obsidian Git Plugin):**
   - Active while Obsidian is open.
   - Automatically pulls incoming remote changes on vault startup (`autoPullOnBoot: true`).
   - Automatically stages, commits, and pushes local changes every **2 hours** (`autoSaveInterval: 120`, `autoPushInterval: 120`, `autoPullInterval: 120`).
   - Automatically pulls remote changes before pushing (`pullBeforePush: true`).
   - Operates with `autoCommitOnlyStaged: false` so all modified and newly created notes are tracked automatically.

2. **Headless / Background Layer (`tools/git_sync.py`):**
   - Operates independently of the Obsidian GUI.
   - Useful for terminal sessions, automated CI/CD, scheduled tasks, or automated backups when Obsidian is closed.
   - Executes atomic Git commands:
     - `git fetch origin main`
     - `git merge --no-edit origin/main` (or pull)
     - `git add -A` (respecting `.gitignore`)
     - `git commit -m "vault backup: YYYY-MM-DD HH:mm:ss"`
     - `git push origin main`
   - Emits structured JSON payloads adhering to the schema in `gemini.md`.

3. **Cloud Storage Coexistence (Google Drive / Remotely Save):**
   - Remotely Save handles mobile sync via Google Drive.
   - `.gitignore` strictly isolates `.obsidian/plugins/remotely-save/data.json`, `.env`, OAuth tokens, and binaries (`*.exe`, `*.zip`) to prevent cross-sync corruption.

---

## ⚙️ 2. Configuration Parameters (Obsidian Git `data.json`)

| Parameter | Value | Purpose |
| :--- | :--- | :--- |
| `autoPullOnBoot` | `true` | Fetch and merge remote changes before any local note edits |
| `autoSaveInterval` | `120` | Commit local changes every 2 hours (120 minutes) |
| `autoPushInterval` | `120` | Push commits to GitHub `origin/main` every 2 hours |
| `autoPullInterval` | `120` | Pull incoming commits from other devices every 2 hours |
| `pullBeforePush` | `true` | Prevent push rejection by merging remote changes first |
| `autoCommitOnlyStaged` | `false` | Stage all working tree changes automatically |
| `syncMethod` | `"merge"` | Deterministic merge strategy for non-conflicting notes |
| `commitMessage` | `"vault backup: {{date}}"` | Consistent audit trail |

---

## 🛠️ 3. Tool Specifications (`tools/git_sync.py`)

- **Execution:** `python tools/git_sync.py [--direction sync|pull|push] [--dry-run]`
- **Exit Codes:**
  - `0`: Sync successful or cleanly up-to-date.
  - `1`: Git merge conflict detected (safely halts and alerts).
  - `2`: Network / Authentication error.
- **Payload:** Outputs JSON result matching `GitSyncResult` in `gemini.md`.

---

## ⚠️ 4. Self-Annealing & Conflict Resolution

If changes to the same markdown note occur concurrently on two devices:
1. Git flags conflict markers (`<<<<<<< HEAD ... ======= ... >>>>>>> origin/main`).
2. Obsidian Git alerts the user with notification toast.
3. The conflict is inspected, edited to resolve, staged, and committed cleanly.
4. Large files (`>50MB`, `.zip`, `.exe`) and `.env` credentials are systematically excluded by `.gitignore`.

---

## 📅 Maintenance Log

| Date | Version | Change Description | Author |
| :--- | :--- | :--- | :--- |
| 2026-05-10 | 1.0.0 | Initial Git SOP created | Antigravity Pilot |
| 2026-10-08 | 2.0.0 | Upgraded to 2-Way Hybrid Model (30m cadence, Google Drive coexistence, headless sync tool) | Antigravity Pilot |
| 2026-10-27 | 2.1.0 | Adjusted sync cadence to 2 hours (120 minutes) across in-app plugin and background scheduler | Antigravity Pilot |
