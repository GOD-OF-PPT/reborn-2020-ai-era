"""Read-only verification of completed P2 records; writes one fresh audit receipt."""
from pathlib import Path
from collections import Counter
import gzip
import hashlib
import json

ROOT = Path(__file__).resolve().parents[3]
TASK = Path(__file__).resolve().parent
OUTPUT = TASK / 'matrix-r2'


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_json(path):
    return json.loads(path.read_bytes())


def resolve_output(name):
    lexical = OUTPUT / name
    path = lexical.resolve(strict=True)
    require(path.is_relative_to(OUTPUT.resolve()), 'OUTPUT_PATH_ESCAPE')
    require(lexical.absolute() == path and path.is_file(), 'REGULAR_NON_SYMLINK_EVIDENCE_REQUIRED')
    return path


summary = read_json(OUTPUT / 'course-shape-results.json')
registration = read_json(OUTPUT / 'registration.json')
command = read_json(TASK / 'matrix-r2-command.json')
require(command['exitCode'] == 0, 'ACTUAL_MATRIX_PROCESS_NOT_SUCCESSFUL')
require(summary['registered'] == summary['recorded'] == summary['attempted'] == 288, 'EXACT_288_EXECUTED_REQUIRED')
require(summary['fatal'] == summary['unexecutedDueToFatal'] == 0, 'UNRESOLVED_MATRIX_ERROR')
require(summary['allExecutedSuffixBytesEqual'], 'MISSING_FULL_SUFFIX_BYTES_PROOF')
require(len(summary['prefixProofs']) == 6 and all(p['status'] == 'verified' for p in summary['prefixProofs']), 'SIX_CREATE_PROOFS_REQUIRED')
require(summary['criticalBranchesExecuted'] == 0, 'P3_SCOPE_MISREPRESENTED')
require(len(summary['results']) == len(registration['registered']) == 288, 'REGISTERED_ROW_LOSS')
require(summary['sourceHashes'] == registration['sourceHashes'] and summary['sourceInputHashes'] == registration['sourceInputHashes'], 'REGISTERED_FREEZE_CHANGED')
expected_identities = {background + '-' + seed for background in ['technical_employee', 'content_employee'] for seed in ['t16-campaign-0', 't16-campaign-1', 't16-campaign-2']}
expected_shapes = {'--'.join([product, topic, edition, support]) for product in ['intro_recorded', 'practical_cohort', 'enterprise_training'] for topic in ['image_workflows', 'video_workflows'] for edition in ['foundation', 'advanced'] for support in ['self_small', 'guided_group', 'assisted_group', 'delegated_group']}
prefix_rows = read_json(ROOT / 'goal-1/evidence/t17-acceptance-05/prefix-r1/course-prefix-results.json')['results']
prefix_ids = {row['name']: {'courses': {course['id'] for course in row['publicCourse']['courses']}, 'cohorts': {cohort['id'] for cohort in row['publicCourse']['cohorts']}} for row in prefix_rows}

gzip_proofs = {}
record_hashes = {}
statuses = Counter()
refusals = Counter()
identity_counts = Counter()
shape_outcomes = {}
pairs = set()
milestone_count = accepted_commands = rejected_commands = 0


def check_gzip_tree(value):
    if isinstance(value, dict):
        if value.get('encoding') == 'gzip' and 'uncompressedSha256' in value:
            name = value['file']
            if name not in gzip_proofs:
                stored = resolve_output(name).read_bytes()
                raw = gzip.decompress(stored)
                require(len(stored) == value['storedBytes'] and digest(stored) == value['storedSha256'], 'GZIP_STORAGE_BYTES_CHANGED:' + name)
                require(len(raw) == value['uncompressedBytes'] and digest(raw) == value['uncompressedSha256'], 'COMPLETE_ORIGINAL_BYTES_CHANGED:' + name)
                require(value['losslessReadbackEqual'] is True, 'MISSING_INITIAL_GZIP_READBACK:' + name)
                gzip_proofs[name] = value
            else:
                require(gzip_proofs[name] == value, 'CONTRADICTORY_GZIP_DESCRIPTOR:' + name)
        for child in value.values():
            check_gzip_tree(child)
    elif isinstance(value, list):
        for child in value:
            check_gzip_tree(child)


