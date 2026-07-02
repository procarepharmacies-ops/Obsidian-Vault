#!/bin/bash
# ============================================================
# 📊 Task Status Checker (RHEL/Linux)
# Run: bash 02-check-status.sh
# ============================================================

VAULT_PATH="/home/ahmed/Obsidian-Vault"
AHMED_TASKS="$VAULT_PATH/AI-Brain/📋 Ahmed's Tasks.md"
GEMINI_TASKS="$VAULT_PATH/AI-Brain/🤖 Gemini's Tasks.md"
PLUGINS_PATH="$VAULT_PATH/.obsidian/plugins"

echo ""
echo "📊 TASK STATUS REPORT"
echo "$(date '+%Y-%m-%d %H:%M')"
echo "============================="

get_tasks() {
    local file="$1"
    local label="$2"

    if [ ! -f "$file" ]; then
        echo "   ⚠️  File not found: $file"
        return
    fi

    pending=$(grep -c '^\s*- \[ \]' "$file" 2>/dev/null || echo 0)
    done=$(grep -c '^\s*- \[x\]' "$file" 2>/dev/null || echo 0)

    echo ""
    echo "👤 $label"
    echo "   Pending: $pending  |  Done: $done"

    if [ "$pending" -gt 0 ]; then
        echo "   🔴 To Do:"
        grep '^\s*- \[ \]' "$file" | sed 's/^\s*- \[ \] /      • /'
    else
        echo "   ✅ All tasks complete!"
    fi
}

get_tasks "$AHMED_TASKS" "Ahmed's Tasks"
get_tasks "$GEMINI_TASKS" "Gemini's Tasks"

# Plugin check
echo ""
echo "🔌 Plugin Status"
required_plugins=("dataview" "templater-obsidian" "quickadd" "tag-wrangler")
for p in "${required_plugins[@]}"; do
    if [ -f "$PLUGINS_PATH/$p/main.js" ]; then
        echo "   ✅ $p"
    else
        echo "   ❌ $p — NOT INSTALLED (run 01-install-plugins.sh)"
    fi
done

echo ""
echo "============================="
echo "💡 Tip: Open Obsidian → AI-Brain → 📋 Team Command Center"
echo ""
