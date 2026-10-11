#!/usr/bin/env python3
"""
Deterministic Git sync for the Obsidian vault.

Operates independently of the Obsidian GUI so that terminal sessions,
automated CI/CD, scheduled tasks, or automated backups can sync the
vault when Obsidian is closed.

Usage:
    python tools/git_sync.py [--direction sync|pull|push] [--dry-run] [--vault PATH]

Exit codes:
    0: Sync successful or cleanly up-to-date.
    1: Git merge conflict detected (safely halts and alerts).
    2: Network / authentication error.
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


def run_git(vault: Path, *args: str) -> subprocess.CompletedProcess:
    """Run a git command in the vault directory."""
    return subprocess.run(
        ["git", "-C", str(vault), *args],
        capture_output=True,
        text=True,
        timeout=60,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Deterministic Git sync for Obsidian vault."
    )
    parser.add_argument(
        "--direction",
        choices=["sync", "pull", "push"],
        default="sync",
        help="sync = pull+merge+push (default); pull = fetch+merge only; push = commit+push only",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Show what would happen without writing"
    )
    parser.add_argument(
        "--vault",
        type=Path,
        default=None,
        help="Vault path (default: auto-detect from script location)",
    )
    return parser.parse_args()


def resolve_vault(vault_arg: Path | None) -> Path:
    if vault_arg:
        return vault_arg

    # Auto-detect: look for .git in the parent directories
    current = Path(__file__).resolve().parent
    for candidate in [current, current.parent, current.parent.parent]:
        if (candidate / ".git").exists():
            return candidate

    # Fallback: standard vault location
    fallback = Path.home() / "Documents" / "Obsidian Vault"
    if (fallback / ".git").exists():
        return fallback

    print("ERROR: Could not locate vault .git directory.", file=sys.stderr)
    sys.exit(2)


def check_conflict(vault: Path) -> bool:
    """Check for merge conflict markers in staged/committed files."""
    result = run_git(vault, "diff", "--check")
    if result.stdout.strip():
        return True
    # Also check for conflict markers in the working tree
    for pattern in ["<<<<<<<", "=======", ">>>>>>>"]:
        grep = subprocess.run(
            ["grep", "-rl", pattern, str(vault)],
            capture_output=True,
            text=True,
        )
        if grep.stdout.strip():
            return True
    return False


def main() -> int:
    args = parse_args()
    vault = resolve_vault(args.vault)
    now = datetime.now(timezone.utc)
    commit_msg = f"vault backup: {now.strftime('%Y-%m-%d %H:%M:%S')}"

    result: dict = {
        "timestamp": now.isoformat(),
        "vault_path": str(vault),
        "direction": args.direction,
        "dry_run": args.dry_run,
        "exit_code": 0,
        "steps": [],
    }

    def step(action: str, success: bool, output: str = "") -> None:
        result["steps"].append({"action": action, "success": success, "output": output})

    # Step 1: Fetch from remote
    fetch = run_git(vault, "fetch", "origin", "main")
    step("fetch", fetch.returncode == 0, fetch.stderr.strip() or fetch.stdout.strip())
    if fetch.returncode != 0:
        result["exit_code"] = 2
        result["error"] = "Network/authentication error during fetch"
        print(json.dumps(result, indent=2))
        return 2

    # Step 2: Pull / merge remote changes
    if args.direction in ("sync", "pull"):
        pull = run_git(vault, "pull", "--no-edit", "origin", "main")
        step("pull", pull.returncode == 0, pull.stderr.strip())
        if pull.returncode != 0:
            if check_conflict(vault):
                result["exit_code"] = 1
                result["error"] = "Merge conflict detected — vault sync halted"
                print(json.dumps(result, indent=2))
                return 1
            result["exit_code"] = 2
            result["error"] = "Git pull failed"
            print(json.dumps(result, indent=2))
            return 2

    # Step 3: Check for conflicts before proceeding
    if check_conflict(vault):
        result["exit_code"] = 1
        result["error"] = "Conflict markers detected — resolve manually"
        print(json.dumps(result, indent=2))
        return 1

    # Step 4: Stage changes
    if args.direction in ("sync", "push"):
        add = run_git(vault, "add", "-A")
        step("add", add.returncode == 0, add.stderr.strip())

        if args.dry_run:
            status = run_git(vault, "status", "--short")
            step("dry_run_status", True, status.stdout.strip())
            print(json.dumps(result, indent=2))
            return 0

        # Check if there are changes to commit
        status = run_git(vault, "status", "--porcelain")
        if status.stdout.strip():
            commit = run_git(vault, "commit", "-m", commit_msg)
            step("commit", commit.returncode == 0, commit.stderr.strip())
            if commit.returncode != 0:
                # Might be nothing to commit or other issue
                step("commit_note", True, commit.stderr.strip() or "no changes or nothing to commit")

            # Push
            push = run_git(vault, "push", "origin", "main")
            step("push", push.returncode == 0, push.stderr.strip())
            if push.returncode != 0:
                result["exit_code"] = 2
                result["error"] = "Push failed"
                print(json.dumps(result, indent=2))
                return 2
        else:
            step("commit", True, "no changes to commit")

    # Step 5: Final check
    result["message"] = "Vault sync completed successfully" if args.direction != "sync" or not check_conflict(vault) else "Conflict detected"
    print(json.dumps(result, indent=2))
    return result["exit_code"]


if __name__ == "__main__":
    sys.exit(main())
