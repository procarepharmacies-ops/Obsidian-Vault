#!/usr/bin/env python3
"""
AI Memory Parser — Obsidian AI Brain
Converts ChatGPT/Claude/Perplexity JSON exports into Obsidian Markdown notes.

Usage:
  python parse_memories.py --source chatgpt --input exports/conversations.json --output "AI-Brain/Memories/ChatGPT/"
  python parse_memories.py --source claude   --input exports/claude.json       --output "AI-Brain/Memories/Claude/"
"""

import json
import os
import sys
import argparse
import re
from datetime import datetime
from pathlib import Path


# ─── Helpers ────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    """Convert text to a safe filename."""
    text = re.sub(r'[^\w\s-]', '', text.lower())
    text = re.sub(r'[\s_-]+', '-', text).strip('-')
    return text[:80]  # max 80 chars


def extract_insights(messages: list, max_bullets: int = 5) -> list:
    """Extract first N assistant sentences as rough insights."""
    insights = []
    for msg in messages:
        if msg.get("role") == "assistant":
            content = msg.get("content", "")
            # Split into sentences, grab first ones
            sentences = [s.strip() for s in content.split('. ') if len(s.strip()) > 30]
            insights.extend(sentences[:2])
            if len(insights) >= max_bullets:
                break
    return insights[:max_bullets]


def build_note(title: str, source: str, date: str, conv_id: str, insights: list, summary: str) -> str:
    """Build an Obsidian markdown note string."""
    source_tag = f"source-{source.lower().replace(' ', '-')}"
    insights_md = "\n".join(f"- {i}" for i in insights) if insights else "- (No insights extracted)"

    return f"""---
source: {source}
date: {date}
tags: [ai-memory, {source_tag}]
type: ai-conversation
topic: "{title}"
---

# 🗣️ {title}

## 💡 Key Insights
{insights_md}

## 🔗 Linked Concepts
- [[]]

## 📝 Raw Summary
> {summary[:500] if summary else "(No summary)"}

## 🏷️ Metadata
- **Source:** {source}
- **Date:** {date}
- **Original ID:** {conv_id}
"""


# ─── Platform Parsers ────────────────────────────────────────────────────────

def parse_chatgpt(data: list) -> list:
    """Parse ChatGPT conversations.json format."""
    notes = []
    for conv in data:
        title = conv.get("title", "Untitled Conversation")
        conv_id = conv.get("id", "unknown")
        create_time = conv.get("create_time")
        date = datetime.fromtimestamp(create_time).strftime("%Y-%m-%d") if create_time else datetime.now().strftime("%Y-%m-%d")

        messages = []
        for node in conv.get("mapping", {}).values():
            msg = node.get("message")
            if msg and msg.get("content"):
                parts = msg["content"].get("parts", [])
                content = " ".join(str(p) for p in parts if isinstance(p, str))
                if content.strip():
                    messages.append({"role": msg["author"]["role"], "content": content})

        insights = extract_insights(messages)
        summary = next((m["content"][:300] for m in messages if m["role"] == "assistant"), "")
        notes.append({"title": title, "id": conv_id, "date": date, "messages": messages, "insights": insights, "summary": summary})
    return notes


def parse_claude(data: dict) -> list:
    """Parse Claude export format."""
    notes = []
    conversations = data if isinstance(data, list) else data.get("conversations", [])
    for conv in conversations:
        title = conv.get("name", "Untitled")
        conv_id = conv.get("uuid", "unknown")
        created = conv.get("created_at", "")
        date = created[:10] if created else datetime.now().strftime("%Y-%m-%d")

        messages = [{"role": m["sender"], "content": m.get("text", "")} for m in conv.get("chat_messages", [])]
        insights = extract_insights(messages)
        summary = next((m["content"][:300] for m in messages if m["role"] == "assistant"), "")
        notes.append({"title": title, "id": conv_id, "date": date, "insights": insights, "summary": summary})
    return notes


def parse_generic(data) -> list:
    """Fallback parser for Perplexity/Gemini/Copilot."""
    notes = []
    items = data if isinstance(data, list) else [data]
    for i, item in enumerate(items):
        title = item.get("title") or item.get("query") or f"Conversation {i+1}"
        conv_id = item.get("id") or str(i)
        date = item.get("date") or datetime.now().strftime("%Y-%m-%d")
        messages = item.get("messages") or item.get("turns") or []
        if isinstance(messages, list):
            messages = [{"role": m.get("role", "assistant"), "content": m.get("content", m.get("text", ""))} for m in messages]
        insights = extract_insights(messages) if messages else ["(Manual review needed)"]
        summary = item.get("answer") or item.get("response") or ""
        notes.append({"title": title, "id": conv_id, "date": date, "insights": insights, "summary": summary[:300]})
    return notes


# ─── Main ───────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Convert AI exports to Obsidian notes")
    parser.add_argument("--source", required=True, choices=["chatgpt", "claude", "perplexity", "gemini", "copilot"], help="Source platform")
    parser.add_argument("--input",  required=True, help="Path to the JSON export file")
    parser.add_argument("--output", required=True, help="Output folder for Obsidian notes")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        print(f"❌ Input file not found: {input_path}")
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"✅ Loaded: {input_path}")

    # Route to correct parser
    parsers = {"chatgpt": parse_chatgpt, "claude": parse_claude}
    parse_fn = parsers.get(args.source, parse_generic)
    notes = parse_fn(data)

    print(f"📦 Found {len(notes)} conversations from {args.source}")

    for note in notes:
        filename = f"{note['date']}--{slugify(note['title'])}.md"
        filepath = output_dir / filename
        source_display = args.source.replace("-", " ").title()
        content = build_note(note["title"], source_display, note["date"], note["id"], note["insights"], note["summary"])

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

    print(f"🎉 Done! {len(notes)} notes written to: {output_dir}")
    print(f"\nNext step: Open Obsidian and check your Memories/{args.source.title()}/ folder.")


if __name__ == "__main__":
    main()
