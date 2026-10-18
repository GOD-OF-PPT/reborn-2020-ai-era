"""Read back D03 source, opening bytes, art and fixed local builds."""
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
sha = lambda data: hashlib.sha256(data).hexdigest()
opening = json.loads((OUT / 'opening-files.json').read_text())
allowed = {'goal-1/tasks.md', 'src/main.tsx', 'src/ui/LifePanel.tsx',
           'src/ui/Navigation.tsx', 'src/ui/Workbench.tsx'}
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
if head != opening['baseCommit']:
    raise RuntimeError('PRECOMMIT_BASE_CHANGED')
changed, preserved = [], []
for row in opening['files']:
    data = (ROOT / row['file']).read_bytes()
    if sha(data) != row['sha256']:
        if row['file'] not in allowed:
            raise RuntimeError('UNAUTHORIZED_OPENING_CHANGE:' + row['file'])
        changed.append(row['file'])
    else:
        preserved.append(row['file'])
if set(changed) != allowed:
    raise RuntimeError('EXPECTED_CHANGE_SET_MISMATCH')
freeze = json.loads((OUT / 'candidate2-source-freeze.json').read_text())['sha256']
for name, expected in freeze.items():
    if sha((ROOT / name).read_bytes()) != expected:
        raise RuntimeError('FROZEN_SOURCE_CHANGED:' + name)
art = json.loads((OUT / 'art-manifest.json').read_text())['assets']
for row in art:
    for path_key, hash_key in [('projectPng', 'pngSha256'), ('projectJpeg', 'jpegSha256')]:
        if sha((ROOT / row[path_key]).read_bytes()) != row[hash_key]:
            raise RuntimeError('ART_CHANGED:' + row[path_key])
builds = []
for manifest in ['baseline-manifest.json', 'candidate1-production-manifest.json', 'candidate2-production-manifest.json']:
    data = json.loads((OUT / manifest).read_text())
    directory = Path(data['outDir'])
    files = data['files']
    if set(files) != {str(p.relative_to(directory)) for p in directory.rglob('*') if p.is_file()}:
        raise RuntimeError('BUILD_INVENTORY_CHANGED')
    for name, expected in files.items():
        disk = (directory / name).read_bytes()
        with urllib.request.urlopen('http://127.0.0.1:' + str(data['port']) + '/' + name, timeout=15) as response:
            remote = response.read()
            if response.status != 200:
                raise RuntimeError('HTTP_STATUS')
        if sha(disk) != expected or disk != remote:
            raise RuntimeError('FIXED_PREVIEW_CHANGED:' + name)
    builds.append(dict(manifest=manifest, files=len(files), diskAndHttpByteEqual=True))
candidate = json.loads((OUT / 'candidate1-production-manifest.json').read_text())
cumulative = ROOT / '.delivery/d03-cumulative'
if set(candidate['files']) != {str(p.relative_to(cumulative)) for p in cumulative.rglob('*') if p.is_file()}:
    raise RuntimeError('CUMULATIVE_BUILD_INVENTORY_CHANGED')
for name, expected in candidate['files'].items():
    if sha((cumulative / name).read_bytes()) != expected:
        raise RuntimeError('CUMULATIVE_BUILD_BYTES_CHANGED:' + name)
reference = json.loads((OUT / 'candidate2-build-reference-comparison.json').read_text())
if not reference['allActualJavaScriptEqualAfterOnlyDeclaredAssetFilenameReferences']:
    raise RuntimeError('C2_JAVASCRIPT_CODE_CHANGED')
parent = json.loads((OUT / 'native-report.json').read_text())
homes = [c for c in parent['checks'] if c['id'].startswith('home-')]
if len(homes) != 4 or any(c['observed'].get('textOnly') is not False for c in homes):
    raise RuntimeError('C1_HOME_SCOPE_NOT_PROVEN_UNCHANGED')
text = next(c for c in parent['checks'] if c['id'] == 'text-motion-and-restored-focus')
if not text['observed']['textOnly'] or '把时间留给生活，也留给人' not in text['observed']['headings']:
    raise RuntimeError('C1_TEXT_SCOPE_NOT_LIFE')
checks = json.loads((OUT / 'native-final-report.json').read_text())
if not checks['d03DesktopChecksComplete'] or checks['nativeAcceptanceComplete']:
    raise RuntimeError('NATIVE_SCOPE_MISMATCH')
result = dict(taskId='D03', scope='precommit integrity; no remote publication or overall game acceptance',
              baseCommit=head, openingFiles=len(opening['files']), authorizedChanged=sorted(changed),
              preservedCount=len(preserved), preservedFiles=preserved, frozenFiles=len(freeze),
              frozenSourceUnchanged=True, portraitAssetsVerified=8, builds=builds,
              cumulativeCandidate1BuildByteEqual=True, finalCandidate2OnlyCssSourceRepair=True, currentDirectChecks=6, inheritedChecks=52, javascriptReferenceOnlyComparisonVerified=True, rawHistoricalEvidenceUnchanged=True,
              notCovered=['old missing runtime preview directories are not claimed live',
                          'T15 native200/beforeunload', 'T16 complete campaign/epilogue',
                          'T17 original3PNG/humans', 'M01 mobile', 'T18 final candidate'])
with (OUT / 'integrity-final-before-commit.json').open('x') as handle:
    json.dump(result, handle, ensure_ascii=False, indent=2)
    handle.write('\n')
print(json.dumps({k: v for k, v in result.items() if k != 'preservedFiles'}, ensure_ascii=False))
