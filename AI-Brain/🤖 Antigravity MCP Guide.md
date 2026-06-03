---
type: guide
tags: [antigravity, mcp, ai-tools, setup]
updated: 2026-05-10
---

# 🤖 Antigravity MCP Power Plugins Guide

> **MCP (Model Context Protocol)** = plugins that give Gemini AI new superpowers.
> These run as background servers that Antigravity connects to automatically.

---

## 🔌 Installed MCP Servers (5 plugins)

### 🗂️ 1. Filesystem Server
**What it does:** Gives me direct read/write access to your files — no copy-pasting needed.

**With this I can:**
- Read and update your Obsidian vault files directly
- Create/edit notes, scripts, and documents
- Search through your files for content

**Allowed paths:**
- `C:\Users\Ahmed\Documents\Obsidian Vault\` ← Your brain
- `C:\Users\Ahmed\Documents\`
- `C:\Users\Ahmed\.gemini\` ← Antigravity config

---

### 🧠 2. Memory Server
**What it does:** Persistent knowledge graph that survives across sessions.

**With this I can:**
- Remember facts you tell me (your preferences, project details, etc.)
- Build a graph of connected knowledge entities
- Recall context from previous sessions automatically

**How to use it:**
> Tell me: *"Remember that my ProSpices project uses HubSpot"*
> Next session I'll already know this.

---

### 🔗 3. Sequential Thinking Server
**What it does:** Structured multi-step reasoning — I work through problems systematically before answering.

**With this I can:**
- Break complex tasks into verified steps
- Backtrack and reconsider when a step fails
- Give better answers to architectural and planning questions

**Best for:** B.L.A.S.T. blueprint planning, debugging, architecture design

---

### 📚 4. Context7 Server
**What it does:** Fetches live, version-specific documentation for any library or framework.

**With this I can:**
- Look up the exact API for the library version you're using
- Avoid hallucinating outdated code examples
- Get current docs for Python, Node.js, Obsidian API, etc.

**How to use it:**
> Say: *"use context7"* when asking about a library or API

---

### 🌐 5. Puppeteer Server
**What it does:** Controls a real browser — I can browse websites, fill forms, take screenshots.

**With this I can:**
- Scrape competitor websites for ProSpices intelligence
- Take screenshots of web pages
- Automate web-based workflows
- Test your web apps by actually clicking through them

---

## 🔍 Optional: Brave Search (needs free API key)

**Get it:** https://brave.com/search/api/ (free tier: 2,000 searches/month)

**Install:**

```powershell
cd "C:\Users\Ahmed\Documents\Obsidian Vault\scripts"
.\06-add-brave-search.ps1 YOUR_API_KEY_HERE
```

**What it adds:** Real-time web search results directly in my context — no browser needed.

---

## 🆚 Before vs. After MCP Plugins

| Task | Before | After |
|------|--------|-------|
| Update Obsidian note | I write code, you copy-paste | I edit files directly ✅ |
| Remember project context | You re-explain every session | I recall from memory ✅ |
| Research libraries | I might hallucinate old docs | I fetch live docs ✅ |
| Scrape a website | You do it manually | I browse and extract ✅ |
| Complex planning | Linear reasoning | Structured step-by-step ✅ |

---

## 🔄 How to Verify Plugins Are Active

After restarting Antigravity, ask me:
> *"What MCP tools do you have available?"*

I'll list all active servers and their tools.

---

## 🛠️ Troubleshooting

**Plugin not showing up?**

```powershell
# Check settings.json is valid JSON
Get-Content "C:\Users\Ahmed\.gemini\settings.json" | ConvertFrom-Json
```

**Re-run installer:**

```powershell
cd "C:\Users\Ahmed\Documents\Obsidian Vault\scripts"
.\05-install-antigravity-mcp.ps1
```

---

## 📅 MCP Maintenance Log

| Date | Action |
|------|--------|
| 2026-05-10 | Installed 5 MCP power plugins (filesystem, memory, sequential-thinking, context7, puppeteer) |
