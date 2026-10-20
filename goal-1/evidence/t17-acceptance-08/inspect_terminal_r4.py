"""Read back the completed independent audit; no game or compatibility execution."""
from pathlib import Path
import hashlib
import json
import os
import stat

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parents[2]


def digest(path):
    assert stat.S_ISREG(path.lstat().st_mode), str(path)
    h = hashlib.sha256()
    size = 0
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1048576), b''):
            size += len(block)
            h.update(block)
    return {'bytes': size, 'sha256': h.hexdigest()}


def read(name):
    return json.loads((ROOT / name).read_text())


def leaves(folder):
    found = set()
    for directory, dirs, files in os.walk(folder, followlinks=False):
        for name in dirs + files:
            p = Path(directory) / name
            assert not p.is_symlink(), str(p)
            if p.is_file():
                found.add(p.relative_to(folder).as_posix())
            else:
                assert p.is_dir(), str(p)
    return found


terminal = read('audit-r4-complete.json')
assert terminal['state'] == 'terminal' and terminal['exitCode'] == 0
assert terminal['metadataErrors'] == []
result = read('audit-r4/course-delegated-verification.json')
expected = {'registered': 72, 'verified': 72, 'missing': 0, 'partial': 0,
            'invalid': 0, 'completed': 48, 'finiteRefusals': 24, 'fatal': 0,
            'unknown': 0, 'actualAcceptedSuffixCommands': 2006,
            'actualRejectedCommands': 0, 'originalCoreRegistered': 288,
            'fullMatrixRegistered': 378, 'criticalRegistered': 90,
            'criticalBranchesExecuted': 0}
assert all(result[k] == v for k, v in expected.items())
assert result['setupErrors'] == []
assert all(result[k] is True for k in ['evidenceValid', 'all12HaveRetainedHelpedLearner', 'positiveCoverageComplete'])
assert result['summaryAudit'] == {'status': 'verified', 'recorded': 72,
    'sourceStatuses': {'completed': 48, 'policyRefused': 24, 'fatal': 0, 'unexecutedDueToFatal': 0}}
prefixes = result['prefixAudits']
assert len(prefixes) == 6 and sum(p['commands'] for p in prefixes) == 878
assert sum(p['milestones'] for p in prefixes) == 150
assert all(p['status'] == 'verified' and p['fullCreateAndEveryOriginalMilestoneBytesEqual'] for p in prefixes)
coverage = result['shapeCoverage']
assert len(coverage) == 12 and len({p['shape']['id'] for p in coverage}) == 12
assert all(p['registered'] == p['verified'] == 6 and p['positiveDelegatedBusinesses'] == 4
           and p['actualClosedBusinesses'] == 4 and p['finiteRefusals'] == 2
           and p['missing'] == p['partial'] == p['invalid'] == 0 for p in coverage)
freeze = read('audit-source-freeze-r5.json')
assert len(freeze) == 435
for name, evidence in freeze.items():
    assert digest(PROJECT / name) == evidence, name
for key in ['sourceHashes', 'inputHashes', 'originalInputFileSetAndHashes']:
    for name, expected_hash in result[key].items():
        assert digest(PROJECT / name)['sha256'] == expected_hash, name
seal = read('matrix-r2/sealed-evidence.json')
assert len(seal['files']) == 237 and seal['selfExcluded'] == ['sealed-evidence.json']
assert leaves(ROOT / 'matrix-r2') == set(seal['files']) | {'sealed-evidence.json'}
for name, evidence in seal['files'].items():
    assert digest(ROOT / 'matrix-r2' / name) == evidence, name
rows = result['rows']
assert len(rows) == len({r['rowId'] for r in rows}) == 72
proofs = []
milestones = raw_members = monitored = accepted = rejected = 0
boundaries = []
for row in rows:
    reference = row['proof']
    assert digest(ROOT / 'audit-r4' / reference['file']) == {k: reference[k] for k in ['bytes', 'sha256']}
    proof = read('audit-r4/' + reference['file'])
    assert proof['rowId'] == row['rowId'] and proof['status'] == 'verified'
    assert proof['collectorFailure'] is None
    assert proof['independentlyReplayedAccepted'] == row['accepted']
    assert proof['independentlyReplayedRejected'] == row['rejected'] == 0
    assert proof['monitoringComplete'] is True
    if row['sourceStatus'] == 'completed':
        business = proof['business']
        assert business['positiveDelegatedBusiness'] and business['actualClosedShape']
        assert business['helpedRetainedStudents'] > 0 and len(business['stages']) == 2
        assert all(stage['deliveredAt'] is not None for stage in business['stages'])
        assert business['originalDelegatedSupports']
        assert all(item['job']['status'] == 'completed' for item in business['originalDelegatedSupports'])
    monitored += 1
    accepted += proof['independentlyReplayedAccepted']
    rejected += proof['independentlyReplayedRejected']
    milestones += proof['allOriginalMilestonesMatched']
    raw_members += len(proof['checkedRawMembers'])
    external = [dict(deploymentId=d['id'], grantLevel=(d.get('currentGrant') or {}).get('level'),
                     unverifiedExternalDelegations=sum(e.get('revocationVerifiedAt') is None for e in d['externalDelegations']))
                for d in proof['publicStory']['deployments'] if d['externalDelegations']]
    boundaries.append({'rowId': row['rowId'], 'unresolvedLocalIncidents': proof['publicStory']['unresolvedCount'],
                       'externalStatesRemainSeparate': external})
    proofs.append(reference)
assert monitored == 72 and accepted == 2006 and rejected == 0
assert leaves(ROOT / 'audit-r4') == {p['file'] for p in proofs} | {'audit-registration.json', 'course-delegated-verification.json', 'progress.jsonl'}
report = {'scope': 'Terminal and full proof/source/input readback, not a new simulation, UI or compatibility test.',
          'terminal': terminal, 'actualTotals': expected, 'proofsReadBack': proofs,
          'prefixes': {'count': 6, 'commands': 878, 'originalMilestones': 150},
          'matchedSuffixMilestones': milestones, 'checkedFullContainerMembers': raw_members,
          'yearEndMonitored': monitored, 'sourceFreezeFilesReadBack': len(freeze),
          'auditSourceHashesReadBack': len(result['sourceHashes']), 'auditInputHashesReadBack': len(result['inputHashes']),
          'sealedMatrixFilesReadBack': len(seal['files']), 'shapeCoverage': coverage,
          'preservedExternalBoundaries': boundaries, 'passed': True,
          'limits': ['No external control recovery is inferred from business closure, year end, or local incident count.',
                     'Fixed-policy finite results are not an exhaustive proof that all legal strategies fail.',
                     'P3/P4, whole P2/5b/T17/goal, assets, human playtest and paused compatibility remain open.']}
with (ROOT / 'terminal-inspection-r4.json').open('x') as out:
    json.dump(report, out, indent=2, ensure_ascii=False)
print(json.dumps({k: report[k] for k in ['passed', 'prefixes', 'matchedSuffixMilestones', 'checkedFullContainerMembers', 'yearEndMonitored', 'sourceFreezeFilesReadBack', 'auditSourceHashesReadBack', 'auditInputHashesReadBack', 'sealedMatrixFilesReadBack']}))
