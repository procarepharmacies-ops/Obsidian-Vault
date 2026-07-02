#!/bin/bash
# ============================================================
# 🚀 Obsidian Power Plugin Installer — Full Stack (RHEL/Linux)
# Installs 15 curated plugins for a Second Brain setup
# Run AFTER 01-install-plugins.sh (core plugins)
# ============================================================

VAULT_PATH="/home/ahmed/Obsidian-Vault"
PLUGINS_PATH="$VAULT_PATH/.obsidian/plugins"
COMMUNITY_PLUGINS_FILE="$VAULT_PATH/.obsidian/community-plugins.json"

mkdir -p "$PLUGINS_PATH"

echo ""
echo "🚀 Obsidian Power Plugin Installer"
echo "====================================="
echo "Installing 15 curated plugins for your Second Brain..."
echo ""

# Plugin definitions: "id|repo|name|tier"
plugins=(
    # Task Management
    "obsidian-tasks-plugin|obsidian-tasks-group/obsidian-tasks|Tasks|🔴 Task Management"
    "obsidian-kanban|mgmeyers/obsidian-kanban|Kanban|🔴 Task Management"
    # Time Management
    "calendar|liamcain/obsidian-calendar-plugin|Calendar|🟠 Time Management"
    "periodic-notes|liamcain/obsidian-periodic-notes|Periodic Notes|🟠 Time Management"
    "nldates-obsidian|argenos/nldates-obsidian|Natural Language Dates|🟠 Time Management"
    # Search & Nav
    "omnisearch|scambier/obsidian-omnisearch|Omnisearch|🟡 Search & Nav"
    "recent-files-obsidian|tgrosinger/recent-files-obsidian|Recent Files|🟡 Search & Nav"
    # Visual Tools
    "obsidian-excalidraw-plugin|zsviczian/obsidian-excalidraw-plugin|Excalidraw|🟢 Visual Tools"
    "obsidian-mind-map|lynchjames/obsidian-mind-map|Mind Map|🟢 Visual Tools"
    # Writing
    "advanced-tables-obsidian|tgrosinger/advanced-tables-obsidian|Advanced Tables|🔵 Writing"
    "obsidian-outliner|vslinko/obsidian-outliner|Outliner|🔵 Writing"
    "obsidian-url-into-selection|denolehov/obsidian-url-into-selection|Paste URL|🔵 Writing"
    # Backup
    "obsidian-git|denolehov/obsidian-git|Obsidian Git|⚙️ Backup"
    # Appearance
    "obsidian-style-settings|mgmeyers/obsidian-style-settings|Style Settings|🎨 Appearance"
    "obsidian-banners|noatpad/obsidian-banners|Banners|🎨 Appearance"
)

installed_ids=()
current_tier=""

install_plugin() {
    local id="$1" repo="$2" name="$3"
    local plugin_dir="$PLUGINS_PATH/$id"
    mkdir -p "$plugin_dir"

    tag=$(curl -s "https://api.github.com/repos/$repo/releases/latest" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')

    if [ -n "$tag" ]; then
        base_url="https://github.com/$repo/releases/download/$tag"
        if curl -fsSL "$base_url/main.js" -o "$plugin_dir/main.js" && \
           curl -fsSL "$base_url/manifest.json" -o "$plugin_dir/manifest.json"; then
            curl -fsSL "$base_url/styles.css" -o "$plugin_dir/styles.css" 2>/dev/null || true
            echo "   ✅ $name ($tag)"
            echo "$id"
            return
        fi
    fi

    # Fallback: try main branch
    if curl -fsSL "https://raw.githubusercontent.com/$repo/master/manifest.json" -o "$plugin_dir/manifest.json" && \
       curl -fsSL "https://raw.githubusercontent.com/$repo/master/main.js" -o "$plugin_dir/main.js" 2>/dev/null; then
        echo "   ✅ $name (from main branch)"
        echo "$id"
    else
        echo "   ⚠️  $name — skipped (manual install may be needed)"
    fi
}

for plugin_def in "${plugins[@]}"; do
    IFS='|' read -r id repo name tier <<< "$plugin_def"

    if [ "$tier" != "$current_tier" ]; then
        echo ""
        echo "  $tier"
        current_tier="$tier"
    fi

    result=$(install_plugin "$id" "$repo" "$name")
    [ -n "$result" ] && installed_ids+=("$result")
done

# Update community-plugins.json
echo ""
echo "⚙️  Updating Obsidian plugin registry..."

if [ -f "$COMMUNITY_PLUGINS_FILE" ]; then
    existing=$(cat "$COMMUNITY_PLUGINS_FILE")
else
    existing="[]"
fi

merged="$existing"
for id in "${installed_ids[@]}"; do
    if ! echo "$merged" | grep -q "\"$id\""; then
        merged=$(echo "$merged" | sed 's/\]$/,"'"$id"'"]/')
    fi
done
merged=$(echo "$merged" | sed 's/\[\s*,/[/')
echo "$merged" > "$COMMUNITY_PLUGINS_FILE"

total=$(echo "$merged" | grep -o '"[^"]*"' | wc -l)
echo "   ✅ Registry updated ($total total plugins)"

echo ""
echo "============================================"
echo "✅ Power Plugins Installation Complete!"
echo "   Installed: ${#installed_ids[@]} new plugins"
echo ""
echo "⚠️  NEXT STEPS:"
echo "   1. Restart Obsidian completely (close & reopen)"
echo "   2. Settings → Community Plugins → Toggle ON each new plugin"
echo "   3. Open: AI-Brain → 🔌 Plugin Guide.md for setup tips"
echo ""
