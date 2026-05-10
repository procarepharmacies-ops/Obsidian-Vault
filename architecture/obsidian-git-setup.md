# 🛰️ SOP: Obsidian Git Version Control Setup

> **Version:** 1.0.0
> **Status:** ACTIVE
> **Purpose:** Establish a robust, automated version control system for the Obsidian Vault using Git and GitHub.

---

## 🏗️ 1. Local Initialization

Before connecting to GitHub, we must prepare the local repository.

### A. Initialize Git
Run this in the vault root:
```powershell
git init
```

### B. Create `.gitignore`
Create a file named `.gitignore` in the root to prevent system junk from being tracked.
**Recommended Content:**
```text
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/graph.json
.obsidian/appearance.json
.obsidian/plugins/obsidian-git/data.json
.trash/
*.DS_Store
.tmp/
```

## 🔗 2. GitHub Connection

✅ **Status:** LINKED
**Remote URL:** `https://github.com/procarepharmacies-ops/Obsidian-Vault.git`

The local vault is already connected to the organization repository. No further manual linking is required. 

### Recent Sync Status
- [x] Initial Architecture Push (May 10, 2026)
- [x] `.gitignore` established
- [x] `architecture/` directory synced

---

## ⚙️ 3. Obsidian Plugin Configuration

Once the local repo is linked to GitHub, configure the **Obsidian Git** plugin for automation.

| Setting | Recommendation | Why? |
| :--- | :--- | :--- |
| **Vault backup interval** | `30` minutes | Frequent enough to prevent data loss, low impact. |
| **Auto pull interval** | `10` minutes | Keeps multiple devices in sync automatically. |
| **Commit message** | `vault backup: {{date}}` | Clean, standardized history. |
| **Push on backup** | `Enabled` | Ensures your cloud backup is always up to date. |
| **Pull updates on startup** | `Enabled` | Prevents merge conflicts before you start writing. |

---

## ⚠️ 4. Conflict Resolution

If a conflict occurs (editing same note on two devices):

1. **Don't Panic**: Obsidian Git will notify you.
2. **Merge**: Obsidian will show a side-by-side diff.
3. **Resolve**: Choose the correct version and commit.
4. **Manual Fix**: If stuck, run `git status` in the terminal to see conflicting files.

---

## 📅 Maintenance Log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | SOP Created: Obsidian Git Full Setup | Antigravity Pilot |

---

*"Version control is the bedrock of digital immortality."*
