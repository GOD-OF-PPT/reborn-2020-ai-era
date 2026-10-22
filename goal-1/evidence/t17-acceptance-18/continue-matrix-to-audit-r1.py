"""Continue this single live P2 collector into its already planned full audit."""
from pathlib import Path
import datetime
import hashlib
import json
import os
import shlex
import stat
import subprocess
import time

PROJECT = Path.cwd()
TASK = PROJECT / 'goal-1/evidence/t17-acceptance-18'
CONTROL = TASK / 'sequential-audit-r1-execution'
COLLECTOR = TASK / 'matrix-r1-execution'
MATRIX = TASK / 'matrix-r1'
AUDIT = TASK / 'audit-r1'
HELPER = TASK / 'matrix-r1-readback-and-seal.mjs'
FREEZE = TASK / 'freeze-r1.json'
FREEZE_SHA = 'e70b059a5fd466f627e387a755e8960823b3fd5eba513bb5f18ae02a25517aa9'
COLLECTOR_ARGV = ['rtk', 'proxy', 'node', '--max-old-space-size=1536',
                  '--experimental-strip-types', 'scripts/collect_relay_shape_evidence.ts',
                  '--output-dir', 'goal-1/evidence/t17-acceptance-18/matrix-r1']


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def sha(data):
    return hashlib.sha256(data).hexdigest()


def parent_guard(path):
    if not path.is_relative_to(TASK):
        raise RuntimeError('FIXED_CURRENT_TASK_CONTROL_REQUIRED')
    for directory in [path.parent, *path.parent.parents]:
        info = directory.lstat()
        if not stat.S_ISDIR(info.st_mode):
            raise RuntimeError('CONTROL_DIRECTORY_LINK_OR_NON_DIRECTORY')
        if os.path.lexists(directory / 'sealed-evidence.json'):
            raise RuntimeError('CONTROL_ANCESTOR_SEALED')
        if directory == PROJECT / 'goal-1/evidence':
            return
    raise RuntimeError('CONTROL_EVIDENCE_ROOT_REQUIRED')


def record(path, value):
    parent_guard(path)
    with path.open('x') as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2)
        stream.write('\n')


def read_json(path):
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode):
        raise RuntimeError('REGULAR_CONTROL_INPUT_REQUIRED:' + str(path))
    return json.loads(path.read_text())


def guard_frozen():
    if sha(FREEZE.read_bytes()) != FREEZE_SHA:
        raise RuntimeError('FIXED_FORMAL_FREEZE_CHANGED')
    frozen = read_json(FREEZE)
    for name, expected in {**frozen['sourceHashes'], **frozen['inputHashes']}.items():
        if sha((PROJECT / name).read_bytes()) != expected:
            raise RuntimeError('FORMAL_SOURCE_OR_INPUT_DRIFT:' + name)
    return frozen


def observe_collector():
    result = subprocess.run(['rtk', 'proxy', 'ps', '-o', 'pid=,ppid=,command=',
                             '-p', '5741,5742,5743'], capture_output=True, text=True)
    if result.returncode not in [0, 1]:
        raise RuntimeError('COLLECTOR_PROCESS_OBSERVATION_FAILED:' + str(result.returncode))
    found = {}
    for line in result.stdout.splitlines():
        fields = line.strip().split(None, 2)
        if len(fields) != 3:
            raise RuntimeError('COLLECTOR_PROCESS_OBSERVATION_MALFORMED')
        pid, parent, command = int(fields[0]), int(fields[1]), shlex.split(fields[2])
        if pid == 5741:
            valid = Path(command[0]).name in ['Python', 'python3', 'python3.13'] and command[1:] == ['-']
        elif pid == 5742:
            valid = parent == 5741 and Path(command[0]).name == 'rtk' and command[1:] == COLLECTOR_ARGV[1:]
        elif pid == 5743:
            valid = parent == 5742 and Path(command[0]).name == 'node' and command[1:] == COLLECTOR_ARGV[3:]
        else:
            valid = False
        if not valid:
            raise RuntimeError('COLLECTOR_PID_COMMAND_OR_PARENT_CHANGED:' + str(pid))
        found[pid] = {'pid': pid, 'ppid': parent, 'argv': command}
    return found


