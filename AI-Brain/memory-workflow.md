---
type: guide
tags: [ai-memory, workflow]
---

# AI memory workflow

This workflow separates raw exports, imported conversation records, and durable memories. The data contract is maintained in [[gemini]].

## 1. Preserve the export

Put each platform's original JSON export under `AI-Brain/_Inbox/{Source}/`. Keep the original unchanged. Do not import credentials, API keys, or other material you would not want copied into notes.

## 2. Preview the import

From the vault root, run a dry run first:

```powershell
python AI-Brain/tools/parse_memories.py --source chatgpt --input "AI-Brain/_Inbox/ChatGPT/conversations.json" --output "AI-Brain/Memories/ChatGPT" --dry-run
```

Replace `chatgpt` and paths with the platform and export location. Supported source values are `chatgpt`, `claude`, `perplexity`, `gemini`, and `copilot`.

## 3. Import and review

Run the same command without `--dry-run`. The importer creates one transcript source record per conversation, records the source ID, and marks each note `status: needs-review`. It refuses to overwrite existing notes. Use `--overwrite` only when you have reviewed the listed collision and intend to replace it.

Open [[Dashboards/main-dashboard]] and review the queue. Compare the imported record with the untouched export. Correct any import errors before treating the record as usable evidence.

## 4. Curate durable memories

Create a note from [[Templates/memory-note]] in `AI-Brain/Memories/Curated/` only when information is likely to help in future work. Keep it concise, link its source record, distinguish confirmed information from interpretation, and set a review date for information that can change. The curated note's status becomes `active` after review; revise or mark stale notes `superseded` when facts change.

An imported transcript is not itself an approved preference or instruction. Never turn one-time requests, speculative assistant suggestions, or sensitive details into durable memories without checking their context and usefulness.
