# 📋 Task Plan — Obsidian AI Brain (Karpathy-Style)

> Blueprint approved. All phases tracked here.

---

## 🎯 Goal

Build a graph-based "Second Brain" in Obsidian that aggregates, structures, and interconnects AI conversation memories from 5 platforms into a searchable, visual knowledge graph.

---

## 📐 Phase 0: Setup & Foundation

- [] Install Obsidian on Windows
- [ ] Create `AI-Brain/` folder structure in Obsidian Vault
- [ ] Install all required plugins (Dataview, Templater, QuickAdd, Tag Wrangler)
- [ ] Configure plugin settings
- [ ] Create base note templates

## 📥 Phase 1: Export Memories from Each Platform

- [ ] Export ChatGPT conversations (JSON via Settings > Data Export)
- [ ] Export Claude conversations (via claude.ai account settings)
- [ ] Export Perplexity conversations (via profile > export)
- [ ] Export Copilot conversations (via Microsoft account)
- [ ] Export Gemini conversations (via Google Takeout)
- [ ] Store all raw exports in `_Inbox/` folder

## 🛠️ Phase 2: Build the Processing Pipeline

- [ ] Create Python script `tools/parse_chatgpt.py`
- [ ] Create Python script `tools/parse_claude.py`
- [ ] Create Python script `tools/parse_perplexity.py`
- [ ] Create Python script `tools/parse_generic.py`
- [ ] Create Obsidian templates in `Templates/`
- [ ] Test pipeline with 5 sample conversations

## 🧠 Phase 3: Populate the Brain

- [ ] Process all ChatGPT exports → Memories/ChatGPT/
- [ ] Process all Claude exports → Memories/Claude/
- [ ] Process all Perplexity exports → Memories/Perplexity/
- [ ] Process Copilot/Gemini exports
- [ ] Create 10+ Concept notes linking memories together
- [ ] Create Topic hub notes

## 📊 Phase 4: Build Dashboards & Graph

- [ ] Create Dataview dashboard (all memories by date)
- [ ] Create per-source dashboards
- [ ] Configure Graph View filters (color by source)
- [ ] Create Canvas board (Karpathy-style visual map)

## 🚀 Phase 5: Automate New Memory Capture

- [ ] Set up QuickAdd macro for fast capture
- [ ] Create ongoing export + import workflow
- [ ] Document the routine in `architecture/daily-workflow.md`

## ⚡ Phase 6: Skill Sync & Antigravity Extensions
- [x] Integrate Skill Sync constitution into `gemini.md`
- [ ] Verify `skills/` folder source of truth
- [ ] Automate skill sync to Antigravity knowledge base
- [ ] Fix MCP Loading issues (Troubleshooting)

---

## ✅ Definition of Done

The project is complete when:

1. All historical AI memories are searchable in Obsidian
2. The graph view shows meaningful connections between concepts
3. A daily capture workflow is documented and working
4. At least one Dataview dashboard is functional
