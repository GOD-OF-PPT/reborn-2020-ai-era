#!/usr/bin/env python3
"""Explicit, bounded COW replacement of equal derived images; default is read only."""
from __future__ import annotations

import argparse
import ctypes
import errno
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import uuid

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_GROUPS = ('memory-v1', 'room-improved-v1', 'room-ordinary-v1')
EXCLUDED_BUILDS = {'t17-risk-final', 't17-course-r10'}
LIBC = ctypes.CDLL(None, use_errno=True)
LIBC.clonefile.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_int]
LIBC.clonefile.restype = ctypes.c_int
LIBC.renamex_np.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_uint]
LIBC.renamex_np.restype = ctypes.c_int
LIBC.acl_get_file.argtypes = [ctypes.c_char_p, ctypes.c_int]
LIBC.acl_get_file.restype = ctypes.c_void_p
LIBC.acl_get_entry.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.POINTER(ctypes.c_void_p)]
LIBC.acl_get_entry.restype = ctypes.c_int
LIBC.acl_free.argtypes = [ctypes.c_void_p]
LIBC.acl_free.restype = ctypes.c_int
LIBC.listxattr.argtypes = [ctypes.c_char_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_int]
LIBC.listxattr.restype = ctypes.c_ssize_t


class CowError(RuntimeError):
    def __init__(self, message, report=None):
        super().__init__(message)
        self.report = report


def require(condition, code):
    if not condition:
        raise CowError(code)


def clone_strict(src: Path, dst: Path):
    """clonefile has no ordinary-copy fallback and refuses an existing destination."""
    require(sys.platform == 'darwin', 'DARWIN_CLONE_REQUIRED')
    if LIBC.clonefile(os.fsencode(src), os.fsencode(dst), 1) != 0:  # CLONE_NOFOLLOW
        code = ctypes.get_errno()
        raise OSError(code, os.strerror(code), str(dst))


def swap_strict(left: Path, right: Path):
    # Preserve the actual displaced inode, including a last-moment external version.
    if LIBC.renamex_np(os.fsencode(left), os.fsencode(right), 2) != 0:  # RENAME_SWAP
        code = ctypes.get_errno()
        raise OSError(code, os.strerror(code), str(right))


def acl_entries(path: Path):
    ctypes.set_errno(0)
    acl = LIBC.acl_get_file(os.fsencode(path), 0x100)  # ACL_TYPE_EXTENDED
    if not acl:
        # Darwin can return NULL for an existing ordinary file without an
        # extended ACL. Do not infer "empty" from errno: independently inspect
        # the native ACL presentation and fail closed on an unknown result.
        value = path.lstat()
        require(stat.S_ISREG(value.st_mode) and not stat.S_ISLNK(value.st_mode), 'ACL_FILE_CHANGED')
        result = subprocess.run(['rtk', 'proxy', '/bin/ls', '-lde', str(path)],
                                check=True, capture_output=True, text=True,
                                env={**os.environ, 'LC_ALL': 'C'}, timeout=10)
        lines = result.stdout.splitlines()
        require(lines and all(re.match(r'\s*\d+:\s', line) for line in lines[1:]), 'ACL_PRESENTATION_UNRECOGNIZED')
        return len(lines) - 1
    try:
        count = 0
        entry = ctypes.c_void_p()
        while True:
            ctypes.set_errno(0)
            result = LIBC.acl_get_entry(acl, 0 if count == 0 else -1, ctypes.byref(entry))
            if result == -1:
                require(ctypes.get_errno() == errno.EINVAL, 'ACL_INSPECTION_FAILED')
                return count
            require(result == 0 and count < 256, 'ACL_INSPECTION_FAILED')
            count += 1
    finally:
        LIBC.acl_free(acl)


def available(path):
    value = os.statvfs(path)
    return value.f_bavail * value.f_frsize


