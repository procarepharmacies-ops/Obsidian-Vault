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
   - **Status**: **RESOLVED (2026-05-17)**
   - **Root Cause**: The Antigravity desktop application reads its MCP configuration from `C:\Users\Ahmed\.gemini\antigravity\mcp_config.json`, but the installer script was incorrectly writing to `C:\Users\Ahmed\.gemini\settings.json`.
   - **Resolution**: Merged the configuration from `settings.json` into `antigravity/mcp_config.json` and updated `05-install-antigravity-mcp.ps1` to target `mcp_config.json` directly.

### MCP Audit

- **Filesystem**: Configured in `mcp_config.json` ✅ **ACTIVE ON NEXT RESTART**
- **Sequential Thinking**: Configured in `mcp_config.json` ✅ **ACTIVE ON NEXT RESTART**
- **Memory**: Configured in `mcp_config.json` ✅ **ACTIVE ON NEXT RESTART**
- **Context7**: Configured in `mcp_config.json` ✅ **ACTIVE ON NEXT RESTART**
- **Puppeteer**: Configured in `mcp_config.json` ✅ **ACTIVE ON NEXT RESTART**
- **DuckDuckGo**: Configured in `mcp_config.json` ✅ **ACTIVE ON NEXT RESTART**
