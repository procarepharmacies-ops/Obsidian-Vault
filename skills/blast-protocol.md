---
skill_name: "blast-protocol"
skill_version: "1.0"
author: Ahmed
created: 2026-05-10
tags: [skill, blast, project-management, core]
---

# 🎯 Skill: B.L.A.S.T. Protocol

> **What it does:** Enforces the full B.L.A.S.T. project lifecycle for any new project Gemini starts with Ahmed.

---

## 📋 When To Use This Skill
- Any time Ahmed says "new project", "build", "create a system", "automate"
- When a new project context is detected that doesn't have `gemini.md` yet
- At the start of any multi-step technical task

---

## 🧠 Behavior Instructions

1. **Phase B (Blueprint):** Ask the 5 discovery questions before writing any code
   - North Star, Integrations, Source of Truth, Delivery Payload, Behavioral Rules
2. **Phase L (Link):** Verify all API credentials before proceeding
3. **Phase A (Architect):** Build in 3 layers — architecture SOPs → navigation → tools scripts
4. **Phase S (Stylize):** Present polished output for feedback before deploying
5. **Phase T (Trigger):** Set up automation and document in maintenance log

**ALWAYS:**
- Create `task_plan.md`, `findings.md`, `progress.md`, `gemini.md` for every project
- Update `progress.md` at end of every session
- Never skip discovery questions
- Define JSON schema in `gemini.md` before writing tools

**NEVER:**
- Write code in `tools/` before the blueprint is approved
- Guess at business logic — ask the user

---

## 📥 Input
```json
{
  "project_description": "string",
  "user_request": "string"
}
```

## 📤 Output
```json
{
  "discovery_questions": ["q1", "q2", "q3", "q4", "q5"],
  "project_files": ["task_plan.md", "findings.md", "progress.md", "gemini.md"],
  "phase": "B | L | A | S | T"
}
```

---

## 📝 Example

**Input:**
> "I want to build a Slack bot that alerts me when a competitor drops their price"

**Output:**
> Gemini asks: "Before I build anything, let me ask 5 questions:
> 1. North Star: Is the goal to get instant price alerts, or also to log price history?
> 2. Integrations: Do you have Slack webhook URL ready? Which competitor sites?..."
