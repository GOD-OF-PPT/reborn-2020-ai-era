"""Run only the registered P3 matrix or its independent audit; preserve owned terminal metadata."""
from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time

task = Path(__file__).absolute().parent
project = task.parents[2]
if len(sys.argv) != 2 or sys.argv[1] not in {'matrix-r1', 'audit-r1'}:
    raise RuntimeError('EXACT_REGISTERED_P3_JOB_REQUIRED')
job = sys.argv[1]
if Path.cwd().resolve() != project.resolve():
    raise RuntimeError('ORIGINAL_PROJECT_CWD_REQUIRED')
for ancestor in [task, *task.parents]:
    if ancestor.is_symlink() or (ancestor / 'sealed-evidence.json').exists():
        raise RuntimeError('JOB_PARENT_LINK_OR_SEALED')
    if ancestor == project:
        break
else:
    raise RuntimeError('PROJECT_ANCESTOR_REQUIRED')
if (task / job).exists() or (task / job).is_symlink():
    raise RuntimeError('FRESH_REGISTERED_OUTPUT_REQUIRED')
freeze_name = 'execution-source-freeze-r1.json' if job == 'matrix-r1' else 'audit-source-freeze-r1.json'
for name, expected in json.loads((task / freeze_name).read_text()).items():
    path = project / name
    if path.is_symlink() or not path.is_file():
        raise RuntimeError('REGULAR_FROZEN_INPUT_REQUIRED:' + name)
    digest = hashlib.sha256()
    count = 0
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1048576), b''):
            count += len(block)
            digest.update(block)
    if {'bytes': count, 'sha256': digest.hexdigest()} != expected:
        raise RuntimeError('P3_FROZEN_SOURCE_CHANGED:' + name)

environment = os.environ.copy()
if job == 'audit-r1':
    terminal = json.loads((task / 'matrix-r1-complete.json').read_text())
    summary = json.loads((task / 'matrix-r1/course-critical-results.json').read_text())
    if terminal['state'] != 'terminal' or terminal['exitCode'] != 0 or terminal['metadataErrors']:
        raise RuntimeError('ACTUAL_SUCCESSFUL_MATRIX_TERMINAL_REQUIRED')
    if not (summary['registered'] == summary['recorded'] == summary['attempted'] == summary['targetVerified'] == 90
            and summary['failed'] == summary['unexecutedDueToFatal'] == 0
            and summary['allOriginal90TargetsVerified'] is True and summary['fatal'] is None):
        raise RuntimeError('COMPLETE_ORIGINAL90_MATRIX_REQUIRED')
    matrix = task / 'matrix-r1'
    seal = json.loads((matrix / 'sealed-evidence.json').read_text())
    leaves = set()
    for path in matrix.rglob('*'):
        if path.is_symlink():
            raise RuntimeError('SEALED_MATRIX_LINK_FORBIDDEN')
        if path.is_file():
            leaves.add(path.relative_to(matrix).as_posix())
        elif not path.is_dir():
            raise RuntimeError('SEALED_MATRIX_NONREGULAR_FORBIDDEN')
    if seal['selfExcluded'] != ['sealed-evidence.json'] or leaves != set(seal['files']) | {'sealed-evidence.json'}:
        raise RuntimeError('SEALED_MATRIX_COMPLETE_SET_CHANGED')
    for name, expected in seal['files'].items():
        raw = (matrix / name).read_bytes()
        if len(raw) != expected['bytes'] or hashlib.sha256(raw).hexdigest() != expected['sha256']:
            raise RuntimeError('SEALED_MATRIX_ORIGINAL_BYTES_CHANGED:' + name)
    environment['COURSE_CRITICAL_INPUT_DIRECTORY'] = 'goal-1/evidence/t17-acceptance-09/matrix-r1'

free = shutil.disk_usage(task).free
if free < 2 * 1024 * 1024 * 1024:
    raise RuntimeError('INSUFFICIENT_P3_LAUNCH_SPACE:' + str(free))
probe = task / (job + '-write-probe.txt')
with probe.open('xb') as output:
    output.write(b'p3-owned-probe-ok\n')
    output.flush()
    os.fsync(output.fileno())
if probe.read_bytes() != b'p3-owned-probe-ok\n':
    raise RuntimeError('P3_SMALL_WRITE_READBACK_FAILED')
script = 'collect_course_critical_evidence.ts' if job == 'matrix-r1' else 'verify_course_critical_evidence.ts'
command = ['rtk', 'proxy', 'node', '--max-old-space-size=1024', '--trace-gc', '--trace-gc-ignore-scavenger',
           '--experimental-strip-types', '--experimental-transform-types', 'scripts/' + script,
           '--output-dir', 'goal-1/evidence/t17-acceptance-09/' + job]
started = time.time()
intent = {'job': job, 'command': command, 'started': started, 'driverPid': os.getpid(),
          'inputDirectory': environment.get('COURSE_CRITICAL_INPUT_DIRECTORY') if job == 'audit-r1' else None,
          'resourceBounds': {'managedHeapMiB': 1024, 'freeBytesBeforeLaunch': free,
                             'minimumLaunchFreeBytes': 2147483648, 'majorGcLogOnly': True},
          'scope': 'P3 original90 Node rules/evidence only; no UI, browser or compatibility work'}
with (task / (job + '-command-intent.json')).open('x') as output:
    json.dump(intent, output, indent=2)
metadata_errors = []
with (task / (job + '-console.txt')).open('x') as log:
    process = subprocess.Popen(command, env=environment, cwd=project, stdout=log, stderr=subprocess.STDOUT)
    try:
        try:
            with (task / (job + '-running.json')).open('x') as output:
                json.dump({**intent, 'wrapperPid': process.pid, 'state': 'launched; recheck actual session/PIDs'}, output, indent=2)
        except OSError as error:
            metadata_errors.append({'file': job + '-running.json', 'error': str(error)})
        print(json.dumps({'job': job, 'driverPid': os.getpid(), 'wrapperPid': process.pid,
                          'metadataErrors': metadata_errors}), flush=True)
    finally:
        code = process.wait()
try:
    with (task / (job + '-complete.json')).open('x') as output:
        json.dump({**intent, 'wrapperPid': process.pid, 'finished': time.time(), 'exitCode': code,
                   'state': 'terminal', 'metadataErrors': metadata_errors}, output, indent=2)
except OSError as error:
    metadata_errors.append({'file': job + '-complete.json', 'error': str(error)})
driver_code = code if not metadata_errors else 1
print(json.dumps({'job': job, 'driverExitCode': driver_code, 'wrapperExitCode': code,
                  'metadataErrors': metadata_errors, 'elapsedSeconds': time.time() - started}), flush=True)
sys.exit(driver_code)
