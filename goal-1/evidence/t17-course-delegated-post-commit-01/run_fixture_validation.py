#!/usr/bin/env python3
"""Small serial fixtures only; never stage or commit the real project."""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import stat
import subprocess
import tempfile
import time
import traceback

post = Path(__file__).absolute().parent
real_repo = post.parents[2]
verifier = post / 'verify_task_bytes.py'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--label', required=True)
parser.add_argument('--expected-sha256', required=True)
args = parser.parse_args()
assert re.fullmatch(r'[a-z0-9][a-z0-9-]*', args.label)
assert re.fullmatch(r'[a-f0-9]{64}', args.expected_sha256)
result_path = post / ('fixture-results-' + args.label + '.json')
assert not os.path.lexists(result_path)
for ancestor in (post, *post.parents):
    assert ancestor.is_dir() and not ancestor.is_symlink()
    assert not os.path.lexists(ancestor / 'sealed-evidence.json')

environment = {key: value for key, value in os.environ.items() if not key.startswith('GIT_')}
environment.update({'GIT_CONFIG_NOSYSTEM': '1', 'GIT_CONFIG_GLOBAL': os.devnull,
                    'GIT_TERMINAL_PROMPT': '0', 'GIT_OPTIONAL_LOCKS': '0',
                    'GIT_ATTR_NOSYSTEM': '1', 'GIT_NO_REPLACE_OBJECTS': '1', 'GIT_PAGER': 'cat'})


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def current_identity():
    command = ['rtk', 'proxy', 'git', '--no-optional-locks', '-c',
               'core.fsmonitor=false', '-C', str(real_repo)]
    head = subprocess.check_output(command + ['rev-parse', 'HEAD'], env=environment).decode().strip()
    name = subprocess.check_output(command + ['rev-parse', '--git-path', 'index'], env=environment).decode().strip()
    index = Path(name) if Path(name).is_absolute() else real_repo / name
    value = index.lstat()
    assert stat.S_ISREG(value.st_mode)
    return {'head': head, 'indexBytes': value.st_size, 'indexSha256': sha(index.read_bytes()),
            'indexMtimeNs': value.st_mtime_ns, 'indexCtimeNs': value.st_ctime_ns}


real_before = current_identity()
source_before = verifier.read_bytes()
assert sha(source_before) == args.expected_sha256
scratch = Path(tempfile.mkdtemp(prefix='course-byte-fixture-', dir='/private/tmp'))
repo = scratch / 'repository'
repo.mkdir()
empty = scratch / 'empty-template-and-hooks'
empty.mkdir()
attributes_file = scratch / 'empty-attributes'
attributes_file.write_bytes(b'')
commands, cases = [], []
fatal = None
peaks = {'logicalBytes': 0, 'allocatedBytes': 0}


def footprint():
    logical = allocated = 0
    for directory, dirs, files in os.walk(scratch, followlinks=False):
        for name in dirs + files:
            value = (Path(directory) / name).lstat()
            if stat.S_ISREG(value.st_mode) or stat.S_ISLNK(value.st_mode):
                logical += value.st_size
                allocated += value.st_blocks * 512
    peaks['logicalBytes'] = max(peaks['logicalBytes'], logical)
    peaks['allocatedBytes'] = max(peaks['allocatedBytes'], allocated)
    assert logical < 1024 * 1024 and allocated < 1024 * 1024
    return {'logicalBytes': logical, 'allocatedBytes': allocated}


def fixture_git(*arguments, raw=None):
    assert repo.is_relative_to(scratch) and repo != real_repo
    command = ['rtk', 'proxy', 'git', '--no-optional-locks', '-c', 'core.fsmonitor=false',
               '-c', 'protocol.allow=never', '-c', 'commit.gpgsign=false', '-c', 'tag.gpgsign=false',
               '-c', 'core.hooksPath=' + str(empty), '-C', str(repo), *arguments]
    completed = subprocess.run(command, input=raw, stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE, env=environment, timeout=30)
    commands.append({'command': command, 'inputUtf8': None if raw is None else raw.decode('utf8'),
                     'exitCode': completed.returncode, 'stdout': completed.stdout.decode('utf8', errors='replace'),
                     'stderr': completed.stderr.decode('utf8', errors='replace')})
    assert completed.returncode == 0, commands[-1]
    footprint()
    return completed.stdout


manifest_path = scratch / 'manifest.json'