parent_guard(CONTROL)
CONTROL.mkdir()
progress_path = CONTROL / 'progress.jsonl'
parent_guard(progress_path)
progress = progress_path.open('x')
progress_identity = os.fstat(progress.fileno())
started_at, started_clock = now(), time.monotonic()
phases = []
helper_sha = sha(HELPER.read_bytes())


def event(value):
    parent_guard(progress_path)
    current = progress_path.lstat()
    if (current.st_dev, current.st_ino) != (progress_identity.st_dev, progress_identity.st_ino):
        raise RuntimeError('OWNED_CONTINUATION_JOURNAL_CHANGED')
    value = {'at': now(), **value}
    progress.write(json.dumps(value, ensure_ascii=False) + '\n')
    progress.flush()
    print(json.dumps(value, ensure_ascii=False), flush=True)


def run_phase(name, argv, folder, env=None):
    guard_frozen()
    parent_guard(folder)
    folder.mkdir()
    event({'phase': name, 'status': 'starting', 'argv': argv})
    phase_start, clock_start = now(), time.monotonic()
    parent_guard(folder / 'stdout.txt')
    with (folder / 'stdout.txt').open('xb') as out, (folder / 'stderr.txt').open('xb') as err:
        child = subprocess.Popen(argv, cwd=PROJECT, env=env, stdout=out, stderr=err)
        running = {'phase': name, 'argv': argv, 'driverPid': os.getpid(), 'rtkPid': child.pid,
                   'startedAt': phase_start, 'freezeSha256': FREEZE_SHA}
        metadata_errors = []
        try:
            print(json.dumps({'phase': name, 'actualStartedRtkPid': child.pid, 'argv': argv}), flush=True)
            record(folder / 'running.json', running)
            event({'phase': name, 'status': 'running', 'rtkPid': child.pid})
        except Exception as caught:
            metadata_errors.append(repr(caught))
            print(json.dumps({'phase': name, 'rtkPid': child.pid,
                              'metadataError': repr(caught), 'action': 'wait-existing-child-no-next-phase'}), flush=True)
        finally:
            code = child.wait()
    result = {**running, 'exitCode': code, 'endedAt': now(),
              'wallSeconds': time.monotonic() - clock_start, 'metadataErrors': metadata_errors}
    try:
        record(folder / 'terminal.json', result)
    except Exception as caught:
        metadata_errors.append(repr(caught))
        print(json.dumps({'phase': name, 'actualTerminal': result,
                          'terminalRecordError': repr(caught)}), flush=True)
    phases.append(result)
    event({'phase': name, 'status': 'terminal', 'exitCode': code})
    if code != 0 or metadata_errors:
        raise RuntimeError('CONTINUATION_PHASE_FAILED_OR_METADATA_INCOMPLETE:' + name + ':' + str(code))


