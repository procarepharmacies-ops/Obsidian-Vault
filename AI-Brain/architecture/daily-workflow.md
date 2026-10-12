---
title: Daily Memory Capture Workflow
tags:
  - workflow
  - memory
  - daily-routine
---

# Daily Memory Capture Workflow

> How to continuously sync new conversations and memory into the Obsidian vault.

## Morning (5 min)

1. Open Obsidian → vault auto-pulls latest from GitHub via obsidian-git (or run `python AI-Brain/tools/git_sync.py --direction pull`)
2. Check [[Dashboards/main-dashboard]] for pending source records
3. Review any `needs-review` items from yesterday's import

## During Session (capture as you go)

Use QuickAdd to capture key moments:
- **Quick capture**: `Ctrl/Cmd + Shift + Q` → "Memory capture" → type or paste → auto-tags with `#ai-memory`
- **Decision log**: QuickAdd "Decision" template → records in `AI-Brain/Memories/Curated/` with `memory_kind: decision`
- **Lesson learned**: QuickAdd "Lesson" template → `memory_kind: lesson`

## After Each AI Conversation

1. Export the conversation JSON from the platform's settings
2. Place the raw export in `AI-Brain/_Inbox/{Platform}/`
3. Run the parser:

```bash
python AI-Brain/tools/parse_memories.py --source chatgpt --input _Inbox/ChatGPT/conversations.json --output Memories/ChatGPT
```

4. Review generated source records in Obsidian (they start as `needs-review`)
5. Create curated memory notes only for useful, verified information

## End of Day (5 min)

1. `python AI-Brain/tools/git_sync.py --direction sync`
2. Or let obsidian-git auto-commit/push on its 30-min interval
3. Verify push succeeded: `git ls-remote origin`

## Import Checklist

- [ ] Raw export placed in `_Inbox/{Source}/` (untouched)
- [ ] Source records generated with `--dry-run` first
- [ ] Source records reviewed (Summary, Facts, Decisions)
- [ ] Curated notes created only for verified, useful info
- [ ] Source records linked from curated notes
- [ ] `git_sync.py` run to commit and push
- [ ] `git ls-remote origin` confirms push

## Platform Export Methods

See [[findings.md]] for the full reference table. Quick links:

| Platform | Where | Format |
|----------|-------|--------|
| ChatGPT | Settings → Data Controls → Export | ZIP with `conversations.json` |
| Claude | claude.ai → Settings → Privacy → Export | JSON |
| Perplexity | Profile → Settings → Export | Markdown or JSON |
| Copilot | Microsoft Privacy Dashboard | JSON |
| Gemini | Google Takeout → Gemini Apps Activity | JSON in ZIP |
