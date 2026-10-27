# 📐 Data Schema & Specifications — Git 2-Way Sync

## 1. Sync Configuration Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ObsidianGitSyncConfig",
  "type": "object",
  "properties": {
    "syncMethod": {
      "type": "string",
      "enum": ["obsidian-git", "background-script", "hybrid"],
      "default": "hybrid",
      "description": "Primary automation mechanism for 2-way sync"
    },
    "pullIntervalMinutes": {
      "type": "integer",
      "minimum": 1,
      "default": 120
    },
    "commitPushIntervalMinutes": {
      "type": "integer",
      "minimum": 1,
      "default": 120
    },
    "pullOnStartup": {
      "type": "boolean",
      "default": true
    },
    "autoStageAll": {
      "type": "boolean",
      "default": true
    },
    "ignorePatterns": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["syncMethod", "pullIntervalMinutes", "commitPushIntervalMinutes", "pullOnStartup", "autoStageAll"]
}
```

## 2. Sync Tool Execution Payload Schema (`tools/git_sync.py`)
### Input Parameters:
```json
{
  "vaultPath": "C:\\Users\\Ahmed\\Documents\\Obsidian Vault",
  "remote": "origin",
  "branch": "main",
  "autoPush": true,
  "autoPull": true,
  "commitMessage": "vault backup: {{timestamp}}"
}
```

### Output Response Schema:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GitSyncResult",
  "type": "object",
  "properties": {
    "timestamp": { "type": "string" },
    "branch": { "type": "string" },
    "remote": { "type": "string" },
    "pulledCommits": { "type": "integer" },
    "pushedCommits": { "type": "integer" },
    "hasConflicts": { "type": "boolean" },
    "uncommittedChangesBefore": { "type": "integer" },
    "syncStatus": { "type": "string", "enum": ["success", "conflict", "error", "no-op"] },
    "message": { "type": "string" }
  },
  "required": ["timestamp", "branch", "remote", "syncStatus", "message"]
}
```
