"""D03 frozen-source cumulative verification; serial, immutable output files."""
import hashlib
import json
from pathlib import Path
import subprocess
import time

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
FREEZE = json.loads((OUT / 'candidate1-source-freeze.json').read_text())['sha256']


def frozen():
    for name, expected in FREEZE.items():
        if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != expected:
            raise RuntimeError('SOURCE_CHANGED:' + name)


STEPS = [
    ('typecheck', ['npm', 'run', 'typecheck']),
    ('unit', ['npm', 'run', 'test:unit', '--', '--maxWorkers=1']),
    ('tools', ['npm', 'run', 'test:docs']),
    ('content', ['npm', 'run', 'validate:content']),
    ('docs', ['npm', 'run', 'check:docs']),
    ('build', ['npm', 'run', 'build', '--', '--outDir', str(ROOT / '.delivery/d03-cumulative')]),
    ('life-replay', ['node', '--experimental-strip-types', 'scripts/collect_life_evidence.ts', '--output-dir', 'goal-1/evidence/d03/replay-life']),
    ('playable-replay', ['npm', 'run', 'evidence:playable', '--', '--output-dir', 'goal-1/evidence/d03/replay-playable']),
]

frozen()
if any((OUT / ('cumulative-' + name + '-result.json')).exists() for name, _ in STEPS):
    raise RuntimeError('USE_FRESH_CUMULATIVE_DESTINATION')
results = []
for number, (name, command) in enumerate(STEPS, 1):
    frozen()
    started = time.monotonic()
    print('START', number, name, flush=True)
    with (OUT / ('cumulative-' + name + '-output.txt')).open('x') as log:
        process = subprocess.run(command, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
    result = dict(step=number, name=name, command=command, exitCode=process.returncode,
                  wallSeconds=round(time.monotonic() - started, 3))
    with (OUT / ('cumulative-' + name + '-result.json')).open('x') as handle:
        json.dump(result, handle, indent=2)
        handle.write('\n')
    results.append(result)
    print('END', json.dumps(result), flush=True)
    frozen()
    if process.returncode:
        raise SystemExit(process.returncode)
with (OUT / 'cumulative-results.json').open('x') as handle:
    json.dump(dict(scope='D03/C-D03 current frozen source; original assertions, limits and isolation unchanged',
                   sourceFreeze='candidate1-source-freeze.json', sourceFiles=len(FREEZE),
                   results=results, sourceUnchanged=True), handle, indent=2)
    handle.write('\n')