def list_xattrs(path):
    # This macOS Python does not expose Linux's os.listxattr API. Use the
    # system's no-follow query; attributes are never removed or rewritten.
    size = LIBC.listxattr(os.fsencode(path), None, 0, 1)
    require(size >= 0, 'XATTR_INSPECTION_UNAVAILABLE:' + str(ctypes.get_errno()))
    if size == 0:
        return []
    buffer = ctypes.create_string_buffer(size)
    length = LIBC.listxattr(os.fsencode(path), buffer, size, 1)
    require(length == size, 'XATTR_CHANGED_DURING_INSPECTION')
    return sorted(os.fsdecode(value) for value in buffer.raw[:length].split(b'\0') if value)


def attributes(value):
    return {'dev': value.st_dev, 'ino': value.st_ino, 'bytes': value.st_size,
            'mode': stat.S_IMODE(value.st_mode), 'uid': value.st_uid, 'gid': value.st_gid,
            'atimeNs': value.st_atime_ns, 'mtimeNs': value.st_mtime_ns,
            'ctimeNs': value.st_ctime_ns, 'nlink': value.st_nlink,
            'flags': getattr(value, 'st_flags', None),
            'birthtimeSeconds': getattr(value, 'st_birthtime', None)}


def stable_identity(value):
    # Reads can update atime. Every other original identity field must remain stable.
    return {k: v for k, v in value.items() if k != 'atimeNs'}


def content_metadata(value):
    return {k: value[k] for k in ('bytes', 'sha256', 'mode', 'uid', 'gid',
                                 'mtimeNs', 'flags', 'nlink', 'xattrs', 'aclEntries')}


