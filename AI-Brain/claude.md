# 🛡️ Project Constitution — Obsidian AI Brain & Antigravity Skills

> This file is the **LAW**. It defines the deterministic rules, architectural invariants, and data schemas for this environment.

---

## 🏛️ ARCHITECTURAL INVARIANTS (A.N.T.)

1. **Layer 1: Architecture (`architecture/`)**
   - All logic must be documented in Markdown SOPs before code is written.
   - SOPs are the "Source of Truth" for how tools operate.

13. **Layer 2: Navigation (The Maestro)**
   - Antigravity acts as the **Maestro**, coordinating all agents, models, and tools.
   - The LLM (Antigravity) routes data between SOPs, external "Pro" models, and local Tools.
   - Reasoning must be sequential, transparent, and self-healing.

3. **Layer 3: Tools (`tools/`)**
   - Deterministic Python scripts.
   - No hardcoded secrets (use `.env`).
   - Use `.tmp/` for intermediates.

---

## 🗂️ DATA SCHEMAS

*See [[gemini.md]] for full data schemas and skill registry.*

---

## 🔧 BEHAVIORAL RULES

- **B.L.A.S.T. Protocol** must be followed for every major task.
- **Data-First**: Define schema in `gemini.md` before coding.
- **Self-Healing**: Analyze errors, patch tools, update SOPs.
- **No Placeholders**: Generate real assets or data.
- **Source of Truth**: The `AI-Brain/` directory is the root for all project tracking.
- **Maestro Protocol**: Antigravity leverages external "Pro" models (like Claude Pro) for high-level strategy. These insights must be saved as `skills/` or `architecture/` for Antigravity to execute deterministically.

---

## 📅 MAINTENANCE LOG

| Date | Change | Author |
|------|--------|--------|
| 2026-05-10 | Constitution restored to AI-Brain folder | Antigravity Pilot |
| 2026-05-10 | Conflict resolved: root-level duplicates removed | Antigravity Pilot |
| 2026-05-16 | Maestro Role established; Claude Pro integration defined | Antigravity Maestro |
