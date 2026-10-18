import hashlib
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
sha = lambda value: hashlib.sha256(value).hexdigest()
first = json.loads((OUT / 'candidate1-production-manifest.json').read_text())
directory = ROOT / '.delivery/d03-candidate2'
files = {str(p.relative_to(directory)): sha(p.read_bytes())
         for p in sorted(directory.rglob('*')) if p.is_file()}
for name, expected in files.items():
    with urllib.request.urlopen('http://127.0.0.1:5220/' + name, timeout=15) as response:
        if response.status != 200 or sha(response.read()) != expected:
            raise RuntimeError('C2_HTTP_BYTES_MISMATCH:' + name)


def logical(name):
    path = Path(name)
    match = re.fullmatch(r'(.+)-[A-Za-z0-9_-]{8}(\.[^.]+)', path.name)
    return str(path.parent / (match[1] + match[2])) if match else name


before = {logical(name): name for name in first['files']}
after = {logical(name): name for name in files}
if len(before) != len(first['files']) or len(after) != len(files) or set(before) != set(after):
    raise RuntimeError('C2_LOGICAL_ASSET_INVENTORY_CHANGED')
replacements = {}
for key in before:
    if before[key] != after[key]:
        marker = '__D03_DECLARED_ASSET__' + key
        replacements[Path(before[key]).name] = marker
        replacements[Path(after[key]).name] = marker


def normalize(data):
    for name, marker in sorted(replacements.items(), key=lambda row: -len(row[0])):
        data = data.replace(name.encode(), marker.encode())
    return data


rows = []
for key in sorted(before):
    old_path, new_path = before[key], after[key]
    old = (Path(first['outDir']) / old_path).read_bytes()
    new = (directory / new_path).read_bytes()
    if sha(old) != first['files'][old_path]:
        raise RuntimeError('C1_PINNED_ASSET_CHANGED')
    row = dict(logical=key, before=old_path, after=new_path,
               beforeSha256=sha(old), afterSha256=sha(new), rawByteEqual=old == new)
    if key.endswith('.js'):
        row['equalAfterOnlyDeclaredAssetFilenameReferences'] = normalize(old) == normalize(new)
        if not row['equalAfterOnlyDeclaredAssetFilenameReferences']:
            raise RuntimeError('UNEXPECTED_C2_JAVASCRIPT_CODE_DIFFERENCE:' + key)
    if key.endswith(('.jpg', '.png')) and old != new:
        raise RuntimeError('C2_ART_BYTES_CHANGED:' + key)
    rows.append(row)

freeze = json.loads((OUT / 'candidate2-source-freeze.json').read_text())
for name, expected in freeze['sha256'].items():
    if sha((ROOT / name).read_bytes()) != expected:
        raise RuntimeError('C2_SOURCE_CHANGED:' + name)
manifest = dict(scope='D03 fixed candidate2 final CSS repair; not public deployment or full-game acceptance',
                outDir=str(directory), port=5220, sourceFreeze='candidate2-source-freeze.json',
                sourceUnchanged=True, files=files, allHttpAndDiskByteEqual=True)
with (OUT / 'candidate2-production-manifest.json').open('x') as handle:
    json.dump(manifest, handle, indent=2)
    handle.write('\n')
result = dict(scope='C1 to C2 only source change is the precise home text-mode CSS insertion; JavaScript source unchanged. Build filenames can change via CSS dependency hashes. No arbitrary code normalization.',
              declaredFilenameReplacements=replacements, files=rows,
              allActualJavaScriptEqualAfterOnlyDeclaredAssetFilenameReferences=True,
              sourceReuse='candidate2-source-reuse.json')
with (OUT / 'candidate2-build-reference-comparison.json').open('x') as handle:
    json.dump(result, handle, indent=2)
    handle.write('\n')
javascript = [row for row in rows if row['logical'].endswith('.js')]
print(json.dumps(dict(files=len(files), httpAndDiskEqual=True, javascript=len(javascript),
                      rawJavaScriptEqual=sum(row['rawByteEqual'] for row in javascript),
                      declaredReferenceOnlyChanges=sum(not row['rawByteEqual'] for row in javascript),
                      unexpectedJavaScriptChanges=0)))