class Recovery:
    def __init__(self, root: Path, *, tracked_paths=frozenset(), frozen_paths=frozenset()):
        self.root = root.absolute()
        self.delivery = self.root / '.delivery'
        self.tracked = tracked_paths
        self.frozen = frozen_paths
        self.first_seen = {}

    def path(self, path):
        path = Path(path).absolute()
        try:
            relative = path.relative_to(self.delivery)
        except ValueError as error:
            raise CowError('DELIVERY_SCOPE_REQUIRED') from error
        require(len(relative.parts) >= 2 and '..' not in relative.parts, 'DERIVED_ASSET_REQUIRED')
        require(relative.parts[0] not in EXCLUDED_BUILDS, 'CURRENT_FINAL_BUILD_EXCLUDED')
        name = path.relative_to(self.root).as_posix()
        require(name not in self.tracked and name not in self.frozen, 'TRACKED_OR_FROZEN_FILE')
        for node in (path.parent, *path.parent.parents):
            value = node.lstat()
            require(stat.S_ISDIR(value.st_mode) and not stat.S_ISLNK(value.st_mode), 'PARENT_SYMLINK_OR_NON_DIRECTORY')
            require(not os.path.lexists(node / 'sealed-evidence.json'), 'SEALED_PARENT_FORBIDDEN')
            if node == self.root:
                break
        require(path.suffix.lower() in {'.jpg', '.jpeg', '.png'}, 'DERIVED_IMAGE_ONLY')
        return path

    def inspect(self, path):
        path = self.path(path)
        before = path.lstat()
        require(stat.S_ISREG(before.st_mode) and not stat.S_ISLNK(before.st_mode), 'REGULAR_FILE_REQUIRED')
        result = attributes(before)
        result['xattrs'] = list_xattrs(path)
        result['aclEntries'] = acl_entries(path)
        # Reject unsupported metadata before reading any of its content.
        self.allowed(result)
        digest = hashlib.sha256()
        descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
        with os.fdopen(descriptor, 'rb') as source:
            require((os.fstat(source.fileno()).st_dev, os.fstat(source.fileno()).st_ino) ==
                    (before.st_dev, before.st_ino), 'FILE_CHANGED_BEFORE_READ')
            for chunk in iter(lambda: source.read(1024 * 1024), b''):
                digest.update(chunk)
        require(stable_identity(attributes(path.lstat())) == stable_identity(attributes(before)), 'FILE_CHANGED_DURING_READ')
        result['sha256'] = digest.hexdigest()
        self.first_seen.setdefault(str(path), dict(result))
        return result

    def allowed(self, value):
        require(value['nlink'] == 1, 'INDEPENDENT_NLINK_ONE_REQUIRED')
        require(value['uid'] == os.getuid() and value['gid'] == os.getgid(), 'CURRENT_OWNER_AND_GROUP_REQUIRED')
        require(value['flags'] == 0, 'SPECIAL_FLAGS_UNSUPPORTED')
        require(not value['xattrs'], 'XATTR_UNSUPPORTED')
        require(value['aclEntries'] == 0, 'EXTENDED_ACL_UNSUPPORTED')
        require(value['mode'] & 0o7000 == 0, 'SPECIAL_MODE_UNSUPPORTED')

    def equal_bytes(self, left, right):
        with Path(left).open('rb') as a, Path(right).open('rb') as b:
            while True:
                aa, bb = a.read(1024 * 1024), b.read(1024 * 1024)
                require(aa == bb, 'COMPLETE_BYTES_DIFFER')
                if not aa:
                    return

    def pair(self, src, dst):
        src, dst = self.path(src), self.path(dst)
        require(src != dst, 'DISTINCT_PATHS_REQUIRED')
        a, b = self.inspect(src), self.inspect(dst)
        self.allowed(a)
        self.allowed(b)
        require(a['dev'] == b['dev'] and a['ino'] != b['ino'], 'SAME_VOLUME_INDEPENDENT_FILES_REQUIRED')
        require((a['bytes'], a['sha256']) == (b['bytes'], b['sha256']), 'COMPLETE_BYTES_DIFFER')
        self.equal_bytes(src, dst)
        require(stable_identity(self.inspect(src)) == stable_identity(a) and
                stable_identity(self.inspect(dst)) == stable_identity(b), 'PAIR_CHANGED_DURING_CHECK')
        return a, b

    def restore_metadata(self, path, original, expected_ino=None):
        # Mutate only the opened, verified inode; a swapped pathname must not
        # redirect chmod/utime to a concurrent external replacement.
        descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
        try:
            current = os.fstat(descriptor)
            require(expected_ino is None or current.st_ino == expected_ino, 'METADATA_INODE_CHANGED')
            require((current.st_uid, current.st_gid) == (original['uid'], original['gid']), 'CLONE_OWNER_CHANGED')
            os.fchmod(descriptor, original['mode'])
            os.utime(descriptor, ns=(original['atimeNs'], original['mtimeNs']))
            actual = path.lstat()
            require((actual.st_dev, actual.st_ino) == (current.st_dev, current.st_ino), 'METADATA_PATH_CHANGED_CONCURRENTLY')
        finally:
            os.close(descriptor)

    def replace_one(self, src, dst, *, fault=None, journal=None, target_snapshot=None):
        src, dst = self.path(src), self.path(dst)
        # Capture both atimes before this operation's first content read. Holding
        # the descriptors also permits safe restoration after an atomic swap.
        source_fd = os.open(src, os.O_RDONLY | os.O_NOFOLLOW)
        try:
            target_fd = os.open(dst, os.O_RDONLY | os.O_NOFOLLOW)
        except Exception:
            os.close(source_fd)
            raise
        source_initial, target_initial = attributes(os.fstat(source_fd)), attributes(os.fstat(target_fd))
        try:
            a, b = self.pair(src, dst)
            require((a['dev'], a['ino']) == (source_initial['dev'], source_initial['ino']) and
                    (b['dev'], b['ino']) == (target_initial['dev'], target_initial['ino']), 'ORIGINAL_FD_IDENTITY_CHANGED')
            first_target = target_snapshot or self.first_seen.get(str(dst)) or target_initial
            if target_snapshot:
                require(all(target_snapshot[k] == b[k] for k in b if k != 'atimeNs'), 'SCANNED_TARGET_CHANGED')
            a['atimeNs'], b['atimeNs'] = source_initial['atimeNs'], first_target['atimeNs']
        except Exception:
            os.close(source_fd)
            os.close(target_fd)
            raise
        token = uuid.uuid4().hex
        # Keep a usable image suffix so the same strict scope validation applies.
        temp = dst.with_name('.cow-' + token + '-new' + dst.suffix)
        backup = dst.with_name('.cow-' + token + '-backup' + dst.suffix)
        report = {'src': src.relative_to(self.root).as_posix(), 'dst': dst.relative_to(self.root).as_posix(),
                  'sourceBefore': a, 'targetBefore': b, 'freeBeforeBytes': available(dst.parent),
                  'temporary': temp.relative_to(self.root).as_posix(), 'backup': backup.relative_to(self.root).as_posix(),
                  'status': 'attempted', 'events': [], 'rollback': None}
        swapped = False
        committed = False
        installed = None

        def emit(stage, **detail):
            event = {'stage': stage, **detail}
            report['events'].append(event)
            if journal:
                journal(event)

        def original_unchanged():
            require(stable_identity(self.inspect(src)) == stable_identity(a), 'SOURCE_CHANGED_CONCURRENTLY')
            require(stable_identity(self.inspect(dst)) == stable_identity(b), 'TARGET_CHANGED_CONCURRENTLY')

        def installed_unchanged():
            current = self.inspect(dst)
            require(installed is not None and current['ino'] == installed['ino'] and
                    current['dev'] == installed['dev'] and content_metadata(current) == content_metadata(installed),
                    'INSTALLED_TARGET_CHANGED_CONCURRENTLY')

        try:
            emit('before-clones', source=a, target=b)
            clone_strict(dst, backup)
            self.restore_metadata(backup, b)
            saved = self.inspect(backup)
            self.allowed(saved)
            require(content_metadata(saved) == content_metadata(b) and saved['ino'] != b['ino'], 'BACKUP_NOT_COMPLETE_INDEPENDENT_CLONE')
            self.equal_bytes(dst, backup)
            clone_strict(src, temp)
            self.restore_metadata(temp, b)
            candidate = self.inspect(temp)
            self.allowed(candidate)
            require(content_metadata(candidate) == content_metadata(b) and candidate['ino'] not in {a['ino'], b['ino'], saved['ino']}, 'CANDIDATE_NOT_COMPLETE_INDEPENDENT_CLONE')
            self.equal_bytes(src, temp)
            self.restore_metadata(temp, b)
            original_unchanged()
            emit('before-atomic-swap', candidate=candidate, backup=saved)
            if fault:
                fault('before_replace')
            original_unchanged()
            # Freeze the expected object BEFORE the swap. A writer racing with
            # the first post-swap inspect must never become our rollback baseline.
            installed = candidate
            swap_strict(temp, dst)
            swapped = True
            observed_installed = self.inspect(dst)
            # The actual displaced inode is still present, even if a writer raced
            # between the final check and swap. Never discard an unexpected version.
            displaced = self.inspect(temp)
            require(displaced['dev'] == b['dev'] and displaced['ino'] == b['ino'] and
                    content_metadata(displaced) == content_metadata(b), 'DISPLACED_TARGET_CHANGED_CONCURRENTLY')
            require(observed_installed['ino'] == candidate['ino'] and content_metadata(observed_installed) == content_metadata(b), 'INSTALLED_CLONE_CHANGED')
            emit('after-atomic-swap', installed=observed_installed, displaced=displaced)
            if fault:
                fault('after_replace')
            self.equal_bytes(src, dst)
            require(stable_identity(self.inspect(src)) == stable_identity(a), 'SOURCE_CHANGED_AFTER_SWAP')
            installed_unchanged()
            self.restore_metadata(dst, b, expected_ino=installed['ino'])
            final = attributes(dst.lstat())
            require(all(final[k] == b[k] for k in ('bytes', 'mode', 'uid', 'gid', 'mtimeNs', 'atimeNs', 'flags', 'nlink')), 'TARGET_METADATA_NOT_PRESERVED')
            require(not list_xattrs(dst) and acl_entries(dst) == 0, 'TARGET_EXTENDED_METADATA_CHANGED')
            report.update({'status': 'verified', 'targetAfter': {**final, 'sha256': installed['sha256'], 'xattrs': [], 'aclEntries': 0},
                           'inodeChanged': final['ino'] != b['ino'], 'ctimeChanged': final['ctimeNs'] != b['ctimeNs']})
            emit('verified-before-own-backup-removal', target=report['targetAfter'])
            # Both names were created by this operation; neither is an original
            # delivery path. The original data remain present at canonical + target.
            temp.unlink()
            backup.unlink()
            swapped = False
            committed = True
            os.close(target_fd)
            target_fd = None
            report['freeAfterBytes'] = available(dst.parent)
            report['observedFreeDeltaBytes'] = report['freeAfterBytes'] - report['freeBeforeBytes']
            emit('complete', observedFreeDeltaBytes=report['observedFreeDeltaBytes'])
            return report
        except Exception as error:
            report.update({'status': 'failed', 'error': type(error).__name__ + ':' + str(error)})
            try:
                if committed:
                    report['rollback'] = {'status': 'verified-target-retained-after-late-wrapper-failure'}
                elif swapped:
                    installed_unchanged()
                    # Swap back rather than unlink/overwrite: any displaced version
                    # remains captured until its bytes are independently checked.
                    swap_strict(temp, dst)
                    restored = self.inspect(dst)
                    self.restore_metadata(dst, b if content_metadata(restored) == content_metadata(b) else restored, expected_ino=restored['ino'])
                    report['rollback'] = {'status': 'actual-displaced-inode-restored', 'target': attributes(dst.lstat())}
                    swapped = False
                else:
                    report['rollback'] = {'status': 'original-target-not-replaced'}
                # Failure artifacts deliberately remain for review. Never delete a
                # version after detecting an external update or a failed verification.
            except Exception as rollback_error:
                report['rollback'] = {'status': 'versions-retained-do-not-overwrite', 'error': str(rollback_error)}
            report['freeAfterBytes'] = available(dst.parent)
            try:
                emit('failed', error=report['error'], rollback=report['rollback'])
            except Exception as logging_error:
                report['loggingError'] = str(logging_error)
            raise CowError(str(error), report) from error
        finally:
            # Canonical and unprocessed files remain ordinary read-only inputs.
            # Report natural read-atime changes; never write their metadata to
            # manufacture a claim that every metadata value stayed unchanged.
            try:
                report['sourceAfter'] = attributes(os.fstat(source_fd))
                report['sourceReadAtimeChanged'] = report['sourceAfter']['atimeNs'] != a['atimeNs']
            finally:
                os.close(source_fd)
                if target_fd is not None:
                    os.close(target_fd)

    def find_candidates(self, groups=DEFAULT_GROUPS):
        require(groups and all(re.fullmatch(r'[a-z0-9][a-z0-9-]*', g) for g in groups), 'SAFE_IMAGE_GROUPS_REQUIRED')
        self.first_seen = {}
        buckets = {}
        skipped = []
        inspected = 0
        for path in sorted(self.delivery.glob('*/assets/*')):
            if not any(path.name.startswith(group + '-') for group in groups) or path.suffix.lower() not in {'.jpg', '.jpeg', '.png'}:
                continue
            inspected += 1
            try:
                value = self.inspect(path)
                self.allowed(value)
                buckets.setdefault((value['dev'], value['bytes'], value['sha256']), []).append(path)
            except Exception as error:
                skipped.append({'path': path.relative_to(self.root).as_posix(), 'reason': str(error)})
        eligible = []
        for (_, size, digest), paths in buckets.items():
            src = paths[0]
            for dst in paths[1:]:
                try:
                    self.pair(src, dst)
                    eligible.append({'src': src.relative_to(self.root).as_posix(), 'dst': dst.relative_to(self.root).as_posix(), 'bytes': size, 'sha256': digest, 'targetFirstSeen': self.first_seen[str(dst)]})
                except Exception as error:
                    skipped.append({'path': dst.relative_to(self.root).as_posix(), 'reason': str(error)})
        read_observations = []
        for path, first in self.first_seen.items():
            after = attributes(Path(path).lstat())
            read_observations.append({'path': Path(path).relative_to(self.root).as_posix(), 'firstSeen': first,
                                      'afterReads': after, 'naturalAtimeChanged': first['atimeNs'] != after['atimeNs']})
        return {'groups': list(groups), 'eligible': eligible, 'skipped': skipped, 'inspected': inspected,
                'readObservations': read_observations, 'metadataWrites': 0}


