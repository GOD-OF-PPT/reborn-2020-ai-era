from pathlib import Path
import hashlib
import json
import re
import subprocess
import urllib.request

root = Path(__file__).resolve().parents[3]
phase = root / 'goal-1/evidence/d03-cinematic-c2'
c1 = root / 'goal-1/evidence/d03-cinematic'
sha = lambda data: hashlib.sha256(data).hexdigest()
load = lambda path: json.loads(path.read_text())
opening = load(phase / 'opening-files.json')
allowed = {'src/persistence/codec.ts', 'goal-1/tasks.md', 'goal-1/cinematic-plan.md', 'goal-1/d03-progress.md', 'README.md', 'docs/08-technical-plan.md', 'docs/32-interface-experience-redesign.md'}
changed = []
for path, expected in opening['files'].items():
    if sha((root / path).read_bytes()) != expected:
        changed.append(path)
assert set(changed) <= allowed, set(changed) - allowed
freeze = load(phase / 'candidate2-source-freeze.json')['sha256']
assert all(sha((root / p).read_bytes()) == h for p, h in freeze.items())
old = load(c1 / 'candidate1-source-freeze.json')['sha256']
assert [p for p, h in old.items() if freeze[p] != h] == ['src/persistence/codec.ts']
assert set(freeze) - set(old) == {'src/persistence/codec-encoding.test.ts'}
assert sha((phase / 'candidate1-codec-before-repair.ts.txt').read_bytes()) == old['src/persistence/codec.ts']

committed = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', opening['commit'], '--', 'goal-1/evidence/d03-cinematic'], cwd=root, text=True).splitlines()
for path in committed:
    original = subprocess.check_output(['git', 'show', opening['commit'] + ':' + path], cwd=root)
    assert (root / path).read_bytes() == original, path

cumulative = load(phase / 'cumulative/cumulative-results.json')
assert cumulative['status'] == 'passed' and len(cumulative['steps']) == 8
assert all(step['exitCode'] == 0 for step in cumulative['steps'])
unit = re.sub(r'\x1b\[[0-9;]*m', '', (phase / 'cumulative/unit-output.txt').read_text())
assert re.search(r'Test Files\s+80 passed', unit) and re.search(r'Tests\s+500 passed', unit)
life = load(phase / 'replay-life/t15-life-evidence.json')
assert len(life['cases']) == 10 and not life['failures']
playable = load(phase / 'replay-playable/t09-playable-evidence.json')
assert len(playable['cases']) == 2

def resources(folder, manifest, url):
    actual = {str(p.relative_to(folder)): p for p in folder.rglob('*') if p.is_file()}
    assert set(actual) == set(manifest['files'])
    for name, record in manifest['files'].items():
        data = actual[name].read_bytes()
        assert sha(data) == record['sha256'] and len(data) == record['bytes'], name
        assert urllib.request.urlopen(url + name).read() == data, name
    return actual

c1_files = resources(root / '.delivery/d03-cinematic-candidate1', load(c1 / 'candidate1-production-manifest.json'), 'http://127.0.0.1:5232/')
c2_files = resources(root / '.delivery/d03-cinematic-c2-final', load(phase / 'production-manifest.json'), 'http://127.0.0.1:5234/')
built = root / '.delivery/d03-cinematic-c2-cumulative'
assert {str(p.relative_to(built)) for p in built.rglob('*') if p.is_file()} == set(c2_files)
assert all((built / name).read_bytes() == path.read_bytes() for name, path in c2_files.items())

for group in load(c1 / 'assets-manifest.json')['assets']:
    for record in group.get('files', [group]):
        assert sha((root / record['path']).read_bytes()) == record['sha256']
cross = load(phase / 'c1-cross-replay/native-audit.json')
native = load(phase / 'native-audit/native-audit.json')
assert cross['result'] == 'C1_NATIVE_EXPORTS_REPLAYED_BY_C2' and cross['evaluatedUniqueCommands'] == 293
assert native['result'] == 'EXPORT_REPLAY_PASS' and native['checks'] == 18 and native['evaluatedUniqueCommands'] == 79
assert native['nativeAcceptanceComplete'] is False
assert load(phase / 'production-console.json')['entries'] == []
report = {'taskId': 'D03-CINEMATIC-C2', 'result': 'INTEGRITY_PASS', 'openingCommit': opening['commit'], 'openingTrackedFiles': len(opening['files']), 'preservedOldFiles': len(opening['files']) - len(changed), 'authorizedOldChanges': changed, 'frozenFiles': len(freeze), 'uiArtBusinessContentRandomHashOriginal79TestsAndRootConfigUnchangedFromC1': True, 'c1CommittedEvidenceFilesPreserved': len(committed), 'c1FixedResources': len(c1_files), 'c2FixedResources': len(c2_files), 'c2CumulativeBuildEqualsFixed': True, 'fullUnitFiles': 80, 'fullUnitTests': 500, 'nativeCurrent': {'checks': 18, 'exports': len(native['cases']), 'inputs': len(native['inputs']), 'pairs': len(native['equality']), 'uniqueCommands': 79}, 'historicalC1CrossReplayedCommands': 293, 'nativeAcceptanceComplete': False, 'D03Complete': False, 'pending': ['GJ/final art review and local commit/task record', 'T15 native200percent/beforeunload/FCP', 'T16 full24quarter endings', 'T17 originalPNG/human', 'M01 mobile last', 'T18 final review']}
(phase / 'integrity-before-commit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False))
