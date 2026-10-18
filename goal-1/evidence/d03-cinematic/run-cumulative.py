from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess
import time

root = Path(__file__).resolve().parents[3]
phase = root / 'goal-1/evidence/d03-cinematic'
out = phase / 'cumulative'
out.mkdir(exist_ok=False)
freeze = json.loads((phase / 'candidate1-source-freeze.json').read_text())['sha256']
steps = [
    ('typecheck', ['npm', 'run', 'typecheck']),
    ('unit', ['node', 'node_modules/vitest/vitest.mjs', 'run', '--config', 'goal-1/evidence/d03-cinematic/ordered.vitest.config.ts', '--maxWorkers=1']),
    ('tools', ['python3', '-B', '-m', 'unittest', 'discover', '-s', 'scripts', '-p', 'test_*.py']),
    ('content', ['npm', 'run', 'validate:content']),
    ('docs', ['npm', 'run', 'check:docs']),
    ('build', ['npm', 'run', 'build', '--', '--outDir', '.delivery/d03-cinematic-cumulative']),
    ('life', ['node', '--experimental-strip-types', 'scripts/collect_life_evidence.ts', '--output-dir', 'goal-1/evidence/d03-cinematic/replay-life']),
    ('playable', ['node', '--experimental-strip-types', 'scripts/collect_playable_evidence.ts', '--output-dir', 'goal-1/evidence/d03-cinematic/replay-playable']),
]
records = []


def verify_source():
    changed = [p for p, sha in freeze.items() if hashlib.sha256((root / p).read_bytes()).hexdigest() != sha]
    if changed:
        raise RuntimeError('FROZEN_SOURCE_CHANGED: ' + ','.join(changed))


def save(status):
    report = {'taskId': 'D03-CINEMATIC', 'status': status, 'sourceFreeze': 'candidate1-source-freeze.json', 'driverSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'steps': records, 'scope': 'Current full496 in79 files; original assertions/deadlines/fork isolation. Explicit pair-first order does not prove default-order timing stability. Not native/human/whole-game acceptance.'}
    (out / 'cumulative-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


verify_source()
save('running')
for name, command in steps:
    verify_source()
    start = time.monotonic()
    started = datetime.now(timezone.utc).isoformat()
    print(json.dumps({'step': name, 'status': 'running', 'startedAt': started}), flush=True)
    with (out / (name + '-output.txt')).open('wb') as stream:
        result = subprocess.run(command, cwd=root, stdout=stream, stderr=subprocess.STDOUT)
    row = {'name': name, 'command': command, 'startedAt': started, 'exitCode': result.returncode, 'wallSeconds': round(time.monotonic() - start, 3), 'output': name + '-output.txt'}
    records.append(row)
    (out / (name + '-result.json')).write_text(json.dumps(row, ensure_ascii=False, indent=2) + '\n')
    verify_source()
    save('running' if result.returncode == 0 else 'failed_stopped')
    print(json.dumps(row), flush=True)
    if result.returncode != 0:
        raise SystemExit(result.returncode)
save('passed')
print('CURRENT CINEMATIC CUMULATIVE CHECKS PASSED', flush=True)