def run_case(name, *, mode='staged', commit=None, error=None, tool=verifier,
             report=None, manifest_file=manifest_path, trees=('evidence',), expect_report=True):
    output = report or post / ('fixture-' + name + '-' + args.label + '.json')
    assert not os.path.lexists(output)
    command = ['rtk', 'proxy', 'python3', '-B', str(tool), '--repo-root', str(repo),
               '--manifest', str(manifest_file), '--mode', mode, '--output-report', str(output)]
    for tree in trees:
        command += ['--tree-root', tree]
    if commit:
        command += ['--commit', commit]
    started = time.monotonic()
    completed = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               env=environment, timeout=45)
    raw = output.read_bytes() if output.exists() else None
    parsed = json.loads(raw) if raw is not None else None
    expected_code = 0 if error is None else 1
    observed_error = '' if parsed is None else str(parsed.get('error'))
    matched = completed.returncode == expected_code and (parsed is not None) == expect_report
    if error is None:
        matched = (matched and parsed['passed'] is True and parsed['expectedEntries'] == 4 and
                   parsed['checkedEntries'] == 4 and parsed['headAndIndexUnchanged'] is True)
    else:
        matched = (matched and (parsed is None or parsed['passed'] is False) and
                   error in (observed_error + completed.stderr.decode('utf8', errors='replace')))
    cases.append({'name': name, 'command': command, 'expectedExitCode': expected_code,
                  'expectedError': error, 'actualExitCode': completed.returncode,
                  'stdout': completed.stdout.decode('utf8', errors='replace'),
                  'stderr': completed.stderr.decode('utf8', errors='replace'),
                  'report': None if raw is None else {'file': str(output), 'bytes': len(raw), 'sha256': sha(raw)},
                  'reportPassed': None if parsed is None else parsed['passed'], 'error': observed_error,
                  'expectationMatched': bool(matched), 'wallSeconds': time.monotonic() - started,
                  'fixtureFootprint': footprint()})


try:
    fixture_git('init', '--object-format=sha1', '--template=' + str(empty))
    for key, value in [('user.name', 'Task Byte Fixture'), ('user.email', 'task-byte-fixture@example.invalid'),
                       ('core.hooksPath', str(empty)), ('core.attributesFile', str(attributes_file)),
                       ('core.autocrlf', 'false'), ('commit.gpgsign', 'false'),
                       ('tag.gpgsign', 'false'), ('protocol.allow', 'never')]:
        fixture_git('config', '--local', key, value)
    fixture_git('commit', '--allow-empty', '--no-gpg-sign', '-m', 'Self-owned fixture baseline')
    note, file_link, dir_link = 'evidence/data/note.txt', 'evidence/file-link', 'evidence/dir-link'
    payload = '原始字节\r\nfixture-only\n'.encode('utf8')
    run_raw = b'#!/bin/sh\nexit 0\n'
    (repo / 'evidence/data').mkdir(parents=True)
    (repo / note).write_bytes(payload)
    (repo / 'run.sh').write_bytes(run_raw)
    (repo / 'run.sh').chmod(0o755)
    (repo / file_link).symlink_to('data/note.txt')
    (repo / dir_link).symlink_to('data', target_is_directory=True)

    def entry(raw, **extra):
        return {'bytes': len(raw), 'sha256': sha(raw), **extra}

    manifest = {'files': {note: entry(payload, gitMode='100644'), 'run.sh': entry(run_raw, gitMode='100755')},
                'symlinks': {file_link: entry(b'data/note.txt', target='data/note.txt', gitMode='120000'),
                             dir_link: entry(b'data', target='data', gitMode='120000')}}
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    fixture_git('add', '--', note, 'run.sh', file_link, dir_link)
    run_case('staged-positive')
    (repo / note).write_bytes(b'X' + payload[1:])
    run_case('wrong-content', error='GIT_DISK_BYTES_MISMATCH')
    (repo / note).write_bytes(payload)
    (repo / file_link).unlink()
    (repo / file_link).symlink_to('data/missing.txt')
    run_case('wrong-link', error='DISK_LINK_TARGET_MISMATCH')
    (repo / file_link).unlink()
    (repo / file_link).symlink_to('data/note.txt')
    link_oid = fixture_git('ls-files', '--stage', '--', file_link).split()[1].decode()
    fixture_git('update-index', '--cacheinfo', '100644', link_oid, file_link)
    run_case('wrong-git-link-mode', error='GIT_MODE_MISMATCH')
    fixture_git('update-index', '--cacheinfo', '120000', link_oid, file_link)
    fixture_git('update-index', '--force-remove', note)
    run_case('missing-index-entry', error='TASK_CHANGE_SET_MISMATCH')
    fixture_git('add', '--', note)
    (repo / 'extra.txt').write_bytes(b'extra\n')
    fixture_git('add', '--', 'extra.txt')
    run_case('extra-index-entry', error='TASK_CHANGE_SET_MISMATCH')
    fixture_git('update-index', '--force-remove', 'extra.txt')
    (repo / 'extra.txt').unlink()
    note_oid = fixture_git('ls-files', '--stage', '--', note).split()[1].decode()
    raw = ('0 ' + '0' * 40 + '\t' + note + '\n100644 ' + note_oid + ' 1\t' + note +
           '\n100644 ' + note_oid + ' 2\t' + note + '\n').encode()
    fixture_git('update-index', '--index-info', raw=raw)
    run_case('unmerged-stage', error='UNMERGED_INDEX_STAGE')
    fixture_git('update-index', '--cacheinfo', '100644', note_oid, note)
    (repo / 'evidence/untracked.txt').write_bytes(b'unlisted\n')
    run_case('untracked-tree-entry', error='COMPLETE_TREE_SET_MISMATCH')
    (repo / 'evidence/untracked.txt').unlink()
    copy_post = repo / 'goal-1/evidence/t17-course-delegated-post-commit-01'
    copy_post.mkdir(parents=True)
    copied_tool = copy_post / 'verify_task_bytes.py'
    copied_tool.write_bytes(source_before)
    overlap = copy_post / 'must-not-be-created.json'
    overlap_name = overlap.relative_to(repo).as_posix()
    empty_oid = fixture_git('hash-object', '-w', '--stdin', raw=b'').decode().strip()
    fixture_git('update-index', '--add', '--cacheinfo', '100644', empty_oid, overlap_name)
    overlap_manifest = json.loads(json.dumps(manifest))
    overlap_manifest['files'][overlap_name] = entry(b'', gitMode='100644')
    overlap_input = scratch / 'manifest-output-overlap.json'
    overlap_input.write_text(json.dumps(overlap_manifest) + '\n')
    run_case('report-input-overlap', error='REPORT_MUST_NOT_BE_A_MANIFEST_INPUT', tool=copied_tool,
             report=overlap, manifest_file=overlap_input, trees=(), expect_report=False)
    assert not os.path.lexists(overlap)
    fixture_git('update-index', '--force-remove', overlap_name)
    fixture_git('commit', '--no-gpg-sign', '-m', 'Self-owned typed task fixture')
    revision = fixture_git('rev-parse', 'HEAD').decode().strip()
    run_case('commit-positive', mode='commit', commit=revision)
