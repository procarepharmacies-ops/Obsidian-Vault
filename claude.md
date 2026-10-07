# 🛡️ Project Constitution — Obsidian Vault Sync

## 🏛️ Architectural Invariants (A.N.T.)
1. **Layer 1: Architecture (`architecture/`):**
   - All Git sync procedures and recovery mechanisms documented in SOPs before modification.
2. **Layer 2: Navigation:**
   - Antigravity acts as the System Pilot orchestrating configuration and self-healing.
3. **Layer 3: Tools (`tools/`):**
   - Deterministic scripts with isolated responsibilities, secrets via `.env`, intermediate files in `.tmp/`.

## 🔧 Behavioral Rules
- **Data-First:** Define schemas and configuration contracts in `gemini.md`.
- **Self-Annealing:** Detect Git merge/push/auth errors deterministically and provide automated recovery.
- **Safety First:** Never force-push (`git push --force`) without explicit confirmation; ensure binary and secret files (`.env`, large archives, installers) are protected by `.gitignore`.
