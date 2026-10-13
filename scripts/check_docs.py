#!/usr/bin/env python3
"""Offline checks for documentation links, task dependency graph and original assets."""
from __future__ import annotations
import hashlib
import json
import re
import struct
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse


def check(root: Path, *, text_only: bool = False) -> list[str]:
    errors: list[str] = []
    documents = sorted(p for p in root.rglob('*.md') if '.git' not in p.parts and '.delivery' not in p.parts)
    for doc in documents:
        text = doc.read_text(encoding='utf-8')
        text = re.sub(r'```.*?```', '', text, flags=re.S)
        for target in re.findall(r'!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)', text):
            parsed = urlparse(target)
            if parsed.scheme or target.startswith('#'):
                continue
            file_path = (doc.parent / unquote(parsed.path)).resolve()
            if not file_path.is_relative_to(root.resolve()) or not file_path.exists():
                errors.append(f'{doc.relative_to(root)}: broken local link {target}')
    for path in root.rglob('*.json'):
        if '.git' not in path.parts and '.delivery' not in path.parts:
            try:
                json.loads(path.read_text(encoding='utf-8'))
            except (ValueError, OSError) as exc:
                errors.append(f'{path.relative_to(root)}: invalid JSON ({exc})')
    manifest = json.loads((root/'assets/concepts/manifest.json').read_text(encoding='utf-8'))
    missing_assets = []
    for asset in manifest['assets']:
        asset_path = root/asset['path']
        if not asset_path.exists():
            missing_assets.append(asset['path'])
            if not text_only:
                errors.append(f"Missing original asset: {asset['path']}")
            continue
        data = asset_path.read_bytes()
        if hashlib.sha256(data).hexdigest() != asset['sha256'] or len(data) != asset['bytes']:
            errors.append(f"Asset integrity mismatch: {asset['path']}")
        if data[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', data[16:24]) != (asset['width'], asset['height']):
            errors.append(f"PNG size/signature mismatch: {asset['path']}")
    tasks = json.loads((root/'planning/backlog.json').read_text(encoding='utf-8'))['tasks']
    by_id = {t['id']:t for t in tasks}
    if len(by_id) != len(tasks):
        errors.append('Duplicate task IDs')
    visited, active = set(), set()
    def visit(task_id: str) -> None:
        if task_id not in by_id:
            errors.append(f'Unknown dependency: {task_id}'); return
        if task_id in active:
            errors.append(f'Circular dependency at {task_id}'); return
        if task_id in visited:
            return
        active.add(task_id)
        for dep in by_id[task_id]['dependsOn']:
            visit(dep)
        active.remove(task_id); visited.add(task_id)
    for t in tasks:
        visit(t['id'])
        if not t.get('acceptanceCriteria'):
            errors.append(f"Task {t['id']} lacks acceptance criteria")
    for path in missing_assets:
        print(f'PENDING ORIGINAL ASSET: {path}')
    if not errors:
        mode = 'TEXT-ONLY (original assets may be missing)' if text_only else 'FULL ASSET'
        print(f'PASS {mode}: {len(documents)} Markdown files, {len(tasks)} tasks; text links, JSON and dependency graph verified.')
        print(f'Original PNG files present and checked: {len(manifest["assets"])-len(missing_assets)}/{len(manifest["assets"])}')
        print('This is documentation validation, not a game build or a remote publication test.')
    return errors

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--text-only', action='store_true', help='Report missing original PNGs without treating them as a completed asset check.')
    args = parser.parse_args()
    try:
        failures = check(Path(__file__).resolve().parents[1], text_only=args.text_only)
    except (OSError, ValueError, KeyError) as exc:
        print(f'Validation failed: {exc}', file=sys.stderr); raise SystemExit(1)
    for failure in failures:
        print(failure, file=sys.stderr)
    raise SystemExit(bool(failures))
