---
type: guide
tags: [plugins, setup, reference]
updated: 2026-05-10
---

# 🔌 Obsidian Plugin Guide — Full Stack

> **19 plugins total** — installed in 2 batches.
> This guide tells you what each plugin does and how to use it right away.

---

## ✅ Already Installed (Batch 1 — Core)

| Plugin | What It Does | First Thing To Do |
|--------|-------------|-------------------|
| **Dataview** | Query your vault like a database | Powers all dashboards in this vault |
| **Templater** | Smart note templates with logic | Used for AI memory note templates |
| **QuickAdd** | Fast capture with one shortcut | Set `Ctrl+Shift+A` as your capture key |
| **Tag Wrangler** | Rename/manage tags across all notes | Right-click any tag in Tag Pane |

---

## 🔴 Task Management

### Tasks (`obsidian-tasks-plugin`)
> **The best task manager in Obsidian.** Way more powerful than basic checkboxes.

**How to use:**
- Type a task: `- [ ] Buy groceries 📅 2026-05-15 🔺`
- Symbols: `📅` = due date, `🔺` = high priority, `🔁` = recurring
- Query tasks from any note: ` ```tasks ... ``` `

**Quick start — paste this in any note:**
````markdown
```tasks
not done
due before next week
```
````

---

### Kanban (`obsidian-kanban`)
> **Visual board** for project tracking. Like Trello inside Obsidian.

**How to use:**
- Create new file → Change to Kanban view (top right `···` menu)
- Or open: Command Palette → "Create new Kanban board"
- Columns: `Backlog | In Progress | Done`

---

## 🟠 Time Management

### Calendar (`calendar`)
> **Sidebar calendar** — click any date to open/create that day's note.

**How to use:**
- Enable Daily Notes (Settings → Core Plugins → Daily Notes)
- Calendar appears in right sidebar automatically
- Click any date to jump to that day's note

---

### Periodic Notes (`periodic-notes`)
> **Daily, Weekly, Monthly, Yearly notes** — review cycles for your Second Brain.

**How to use:**
- Settings → Periodic Notes → Enable Weekly Notes
- Set folder: `Journal/Weekly/`
- Use `Ctrl+Shift+W` for this week's note

---

### Natural Language Dates (`nldates-obsidian`)
> **Type dates in English** — `@today`, `@next Monday`, `@in 2 weeks`

**How to use:**
- Type `@` anywhere → select date from popup
- Works inside Templater templates

---

## 🟡 Search & Navigation

### Omnisearch (`omnisearch`)
> **Full-text search that actually works** — finds content inside notes, not just titles.

**How to use:**
- `Ctrl+Shift+O` to open
- Searches everything: titles, content, tags, headings
- Replaces the default `Ctrl+O` search for most queries

---

### Recent Files (`recent-files-obsidian`)
> **Sidebar panel** showing your last 10 opened notes.

**How to use:**
- Appears in left sidebar automatically
- Click any file to jump back to it

---

## 🟢 Visual Tools

### Excalidraw (`obsidian-excalidraw-plugin`)
> **Draw diagrams, mind maps, and visual boards** inside Obsidian notes.

**How to use:**
- Command Palette → "Create new Excalidraw drawing"
- Use for: architecture diagrams, Karpathy-style memory maps, flowcharts
- Embed in notes with: `![[drawing.excalidraw]]`

**Perfect for:** Visual representations of your AI Brain graph

---

### Mind Map (`obsidian-mind-map`)
> **Convert any note with headings into a mind map** instantly.

**How to use:**
- Open any note with `## headings`
- Command Palette → "Open as Mind Map"

---

## 🔵 Writing & Editing

### Advanced Tables (`advanced-tables-obsidian`)
> **Excel-like table editing** — Tab to move cells, auto-formats markdown tables.

**How to use:**
- Start typing `|` → Tab → auto-creates a table
- Navigate cells with Tab/Shift+Tab
- Right-click for row/column operations

---

### Outliner (`obsidian-outliner`)
> **Better bullet lists** — move items up/down, indent/outdent like Roam/Notion.

**How to use:**
- `Alt+↑/↓` — move list item up or down
- `Alt+Shift+↑/↓` — move with children
- `Tab/Shift+Tab` — indent/outdent

---

### Paste URL (`obsidian-url-into-selection`)
> **Select text, paste a URL** → auto-creates `[text](url)` markdown link.

**How to use:**
- Select: `Click here to read more`
- Paste a URL → becomes: `[Click here to read more](https://...)`

---

## ⚙️ Backup

### Obsidian Git (`obsidian-git`)
> **Auto-backup your entire vault to GitHub** every X minutes.

**Setup (requires Git installed):**
1. Create a private GitHub repo
2. Settings → Obsidian Git → Set "Vault backup interval": `10` minutes
3. Set commit message: `vault backup: {{date}}`
4. First backup: Command Palette → "Obsidian Git: Create backup"

> 💡 Tell Gemini "Set up Obsidian Git" for a full setup guide

---

## 🎨 Appearance

### Style Settings (`obsidian-style-settings`)
> **Customize your theme** — colors, fonts, spacing without CSS knowledge.

**How to use:**
- Settings → Style Settings (appears after installing a compatible theme)
- Recommended theme: **Minimal** or **AnuPpuccin**

---

### Banners (`obsidian-banners`)
> **Add header images** to your notes for visual navigation.

**How to use:**
- Add to note YAML frontmatter:
  ```yaml
  banner: "https://images.unsplash.com/photo-..."
  banner_y: 0.5
  ```
- Or: Command Palette → "Add banner to current note"

---

## 📊 Plugin Status Check

Run in terminal to verify all plugins:
```powershell
cd "C:\Users\Ahmed\Documents\Obsidian Vault\scripts"
.\02-check-status.ps1
```

---

## 🏆 Priority Order (Enable These First)

1. ✅ Dataview, Templater, QuickAdd, Tag Wrangler ← already done
2. 🔴 **Tasks** — improves your to-do system immediately
3. 🟠 **Calendar + Periodic Notes** — daily review workflow
4. 🟡 **Omnisearch** — better search immediately
5. 🟢 **Excalidraw** — for Karpathy visual brain maps
6. ⚙️ **Obsidian Git** — backup before anything goes wrong
