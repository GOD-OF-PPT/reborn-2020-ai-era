"""Run one registered D08_CURRENT_UI check in a fresh task-owned round; preserve actual output."""
from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import time

task = Path(__file__).absolute().parent
project = task.parents[2]
registration = json.loads((task / 'regression-registration-r1.json').read_text())
if len(sys.argv) not in (2, 3):
    raise RuntimeError('ONE_REGISTERED_CHECK_REQUIRED')
mode = sys.argv[1]
round_name = sys.argv[2] if len(sys.argv) == 3 else 'r1'
if mode not in {*registration['groups'], 'typecheck', 'build'} or not re.fullmatch(r'r[1-9][0-9]*', round_name):
    raise RuntimeError('REGISTERED_MODE_AND_FRESH_ROUND_REQUIRED')
if Path.cwd().resolve() != project.resolve():
    raise RuntimeError('ORIGINAL_PROJECT_CWD_REQUIRED')
for ancestor in (task, *task.parents):
    if ancestor.is_symlink() or os.path.lexists(ancestor / 'sealed-evidence.json'):
        raise RuntimeError('SEALED_OR_LINKED_PARENT')
    if ancestor == project:
        break
else:
    raise RuntimeError('PROJECT_ANCESTOR_REQUIRED')
parent = task / ('checks-' + round_name)
if os.path.lexists(parent) and (parent.is_symlink() or not parent.is_dir() or os.path.lexists(parent / 'sealed-evidence.json')):
    raise RuntimeError('UNSEALED_REGULAR_CHECK_PARENT_REQUIRED')
parent.mkdir(exist_ok=True)
output = parent / mode
output.mkdir()
free = shutil.disk_usage(task).free
if free < 2 * 1024**3:
    raise RuntimeError('D08_CURRENT_UI_CHECK_REQUIRES_TWO_GIB_FREE:' + str(free))

names = {Path(__file__).absolute(), task / 'regression-registration-r1.json', task / 'regression-r1-plan.md', task / 'plan.md', task / 'input.md'}
names.update(path for path in (project / 'src').rglob('*') if path.suffix in {'.ts', '.tsx', '.css'})
names.update(path for path in (project / 'public').rglob('*') if not path.is_dir())
names.update(project / name for name in ('package.json', 'package-lock.json', 'vite.config.ts', 'vitest.config.ts'))
names.update(project.glob('tsconfig*.json'))

def reference(path):
    if path.is_symlink() or not stat.S_ISREG(path.lstat().st_mode) or path.resolve() != path:
        raise RuntimeError('REGULAR_SOURCE_REQUIRED:' + str(path))
    raw = path.read_bytes()
    return {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}

sources = {path.relative_to(project).as_posix(): reference(path) for path in sorted(names)}
with (output / 'source-freeze.json').open('x') as stream:
    json.dump(sources, stream, indent=2)
with (output / 'runner-under-test.py').open('xb') as stream:
    stream.write(Path(__file__).read_bytes())
if mode in registration['groups']:
    command = ['rtk', 'proxy', 'npm', 'run', 'test:unit', '--', '--maxWorkers=1',
               '--reporter=default', '--reporter=json', '--outputFile.json=' + str(output / 'vitest.json'),
               *registration['groups'][mode]]
elif mode == 'typecheck':
    command = ['rtk', 'proxy', 'npm', 'run', 'typecheck']
else:
    build_path = project / '.delivery' / ('t17-game-clarity-' + round_name)
    if os.path.lexists(build_path):
        raise RuntimeError('FRESH_D08_CURRENT_UI_BUILD_REQUIRED')
    command = ['rtk', 'proxy', 'npm', 'run', 'build', '--', '--outDir', str(build_path.relative_to(project))]
started = time.time()
intent = {'mode': mode, 'round': round_name, 'command': command, 'started': started,
          'driverPid': os.getpid(), 'freeBytesBeforeLaunch': free,
          'scope': 'One current D08_CURRENT_UI check. No viewport, zoom, cross-browser or native-leave compatibility execution.'}
with (output / 'command-intent.json').open('x') as stream:
    json.dump(intent, stream, indent=2)
metadata_errors = []
with (output / 'console.txt').open('x') as console:
    process = subprocess.Popen(command, cwd=project, stdout=console, stderr=subprocess.STDOUT)
    try:
        try:
            with (output / 'running.json').open('x') as stream:
                json.dump({**intent, 'wrapperPid': process.pid}, stream, indent=2)
        except OSError as error:
            metadata_errors.append(str(error))
        print(json.dumps({'mode': mode, 'driverPid': os.getpid(), 'wrapperPid': process.pid}), flush=True)
    finally:
        code = process.wait()
validation_errors = []
test_result = None
try:
    for name, expected in sources.items():
        if reference(project / name) != expected:
            raise RuntimeError('CHECK_SOURCE_CHANGED:' + name)
    if mode in registration['groups']:
        report = json.loads((output / 'vitest.json').read_text())
        actual = {Path(row['name']).relative_to(project).as_posix() for row in report['testResults']}
        if actual != set(registration['groups'][mode]):
            raise RuntimeError('EXACT_REGISTERED_TEST_FILE_SET_CHANGED')
        assertions = [item for row in report['testResults'] for item in row['assertionResults']]
        test_result = {'files': len(actual), 'tests': len(assertions),
                       'passed': sum(item['status'] == 'passed' for item in assertions),
                       'other': sum(item['status'] != 'passed' for item in assertions),
                       'reportSuccess': report['success']}
        if code == 0 and (not report['success'] or test_result['other']):
            raise RuntimeError('ALL_REGISTERED_TESTS_MUST_PASS')
except Exception as error:
    validation_errors.append(str(error))
driver_code = code if code != 0 else (1 if metadata_errors or validation_errors else 0)
terminal = {**intent, 'wrapperPid': process.pid, 'finished': time.time(), 'wrapperExitCode': code,
            'driverExitCode': driver_code, 'state': 'terminal', 'metadataErrors': metadata_errors,
            'validationErrors': validation_errors, 'testResult': test_result, 'frozenSources': len(sources)}
try:
    with (output / 'complete.json').open('x') as stream:
        json.dump(terminal, stream, indent=2)
except OSError as error:
    metadata_errors.append(str(error))
    driver_code = 1
print(json.dumps({'mode': mode, 'driverExitCode': driver_code, 'wrapperExitCode': code,
                  'testResult': test_result, 'metadataErrors': metadata_errors,
                  'validationErrors': validation_errors, 'elapsedSeconds': time.time() - started}), flush=True)
sys.exit(driver_code)
