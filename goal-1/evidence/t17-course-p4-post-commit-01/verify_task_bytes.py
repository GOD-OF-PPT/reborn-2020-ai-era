#!/usr/bin/env python3
"""Compare an exact task manifest with disk and staged or committed Git blobs.

Manifest: {"files": {repoPath: {bytes, sha256, gitMode?}},
           "symlinks": {repoPath: {target, bytes, sha256, gitMode: "120000"}}}.
No index, HEAD, seal, input content, permissions or timestamps are written.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import selectors
import signal
import stat
import subprocess
import sys
import time

PROJECT_ROOT = Path(__file__).absolute().parents[3]
POST_ROOT = Path(__file__).absolute().parent
CHUNK_BYTES = 1024 * 1024


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def unique_object(pairs):
    value = {}
    for key, item in pairs:
        require(key not in value, 'DUPLICATE_MANIFEST_JSON_KEY:' + key)
        value[key] = item
    return value


def no_link_ancestors(path, *, include_leaf=False):
    for node in ((path, *path.parents) if include_leaf else path.parents):
        value = node.lstat()
        require(stat.S_ISDIR(value.st_mode) and not stat.S_ISLNK(value.st_mode),
                'DIRECTORY_SYMLINK_OR_NON_DIRECTORY:' + str(node))


def repo_name(name):
    require(isinstance(name, str) and name and not any(c in name for c in '\0\r\n\t\\'),
            'CANONICAL_REPO_RELATIVE_PATH_REQUIRED')
    value = PurePosixPath(name)
    require(not value.is_absolute() and value.as_posix() == name and
            all(part not in {'.', '..', '.git'} for part in value.parts),
            'CANONICAL_REPO_RELATIVE_PATH_REQUIRED:' + name)
    return name


def stable(value):
    # Ordinary reads may update atime. No input metadata is explicitly restored.
    return (value.st_dev, value.st_ino, value.st_mode, value.st_size,
            value.st_mtime_ns, value.st_ctime_ns)


def regular_digest(path):
    no_link_ancestors(path)
    before = path.lstat()
    require(stat.S_ISREG(before.st_mode), 'REGULAR_INPUT_REQUIRED:' + str(path))
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    digest = hashlib.sha256()
    size = 0
    with os.fdopen(descriptor, 'rb') as source:
        require(stable(os.fstat(source.fileno())) == stable(before), 'INPUT_CHANGED_BEFORE_READ')
        for raw in iter(lambda: source.read(CHUNK_BYTES), b''):
            digest.update(raw)
            size += len(raw)
        require(stable(os.fstat(source.fileno())) == stable(before), 'INPUT_CHANGED_DURING_READ')
    require(stable(path.lstat()) == stable(before), 'INPUT_PATH_CHANGED_DURING_READ')
    return {'bytes': size, 'sha256': digest.hexdigest()}


def guard_report(path, owned=None):
    require(path.is_absolute() and '..' not in path.parts, 'ABSOLUTE_FRESH_REPORT_REQUIRED')
    require(path.parent == POST_ROOT, 'CURRENT_POST_REPORT_REQUIRED')
    no_link_ancestors(path)
    for node in path.parents:
        require(not os.path.lexists(node / 'sealed-evidence.json'),
                'SEALED_REPORT_ANCESTOR:' + str(node))
    require(PROJECT_ROOT in path.parents, 'REPORT_PROJECT_ANCESTOR_REQUIRED')
    if os.path.lexists(path):
        value = path.lstat()
        require(owned is not None and stat.S_ISREG(value.st_mode) and
                (value.st_dev, value.st_ino) == owned, 'FRESH_REPORT_REQUIRED')
    else:
        require(owned is None, 'OWN_REPORT_DISAPPEARED')


def git_environment():
    # Inherited Git directory/config overrides must not redirect read-only queries.
    environment = {key: value for key, value in os.environ.items() if not key.startswith('GIT_')}
    environment.update({'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': os.devnull,
                        'GIT_TERMINAL_PROMPT': '0', 'GIT_OPTIONAL_LOCKS': '0',
                        'GIT_NO_REPLACE_OBJECTS': '1', 'GIT_ATTR_NOSYSTEM': '1',
                        'GIT_PAGER': 'cat'})
    return environment


def terminate_owned(process):
    # Every caller creates a new session; never signal the invoking task's group.
    for requested_signal in (signal.SIGTERM, signal.SIGKILL):
        try:
            os.killpg(process.pid, requested_signal)
        except ProcessLookupError:
            pass
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            continue
    process.wait(timeout=5)


class Git:
    def __init__(self, root):
        self.root = root
        self.command = ['rtk', 'proxy', 'git', '--no-optional-locks', '-c',
                        'core.fsmonitor=false', '-C', str(root)]
        self.environment = git_environment()

    def run(self, *arguments, check=True):
        command = [*self.command, *arguments]
        process = subprocess.Popen(command, env=self.environment, stdout=subprocess.PIPE,
                                   stderr=subprocess.PIPE, start_new_session=True)
        try:
            stdout, stderr = process.communicate(timeout=30)
        except BaseException:
            terminate_owned(process)
            raise
        result = subprocess.CompletedProcess(command, process.returncode, stdout, stderr)
        if check:
            require(result.returncode == 0, 'GIT_READ_FAILED:' +
                    result.stderr.decode('utf8', errors='replace'))
        return result

    def head(self):
        result = self.run('rev-parse', '--verify', '-q', 'HEAD', check=False)
        require(result.returncode in {0, 1}, 'CANNOT_READ_HEAD')
        return result.stdout.decode('ascii').strip() if result.returncode == 0 else None

    def index(self):
        name = self.run('rev-parse', '--git-path', 'index').stdout.decode('utf8').strip()
        path = Path(name) if Path(name).is_absolute() else self.root / name
        return regular_digest(path) if os.path.lexists(path) else None


def manifest_input(path):
    before = regular_digest(path)
    require(before['bytes'] <= 32 * 1024 * 1024, 'MANIFEST_SIZE_LIMIT')
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor, 'rb') as source:
        require(stat.S_ISREG(os.fstat(source.fileno()).st_mode), 'REGULAR_MANIFEST_REQUIRED')
        raw = source.read(32 * 1024 * 1024 + 1)
    require({'bytes': len(raw), 'sha256': sha(raw)} == before, 'MANIFEST_CHANGED_DURING_PARSE')
    manifest = json.loads(raw.decode('utf8', errors='strict'), object_pairs_hook=unique_object)
    require(isinstance(manifest, dict) and set(manifest) == {'files', 'symlinks'},
            'MANIFEST_FILES_AND_SYMLINKS_REQUIRED')
    for kind, table in manifest.items():
        require(isinstance(table, dict), 'MANIFEST_TABLE_REQUIRED:' + kind)
        for name, evidence in table.items():
            repo_name(name)
            require(isinstance(evidence, dict), 'MANIFEST_ENTRY_REQUIRED:' + name)
            require(type(evidence.get('bytes')) is int and evidence['bytes'] >= 0 and
                    isinstance(evidence.get('sha256'), str) and
                    re.fullmatch(r'[0-9a-f]{64}', evidence['sha256']), 'BYTES_SHA256_REQUIRED:' + name)
            if kind == 'symlinks':
                require(set(evidence) == {'target', 'bytes', 'sha256', 'gitMode'} and
                        isinstance(evidence['target'], str) and evidence['gitMode'] == '120000',
                        'SYMLINK_TARGET_AND_MODE_REQUIRED:' + name)
                target = evidence['target'].encode('utf8', errors='strict')
                require(len(target) == evidence['bytes'] and sha(target) == evidence['sha256'],
                        'MANIFEST_LINK_ORIGINAL_BYTES_MISMATCH:' + name)
            else:
                require(set(evidence) in ({'bytes', 'sha256'}, {'bytes', 'sha256', 'gitMode'}) and
                        evidence.get('gitMode', '100644') in {'100644', '100755'},
                        'REGULAR_FILE_MODE_REQUIRED:' + name)
    require(not (set(manifest['files']) & set(manifest['symlinks'])), 'OVERLAPPING_MANIFEST_TYPES')
    require(manifest['files'] or manifest['symlinks'], 'NONEMPTY_TASK_MANIFEST_REQUIRED')
    return manifest, before


def tree_entries(root, name):
    path = root / repo_name(name)
    no_link_ancestors(path, include_leaf=True)
    result = set()

    def visit(directory):
        before = directory.lstat()
        with os.scandir(directory) as entries:
            for entry in entries:
                value = entry.stat(follow_symlinks=False)
                child = Path(entry.path)
                if stat.S_ISLNK(value.st_mode) or stat.S_ISREG(value.st_mode):
                    result.add(child.relative_to(root).as_posix())
                elif stat.S_ISDIR(value.st_mode):
                    visit(child)
                else:
                    raise RuntimeError('UNSUPPORTED_TREE_ENTRY:' + str(child))
        require(stable(directory.lstat()) == stable(before), 'TREE_CHANGED_DURING_ENUMERATION')

    visit(path)
    return result


def git_entries(git, mode, revision):
    data = git.run('ls-files', '--stage', '-z').stdout if mode == 'staged' else git.run(
        'ls-tree', '-r', '-z', '--full-tree', revision).stdout
    entries = {}
    for row in data.split(b'\0'):
        if not row:
            continue
        header, name_raw = row.split(b'\t', 1)
        fields = header.split()
        require(len(fields) == 3, 'INVALID_GIT_ENTRY_HEADER')
        name = name_raw.decode('utf8', errors='strict')
        if mode == 'staged':
            file_mode, oid, stage = fields
            require(stage == b'0', 'UNMERGED_INDEX_STAGE:' + name)
        else:
            file_mode, object_type, oid = fields
            # Trees are omitted by -r; submodule entries cannot match a file manifest.
            require(object_type in {b'blob', b'commit'}, 'INVALID_GIT_TREE_ENTRY')
        require(name not in entries, 'DUPLICATE_GIT_PATH:' + name)
        entries[name] = (file_mode.decode('ascii'), oid.decode('ascii'))
    return entries


def changed_names(git, mode, revision):
    arguments = ('diff', '--cached', '--no-renames', '--name-status', '-z') if mode == 'staged' else (
        'diff-tree', '--root', '--no-commit-id', '--no-renames', '--name-status', '-r', '-z', revision)
    data = git.run(*arguments).stdout.split(b'\0')
    require(data[-1:] == [b''], 'NUL_DELIMITED_GIT_DIFF_REQUIRED')
    data = data[:-1]
    require(len(data) % 2 == 0, 'INVALID_GIT_DIFF_FIELDS')
    names = []
    for index in range(0, len(data), 2):
        status, name = data[index].decode('ascii'), data[index + 1].decode('utf8', errors='strict')
        require(status in {'A', 'M', 'T'}, 'DELETED_OR_UNMERGED_CHANGE:' + name)
        repo_name(name)
        names.append(name)
    require(len(set(names)) == len(names), 'DUPLICATE_CHANGED_PATH')
    return set(names)


class BatchReader:
    """Drain both pipes, retaining at most one input chunk and 4KiB of stderr."""
    def __init__(self, process):
        self.selector = selectors.DefaultSelector()
        self.selector.register(process.stdout, selectors.EVENT_READ, 'stdout')
        self.selector.register(process.stderr, selectors.EVENT_READ, 'stderr')
        self.buffer = bytearray()
        self.stderr = bytearray()
        self.stdout_eof = False

    def pump(self, *, until_eof=False):
        deadline = time.monotonic() + 30
        while self.selector.get_map():
            remaining = deadline - time.monotonic()
            require(remaining > 0, 'GIT_BATCH_READ_TIMEOUT')
            events = self.selector.select(remaining)
            require(events, 'GIT_BATCH_READ_TIMEOUT')
            progress = False
            for key, _mask in events:
                raw = os.read(key.fd, 64 * 1024)
                if not raw:
                    self.selector.unregister(key.fileobj)
                    if key.data == 'stdout':
                        self.stdout_eof = True
                elif key.data == 'stdout':
                    self.buffer.extend(raw)
                    progress = True
                else:
                    self.stderr.extend(raw[:max(0, 4096 - len(self.stderr))])
            if not until_eof and (progress or self.stdout_eof):
                return

    def read(self, size):
        result = bytearray()
        while len(result) < size:
            if self.buffer:
                take = min(size - len(result), len(self.buffer))
                result.extend(self.buffer[:take])
                del self.buffer[:take]
            elif self.stdout_eof:
                break
            else:
                self.pump()
        return bytes(result)

    def line(self, limit):
        result = bytearray()
        while len(result) < limit:
            raw = self.read(1)
            if not raw:
                break
            result.extend(raw)
            if raw == b'\n':
                break
        return bytes(result)

    def finish(self):
        require(self.read(1) == b'', 'EXTRA_GIT_BATCH_OUTPUT')
        self.pump(until_eof=True)
        require(not self.stderr, 'GIT_BATCH_STDERR:' + self.stderr.decode('utf8', errors='replace'))


def compare_blobs(git, manifest, entries, rows):
    process = subprocess.Popen([*git.command, 'cat-file', '--batch'], env=git.environment,
                               stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               bufsize=0, start_new_session=True)
    require(process.stdin is not None and process.stdout is not None, 'GIT_BATCH_STREAM_REQUIRED')
    reader = BatchReader(process)
    identities = {}
    completed = False
    try:
        for name in sorted(set(manifest['files']) | set(manifest['symlinks'])):
            path = git.root / name
            no_link_ancestors(path)
            before = path.lstat()
            link = name in manifest['symlinks']
            require(stat.S_ISLNK(before.st_mode) if link else stat.S_ISREG(before.st_mode),
                    'DISK_ENTRY_TYPE_MISMATCH:' + name)
            evidence = manifest['symlinks' if link else 'files'][name]
            expected_mode = '120000' if link else ('100755' if before.st_mode & stat.S_IXUSR else '100644')
            require(evidence.get('gitMode', expected_mode) == expected_mode, 'DISK_MANIFEST_MODE_MISMATCH:' + name)
            require(name in entries and entries[name][0] == expected_mode, 'GIT_MODE_MISMATCH:' + name)
            file_mode, oid = entries[name]
            require(re.fullmatch(r'[0-9a-f]{40}|[0-9a-f]{64}', oid), 'EXACT_GIT_OBJECT_ID_REQUIRED')
            process.stdin.write((oid + '\n').encode('ascii'))
            process.stdin.flush()
            header = reader.line(1024)
            require(header.endswith(b'\n'), 'GIT_BATCH_HEADER_REQUIRED')
            parts = header.rstrip(b'\n').split()
            require(len(parts) == 3 and parts[0] == oid.encode('ascii') and parts[1] == b'blob',
                    'EXACT_GIT_BLOB_REQUIRED:' + name)
            size = int(parts[2])
            require(size == evidence['bytes'], 'GIT_BLOB_SIZE_MISMATCH:' + name)
            digest = hashlib.sha256()
            if link:
                original = os.readlink(os.fsencode(path))
                require(original == evidence['target'].encode('utf8'), 'DISK_LINK_TARGET_MISMATCH:' + name)
                require(len(original) == size, 'DISK_LINK_SIZE_MISMATCH:' + name)
                position = 0
                while position < size:
                    raw = reader.read(min(CHUNK_BYTES, size - position))
                    require(raw and raw == original[position:position + len(raw)], 'GIT_LINK_ORIGINAL_BYTES_MISMATCH:' + name)
                    digest.update(raw)
                    position += len(raw)
            else:
                descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
                with os.fdopen(descriptor, 'rb') as source:
                    require(stable(os.fstat(source.fileno())) == stable(before), 'DISK_FILE_CHANGED_BEFORE_READ:' + name)
                    remaining = size
                    while remaining:
                        raw = reader.read(min(CHUNK_BYTES, remaining))
                        require(raw and source.read(len(raw)) == raw, 'GIT_DISK_BYTES_MISMATCH:' + name)
                        digest.update(raw)
                        remaining -= len(raw)
                    require(source.read(1) == b'' and stable(os.fstat(source.fileno())) == stable(before),
                            'DISK_FILE_CHANGED_DURING_READ:' + name)
            require(reader.read(1) == b'\n', 'GIT_BATCH_DELIMITER_CHANGED')
            require(stable(path.lstat()) == stable(before), 'DISK_PATH_CHANGED_DURING_READ:' + name)
            require(digest.hexdigest() == evidence['sha256'], 'MANIFEST_SHA256_MISMATCH:' + name)
            identities[name] = stable(before)
            rows.append({'file': name, 'kind': 'symlink' if link else 'file', 'gitMode': file_mode,
                         'gitBlobId': oid, 'bytes': size, 'sha256': digest.hexdigest()})
        process.stdin.close()
        reader.finish()
        require(process.wait(timeout=15) == 0, 'GIT_BATCH_FAILED')
        completed = True
        return identities
    finally:
        if not completed:
            terminate_owned(process)
        reader.selector.close()
        for stream in (process.stdin, process.stdout, process.stderr):
            if stream is not None and not stream.closed:
                stream.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo-root', default=str(PROJECT_ROOT))
    parser.add_argument('--manifest', required=True)
    parser.add_argument('--mode', choices=('staged', 'commit'), required=True)
    parser.add_argument('--commit')
    parser.add_argument('--tree-root', action='append', default=[])
    parser.add_argument('--output-report', required=True)
    args = parser.parse_args()
    require((args.mode == 'commit') == (args.commit is not None), 'COMMIT_SHA_REQUIRED_ONLY_FOR_COMMIT_MODE')
    if args.commit is not None:
        require(re.fullmatch(r'[0-9a-f]{40}|[0-9a-f]{64}', args.commit), 'FULL_COMMIT_SHA_REQUIRED')
    repository = Path(args.repo_root).absolute()
    no_link_ancestors(repository, include_leaf=True)
    manifest_path = Path(args.manifest)
    manifest_path = manifest_path.absolute() if manifest_path.is_absolute() else repository / manifest_path
    require('..' not in manifest_path.parts, 'CANONICAL_MANIFEST_PATH_REQUIRED')
    output = Path(args.output_report).absolute()
    guard_report(output)
    require(output != manifest_path, 'REPORT_MUST_NOT_BE_THE_MANIFEST')
    trees = list(dict.fromkeys(repo_name(name) for name in args.tree_root))
    require(all(not output.is_relative_to(repository / name) for name in trees), 'REPORT_MUST_BE_OUTSIDE_COMPLETE_TREE')
    manifest, manifest_before = manifest_input(manifest_path)
    expected = set(manifest['files']) | set(manifest['symlinks'])
    require(not output.is_relative_to(repository) or
            output.relative_to(repository).as_posix() not in expected,
            'REPORT_MUST_NOT_BE_A_MANIFEST_INPUT')
    descriptor = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    owned = (os.fstat(descriptor).st_dev, os.fstat(descriptor).st_ino)
    started = time.monotonic()
    report = {'scope': 'Exact task paths, file/link types, Git mode and original blob bytes only; no game, UI, compatibility, COW, index or HEAD mutation',
              'mode': args.mode, 'commit': args.commit, 'repository': str(repository),
              'manifest': str(manifest_path), 'completeTreeRoots': trees,
              'passed': False, 'error': None, 'rows': []}
    try:
        git = Git(repository)
        require(Path(git.run('rev-parse', '--show-toplevel').stdout.decode('utf8').strip()) == repository,
                'EXACT_REPOSITORY_ROOT_REQUIRED')
        head_before, index_before = git.head(), git.index()
        report.update({'headBefore': head_before, 'indexBefore': index_before})
        report.update({'manifestBytes': manifest_before['bytes'], 'manifestSha256': manifest_before['sha256'],
                       'expectedFiles': len(manifest['files']), 'expectedSymlinks': len(manifest['symlinks']),
                       'expectedEntries': len(expected)})
        if args.mode == 'commit':
            require(git.run('cat-file', '-t', args.commit).stdout == b'commit\n', 'EXACT_COMMIT_OBJECT_REQUIRED')
            parents = git.run('rev-list', '--parents', '-n', '1', args.commit).stdout.split()
            require(len(parents) in {1, 2}, 'INITIAL_OR_SINGLE_PARENT_COMMIT_REQUIRED')
        entries = git_entries(git, args.mode, args.commit)
        actual = changed_names(git, args.mode, args.commit)
        require(actual == expected, 'TASK_CHANGE_SET_MISMATCH:' + json.dumps({
            'missing': sorted(expected - actual), 'extra': sorted(actual - expected)}))
        tree_sets = {name: tree_entries(repository, name) for name in trees}
        for name, actual_tree in tree_sets.items():
            require(actual_tree == {file for file in expected if file.startswith(name + '/')},
                    'COMPLETE_TREE_SET_MISMATCH:' + name)
        identities = compare_blobs(git, manifest, entries, report['rows'])
        for name, before in tree_sets.items():
            require(tree_entries(repository, name) == before, 'COMPLETE_TREE_CHANGED:' + name)
        require(regular_digest(manifest_path) == manifest_before, 'MANIFEST_CHANGED_DURING_VERIFICATION')
        require(git.head() == head_before and git.index() == index_before, 'HEAD_OR_INDEX_CHANGED_DURING_VERIFICATION')
        for name, identity in identities.items():
            path = repository / name
            no_link_ancestors(path)
            require(stable(path.lstat()) == identity, 'CHECKED_INPUT_CHANGED_BEFORE_COMPLETION:' + name)
        report.update({'passed': True, 'fileSetEqual': True, 'completeTreesEqual': True,
                       'allOriginalBytesAndModesEqual': True, 'headAndIndexUnchanged': True})
    except Exception as error:
        report['error'] = type(error).__name__ + ':' + str(error)
    report['checkedEntries'] = len(report['rows'])
    report['wallSeconds'] = time.monotonic() - started
    report['verifierSha256'] = regular_digest(Path(__file__).absolute())['sha256']
    with os.fdopen(descriptor, 'wb') as target:
        guard_report(output, owned)
        target.write((json.dumps(report, ensure_ascii=False, indent=2) + '\n').encode('utf8'))
        target.flush()
        os.fsync(target.fileno())
    print(json.dumps({key: value for key, value in report.items() if key != 'rows'}, ensure_ascii=False))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
