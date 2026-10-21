from pathlib import Path
import json
import os
import subprocess
import sys
import time

task = Path(__file__).absolute().parent
project = task.parents[2]
if Path.cwd().resolve() != project.resolve():
    raise RuntimeError('PROJECT_CWD_REQUIRED')
for parent in (task, *task.parents):
    if parent.is_symlink() or os.path.lexists(parent / 'sealed-evidence.json'):
        raise RuntimeError('SEALED_OR_LINKED_PARENT')
    if parent == project:
        break
output = task / 'current-chrome-audit-r1'
if os.path.lexists(output):
    raise RuntimeError('FRESH_AUDIT_REQUIRED')
command = ['rtk', 'proxy', 'node', '--experimental-strip-types', '--experimental-transform-types',
           'scripts/verify_normal_browser_exports.ts', '--output-dir', str(output.relative_to(project))]
environment = {**os.environ, 'NATIVE_EXPORT_INPUT_DIRECTORY': str(task.relative_to(project))}
started = time.time()
with (task / 'browser-audit-intent-r1.json').open('x') as stream:
    json.dump({'command': command, 'input': environment['NATIVE_EXPORT_INPUT_DIRECTORY'],
               'started': started, 'driverPid': os.getpid()}, stream, indent=2)
with (task / 'browser-audit-console-r1.txt').open('x') as console:
    process = subprocess.Popen(command, cwd=project, env=environment, stdout=console, stderr=subprocess.STDOUT)
    print(json.dumps({'driverPid': os.getpid(), 'wrapperPid': process.pid}), flush=True)
    code = process.wait()
report_path = output / 'normal-browser-export-audit.json'
errors = []
result = None
if code == 0:
    try:
        report = json.loads(report_path.read_text())
        result = {key: report[key] for key in ('creations', 'executedUniqueCommands', 'files', 'inputBuffers', 'allByteEqual')}
        if report['allByteEqual'] is not True:
            raise RuntimeError('BYTE_AUDIT_NOT_PASSED')
    except Exception as error:
        errors.append(str(error))
driver_code = code if code else int(bool(errors))
with (task / 'browser-audit-complete-r1.json').open('x') as stream:
    json.dump({'wrapperExitCode': code, 'driverExitCode': driver_code, 'validationErrors': errors,
               'elapsedSeconds': time.time() - started, 'result': result}, stream, indent=2)
print(json.dumps({'exit': driver_code, 'result': result, 'errors': errors}), flush=True)
sys.exit(driver_code)
