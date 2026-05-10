# 🛠️ Antigravity Tools

> **Layer 3 of the A.N.T. Architecture.**
> These are deterministic Python scripts that execute the actual work of the system.

## 📋 Tool Inventory

| Script | Purpose | Status |
| :--- | :--- | :--- |
| `parser_chatgpt.py` | Converts ChatGPT JSON exports to Obsidian Markdown notes. | 🧪 Pending |
| `parser_claude.py` | Converts Claude JSON exports to Obsidian Markdown notes. | 🧪 Pending |
| `parser_gemini.py` | Converts Google Takeout (Gemini) data to Obsidian. | 🧪 Pending |

## ⚙️ How to Use

1. **Environment**: Ensure Python 3.10+ is installed.
2. **Execution**:
   ```bash
   python tools/parser_chatgpt.py --input .tmp/chatgpt_export.json --output AI-Brain/Memories/ChatGPT/
   ```
3. **Logs**: Check `.tmp/logs/` for execution traces.

---

## 🔑 Development Rules

1. **No Hardcoding**: Use environment variables for all keys/paths.
2. **Atomic Logic**: Each script should do ONE thing well.
3. **Error Handling**: Use `try/except` blocks and return clear JSON error codes.
4. **Intermediate Files**: Always use `.tmp/` for processing; never pollute the vault root.