def output_guard(path):
    evidence = PROJECT_ROOT / 'goal-1/evidence'
    require(path.parent == PROJECT_ROOT / 'goal-1/evidence/t17-acceptance-08', 'ROOT08_FRESH_REPORT_DIRECTORY_REQUIRED')
    require(not os.path.lexists(path), 'FRESH_OUTPUT_REQUIRED')
    for node in (path.parent, *path.parent.parents):
        require(node.is_dir() and not node.is_symlink(), 'OUTPUT_PARENT_SYMLINK')
        require(not os.path.lexists(node / 'sealed-evidence.json'), 'OUTPUT_PARENT_SEALED')
        if node == evidence:
            return
    raise CowError('EVIDENCE_ROOT_REQUIRED')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', required=True)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--max-files', type=int)
    parser.add_argument('--groups', nargs='+', default=list(DEFAULT_GROUPS))
    args = parser.parse_args()
    require(not args.apply or args.max_files is not None, 'APPLY_REQUIRES_EXPLICIT_MAX_FILES')
    require(args.max_files is None or 1 <= args.max_files <= 256, 'MAX_FILES_MUST_BE_1_TO_256')
    output = Path(args.output_dir).absolute()
    output_guard(output)
    output.mkdir()
    tracked_raw = subprocess.check_output(['rtk', 'proxy', 'git', '--literal-pathspecs', 'ls-files', '-z', '--', '.delivery'], cwd=PROJECT_ROOT)
    tracked = frozenset(tracked_raw.decode().strip('\0').split('\0'))
    frozen = frozenset(json.loads((PROJECT_ROOT / 'goal-1/evidence/t17-acceptance-08/execution-source-freeze-r4.json').read_text()))
    recovery = Recovery(PROJECT_ROOT, tracked_paths=tracked, frozen_paths=frozen)
    journal = output / 'operations.jsonl'
    with journal.open('x'):
        pass

    def emit(value):
        with journal.open('a', encoding='utf8') as target:
            target.write(json.dumps(value, ensure_ascii=False) + '\n')
            target.flush()
            os.fsync(target.fileno())

    report = {'mode': 'apply' if args.apply else 'dry-run', 'maxFiles': args.max_files,
              'scope': 'Only byte-identical derived images; current two deliveries, tracked/frozen files, evidence and saves excluded. clonefile only; no ordinary copy, hardlink or symlink fallback.',
              'freeBeforeBytes': available(PROJECT_ROOT), 'operations': [], 'error': None}
    try:
        candidates = recovery.find_candidates(tuple(args.groups))
        report['candidates'] = candidates
        report['candidateCount'] = len(candidates['eligible'])
        if args.apply:
            for row in candidates['eligible'][:args.max_files]:
                emit({'stage': 'registered-target', 'candidate': row})
                result = recovery.replace_one(PROJECT_ROOT / row['src'], PROJECT_ROOT / row['dst'], journal=emit, target_snapshot=row['targetFirstSeen'])
                report['operations'].append(result)
        report['status'] = 'verified' if args.apply else 'dry-run-only-no-target-replacement'
    except Exception as error:
        report.update({'status': 'failed', 'error': str(error)})
        if isinstance(error, CowError) and error.report:
            report['failedOperation'] = error.report
    report['freeAfterBytes'] = available(PROJECT_ROOT)
    report['observedFreeDeltaBytes'] = report['freeAfterBytes'] - report['freeBeforeBytes']
    report['note'] = 'Space delta includes unrelated concurrent allocation. inode/ctime may change during replacement/rollback; original path, full bytes and target own metadata are verified. A failure retains own temporary versions for review.'
    raw = json.dumps(report, ensure_ascii=False, indent=2) + '\n'
    with (output / 'report.json').open('x', encoding='utf8') as target:
        target.write(raw)
    with (output / 'report.txt').open('x', encoding='utf8') as target:
        target.write(json.dumps({k: v for k, v in report.items() if k not in {'candidates', 'operations', 'failedOperation'}}, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': report['status'], 'candidateCount': report.get('candidateCount'), 'applied': len(report['operations']), 'output': str(output), 'error': report['error']}, ensure_ascii=False))
    return 1 if report['error'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
