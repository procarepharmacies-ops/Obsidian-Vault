#!/bin/bash
# ============================================================
# 🔌 Obsidian Plugin Auto-Installer (RHEL/Linux)
# Run: bash 01-install-plugins.sh
# ============================================================

VAULT_PATH="/home/ahmed/Obsidian-Vault"
PLUGINS_PATH="$VAULT_PATH/.obsidian/plugins"
COMMUNITY_PLUGINS_FILE="$VAULT_PATH/.obsidian/community-plugins.json"

mkdir -p "$PLUGINS_PATH"

echo ""
echo "🔌 Obsidian Plugin Installer"
echo "============================="
echo ""

# Plugin definitions: "id|repo|name"
plugins=(
    "dataview|blacksmithgu/obsidian-dataview|Dataview"
    "templater-obsidian|SilentVoid13/Templater|Templater"
    "quickadd|chhoumann/quickadd|QuickAdd"
    "tag-wrangler|pjeby/tag-wrangler|Tag Wrangler"
)

installed_ids=()

for plugin_def in "${plugins[@]}"; do
    IFS='|' read -r id repo name <<< "$plugin_def"
    plugin_dir="$PLUGINS_PATH/$id"
    mkdir -p "$plugin_dir"

    echo "⬇️  Installing $name..."

    # Get latest release tag
    tag=$(curl -s "https://api.github.com/repos/$repo/releases/latest" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')

    if [ -z "$tag" ]; then
        echo "   ❌ Failed to get release tag for $name"
        continue
    fi

    base_url="https://github.com/$repo/releases/download/$tag"

    if curl -fsSL "$base_url/main.js" -o "$plugin_dir/main.js" && \
       curl -fsSL "$base_url/manifest.json" -o "$plugin_dir/manifest.json"; then
        # styles.css is optional
        curl -fsSL "$base_url/styles.css" -o "$plugin_dir/styles.css" 2>/dev/null || true
        installed_ids+=("$id")
        echo "   ✅ $name ($tag) installed!"
    else
        echo "   ❌ Failed to install $name"
    fi
done

# Update community-plugins.json
echo ""
echo "⚙️  Enabling plugins in Obsidian config..."

if [ -f "$COMMUNITY_PLUGINS_FILE" ]; then
    existing=$(cat "$COMMUNITY_PLUGINS_FILE")
else
    existing="[]"
fi

# Merge installed IDs into existing list (deduplicated)
merged="$existing"
for id in "${installed_ids[@]}"; do
    if ! echo "$merged" | grep -q "\"$id\""; then
        merged=$(echo "$merged" | sed 's/\]$/,"'"$id"'"]/')
    fi
done

# Fix empty array edge case
merged=$(echo "$merged" | sed 's/\[\s*,/[/')
echo "$merged" > "$COMMUNITY_PLUGINS_FILE"
echo "   ✅ community-plugins.json updated!"

echo ""
echo "============================================"
echo "✅ DONE! Plugins installed:"
for id in "${installed_ids[@]}"; do echo "   • $id"; done
echo ""
echo "⚠️  ACTION REQUIRED:"
echo "   1. Open Obsidian (or restart it if open)"
echo "   2. Go to: Settings → Community Plugins"
echo "   3. Toggle ON each plugin in the list"
echo ""
