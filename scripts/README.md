---
type: scripts-guide
tags: [commands, terminal, setup]
updated: 2026-05-10
---

# ⚡ Terminal Command Center

> **How it works:** Copy any command below → paste in PowerShell → get results.
> Obsidian and terminal stay in sync automatically (same files on disk).

---

## 🚀 Step 1 — First Time Setup (Run Once)

### Install All Obsidian Plugins
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
cd "C:\Users\Ahmed\Documents\Obsidian Vault\scripts"
.\01-install-plugins.ps1
```
> After this: Open Obsidian → Settings ⚙️ → Community Plugins → toggle ON each plugin

---

## 📊 Step 2 — Check Status Any Time

### See All Tasks + Plugin Status
```powershell
cd "C:\Users\Ahmed\Documents\Obsidian Vault\scripts"
.\02-check-status.ps1
```

---

## ✅ Step 3 — Mark Tasks Done

### Mark a task done (from terminal)
```powershell
cd "C:\Users\Ahmed\Documents\Obsidian Vault\scripts"
.\03-mark-done.ps1 "Install plugins"
```
> Replace `"Install plugins"` with any task name (partial match works)

### Or just toggle the checkbox in Obsidian — both stay synced!

---

## 🔄 How Sync Works

```
Obsidian Vault (disk)
        ↕  (same files)
  Terminal Scripts
        ↕  (same files)  
    Gemini (me)
```

> **Everything reads/writes the same `.md` files on disk.**
> No extra sync needed — it's always one source of truth.

---

## 📁 Scripts Location

```
Obsidian Vault/
└── scripts/
    ├── 01-install-plugins.ps1        ← Install core 4 plugins
    ├── 02-check-status.ps1           ← Check all tasks + plugins
    ├── 03-mark-done.ps1              ← Mark task complete
    ├── 04-install-power-plugins.ps1  ← Install 15 power plugins
    └── README.md                     ← This file
```

---

## ⚡ Quick Copy Commands

**Open scripts folder in terminal:**
```powershell
cd "C:\Users\Ahmed\Documents\Obsidian Vault\scripts"
```

**Install core plugins (run once):**
```powershell
.\01-install-plugins.ps1
```

**Install power plugins (15 more):**
```powershell
.\04-install-power-plugins.ps1
```

**Check status:**
```powershell
.\02-check-status.ps1
```

**Mark done:**
```powershell
.\03-mark-done.ps1 "task name here"
```
