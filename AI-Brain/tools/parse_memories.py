#!/usr/bin/env python3
"""Convert supported AI conversation exports into traceable Obsidian source notes.

Raw exports should remain in AI-Brain/_Inbox/ until their imported notes have
been reviewed. Generated notes are source records, not approved personal memory.
"""

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


def yaml_string(value: str) -> str:
    """JSON strings are valid YAML scalars and safely quote user supplied text."""
    return json.dumps(str(value), ensure_ascii=False)


def slugify(value: str) -> str:
    value = re.sub(r"[^\w\s-]", "", value.lower(), flags=re.UNICODE)
    return re.sub(r"[\s_-]+", "-", value).strip("-")[:80] or "untitled"


def timestamp_date(value) -> str:
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(value, tz=timezone.utc).date().isoformat()
    if isinstance(value, str) and value:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed.date().isoformat()
        except ValueError:
            if re.match(r"^\d{4}-\d{2}-\d{2}$", value):
                return value
    return datetime.now(timezone.utc).date().isoformat()


def text_content(value) -> str:
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "\n".join(text_content(part) for part in value if text_content(part).strip())
    if isinstance(value, dict):
        # ChatGPT exports store text in parts; other payloads are preserved as
        # readable JSON so image/audio placeholders are not silently lost.
        if "parts" in value:
            return text_content(value["parts"])
        if "text" in value and isinstance(value["text"], str):
            return value["text"]
        return json.dumps(value, ensure_ascii=False)
    return ""


def normalize_messages(messages) -> list[dict]:
    normalized = []
    for message in messages or []:
        if not isinstance(message, dict):
            continue
        role = str(message.get("role") or message.get("sender") or "unknown").lower()
        role = {"human": "user", "model": "assistant"}.get(role, role)
        content = text_content(message.get("content", message.get("text", ""))).strip()
        if content:
            normalized.append({"role": role, "content": content})
    return normalized


def parse_chatgpt(data) -> list[dict]:
    conversations = data if isinstance(data, list) else data.get("conversations", [])
    result = []
    for conv in conversations:
        messages = []
        mapping = conv.get("mapping", {})
        for node in mapping.values():
            msg = node.get("message") or {}
            author = msg.get("author") or {}
            content = text_content(msg.get("content", {})).strip()
            if content:
                messages.append({
                    "role": author.get("role", "unknown"),
                    "content": content,
                    "timestamp": msg.get("create_time"),
                })
        # Mapping order is not guaranteed to match conversation order.
        messages.sort(key=lambda item: item.get("timestamp") or 0)
        result.append({
            "title": conv.get("title") or "Untitled conversation",
            "id": conv.get("id") or "unknown",
            "date": timestamp_date(conv.get("create_time")),
            "messages": normalize_messages(messages),
        })
    return result


def parse_claude(data) -> list[dict]:
    conversations = data if isinstance(data, list) else data.get("conversations", [])
    result = []
    for conv in conversations:
        result.append({
            "title": conv.get("name") or "Untitled conversation",
            "id": conv.get("uuid") or "unknown",
            "date": timestamp_date(conv.get("created_at")),
            "messages": normalize_messages(conv.get("chat_messages", [])),
        })
    return result


def parse_generic(data) -> list[dict]:
    items = data if isinstance(data, list) else data.get("conversations", [data]) if isinstance(data, dict) else []
    result = []
    for index, item in enumerate(items):
        messages = item.get("messages") or item.get("turns") or []
        if not messages and (item.get("answer") or item.get("response")):
            messages = [{"role": "assistant", "content": item.get("answer") or item.get("response")}]
        result.append({
            "title": item.get("title") or item.get("query") or f"Conversation {index + 1}",
            "id": item.get("id") or item.get("uuid") or str(index),
            "date": timestamp_date(item.get("date") or item.get("created_at")),
            "messages": normalize_messages(messages),
        })
    return result


def build_note(note: dict, source: str, input_path: Path) -> str:
    source_tag = re.sub(r"[^a-z0-9-]+", "-", source.lower()).strip("-")
    transcript = []
    for message in note["messages"]:
        transcript.extend([f"### {message['role'].title()}", "", message["content"], ""])
    transcript_md = "\n".join(transcript).rstrip() or "_No text messages were found in this export._"
    return f"""---
type: source-conversation
status: needs-review
source: {yaml_string(source)}
source_id: {yaml_string(note['id'])}
date: {note['date']}
title: {yaml_string(note['title'])}
source_export: {yaml_string(input_path.as_posix())}
tags:
  - ai-source-record
  - source-{source_tag}
---

# {note['title']}

> Imported source record. Review before creating or updating durable personal memory.

## Review
- Summary: pending human review
- Durable facts or preferences: pending human review
- Decisions and lessons: pending human review

## Transcript
{transcript_md}
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Import AI conversation exports as reviewable source records.")
    parser.add_argument("--source", required=True, choices=["chatgpt", "claude", "perplexity", "gemini", "copilot"])
    parser.add_argument("--input", required=True, help="Path to a JSON export")
    parser.add_argument("--output", required=True, help="Output directory for source notes")
    parser.add_argument("--dry-run", action="store_true", help="List planned output paths without writing")
    parser.add_argument("--overwrite", action="store_true", help="Replace existing notes (default: stop on any collision)")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.is_file():
        parser.error(f"input file not found: {input_path}")
    try:
        data = json.loads(input_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        parser.error(f"could not read JSON export: {exc}")

    parse_fn = {"chatgpt": parse_chatgpt, "claude": parse_claude}.get(args.source, parse_generic)
    notes = parse_fn(data)
    output_dir = Path(args.output)
    source_name = args.source.title()
    try:
        source_export = input_path.resolve().relative_to(Path.cwd().resolve()).as_posix()
    except ValueError:
        # Avoid persisting machine-specific absolute paths into synced notes.
        source_export = input_path.name

    planned = []
    seen = set()
    for note in notes:
        identifier = slugify(note["id"])
        filename = f"{note['date']}--{slugify(note['title'])}--{identifier[:32]}.md"
        path = output_dir / filename
        if path in seen:
            parser.error(f"duplicate output path within this import: {path}")
        seen.add(path)
        planned.append((path, note))

    if args.dry_run:
        collisions = {path for path, _ in planned if path.exists()}
        for path, _ in planned:
            print(f"{path}{' [exists]' if path in collisions else ''}")
        print(f"Dry run: {len(planned)} note(s), {len(collisions)} existing path(s); no files written.")
        return 0

    collisions = [path for path, _ in planned if path.exists()]
    if collisions and not args.overwrite:
        parser.error("output already exists; rerun with --overwrite only if replacement is intended: " + ", ".join(map(str, collisions[:5])))

    output_dir.mkdir(parents=True, exist_ok=True)
    for path, note in planned:
        content = build_note(note, source_name, Path(source_export))
        temporary = path.with_suffix(path.suffix + ".tmp")
        with temporary.open("w", encoding="utf-8", newline="\n") as handle:
            handle.write(content)
        temporary.replace(path)
    print(f"Imported {len(planned)} source record(s) into {output_dir}.")
    print("Generated records are marked needs-review; retain the original export until review is complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
