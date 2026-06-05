#!/bin/bash
# ============================================================
# 🔍 Add Brave Search to Antigravity (RHEL/Linux)
# Usage: bash 06-add-brave-search.sh YOUR_API_KEY
# Get free key: https://brave.com/search/api/ (2000 req/month free)
# ============================================================

SETTINGS_PATH="/home/ahmed/.gemini/settings.json"
API_KEY="$1"

if [ -z "$API_KEY" ]; then
    echo "Usage: bash 06-add-brave-search.sh YOUR_API_KEY"
    exit 1
fi

if ! command -v jq &>/dev/null; then
    echo "⚠️  'jq' is required. Install it with: sudo dnf install jq"
    exit 1
fi

tmp=$(mktemp)
jq --arg key "$API_KEY" \
   '.mcpServers["brave-search"] = {"command":"npx","args":["-y","@modelcontextprotocol/server-brave-search"],"env":{"BRAVE_API_KEY":$key}}' \
   "$SETTINGS_PATH" > "$tmp" && mv "$tmp" "$SETTINGS_PATH"

echo ""
echo "✅ Brave Search MCP added to Antigravity!"
echo "   Restart Antigravity to activate."
echo ""
