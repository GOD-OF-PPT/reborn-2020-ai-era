'''Run one preregistered C-D10 check; fresh evidence only, original output preserved.'''
from pathlib import Path
import argparse
import collections
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import time
import traceback

TASK = Path(__file__).absolute().parent
PROJECT = TASK.parents[2]
REGISTRATION = TASK / 'regression-registration-r6.json'
PLAN = TASK / 'regression-r1-plan.md'


def command_read(args):
    result = subprocess.run(['rtk', 'proxy', *args], cwd=PROJECT, capture_output=True)
    if result.returncode:
        raise RuntimeError('READ_COMMAND_FAILED:' + repr(args) + ':' + result.stderr.decode(errors='replace'))
    return result.stdout


def assert_directories(path):
    for ancestor in (path, *path.parents):
        info = ancestor.lstat()
        if not stat.S_ISDIR(info.st_mode) or stat.S_ISLNK(info.st_mode):
            raise RuntimeError('PHYSICAL_DIRECTORY_REQUIRED:' + str(ancestor))
        if os.path.lexists(ancestor / 'sealed-evidence.json'):
            raise RuntimeError('EVIDENCE_SEALED_USE_NEW_ROOT:' + str(ancestor))


def assert_task_writable(path=TASK):
    assert_directories(path)
    if not path.is_relative_to(TASK):
        raise RuntimeError('TASK_OUTPUT_REQUIRED')
    if command_read(['git', 'ls-files', '--stage', '--', TASK.relative_to(PROJECT).as_posix()]).strip():
        raise RuntimeError('TRACKED_OR_INDEXED_TASK_USE_NEW_ROOT')
    command_read(['node', '--input-type=module', '-e',
                  "import {assertBrowserEvidenceWritable} from './scripts/browser_evidence_guard.mjs';assertBrowserEvidenceWritable(process.argv[1]);", str(path)])


def identity(info):
    return [info.st_dev, info.st_ino, info.st_mode, info.st_size, info.st_mtime_ns, info.st_ctime_ns]


