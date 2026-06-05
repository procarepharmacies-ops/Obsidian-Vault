#!/bin/bash
# ============================================================
# 🔍 Add DuckDuckGo Search to Antigravity (RHEL/Linux)
# Usage: bash 07-add-duckduckgo-search.sh
# No API Key Required!
# ============================================================

SETTINGS_PATH="/home/ahmed/.gemini/settings.json"

if [ ! -f "$SETTINGS_PATH" ]; then
    echo "⚠️  Antigravity settings not found at $SETTINGS_PATH"
    exit 1
fi

if ! command -v jq &>/dev/null; then
    echo "⚠️  'jq' is required. Install it with: sudo dnf install jq"
    exit 1
fi

tmp=$(mktemp)
jq '.mcpServers["duckduckgo"] = {"command":"npx","args":["-y","@ericthered926/duckduckgo-mcp-server"]}' \
   "$SETTINGS_PATH" > "$tmp" && mv "$tmp" "$SETTINGS_PATH"

echo ""
echo "✅ DuckDuckGo Search MCP added to Antigravity!"
echo "   No API key needed. Restart Antigravity to activate."
echo ""
