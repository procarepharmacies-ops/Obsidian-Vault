#!/bin/bash
# ============================================================
# ✅ Mark Task Done (RHEL/Linux)
# Usage: bash 03-mark-done.sh "Install plugins" [Ahmed|Gemini|Both]
# ============================================================

VAULT_PATH="/home/ahmed/Obsidian-Vault"
TASK_TEXT="$1"
OWNER="${2:-Both}"

if [ -z "$TASK_TEXT" ]; then
    echo "Usage: bash 03-mark-done.sh \"task name\" [Ahmed|Gemini|Both]"
    exit 1
fi

files=()
if [ "$OWNER" = "Ahmed" ] || [ "$OWNER" = "Both" ]; then
    files+=("$VAULT_PATH/AI-Brain/📋 Ahmed's Tasks.md")
fi
if [ "$OWNER" = "Gemini" ] || [ "$OWNER" = "Both" ]; then
    files+=("$VAULT_PATH/AI-Brain/🤖 Gemini's Tasks.md")
fi

today=$(date '+%Y-%m-%d')
found=false

for file in "${files[@]}"; do
    [ -f "$file" ] || continue

    if grep -qF "- [ ]" "$file" && grep -q "$TASK_TEXT" "$file"; then
        # Replace "- [ ] ...task..." with "- [x] ...task... ✅ date"
        sed -i "s/- \[ \] \(.*$(echo "$TASK_TEXT" | sed 's/[[\.*^$()+?{}|]/\\&/g').*\)/- [x] \1 ✅ $today/" "$file"
        echo "✅ Marked done in: $(basename "$file")"
        found=true
    fi
done

if [ "$found" = false ]; then
    echo "⚠️  Task not found: '$TASK_TEXT'"
    echo "   Check spelling or run 02-check-status.sh to see exact task names"
else
    PROGRESS_FILE="$VAULT_PATH/AI-Brain/progress.md"
    echo "" >> "$PROGRESS_FILE"
    echo "- ✅ Task marked done: \"$TASK_TEXT\" on $today" >> "$PROGRESS_FILE"
    echo "📝 Logged to progress.md"
fi