exit_code, error = 1, None
try:
    guard_frozen()
    running = read_json(COLLECTOR / 'running.json')
    if running['argv'] != COLLECTOR_ARGV or running['driverPid'] != 5741 or running['rtkPid'] != 5742 or running['freezeSha256'] != FREEZE_SHA:
        raise RuntimeError('ORIGINAL_LIVE_COLLECTOR_IDENTITY_CHANGED')
    binding = observe_collector()
    if len(binding) != 3 and not (COLLECTOR / 'terminal.json').exists():
        raise RuntimeError('ORIGINAL_LIVE_COLLECTOR_CHAIN_NOT_PRESENT_AT_START')
    record(CONTROL / 'running.json', {'driverPid': os.getpid(), 'startedAt': started_at,
           'collectorDriverPid': 5741, 'collectorRtkPid': 5742, 'collectorNodePid': 5743,
           'freezeSha256': FREEZE_SHA, 'helperSha256': helper_sha, 'actualCollectorBinding': binding,
           'scope': 'One current collector -> physical readback/seal -> full independent audit. No retry, new task, scheduling or goal completion.'})
    event({'phase': 'wait-original-collector', 'status': 'waiting', 'driverPid': 5741})
    gone_since = None
    last_identity_check = 0
    while not (COLLECTOR / 'terminal.json').exists():
        if time.monotonic() - last_identity_check >= 30:
            last_identity_check = time.monotonic()
            current_binding = observe_collector()
            if len(current_binding) == 3:
                gone_since = None
            else:
                gone_since = gone_since or time.monotonic()
                if time.monotonic() - gone_since > 30:
                    raise RuntimeError('ORIGINAL_COLLECTOR_CHAIN_GONE_WITHOUT_TERMINAL_NO_RESTART')
        time.sleep(5)
    terminal = None
    for retry in range(10):
        try:
            terminal = read_json(COLLECTOR / 'terminal.json')
            break
        except json.JSONDecodeError:
            time.sleep(1)
    if terminal is None or any(terminal.get(k) != running[k] for k in ['argv', 'driverPid', 'rtkPid', 'freezeSha256']) or terminal.get('exitCode') != 0:
        raise RuntimeError('COLLECTOR_NOT_SUCCESSFUL_NO_SEAL_OR_AUDIT')
    event({'phase': 'wait-original-collector', 'status': 'terminal', 'exitCode': 0})
    if sha(HELPER.read_bytes()) != helper_sha:
        raise RuntimeError('FIXED_READBACK_HELPER_CHANGED')
    run_phase('matrix-readback-and-seal', ['rtk', 'proxy', 'node', str(HELPER.relative_to(PROJECT))], CONTROL / 'readback')
    if not (MATRIX / 'sealed-evidence.json').is_file() or AUDIT.exists():
        raise RuntimeError('SEALED_MATRIX_AND_FRESH_AUDIT_REQUIRED')
    audit_argv = ['rtk', 'proxy', 'node', '--max-old-space-size=1536', '--experimental-strip-types',
                  'scripts/verify_relay_shape_evidence.ts', '--output-dir', 'goal-1/evidence/t17-acceptance-18/audit-r1']
    audit_env = {**os.environ, 'RELAY_SHAPE_INPUT_DIRECTORY': 'goal-1/evidence/t17-acceptance-18/matrix-r1'}
    run_phase('full-independent-audit', audit_argv, TASK / 'audit-r1-execution', audit_env)
    report = read_json(AUDIT / 'relay-shape-audit.json')
    frozen = guard_frozen()
    if report.get('allRowsIndependentlyVerified') is not True or report.get('registered') != 288 or report.get('audited') != 288 or report.get('invalidOrUnproven') != 0:
        raise RuntimeError('FULL_INDEPENDENT_AUDIT_REPORT_NOT_VERIFIED')
    if report['sourceHashes'] != frozen['sourceHashes'] or report['inputHashes'] != frozen['inputHashes']:
        raise RuntimeError('FINAL_INDEPENDENT_AUDIT_BINDING_CHANGED')
    exit_code = 0
    event({'phase': 'pipeline', 'status': 'finished-replay-verified-final-review-still-pending'})
except Exception as caught:
    error = repr(caught)
    try:
        event({'phase': 'pipeline', 'status': 'stopped-no-automatic-retry', 'error': error})
    except Exception as log_error:
        print(json.dumps({'error': error, 'journalError': repr(log_error)}), flush=True)
finally:
    terminal = {'driverPid': os.getpid(), 'startedAt': started_at,
                'endedAt': now(), 'wallSeconds': time.monotonic() - started_clock,
                'exitCode': exit_code, 'error': error, 'phases': phases,
                'scope': 'Execution pipeline only; final review, Git delivery, parent tasks and entire goal are not complete.'}
    try:
        record(CONTROL / 'terminal.json', terminal)
    except Exception as terminal_error:
        exit_code = 1
        print(json.dumps({'actualTerminal': terminal, 'terminalRecordError': repr(terminal_error)}), flush=True)
    progress.close()
raise SystemExit(exit_code)
