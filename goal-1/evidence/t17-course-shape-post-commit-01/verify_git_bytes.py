"""Verify this checkpoint's exact staged or committed blobs against disk and seal."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
TASK = ROOT / 'goal-1/evidence/t17-acceptance-06'
revision, destination = sys.argv[1:]
if revision != 'INDEX' and not re.fullmatch(r'[0-9a-f]{40,64}', revision):
    raise RuntimeError('EXACT_COMMIT_OR_INDEX_REQUIRED')
guard = "import {assertFreshVideoEvidencePath} from './scripts/video-shape-output.ts';assertFreshVideoEvidencePath(process.cwd(),['--output-dir',process.argv[1]])"
subprocess.run(['rtk', 'proxy', 'node', '--experimental-strip-types', '--input-type=module', '-e', guard, destination], cwd=ROOT, check=True, capture_output=True)
target = (ROOT / destination).resolve()
seal = json.loads((TASK / 'sealed-evidence.json').read_bytes())
assert seal['selfExcluded'] is True and 'sealed-evidence.json' not in seal['files']
assert len(seal['files']) == seal['fileCount']
actual_set = set()
for path in TASK.rglob('*'):
    assert not path.is_symlink(), str(path)
    if path.is_file():
        actual_set.add(path.relative_to(TASK).as_posix())
assert actual_set == set(seal['files']) | {'sealed-evidence.json'}
expected = {(TASK / name).relative_to(ROOT).as_posix() for name in actual_set}
expected |= {'src/testing/course-shape-assertions.ts', 'src/testing/course-shape-scenario.ts', 'scripts/collect_course_shape_evidence.ts', 'goal-1/plan.md', 'goal-1/tasks.md', 'goal-1/t17-plan.md'}
command = ['git', 'diff', '--cached', '--name-only', '-z'] if revision == 'INDEX' else ['git', 'diff-tree', '--no-commit-id', '--name-only', '-r', '-z', revision]
names = subprocess.check_output(command, cwd=ROOT).decode().split('\0')
names = [name for name in names if name]
assert len(names) == len(set(names)) and set(names) == expected, 'CHECKPOINT_FILE_SET_CHANGED'
process = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
assert process.stdin is not None and process.stdout is not None
start = time.monotonic()
rows = []
error = None
try:
    for name in sorted(names):
        reference = ':' + name if revision == 'INDEX' else revision + ':' + name
        process.stdin.write((reference + '\n').encode())
        process.stdin.flush()
        header = process.stdout.readline().decode().strip().split()
        assert len(header) == 3 and header[1] == 'blob', 'EXACT_BLOB_REQUIRED:' + name
        size, remaining, digest = int(header[2]), int(header[2]), hashlib.sha256()
        while remaining:
            part = process.stdout.read(min(remaining, 1024 * 1024))
            assert part, 'TRUNCATED_GIT_BLOB:' + name
            digest.update(part)
            remaining -= len(part)
        assert process.stdout.read(1) == b'\n', 'GIT_BATCH_DELIMITER_CHANGED'
        disk = (ROOT / name).read_bytes()
        sha = hashlib.sha256(disk).hexdigest()
        assert len(disk) == size and digest.hexdigest() == sha, 'GIT_DISK_BYTES_DIFFER:' + name
        if name.startswith(TASK.relative_to(ROOT).as_posix() + '/'):
            relative = (ROOT / name).relative_to(TASK).as_posix()
            if relative != 'sealed-evidence.json':
                assert seal['files'][relative] == {'bytes': size, 'sha256': sha}, 'SEALED_BYTES_CHANGED:' + name
        rows.append({'file': name, 'bytes': size, 'sha256': sha, 'gitBlobId': header[0]})
    process.stdin.close()
    assert process.wait(timeout=10) == 0
except BaseException as caught:
    error = repr(caught)
    process.terminate()
    process.wait(timeout=10)
finally:
    report = {'scope': 'Direct binary Git blob, disk and original seal comparison; no game/browser execution', 'revision': revision, 'expectedFiles': len(expected), 'checkedFiles': len(rows), 'sealedFilesExcludingMarker': len(seal['files']), 'fileSetEqual': True, 'allComparedBytesEqual': error is None, 'error': error, 'wallSeconds': time.monotonic() - start, 'verifierSha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), 'rows': rows}
    with target.open('x') as output:
        json.dump(report, output, ensure_ascii=False, indent=2)
        output.write('\n')
if error:
    raise RuntimeError(error)
print(json.dumps({key: value for key, value in report.items() if key != 'rows'}))
