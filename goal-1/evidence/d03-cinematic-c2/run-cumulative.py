from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess
import time
import re

root = Path(__file__).resolve().parents[3]
phase = root / 'goal-1/evidence/d03-cinematic-c2'
out = phase / 'cumulative'
out.mkdir(exist_ok=False)
freeze = json.loads((phase / 'candidate2-source-freeze.json').read_text())['sha256']
steps = [
    ('typecheck', ['npm', 'run', 'typecheck']),
    ('unit', ['npm', 'run', 'test:unit', '--', '--maxWorkers=1', '--reporter=verbose']),
    ('tools', ['python3', '-B', '-m', 'unittest', 'discover', '-s', 'scripts', '-p', 'test_*.py']),
    ('content', ['npm', 'run', 'validate:content']),
    ('docs', ['npm', 'run', 'check:docs']),
    ('build', ['npm', 'run', 'build', '--', '--outDir', '.delivery/d03-cinematic-c2-cumulative']),
    ('life', ['node', '--experimental-strip-types', 'scripts/collect_life_evidence.ts', '--output-dir', 'goal-1/evidence/d03-cinematic-c2/replay-life']),
    ('playable', ['node', '--experimental-strip-types', 'scripts/collect_playable_evidence.ts', '--output-dir', 'goal-1/evidence/d03-cinematic-c2/replay-playable']),
]
records = []


def verify_source():
    changed = [p for p, sha in freeze.items() if hashlib.sha256((root / p).read_bytes()).hexdigest() != sha]
    if changed:
        raise RuntimeError('FROZEN_SOURCE_CHANGED: ' + ','.join(changed))


def save(status):
    report = {'taskId': 'D03-CINEMATIC-C2', 'status': status, 'sourceFreeze': 'candidate2-source-freeze.json', 'driverSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'steps': records, 'scope': 'Current full500 in80 files: all original496 plus4 encoding guards, original root config/default ordering/assertions/deadlines/fork isolation, maxWorkers1. Not native/human/whole-game acceptance.'}
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
    if name == 'unit' and result.returncode == 0:
        text = re.sub(r'\x1b\[[0-9;]*m', '', (out / (name + '-output.txt')).read_text())
        if not re.search(r'Test Files\s+80 passed', text) or not re.search(r'Tests\s+500 passed', text):
            raise RuntimeError('FULL80_FILES_500_ASSERTIONS_REQUIRED')
    records.append(row)
    (out / (name + '-result.json')).write_text(json.dumps(row, ensure_ascii=False, indent=2) + '\n')
    verify_source()
    save('running' if result.returncode == 0 else 'failed_stopped')
    print(json.dumps(row), flush=True)
    if result.returncode != 0:
        raise SystemExit(result.returncode)
save('passed')
print('CURRENT CINEMATIC CUMULATIVE CHECKS PASSED', flush=True)
