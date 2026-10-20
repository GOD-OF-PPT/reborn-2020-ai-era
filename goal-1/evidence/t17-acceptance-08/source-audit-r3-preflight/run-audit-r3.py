from pathlib import Path
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time

p = Path(__file__).absolute().parent
for ancestor in [p, *p.parents]:
    if ancestor.is_symlink() or (ancestor / 'sealed-evidence.json').exists():
        raise RuntimeError('AUDIT_PARENT_SYMLINK_OR_SEALED')
    if ancestor.name == 'evidence' and ancestor.parent.name == 'goal-1':
        break
else:
    raise RuntimeError('PROJECT_EVIDENCE_REQUIRED')
terminal = json.loads((p / 'matrix-r2-complete.json').read_text())
if terminal['state'] != 'terminal' or terminal['exitCode'] != 0 or terminal['metadataErrors']:
    raise RuntimeError('COMPLETE_SUCCESSFUL_COLLECTOR_REQUIRED')
summary = json.loads((p / 'matrix-r2/course-delegated-results.json').read_text())
if summary['registered'] != 72 or summary['attempted'] != 72 or summary['fatal'] or summary['unexecutedDueToFatal']:
    raise RuntimeError('ALL_ORIGINAL_72_ACTUAL_RESULTS_REQUIRED')
if (p / 'audit-r3').exists():
    raise RuntimeError('FRESH_AUDIT_OUTPUT_REQUIRED')
for file, evidence in json.loads((p / 'audit-source-freeze-r2.json').read_text()).items():
    raw = Path(file).read_bytes()
    if len(raw) != evidence['bytes'] or hashlib.sha256(raw).hexdigest() != evidence['sha256']:
        raise RuntimeError('AUDIT_FROZEN_SOURCE_CHANGED:' + file)
seal = json.loads((p / 'matrix-r2/sealed-evidence.json').read_text())
for name, evidence in seal['files'].items():
    raw = (p / 'matrix-r2' / name).read_bytes()
    if len(raw) != evidence['bytes'] or hashlib.sha256(raw).hexdigest() != evidence['sha256']:
        raise RuntimeError('SEALED_MATRIX_BYTES_CHANGED:' + name)
free_before_launch = shutil.disk_usage(p).free
if free_before_launch < 2 * 1024 * 1024 * 1024:
    raise RuntimeError('INSUFFICIENT_AUDIT_EVIDENCE_SPACE:' + str(free_before_launch) + ':minimum2147483648')

command = ['rtk', 'proxy', 'node', '--max-old-space-size=1536',
           '--experimental-strip-types', '--experimental-transform-types',
           'scripts/verify_course_delegated_evidence.ts', '--output-dir',
           'goal-1/evidence/t17-acceptance-08/audit-r3']
environment = os.environ.copy()
environment['COURSE_DELEGATED_INPUT_DIRECTORY'] = 'goal-1/evidence/t17-acceptance-08/matrix-r2'
started = time.time()
intent = {'command': command, 'started': started,
          'inputDirectory': environment['COURSE_DELEGATED_INPUT_DIRECTORY'],
          'scope': 'Independent complete Create, raw, command and money audit; no browser or compatibility work'}
with (p / 'audit-r3-command-intent.json').open('x') as out:
    json.dump(intent, out, indent=2)
metadata_errors = []
with (p / 'audit-r3-console.txt').open('x') as log:
    process = subprocess.Popen(command, env=environment, stdout=log, stderr=subprocess.STDOUT)
    try:
        try:
            with (p / 'audit-r3-running.json').open('x') as out:
                json.dump({**intent, 'pid': process.pid, 'state': 'launched; check actual process/session for liveness'}, out, indent=2)
        except OSError as error:
            metadata_errors.append({'file': 'audit-r3-running.json', 'error': str(error)})
        print(json.dumps({'startedAudit': 'audit-r3', 'pid': process.pid,
                          'metadataErrors': metadata_errors}), flush=True)
    finally:
        code = process.wait()
try:
    with (p / 'audit-r3-complete.json').open('x') as out:
        json.dump({**intent, 'pid': process.pid, 'finished': time.time(), 'exitCode': code,
                   'state': 'terminal', 'metadataErrors': metadata_errors}, out, indent=2)
except OSError as error:
    metadata_errors.append({'file': 'audit-r3-complete.json', 'error': str(error)})
driver_code = code if not metadata_errors else 1
print(json.dumps({'audit': 'audit-r3', 'exitCode': driver_code, 'verifierExitCode': code,
                  'metadataErrors': metadata_errors, 'elapsedSeconds': time.time() - started}), flush=True)
sys.exit(driver_code)
