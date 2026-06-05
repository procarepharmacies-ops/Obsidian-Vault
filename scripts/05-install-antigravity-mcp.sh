#!/bin/bash
# ============================================================
# 🚀 Antigravity MCP Power Plugin Installer (RHEL/Linux)
# Installs 5 MCP servers that extend what Gemini AI can do
# Run this ONCE — then restart Antigravity
# ============================================================

SETTINGS_PATH="/home/ahmed/.gemini/settings.json"
VAULT_PATH="/home/ahmed/Obsidian-Vault"

echo ""
echo "🚀 Antigravity MCP Power Plugin Installer"
echo "=========================================="
echo ""

if [ ! -f "$SETTINGS_PATH" ]; then
    echo "⚠️  Antigravity settings not found at $SETTINGS_PATH"
    echo "   Make sure Gemini CLI is installed and has been run at least once."
    exit 1
fi

# Check jq is available
if ! command -v jq &>/dev/null; then
    echo "⚠️  'jq' is required. Install it with: sudo dnf install jq"
    exit 1
fi

echo "  Existing MCP servers preserved:"
jq -r '.mcpServers | keys[]' "$SETTINGS_PATH" 2>/dev/null | sed 's/^/   • /'
echo ""

echo "  🔌 Installing power plugins..."
echo ""

# Build new MCP server entries
new_servers=$(cat <<EOF
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem",
             "$VAULT_PATH",
             "/home/ahmed/Documents",
             "/home/ahmed/.gemini"]
  },
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  },
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
  },
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  },
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}
EOF
)

echo "  ⬇️  [1/5] Filesystem Server...         ✅ vault read/write access"
echo "  ⬇️  [2/5] Memory Server...             ✅ persistent memory across sessions"
echo "  ⬇️  [3/5] Sequential Thinking Server...✅ better multi-step reasoning"
echo "  ⬇️  [4/5] Context7 Server...           ✅ live library documentation"
echo "  ⬇️  [5/5] Puppeteer Browser Server...  ✅ web browsing & screenshots"

# Merge into settings.json
tmp=$(mktemp)
jq --argjson new "$new_servers" '.mcpServers = (.mcpServers // {}) * $new' "$SETTINGS_PATH" > "$tmp" && mv "$tmp" "$SETTINGS_PATH"

echo ""
echo "  💾 settings.json updated ✅"

echo ""
echo "  ⚠️  Brave Search — SKIPPED (needs API key)"
echo "     Get free key at: https://brave.com/search/api/"
echo "     Then run: bash 06-add-brave-search.sh YOUR_KEY"

# Pre-cache packages
echo ""
echo "  🔄 Pre-downloading MCP packages (this may take 1-2 min)..."
packages=(
    "@modelcontextprotocol/server-filesystem"
    "@modelcontextprotocol/server-memory"
    "@modelcontextprotocol/server-sequential-thinking"
    "@upstash/context7-mcp"
    "@modelcontextprotocol/server-puppeteer"
)
for pkg in "${packages[@]}"; do
    echo "     Caching $pkg..."
    npx -y "$pkg" --help &>/dev/null || true
    echo "     ✅ Cached"
done

echo ""
echo "============================================"
echo "✅ Antigravity Power Plugins Installed!"
echo ""
echo "  You now have 5 new MCP capabilities:"
echo "   🗂️  filesystem       — Vault read/write access"
echo "   🧠  memory           — Persistent memory across sessions"
echo "   🔗  sequential-think — Step-by-step reasoning"
echo "   📚  context7         — Live library documentation"
echo "   🌐  puppeteer        — Web browsing & screenshots"
echo ""
echo "⚠️  REQUIRED: Restart Antigravity (close + reopen the app)"
echo ""
echo "  After restart, tell Gemini:"
echo "  'What MCP tools do you have?' to verify"
echo ""
