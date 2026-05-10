# 🔬 Findings — Obsidian AI Brain

> Research discoveries, constraints, and platform-specific notes.

---

## 🔍 Platform Export Methods

### ChatGPT

- **Where:** Settings → Data Controls → Export Data
- **Format:** ZIP containing `conversations.json`
- **Delivery:** Email (takes up to 24h, usually minutes)
- **Structure:** Array of conversations with messages array

### Claude (Anthropic)

- **Where:** claude.ai → Settings → Privacy → Export Data  
- **Format:** JSON file
- **Delivery:** Email download link
- **Note:** Includes full conversation history

### Perplexity

- **Where:** Profile → Settings → Export
- **Format:** Markdown or JSON (varies by version)
- **Note:** May only export recent conversations

### Microsoft Copilot

- **Where:** Microsoft Privacy Dashboard → Download your data
- **URL:** account.microsoft.com/privacy
- **Format:** JSON (part of larger Microsoft export)
- **Note:** May take 1-30 days

### Google Gemini

- **Where:** Google Takeout (takeout.google.com)
- **Format:** JSON within ZIP
- **Note:** Select only "Gemini Apps Activity" to keep size small

---

## 🧩 Karpathy Graph Model Reference

- Andrej Karpathy uses Obsidian's **Canvas** + **Graph View** for visual thinking
- Key principle: **Atomic notes** (one idea per note) + heavy cross-linking
- Reference: https://twitter.com/karpathy obsidian references
- Zettelkasten method is the underlying framework

## ⚠️ Constraints Found

- Copilot exports can take up to 30 days via Microsoft
- Perplexity export may not include all conversations
- Large JSON exports (1000+ conversations) may need batched processing
- Obsidian Sync is paid; use git for free version control

---

## 📅 Log

| Date | Discovery |
|------|-----------|
| 2026-05-09 | Project initialized, export methods researched |
| 2026-05-10 | Resolved "Structural Ambiguity" conflict: root files removed, constitutions merged into AI-Brain folder. |

---

## 🛠️ Antigravity Startup Audit (2026-05-10)

### Startup Issues Detected

1. **Structural Ambiguity**: Dual projects (`AI-Brain` vs root level) caused duplicate tracking files. **(RESOLVED: Reverted to AI-Brain primary)**
2. **MCP Discrepancy**: `settings.json` contains several MCP servers (filesystem, memory, sequential-thinking) that are NOT appearing in the active session toolset.
   - **Status**: Investigating why Antigravity is not loading these servers despite valid `settings.json` configuration.

### MCP Audit

- **Filesystem**: Configured in `settings.json` but not listed in available MCP servers.
- **Sequential Thinking**: Configured but not listed.
- **Memory**: Configured but not listed.
- **Context7**: Configured but not listed.
- **Puppeteer**: Configured but not listed.
