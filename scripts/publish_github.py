#!/usr/bin/env python3
"""Create a private GitHub repository and push this clean, committed project.

Requires Git, GitHub CLI and an authenticated matching personal GitHub account.
No tokens are accepted by this script. It never force-pushes or changes visibility.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable


class PublishError(RuntimeError):
    pass


def run(argv: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(argv, cwd=cwd, text=True, encoding="utf-8", errors="replace", capture_output=True,
                          env={**os.environ, "GH_HOST": "github.com"})


def publish(root: Path, allow_existing: bool = False,
            runner: Callable = run, check_tools: bool = True) -> dict:
    root = root.resolve()
    config = json.loads((root / "planning/repository.json").read_text(encoding="utf-8"))
    owner, name = config["owner"], config["name"]
    if not re.fullmatch(r"[A-Za-z0-9-]+", owner) or not re.fullmatch(r"[A-Za-z0-9_.-]+", name):
        raise PublishError("Invalid repository owner or name.")
    if config.get("visibility") != "private" or config.get("defaultBranch") != "main":
        raise PublishError("This initialization script supports only a private main-branch repository.")
    if check_tools:
        for tool in ("git", "gh"):
            if not shutil.which(tool):
                raise PublishError(f"Missing {tool}; install it before publishing.")
    if not (root / ".git").exists():
        raise PublishError("Missing .git. Use the complete ZIP or clone the supplied Git bundle.")

    def cmd(*args: str, allow_failure: bool = False) -> subprocess.CompletedProcess[str]:
        result = runner(list(args), root)
        if result.returncode and not allow_failure:
            # Do not print raw subprocess output: it may contain private environment details.
            raise PublishError(f"Command failed ({result.returncode}): {args[0]} {args[1]}. "
                               "Check authentication/network and consult docs/12-github-workflow.md.")
        return result

    top = cmd("git", "rev-parse", "--show-toplevel").stdout.strip()
    if Path(top).resolve() != root:
        raise PublishError("Refusing to publish a parent or unrelated Git repository.")
    if cmd("git", "branch", "--show-current").stdout.strip() != "main":
        raise PublishError("Check out main before initial publication.")
    if cmd("git", "status", "--porcelain").stdout.strip():
        raise PublishError("Worktree is not clean. Review and commit changes before publication.")
    head = cmd("git", "rev-parse", "HEAD").stdout.strip()
    login = cmd("gh", "api", "--hostname", "github.com", "user", "--jq", ".login").stdout.strip()
    if login.casefold() != owner.casefold():
        raise PublishError(f"Authenticated account is {login}; expected {owner}. No repository created.")

    full = f"{owner}/{name}"
    url = f"https://github.com/{full}"
    clone_url = url + ".git"
    origin = cmd("git", "remote", "get-url", "origin", allow_failure=True)
    if origin.returncode == 0 and origin.stdout.strip() not in (url, clone_url, f"git@github.com:{full}.git"):
        raise PublishError("An unrelated origin exists. Refusing to replace it.")
    meta_result = cmd("gh", "api", "--hostname", "github.com", f"repos/{full}", allow_failure=True)
    existed = meta_result.returncode == 0
    if existed:
        if not allow_existing:
            raise PublishError("Repository already exists. Review it, then use --allow-existing for a safe retry.")
    else:
        if not re.search(r"\b404\b", meta_result.stderr):
            raise PublishError("Could not establish repository absence; no creation attempted.")
        print(f"Creating PRIVATE repository {full} ...", flush=True)
        cmd("gh", "repo", "create", full, "--private", "--disable-wiki", "--description", config["description"])
        meta_result = cmd("gh", "api", "--hostname", "github.com", f"repos/{full}")

    meta = json.loads(meta_result.stdout)
    if meta.get("private") is not True or meta.get("full_name", "").casefold() != full.casefold():
        raise PublishError("Repository ownership/privacy verification failed; nothing will be pushed.")
    print("Configuring GitHub CLI's Git credential helper (no credentials in project files).", flush=True)
    cmd("gh", "auth", "setup-git", "--hostname", "github.com")
    refs_result = cmd("git", "ls-remote", "--heads", clone_url)
    refs = [line.split() for line in refs_result.stdout.splitlines() if line.strip()]
    if refs:
        if len(refs) != 1 or refs[0][1] != "refs/heads/main":
            raise PublishError("Unexpected remote branches; refusing to modify existing history.")
        remote_head = refs[0][0]
        ancestor = cmd("git", "merge-base", "--is-ancestor", remote_head, head, allow_failure=True)
        if ancestor.returncode:
            raise PublishError("Remote main is unknown or not an ancestor. No force-push or automatic merge.")
    if origin.returncode:
        cmd("git", "remote", "add", "origin", clone_url)
    print("Pushing main without force ...", flush=True)
    cmd("git", "push", "--set-upstream", "origin", "main")
    # gh creates repos using the user's configured default; ensure this project uses main.
    after = json.loads(cmd("gh", "api", "--hostname", "github.com", f"repos/{full}").stdout)
    if after.get("private") is not True:
        raise PublishError("Privacy changed during publication. Verify the repository immediately.")
    if after.get("default_branch") != "main":
        cmd("gh", "repo", "edit", full, "--default-branch", "main")
    verify = cmd("git", "ls-remote", clone_url, "refs/heads/main").stdout.split()
    if len(verify) != 2 or verify[0] != head or verify[1] != "refs/heads/main":
        raise PublishError("Push returned, but remote commit verification failed.")
    receipt = {"repository": full, "url": url, "visibility": "private", "branch": "main",
               "commit": head, "verified_at": datetime.now(timezone.utc).isoformat(),
               "created_by_this_run": not existed}
    receipt_dir = root / ".delivery"
    receipt_dir.mkdir(exist_ok=True)
    (receipt_dir / "publish-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    return receipt


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-existing", action="store_true", help="Allow a verified private, empty or compatible repository.")
    args = parser.parse_args()
    try:
        receipt = publish(Path(__file__).resolve().parents[1], args.allow_existing)
    except (PublishError, OSError, ValueError, KeyError) as exc:
        print(f"Publication stopped: {exc}", file=sys.stderr)
        print("No force-push was performed. Remote creation may have succeeded before a later failure; "
              "review the remote before using --allow-existing.", file=sys.stderr)
        return 1
    print(f"Verified: {receipt['url']}\nmain @ {receipt['commit']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