for original, row in zip(registration['registered'], summary['results'], strict=True):
    require(row['identity'] == original['identity'] and row['shape'] == original['shape'], 'ORIGINAL_FIXED_ROW_CHANGED')
    descriptor = row['evidence']
    require(descriptor is not None, 'ACTUAL_BRANCH_EVIDENCE_MISSING')
    data = resolve_output(descriptor['file']).read_bytes()
    require(len(data) == descriptor['bytes'] and digest(data) == descriptor['sha256'], 'BRANCH_RECORD_BYTES_CHANGED')
    record_hashes[descriptor['file']] = digest(data)
    record = json.loads(data)
    require(record['status'] == row['status'] and record['shape'] == row['shape'] and record['identity'] == row['identity'], 'BRANCH_RECORD_IDENTITY_CHANGED')
    shape_id = '--'.join(row['shape'][key] for key in ['productId', 'topicId', 'edition', 'supportMode'])
    require(shape_id == row['shape']['id'] and shape_id in expected_shapes and row['identity'] in expected_identities, 'FIXED_PARAMETERS_CHANGED')
    require(record['backgroundId'] + '-' + record['seed'] == row['identity'], 'FIXED_BACKGROUND_OR_SEED_CHANGED')
    pair = (row['identity'], shape_id)
    require(pair not in pairs, 'DUPLICATE_IDENTITY_SHAPE_PAIR')
    pairs.add(pair)
    require(record['suffixReplayBytesEqual'] and record['rejectedReplayEqual'] and record['prefixUnchanged'], 'INCOMPLETE_INDEPENDENT_COMMAND_PROOF')
    require(record['earnedPrefix']['fromCreateVerified'] and record['origin'] == 'normal', 'EARNED_NORMAL_PREFIX_REQUIRED')
    require(len(record['suffixCommands']) == row['suffixCommands'], 'SUFFIX_COUNT_CHANGED')
    actual_rejected = sum(attempt['status'] == 'rejected' for attempt in record['actualAttempts'])
    require(row['actualRejectedCommands'] == record['actualRejectedCommands'] == record['rejectedReplayCount'] == actual_rejected, 'REJECTED_ATTEMPT_COUNT_CHANGED')
    require(sum(attempt['status'] in ['committed', 'committed_with_exception'] for attempt in record['actualAttempts']) == row['suffixCommands'], 'ACCEPTED_ATTEMPT_COUNT_CHANGED')
    new_courses = [course for course in record['publicCourse']['courses'] if course['id'] not in prefix_ids[row['identity']]['courses']]
    new_cohorts = [cohort for cohort in record['publicCourse']['cohorts'] if cohort['id'] not in prefix_ids[row['identity']]['cohorts']]
    actual_closed = (len(new_courses) == len(new_cohorts) == 1
                     and all(new_courses[0][key] == row['shape'][key] for key in ['productId', 'topicId', 'edition'])
                     and new_cohorts[0]['courseId'] == new_courses[0]['id']
                     and new_cohorts[0]['closedAt'] is not None
                     and all(stage['deliveredAt'] is not None for stage in new_cohorts[0]['stages'])
                     and any(not slot['recovery'] and slot['mode'] == row['shape']['supportMode'] and slot['job'] is not None and slot['job']['status'] == 'completed' for slot in new_cohorts[0]['supportJobs']))
    helped_retained = sum(student['paidRemainingFen'] > 0 and student['outcome'] == 'helped' and student['refundedFen'] == 0 for cohort in new_cohorts for student in cohort['students'])
    require(actual_closed == record['actualClosedShape'] == row['actualClosedShape'], 'ACTUAL_CLOSED_SHAPE_FLAG_CHANGED')
    require(helped_retained == record['helpedRetainedStudents'] == row['helpedRetainedStudents'], 'ACTUAL_RETAINED_LEARNERS_CHANGED')
    statuses[row['status']] += 1
    identity_counts[row['identity']] += 1
    shape_outcomes.setdefault(row['shape']['id'], []).append(row)
    accepted_commands += row['suffixCommands']
    rejected_commands += row['actualRejectedCommands']
    if row['status'] == 'policy_refused':
        require(record['policyRefusal'] is not None, 'MISSING_ORIGINAL_POLICY_REFUSAL')
        refusals[record['policyRefusal']['code']] += 1
    else:
        require(row['status'] == 'completed' and row['actualClosedShape'], 'COMPLETED_WITHOUT_ACTUAL_CLOSE')
    for milestone in record['milestones']:
        require(milestone['independentMoneyStatus'] == 'passed' and milestone['independentMoneyError'] is None, 'UNPASSED_MONEY_MILESTONE')
        require(all(p['independentChecks']['allFinancialIdentitiesPassed'] for p in milestone['moneyEvidence']), 'FINANCIAL_PROOF_FAILED')
        require(all(p['allCashIdentitiesPassed'] for p in milestone['cashEvidence']), 'CASH_PROOF_FAILED')
        milestone_count += 1
    check_gzip_tree(record)

