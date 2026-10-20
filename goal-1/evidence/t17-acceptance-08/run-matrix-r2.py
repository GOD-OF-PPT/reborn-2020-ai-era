from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys
import time

p = Path(__file__).absolute().parent
minimum_free_bytes = 640 * 1024 * 1024
for ancestor in [p, *p.parents]:
    if ancestor.is_symlink():
        raise RuntimeError('EVIDENCE_SYMLINK_FORBIDDEN')
    if (ancestor / 'sealed-evidence.json').exists():
        raise RuntimeError('EVIDENCE_SEALED_USE_NEW_ROOT')
    if ancestor.name == 'evidence' and ancestor.parent.name == 'goal-1':
        break
else:
    raise RuntimeError('PROJECT_EVIDENCE_REQUIRED')

for name in ['project-types-r4', 'cli-types-r4', 'xz-helper-tests-r2',
             'python-tools-r2', 'framing-same-seam-r2']:
    if json.loads((p / (name + '.json')).read_text())['exitCode'] != 0:
        raise RuntimeError('PREREQUISITE_CHECK_NOT_PASSED:' + name)
for file, evidence in json.loads((p / 'execution-source-freeze-r4.json').read_text()).items():
    original = Path(file).read_bytes()
    if len(original) != evidence['bytes'] or hashlib.sha256(original).hexdigest() != evidence['sha256']:
        raise RuntimeError('FROZEN_SOURCE_CHANGED:' + file)
if (p / 'matrix-r2').exists():
    raise RuntimeError('FRESH_OUTPUT_REQUIRED')
if json.loads((p / 'matrix-r1-complete.json').read_text())['exitCode'] != 1:
    raise RuntimeError('ORIGINAL_R1_TERMINAL_CHANGED')
free_bytes = shutil.disk_usage(p).free
if free_bytes < minimum_free_bytes:
    raise RuntimeError('INSUFFICIENT_COMPLETE_EVIDENCE_SPACE:' + str(free_bytes))

command = ['rtk', 'proxy', 'node', '--max-old-space-size=1536',
           '--experimental-strip-types', '--experimental-transform-types',
           'scripts/collect_course_delegated_evidence.ts', '--output-dir',
           'goal-1/evidence/t17-acceptance-08/matrix-r2']
started = time.time()
bounds = {'managedHeapMiB': 1536, 'minimumFreeEvidenceBytes': minimum_free_bytes,
          'freeEvidenceBytesBeforeLaunch': free_bytes,
          'scope': 'Tool resource bounds; no gameplay, calendar, field or validation reduction'}
with (p / 'matrix-r2-command-intent.json').open('x') as out:
    json.dump({'command': command, 'started': started, 'state': 'before-launch',
               'resourceBounds': bounds}, out, indent=2)
metadata_errors = []
with (p / 'matrix-r2-console.txt').open('x') as log:
    process = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT)
    try:
        try:
            with (p / 'matrix-r2-running.json').open('x') as out:
                json.dump({'command': command, 'started': started, 'pid': process.pid,
                           'state': 'launched; check actual process/session for liveness',
                           'resourceBounds': bounds}, out, indent=2)
        except OSError as error:
            metadata_errors.append({'file': 'matrix-r2-running.json', 'error': str(error)})
        print(json.dumps({'startedMatrix': 'matrix-r2', 'pid': process.pid,
                          'registeredExpected': 72, 'resourceBounds': bounds,
                          'metadataErrors': metadata_errors}), flush=True)
    finally:
        # A failed post-launch metadata write must never abandon a live collector.
        code = process.wait()
try:
    with (p / 'matrix-r2-complete.json').open('x') as out:
        json.dump({'command': command, 'started': started, 'finished': time.time(),
                   'pid': process.pid, 'exitCode': code, 'state': 'terminal',
                   'resourceBounds': bounds, 'metadataErrors': metadata_errors}, out, indent=2)
except OSError as error:
    metadata_errors.append({'file': 'matrix-r2-complete.json', 'error': str(error)})
driver_code = code if not metadata_errors else 1
print(json.dumps({'matrix': 'matrix-r2', 'exitCode': driver_code, 'collectorExitCode': code,
                  'metadataErrors': metadata_errors, 'elapsedSeconds': time.time() - started}), flush=True)
sys.exit(driver_code)