except BaseException:
    fatal = traceback.format_exc()

real_after = current_identity()
result = {'scope': 'Fresh self-owned /private/tmp Git repository only; no real project staged/commit verification, COW, UI, compatibility or marker creation',
          'realRepositoryVerificationInvoked': False, 'actualProjectBefore': real_before,
          'actualProjectAfter': real_after, 'actualProjectHeadAndIndexUnchanged': real_before == real_after,
          'temporaryFixture': str(scratch), 'fixtureFootprint': footprint(), 'peakFixtureFootprint': peaks,
          'fixtureLimitBytes': 1024 * 1024, 'verifierSha256': sha(source_before),
          'verifierUnchanged': verifier.read_bytes() == source_before,
          'cases': cases, 'fixtureGitCommands': commands, 'fatal': fatal,
          'allExpectedOutcomes': fatal is None and len(cases) == 10 and all(case['expectationMatched'] for case in cases)
              and real_before == real_after and verifier.read_bytes() == source_before,
          'notExecuted': ['Real project staged or committed byte verification',
                          'Real project Git add/commit/push or seal', 'Any source/root08 modification',
                          'UI/compatibility/game/COW execution']}
with result_path.open('x', encoding='utf8') as output:
    json.dump(result, output, ensure_ascii=False, indent=2)
    output.write('\n')
print(json.dumps({key: result[key] for key in ('allExpectedOutcomes', 'actualProjectHeadAndIndexUnchanged',
      'verifierUnchanged', 'temporaryFixture', 'peakFixtureFootprint', 'fatal')}, ensure_ascii=False))
print(json.dumps({'cases': [{key: case[key] for key in ('name', 'actualExitCode', 'expectationMatched', 'error')}
                           for case in cases], 'rawResult': str(result_path)}, ensure_ascii=False))
raise SystemExit(0 if result['allExpectedOutcomes'] else 1)
