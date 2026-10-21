"""Read the original Git tree and each current literal file; never follow links."""
from pathlib import Path
import hashlib
import json
import os
import stat
import subprocess
import time

task = Path(__file__).absolute().parent
project = task.parents[2]
baseline = json.loads((task / 'baseline.json').read_text())
if Path.cwd().resolve() != project.resolve():
    raise RuntimeError('PROJECT_CWD_REQUIRED')
if any(os.path.lexists(p / 'sealed-evidence.json') or p.is_symlink() for p in (task, *task.parents)):
    raise RuntimeError('UNSEALED_REGULAR_PARENT_REQUIRED')
allowed = {
    'goal-1/plan.md', 'goal-1/tasks.md', 'goal-1/t17-plan.md',
    'src/ui/CourseCommandDetails.tsx', 'src/ui/CommandDetails.tsx',
    'src/ui/confirmation-money.ts', 'src/ui/confirmation-money.test.ts',
    'src/ui/course-scene-progress.ts', 'src/ui/course-scene-progress.test.ts',
}

def git(*args):
    return subprocess.check_output(['rtk', 'proxy', 'git', '--no-optional-locks', '-c', 'core.fsmonitor=false', *args], cwd=project)

def literal(path, mode):
    for parent in path.parents:
        if parent.is_symlink():
            raise RuntimeError('LINKED_ANCESTOR:' + str(parent))
        if parent == project:
            break
    before = path.lstat()
    if mode == '120000':
        if not stat.S_ISLNK(before.st_mode):
            raise RuntimeError('EXPECTED_LITERAL_LINK:' + str(path))
        raw = os.fsencode(os.readlink(path))
        digest, size = hashlib.sha256(raw).hexdigest(), len(raw)
    else:
        if not stat.S_ISREG(before.st_mode):
            raise RuntimeError('EXPECTED_REGULAR_FILE:' + str(path))
        if ('100755' if before.st_mode & 0o111 else '100644') != mode:
            raise RuntimeError('GIT_MODE_CHANGED:' + str(path))
        accumulator, size = hashlib.sha256(), 0
        with path.open('rb') as stream:
            for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                accumulator.update(chunk)
                size += len(chunk)
        digest = accumulator.hexdigest()
    after = path.lstat()
    if (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns) != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns):
        raise RuntimeError('FILE_CHANGED_DURING_READ:' + str(path))
    return {'bytes': size, 'sha256': digest}

started = time.time()
head = git('rev-parse', 'HEAD').decode().strip()
if head != baseline['head']:
    raise RuntimeError('ORIGINAL_HEAD_REQUIRED')
tree = git('ls-tree', '-rz', baseline['head'])
rows, errors = [], []
process = subprocess.Popen(['rtk', 'proxy', 'git', 'cat-file', '--batch'], cwd=project, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
try:
    for entry in tree.split(b'\0'):
        if not entry:
            continue
        metadata, raw_name = entry.split(b'\t', 1)
        mode, kind, blob = metadata.decode().split()
        name = raw_name.decode()
        if kind != 'blob' or mode not in {'100644', '100755', '120000'}:
            raise RuntimeError('SUPPORTED_ORIGINAL_GIT_ENTRY_REQUIRED:' + name)
        process.stdin.write(blob.encode() + b'\n')
        process.stdin.flush()
        header = process.stdout.readline().decode().strip().split()
        if len(header) != 3 or header[:2] != [blob, 'blob']:
            raise RuntimeError('EXACT_GIT_BLOB_REQUIRED:' + name)
        remaining = size = int(header[2])
        accumulator = hashlib.sha256()
        while remaining:
            chunk = process.stdout.read(min(remaining, 1024 * 1024))
            if not chunk:
                raise RuntimeError('TRUNCATED_GIT_BLOB:' + name)
            accumulator.update(chunk)
            remaining -= len(chunk)
        if process.stdout.read(1) != b'\n':
            raise RuntimeError('GIT_BATCH_FRAME_REQUIRED')
        original = {'bytes': size, 'sha256': accumulator.hexdigest()}
        try:
            current = literal(project / name, mode)
            status = 'same' if original == current else 'authorized_changed' if name in allowed else 'unexpected_changed'
            if status == 'unexpected_changed':
                errors.append(name)
            rows.append({'path': name, 'gitMode': mode, 'gitBlob': blob, 'original': original, 'current': current, 'status': status})
        except Exception as error:
            errors.append(name + ':' + str(error))
            rows.append({'path': name, 'status': 'error', 'error': str(error)})
finally:
    process.stdin.close()
    code = process.wait(timeout=30)
if code != 0 or git('rev-parse', 'HEAD').decode().strip() != head:
    errors.append('GIT_READER_FAILED_OR_HEAD_CHANGED')
if len(rows) != baseline['trackedEntries']:
    errors.append('ORIGINAL_ENTRY_SET_COUNT_CHANGED')
report = {'scope': 'Original15437 Git blobs and literal current paths, allowed task changes only; no browser/compatibility/GameRun execution',
          'head': head, 'originalEntries': len(rows), 'same': sum(r['status'] == 'same' for r in rows),
          'authorizedChanged': [r['path'] for r in rows if r['status'] == 'authorized_changed'],
          'literalSymlinks': sum(r.get('gitMode') == '120000' for r in rows),
          'gitReaderExitCode': code, 'errors': errors, 'passed': not errors,
          'elapsedSeconds': time.time() - started, 'rows': rows}
with (task / 'original-tree-preservation-r1.json').open('x') as stream:
    json.dump(report, stream, ensure_ascii=False, indent=2)
print(json.dumps({k: v for k, v in report.items() if k != 'rows'}, ensure_ascii=False), flush=True)
raise SystemExit(int(bool(errors)))
