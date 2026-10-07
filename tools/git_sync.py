"""
Git 2-Way Sync Engine for Obsidian Vault
Implements Layer 3 (Tools) of the A.N.T. architecture per architecture/obsidian-git-setup.md
and gemini.md schema specification.
"""

import sys
import subprocess
import datetime
import json
import argparse
from pathlib import Path

def run_git_cmd(args, cwd):
    result = subprocess.run(
        ["git"] + args,
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
        errors="replace"
    )
    return result

def get_current_branch(vault_path):
    res = run_git_cmd(["rev-parse", "--abbrev-ref", "HEAD"], vault_path)
    if res.returncode == 0:
        return res.stdout.strip()
    return "main"

def count_uncommitted(vault_path):
    res = run_git_cmd(["status", "--porcelain"], vault_path)
    if res.returncode == 0:
        lines = [line for line in res.stdout.strip().splitlines() if line.strip()]
        return len(lines)
    return 0

def git_sync(vault_path, remote="origin", branch=None, direction="sync", dry_run=False):
    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
    vault_path = Path(vault_path).resolve()
    
    if not branch:
        branch = get_current_branch(vault_path)

    result_payload = {
        "timestamp": timestamp,
        "branch": branch,
        "remote": remote,
        "pulledCommits": 0,
        "pushedCommits": 0,
        "hasConflicts": False,
        "uncommittedChangesBefore": count_uncommitted(vault_path),
        "syncStatus": "success",
        "message": ""
    }

    if dry_run:
        result_payload["syncStatus"] = "no-op"
        result_payload["message"] = "Dry-run mode enabled; no changes applied."
        return result_payload

    # Step 1: Pull from remote (if sync or pull)
    if direction in ["sync", "pull"]:
        fetch_res = run_git_cmd(["fetch", remote, branch], vault_path)
        if fetch_res.returncode != 0:
            result_payload["syncStatus"] = "error"
            result_payload["message"] = f"Failed to fetch from {remote}/{branch}: {fetch_res.stderr.strip()}"
            return result_payload

        # Count commits behind before merge
        rev_list = run_git_cmd(["rev-list", f"HEAD..{remote}/{branch}", "--count"], vault_path)
        if rev_list.returncode == 0 and rev_list.stdout.strip().isdigit():
            result_payload["pulledCommits"] = int(rev_list.stdout.strip())

        # Merge remote branch
        if result_payload["pulledCommits"] > 0:
            merge_res = run_git_cmd(["merge", "--no-edit", f"{remote}/{branch}"], vault_path)
            if merge_res.returncode != 0:
                result_payload["hasConflicts"] = True
                result_payload["syncStatus"] = "conflict"
                result_payload["message"] = f"Merge conflict detected: {merge_res.stderr.strip() or merge_res.stdout.strip()}"
                return result_payload

    # Step 2: Push to remote (if sync or push)
    if direction in ["sync", "push"]:
        uncommitted = count_uncommitted(vault_path)
        if uncommitted > 0:
            # Stage all changes respecting .gitignore
            add_res = run_git_cmd(["add", "-A"], vault_path)
            if add_res.returncode != 0:
                result_payload["syncStatus"] = "error"
                result_payload["message"] = f"Failed to stage changes: {add_res.stderr.strip()}"
                return result_payload

            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            commit_msg = f"vault backup: {now_str}"
            commit_res = run_git_cmd(["commit", "-m", commit_msg], vault_path)
            if commit_res.returncode != 0:
                result_payload["syncStatus"] = "error"
                result_payload["message"] = f"Failed to commit: {commit_res.stderr.strip()}"
                return result_payload

        # Check commits ahead
        ahead_res = run_git_cmd(["rev-list", f"{remote}/{branch}..HEAD", "--count"], vault_path)
        if ahead_res.returncode == 0 and ahead_res.stdout.strip().isdigit():
            ahead_count = int(ahead_res.stdout.strip())
            result_payload["pushedCommits"] = ahead_count
            if ahead_count > 0:
                push_res = run_git_cmd(["push", remote, branch], vault_path)
                if push_res.returncode != 0:
                    result_payload["syncStatus"] = "error"
                    result_payload["message"] = f"Failed to push to {remote}/{branch}: {push_res.stderr.strip()}"
                    return result_payload

    result_payload["message"] = (
        f"Sync completed successfully. "
        f"Pulled: {result_payload['pulledCommits']} commits, "
        f"Pushed: {result_payload['pushedCommits']} commits."
    )
    return result_payload

def main():
    parser = argparse.ArgumentParser(description="2-Way Git Sync for Obsidian Vault")
    parser.add_argument("--vault-path", default=".", help="Path to Obsidian Vault root")
    parser.add_argument("--remote", default="origin", help="Git remote name")
    parser.add_argument("--branch", default=None, help="Git branch name")
    parser.add_argument("--direction", choices=["sync", "pull", "push"], default="sync", help="Sync direction")
    parser.add_argument("--dry-run", action="store_true", help="Perform dry run without modifying git state")
    parser.add_argument("--json", action="store_true", help="Output result as JSON")

    args = parser.parse_args()
    res = git_sync(
        vault_path=args.vault_path,
        remote=args.remote,
        branch=args.branch,
        direction=args.direction,
        dry_run=args.dry_run
    )

    if args.json:
        print(json.dumps(res, indent=2))
    else:
        print(f"[{res['timestamp']}] Status: {res['syncStatus'].upper()}")
        print(f"Branch: {res['branch']} -> Remote: {res['remote']}")
        print(f"Pulled Commits: {res['pulledCommits']} | Pushed Commits: {res['pushedCommits']}")
        print(f"Detail: {res['message']}")

    if res["syncStatus"] in ["error", "conflict"]:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()
