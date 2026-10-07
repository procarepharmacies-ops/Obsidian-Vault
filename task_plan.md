# 📋 Task Plan: 2-Way Git Sync for Obsidian Vault

## 🎯 Goal
Configure deterministic, reliable hybrid 2-way sync between local Obsidian Vault (`C:\Users\Ahmed\Documents\Obsidian Vault`) and remote GitHub repository (`https://github.com/procarepharmacies-ops/Obsidian-Vault.git`), preserving Google Drive coexistence via Remotely Save.

---

## 🏗️ B.L.A.S.T. Status

### Phase 1: Blueprint (Vision & Logic) — APPROVED
- [x] Discovery questions answered (Hybrid internal + external, Google Drive co-exists, GitHub receives updates from other devices)
- [x] Data schemas defined in `gemini.md` (Obsidian Git config & `tools/git_sync.py` payload)
- [x] Protection strategy for large binaries (`.exe`, `.zip`) & secrets (`.env`, tokens) confirmed

### Phase 2: Link (Connectivity) — IN PROGRESS
- [x] Verify remote GitHub connectivity (`git fetch origin` successful)
- [x] Protect secrets and heavy binaries in `.gitignore`
- [ ] Verify clean staging state

### Phase 3: Architect (The 3-Layer Build)
- [ ] Layer 1: Update SOP in `architecture/obsidian-git-setup.md`
- [ ] Layer 2: Implement Navigation logic
- [ ] Layer 3: Build deterministic Python tool `tools/git_sync.py` for headless / background sync

### Phase 4: Stylize (Refinement & UI)
- [ ] Configure `obsidian-git` plugin `data.json` (auto pull on startup, 10 min intervals, stage all)
- [ ] Test synchronization loop (fetch -> pull/merge -> stage -> commit -> push)
- [ ] Validate Remotely Save Google Drive settings do not clash with Git

### Phase 5: Trigger (Deployment & Monitoring)
- [ ] Verify two-way synchronization end-to-end
- [ ] Provide user instructions for manual and automated triggers
- [ ] Update `progress.md` and maintenance log