def reference(path, include_text=False):
    if not path.is_absolute() or not path.is_relative_to(PROJECT):
        raise RuntimeError('SOURCE_PROJECT_BOUNDARY:' + str(path))
    for ancestor in path.parents:
        info = ancestor.lstat()
        if not stat.S_ISDIR(info.st_mode) or stat.S_ISLNK(info.st_mode):
            raise RuntimeError('SOURCE_PARENT_SYMLINK_OR_NON_DIRECTORY:' + str(ancestor))
    before = path.lstat()
    if not stat.S_ISREG(before.st_mode) or stat.S_ISLNK(before.st_mode):
        raise RuntimeError('REGULAR_SOURCE_REQUIRED:' + str(path))
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    digest = hashlib.sha256()
    size = 0
    text_parts = []
    try:
        if identity(os.fstat(descriptor)) != identity(before):
            raise RuntimeError('SOURCE_OPEN_IDENTITY_CHANGED:' + str(path))
        while True:
            chunk = os.read(descriptor, 1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
            size += len(chunk)
            if include_text:
                text_parts.append(chunk)
        if identity(os.fstat(descriptor)) != identity(before) or identity(path.lstat()) != identity(before):
            raise RuntimeError('SOURCE_READ_IDENTITY_CHANGED:' + str(path))
    finally:
        os.close(descriptor)
    result = {'bytes': size, 'sha256': digest.hexdigest(), 'physicalIdentity': identity(before)}
    return (result, b''.join(text_parts)) if include_text else result


def read_json(path):
    _, body = reference(path, True)
    return json.loads(body)


def write_new(path, body):
    assert_task_writable(path.parent)
    parent_fd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        descriptor = os.open(path.name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o644, dir_fd=parent_fd)
    finally:
        os.close(parent_fd)
    with os.fdopen(descriptor, 'wb') as stream:
        stream.write(body)


def write_json(path, value):
    write_new(path, (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode())


def tree_files(root):
    result = set()
    for directory, children, names in os.walk(root, followlinks=False):
        for child in children:
            info = (Path(directory) / child).lstat()
            if stat.S_ISLNK(info.st_mode) or not stat.S_ISDIR(info.st_mode):
                raise RuntimeError('FROZEN_TREE_DIRECTORY_LINK:' + str(Path(directory) / child))
        for name in names:
            result.add(Path(directory) / name)
    return result


def inventory():
    return sorted(path.relative_to(PROJECT).as_posix() for path in tree_files(PROJECT / 'src')
                  if path.name.endswith(('.test.ts', '.test.tsx')))


def source_names():
    names = {Path(__file__).absolute(), REGISTRATION, PLAN}
    names.update(TASK / name for name in ('input.md', 'plan.md', 'tasks.md', 'direction-input.txt')
                 if os.path.lexists(TASK / name))
    for root_name in ('src', 'public', 'scripts', 'docs', 'planning'):
        names.update(tree_files(PROJECT / root_name))
    names.update(PROJECT / name for name in ('package.json', 'package-lock.json', 'vite.config.ts', 'vitest.config.ts', 'AGENTS.md', 'README.md', 'assets/concepts/manifest.json'))
    names.update(PROJECT.glob('tsconfig*.json'))
    names.update(PROJECT / name for name in (
        'goal-1/evidence/t17-acceptance-11/chrome-production-r12/r105-audit-correction-real-cash-saved.json',
        'goal-1/evidence/t17-acceptance-07/chrome-film/signal-input-text-before-import.json',
        'goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0071.json'))
    for source in sorted(path for path in names if path.suffix in ('.ts', '.tsx') and path.is_relative_to(PROJECT / 'src')):
        _, raw = reference(source, True)
        for match in re.finditer(r'''from\s+['"]([^'"]+\.json)\?raw['"]''', raw.decode()):
            candidate = Path(os.path.abspath(source.parent / match.group(1)))
            reference(candidate)
            names.add(candidate)
    return names


def snapshot():
    return {path.relative_to(PROJECT).as_posix(): reference(path) for path in sorted(source_names())}


def git_identity():
    return {name: command_read(args).decode().strip() for name, args in (
        ('head', ['git', 'rev-parse', 'HEAD']), ('branch', ['git', 'branch', '--show-current']),
        ('origin', ['git', 'remote', 'get-url', 'origin']))}


def status_bytes():
    return command_read(['git', 'status', '--porcelain=v1', '--untracked-files=all'])


def dependencies_ok(references):
    results = []
    for value in references:
        if not re.fullmatch(r'r[1-9][0-9]*:[a-z][a-z0-9-]*', value):
            raise RuntimeError('DEPENDENCY_ROUND_MODE_REQUIRED:' + value)
        round_name, mode = value.split(':')
        folder = TASK / ('checks-' + round_name) / mode
        assert_directories(folder)
        terminal = read_json(folder / 'complete.json')
        if terminal.get('state') != 'terminal' or terminal.get('wrapperExitCode') != 0 or terminal.get('driverExitCode') != 0 or terminal.get('metadataErrors') or terminal.get('validationErrors'):
            raise RuntimeError('DEPENDENCY_NOT_SUCCESSFUL:' + value)
        for name, expected in read_json(folder / 'source-freeze.json').items():
            if reference(PROJECT / name) != expected:
                raise RuntimeError('DEPENDENCY_FROZEN_SOURCE_CHANGED:' + value + ':' + name)
        results.append({'reference': value, 'terminal': reference(folder / 'complete.json')})
    return results


def reject_live_checks(output):
    for running in TASK.glob('checks-r*/*/running.json'):
        if running.parent == output or os.path.lexists(running.parent / 'complete.json'):
            continue
        value = read_json(running)
        for key in ('driverPid', 'wrapperPid'):
            pid = value.get(key)
            if isinstance(pid, int) and pid > 0:
                try:
                    os.kill(pid, 0)
                except ProcessLookupError:
                    continue
                raise RuntimeError('OTHER_TASK_CHECK_STILL_RUNNING:' + str(running))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode')
    parser.add_argument('round', nargs='?', default='r1')
    parser.add_argument('--after', action='append', default=[])
    parser.add_argument('--serial', action='store_true', help='Root confirms no concurrent browser/heavy tool for this full-unit run.')
    args = parser.parse_args()
    if Path.cwd().absolute() != PROJECT:
        raise RuntimeError('ORIGINAL_PROJECT_CWD_REQUIRED')
    assert_task_writable()
    registration = read_json(REGISTRATION)
    if args.mode not in {*registration['groups'], *registration['commands']} or not re.fullmatch(r'r[1-9][0-9]*', args.round):
        raise RuntimeError('REGISTERED_MODE_AND_FRESH_ROUND_REQUIRED')
    if args.mode in registration['serialOnlyModes'] and not args.serial:
        raise RuntimeError('FULL_UNIT_SERIAL_SCHEDULING_CONFIRMATION_REQUIRED')
    if shutil.disk_usage(TASK).free < 2 * 1024**3:
        raise RuntimeError('C_D10_CHECK_REQUIRES_TWO_GIB_FREE')
    parent = TASK / ('checks-' + args.round)
    if os.path.lexists(parent):
        assert_task_writable(parent)
    else:
        parent.mkdir()
    output = parent / args.mode
    output.mkdir()
    assert_task_writable(output)
    started = time.time()
    errors = []
    metadata_errors = []
    frozen = {}
    process = None
    code = None
    result = None
    intent = {'mode': args.mode, 'round': args.round, 'started': started, 'driverPid': os.getpid(),
              'scope': 'One C-D10 registered check; no compatibility or browser execution by this runner.',
              'dependencies': args.after, 'serialSchedulingConfirmed': args.serial,
              'freeBytesBeforeLaunch': shutil.disk_usage(TASK).free}
    try:
        reject_live_checks(output)
        intent['dependencyReadback'] = dependencies_ok(args.after)
        if inventory() != registration['testInventory']:
            raise RuntimeError('TEST_INVENTORY_CHANGED_UPDATE_REGISTRATION_BEFORE_FREEZE')
        before_identity = git_identity()
        intent['identityBefore'] = before_identity
        intent['repositoryBefore'] = json.loads(command_read(['gh', 'repo', 'view', '--json', 'nameWithOwner,visibility,url,defaultBranchRef']))
        write_new(output / 'git-status-before.txt', status_bytes())
        frozen = snapshot()
        write_json(output / 'source-freeze.json', frozen)
        write_new(output / 'runner-under-test.py', Path(__file__).read_bytes())
        if args.mode in registration['groups']:
            command = ['rtk', 'proxy', 'npm', 'run', 'test:unit', '--', '--maxWorkers=1', '--reporter=default',
                       '--reporter=json', '--outputFile.json=' + str(output / 'vitest.json'), *registration['groups'][args.mode]]
        elif args.mode == 'build':
            build_path = PROJECT / '.delivery' / (registration['deliveryPrefix'] + '-' + args.round)
            assert_directories(build_path.parent)
            if os.path.lexists(build_path):
                raise RuntimeError('FRESH_C_D10_BUILD_REQUIRED')
            command = ['rtk', 'proxy', 'npm', 'run', 'build', '--', '--outDir', build_path.relative_to(PROJECT).as_posix()]
            intent['buildPath'] = build_path.relative_to(PROJECT).as_posix()
        else:
            command = registration['commands'][args.mode]
        if command[:2] != ['rtk', 'proxy'] or command[2:] in (['npm', 'run', 'check'], ['npm', 'run', 'test:unit']):
            raise RuntimeError('EXPLICIT_RTK_REGISTERED_COMMAND_REQUIRED')
        intent['command'] = command
        write_json(output / 'command-intent.json', intent)
        assert_task_writable(output)
        descriptor = os.open(output / 'console.txt', os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o644)
        with os.fdopen(descriptor, 'wb') as console:
            process = subprocess.Popen(command, cwd=PROJECT, stdout=console, stderr=subprocess.STDOUT)
            write_json(output / 'running.json', {**intent, 'wrapperPid': process.pid})
            print(json.dumps({'mode': args.mode, 'driverPid': os.getpid(), 'wrapperPid': process.pid}), flush=True)
            code = process.wait()
        write_new(output / 'git-status-after.txt', status_bytes())
        intent['identityAfter'] = git_identity()
        if intent['identityAfter'] != before_identity:
            errors.append('GIT_IDENTITY_CHANGED_DURING_CHECK')
        if inventory() != registration['testInventory']:
            errors.append('TEST_INVENTORY_CHANGED_DURING_CHECK')
        if {path.relative_to(PROJECT).as_posix() for path in source_names()} != set(frozen):
            errors.append('FROZEN_SOURCE_INPUT_PATH_SET_CHANGED')
        for name, expected in frozen.items():
            if reference(PROJECT / name) != expected:
                errors.append('CHECK_FROZEN_SOURCE_OR_INPUT_CHANGED:' + name)
        if args.mode in registration['groups']:
            report = read_json(output / 'vitest.json')
            actual = [Path(row['name']).relative_to(PROJECT).as_posix() for row in report['testResults']]
            if len(actual) != len(set(actual)) or set(actual) != set(registration['groups'][args.mode]):
                errors.append('EXACT_REGISTERED_TEST_FILE_SET_CHANGED')
            assertions = [item for row in report['testResults'] for item in row['assertionResults']]
            statuses = dict(collections.Counter(item['status'] for item in assertions))
            result = {'files': len(actual), 'tests': len(assertions), 'assertionStatuses': statuses,
                      'passed': statuses.get('passed', 0), 'other': sum(n for s, n in statuses.items() if s != 'passed'),
                      'suiteStatuses': dict(collections.Counter(row['status'] for row in report['testResults'])),
                      'reportSuccess': report['success'], 'failedTestSuites': report.get('numFailedTestSuites'),
                      'failedTests': report.get('numFailedTests'), 'pendingTests': report.get('numPendingTests'), 'todoTests': report.get('numTodoTests')}
            if code == 0 and (not report['success'] or result['other'] or any(row['status'] != 'passed' for row in report['testResults'])):
                errors.append('ALL_REGISTERED_TESTS_MUST_ACTUALLY_PASS')
    except Exception as error:
        errors.append(type(error).__name__ + ':' + str(error))
        if process is not None and code is None:
            code = process.wait()
        try:
            write_new(output / 'driver-error.txt', traceback.format_exc().encode())
        except Exception as metadata_error:
            metadata_errors.append(str(metadata_error))
    driver_code = code if code is not None and code != 0 else (1 if code is None or errors or metadata_errors else 0)
    terminal = {**intent, 'wrapperPid': process.pid if process else None, 'finished': time.time(),
                'elapsedSeconds': time.time() - started, 'wrapperExitCode': code, 'driverExitCode': driver_code,
                'state': 'terminal', 'metadataErrors': metadata_errors, 'validationErrors': errors,
                'testResult': result, 'frozenSourcesAndInputs': len(frozen)}
    try:
        write_json(output / 'complete.json', terminal)
    except Exception as error:
        metadata_errors.append(str(error))
        driver_code = 1
    print(json.dumps({**terminal, 'driverExitCode': driver_code}, ensure_ascii=False), flush=True)
    return driver_code


if __name__ == '__main__':
    sys.exit(main())
