#!/usr/bin/env python3
"""Batch Inbox Importer for AI-Brain.
Scans AI-Brain/_Inbox/{source} for JSON conversation exports and runs parse_memories.py.
"""

import os
import sys
import subprocess
from pathlib import Path

VAULT_ROOT = Path(__file__).resolve().parent.parent.parent
INBOX_DIR = VAULT_ROOT / "AI-Brain" / "_Inbox"
MEMORIES_DIR = VAULT_ROOT / "AI-Brain" / "Memories"
PARSER_SCRIPT = VAULT_ROOT / "AI-Brain" / "tools" / "parse_memories.py"

SOURCES = ["chatgpt", "claude", "copilot", "gemini", "perplexity"]

def main():
    print(f"🔍 Scanning {INBOX_DIR} for AI exports...")
    total_found = 0
    total_processed = 0

    for source in SOURCES:
        source_inbox = INBOX_DIR / (source.capitalize() if source != "chatgpt" else "ChatGPT")
        if not source_inbox.exists():
            continue

        output_dir = MEMORIES_DIR / (source.capitalize() if source != "chatgpt" else "ChatGPT")
        output_dir.mkdir(parents=True, exist_ok=True)

        json_files = list(source_inbox.glob("*.json"))
        if not json_files:
            continue

        print(f"\n📂 [{source.upper()}] Found {len(json_files)} export file(s):")
        for jf in json_files:
            total_found += 1
            print(f"  ⚡ Processing: {jf.name} -> {output_dir}")
            cmd = [
                sys.executable,
                str(PARSER_SCRIPT),
                "--source", source,
                "--input", str(jf),
                "--output", str(output_dir)
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0:
                print(f"     ✅ Successfully imported.")
                total_processed += 1
            else:
                print(f"     ⚠️ Error importing: {res.stderr.strip() or res.stdout.strip()}")

    if total_found == 0:
        print("\nℹ️ No pending .json export files found in AI-Brain/_Inbox subfolders.")
        print("To import conversations:")
        print("1. Drop ChatGPT conversations.json into AI-Brain/_Inbox/ChatGPT/")
        print("2. Drop Claude conversations.json into AI-Brain/_Inbox/Claude/")
        print("3. Drop Gemini export into AI-Brain/_Inbox/Gemini/")
        print("4. Re-run this script: python AI-Brain/tools/import_inbox.py")
    else:
        print(f"\n🎉 Finished processing. Total files processed: {total_processed}/{total_found}")

if __name__ == "__main__":
    main()