require(len(identity_counts) == 6 and set(identity_counts.values()) == {48}, 'IDENTITY_OR_SHAPE_SCOPE_REDUCED')
require(len(shape_outcomes) == 48 and all(len(rows) == 6 for rows in shape_outcomes.values()), 'ORIGINAL_48_SHAPES_REDUCED')
require(pairs == {(identity, shape) for identity in expected_identities for shape in expected_shapes}, 'ORIGINAL_CARTESIAN_SCOPE_REDUCED')
require(statuses['completed'] == summary['completed'] and statuses['policy_refused'] == summary['policyRefused'], 'STATUS_TOTALS_CHANGED')
all_closed = all(any(row['status'] == 'completed' and row['actualClosedShape'] for row in rows) for rows in shape_outcomes.values())
all_helped = all(any(row['status'] == 'completed' and row['actualClosedShape'] and row['helpedRetainedStudents'] > 0 for row in rows) for rows in shape_outcomes.values())
require(all_closed == summary['all48HaveActualClosedShape'] and all_helped == summary['all48HaveRetainedHelpedLearner'], 'ALL_48_COVERAGE_CHANGED')
require(accepted_commands == summary['actualAcceptedSuffixCommands'] and rejected_commands == summary['actualRejectedCommands'], 'COMMAND_TOTALS_CHANGED')
for identity in identity_counts:
    proof = read_json(OUTPUT / identity / 'prefix-create-replay.json')
    require(proof['status'] == 'verified' and proof['fullCreateAndEveryP1MilestoneBytesEqual'], 'PREFIX_CREATE_PROOF_MISSING')
    check_gzip_tree(proof)
actual_gzip_files = {path.relative_to(OUTPUT).as_posix() for path in OUTPUT.rglob('*.json.gz')}
require(actual_gzip_files == set(gzip_proofs), 'UNINDEXED_OR_MISSING_COMPLETE_RAW_FILES')
for file, expected in (summary['sourceHashes'] | summary['sourceInputHashes']).items():
    require(digest((ROOT / file).read_bytes()) == expected, 'FROZEN_SOURCE_OR_P1_INPUT_CHANGED:' + file)

old = read_json(TASK / 'matrix-r1' / 'registration.json')
old_source_bindings = {}
for file, expected in old['sourceHashes'].items():
    actual = ROOT / file
    if file == 'scripts/collect_course_shape_evidence.ts':
        actual = TASK / 'tool-history' / 'collect-course-shape-r1.ts'
    require(digest(actual.read_bytes()) == expected, 'FAILED_R1_SOURCE_VERSION_NOT_PRESERVED:' + file)
    old_source_bindings[file] = str(actual.relative_to(ROOT))

require(digest((ROOT / 'goal-1/input.md').read_bytes()) == '20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1', 'ORIGINAL_GOAL_INPUT_CHANGED')
report = {
    'scope': 'Independent readback of actual R2 P2 records and full original gzip bytes; no new engine commands, browser or compatibility tests.',
    'auditorSha256': digest(Path(__file__).read_bytes()),
    'registeredAndExecuted': 288, 'statuses': dict(statuses), 'policyReasons': dict(refusals),
    'identityCounts': dict(identity_counts), 'shapes': 48, 'actualAcceptedSuffixCommands': accepted_commands,
    'actualRejectedCommands': rejected_commands, 'actualMilestones': milestone_count,
    'gzipArtifactsReadBack': len(gzip_proofs),
    'storedGzipBytes': sum(p['storedBytes'] for p in gzip_proofs.values()),
    'completeOriginalBytesReadBack': sum(p['uncompressedBytes'] for p in gzip_proofs.values()),
    'allOriginalBytesAndRecordHashesEqual': True, 'branchRecordHashes': record_hashes,
    'all48HaveActualClosedShape': all_closed,
    'all48HaveRetainedHelpedLearner': all_helped,
    'failedR1SourceBindings': old_source_bindings,
    'criticalBranchesExecuted': 0, 'whole5bT17GoalComplete': False,
}
with (TASK / 'audit-r2-results.json').open('x') as target:
    json.dump(report, target, ensure_ascii=False, indent=2)
    target.write('\n')
print(json.dumps({key: value for key, value in report.items() if key not in ['branchRecordHashes', 'failedR1SourceBindings']}, ensure_ascii=False))
