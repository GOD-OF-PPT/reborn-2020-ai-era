from pathlib import Path
from datetime import datetime, timezone
import argparse
import hashlib
import json
import subprocess
import time

parser = argparse.ArgumentParser()
parser.add_argument('--commit', required=True)
parser.add_argument('--output-dir', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parents[3]
out = (root / args.output_dir).resolve()
assert out.is_relative_to(root) and not out.exists()
out.mkdir()
sha = lambda data: hashlib.sha256(data).hexdigest()
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip() == args.commit
paths = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', args.commit, '--', 'goal-1/evidence/d03-cinematic', 'goal-1/evidence/d03-cinematic-c2'], cwd=root, text=True).splitlines()
assert paths
before = {}
for path in paths:
    raw = (root / path).read_bytes()
    assert raw == subprocess.check_output(['git', 'show', args.commit + ':' + path], cwd=root), path
    before[path] = sha(raw)

attempts = [
    ('native', ['node', '--experimental-strip-types', 'goal-1/evidence/d03-cinematic-c2/verify-native.mjs', '--output-dir', 'goal-1/evidence/d03-cinematic-c2/native-audit'], 'IMMUTABLE_TASK_EVIDENCE'),
    ('cross-replay', ['node', '--experimental-strip-types', 'goal-1/evidence/d03-cinematic-c2/verify-c1-native-replay.mjs', '--output-dir', 'goal-1/evidence/d03-cinematic-c2/c1-cross-replay'], 'IMMUTABLE_TASK_EVIDENCE'),
    ('life', ['node', '--experimental-strip-types', 'scripts/collect_life_evidence.ts', '--output-dir', 'goal-1/evidence/d03-cinematic-c2/replay-life'], 'IMMUTABLE_TASK_EVIDENCE'),
    ('playable', ['node', '--experimental-strip-types', 'scripts/collect_playable_evidence.ts', '--output-dir', 'goal-1/evidence/d03-cinematic-c2/replay-playable'], 'IMMUTABLE_TASK_EVIDENCE'),
    ('preparation', ['node', '--experimental-strip-types', 'goal-1/evidence/d03-cinematic-c2/measure-preparation.mjs', '--output-dir', 'goal-1/evidence/d03-cinematic-c2/preparation-v2'], 'IMMUTABLE_TASK_EVIDENCE'),
    ('cumulative', ['python3', 'goal-1/evidence/d03-cinematic-c2/run-cumulative.py'], 'FileExistsError'),
]
results = []
for name, command, marker in attempts:
    started = time.monotonic()
    run = subprocess.run(command, cwd=root, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    text = run.stdout.decode('utf8', errors='strict')
    (out / (name + '-refusal-output.txt')).write_bytes(run.stdout)
    assert run.returncode != 0 and marker in text, (name, run.returncode, text)
    results.append({'name': name, 'command': command, 'exitCode': run.returncode, 'wallSeconds': round(time.monotonic() - started, 3), 'expectedMarker': marker, 'refusedBeforeArtifactWrite': True})

for path, expected in before.items():
    assert sha((root / path).read_bytes()) == expected, path
    assert (root / path).read_bytes() == subprocess.check_output(['git', 'show', args.commit + ':' + path], cwd=root), path
meta = json.loads(subprocess.check_output(['gh', 'repo', 'view', '--json', 'nameWithOwner,visibility,url'], cwd=root, text=True))
assert meta['nameWithOwner'] == 'GOD-OF-PPT/reborn-2020-ai-era' and meta['visibility'] == 'PUBLIC'
remote = subprocess.check_output(['git', 'ls-remote', 'origin', 'refs/heads/main'], cwd=root, text=True).strip()
branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=root, text=True).strip()
report = {'taskId': 'D03-CINEMATIC-C2', 'featureCommit': args.commit, 'recordedAtUtc': datetime.now(timezone.utc).isoformat(), 'attempts': results, 'committedEvidenceFiles': len(paths), 'allOriginalShaAndGitBlobsUnchangedBeforeAfter': True, 'repository': meta, 'branch': branch, 'remoteMainReadback': remote, 'pushedByThisTask': False, 'goalComplete': False, 'scope': 'Post-commit refusal and exact byte preservation only; not whole-game or native200percent/human acceptance.'}
(out / 'post-commit-check.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'result': 'POST_COMMIT_GUARDS_PASS', 'attempts': len(results), 'preservedEvidenceFiles': len(paths), 'featureCommit': args.commit, 'remoteMain': remote}, ensure_ascii=False))
