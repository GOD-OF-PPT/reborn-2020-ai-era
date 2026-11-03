from pathlib import Path
import collections
import hashlib
import json

root = Path('goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/ledger-prefix-r470')
terminal = json.loads((root / 'observe-v1.process-terminal.json').read_text())
assert terminal['exitCode'] == 0 and terminal['pid'] == 40580
result = json.loads((root / 'observe-v1.result.json').read_text())
profile_bytes = (root / 'observe-v1.cpuprofile').read_bytes()
profile = json.loads(profile_bytes)
assert result['allFortyCompleteLedgerPrefixesEqual'] and result['allActualReceiptResultsEqual']
nodes = {node['id']: node for node in profile['nodes']}
parents = {}
for node in nodes.values():
    for child in node.get('children', []):
        assert child not in parents or parents[child] == node['id']
        parents[child] = node['id']

def descendants(roots):
    found, pending = set(), list(roots)
    while pending:
        node_id = pending.pop()
        if node_id not in found:
            found.add(node_id)
            pending.extend(nodes[node_id].get('children', []))
    return found

apply_roots = [key for key, node in nodes.items()
               if node['callFrame']['functionName'] == 'applyLedger'
               and '/t17-u6-money-sum-r469/' in node['callFrame']['url']
               and node['callFrame']['url'].endswith('/src/core/ledger.ts')]
assert apply_roots
apply_nodes = descendants(apply_roots)
hash_nodes = descendants([key for key, node in nodes.items()
                          if node['callFrame']['functionName'] == 'prefixHashReadback'])
history_nodes = descendants([key for key in apply_nodes
                             if nodes[key]['callFrame']['functionName'] == 'assertSupplierHistory'])
assert not apply_nodes.intersection(hash_nodes)
assert len(profile['samples']) == len(profile['timeDeltas'])
times = collections.Counter()
for node_id, elapsed in zip(profile['samples'], profile['timeDeltas']):
    assert node_id in nodes and elapsed >= 0
    times[node_id] += elapsed
total = sum(times.values())
inside = sum(elapsed for key, elapsed in times.items() if key in apply_nodes)
assert inside > 0
by_function = collections.Counter()
money_time = 0
for key, elapsed in times.items():
    if key not in apply_nodes:
        continue
    frame = nodes[key]['callFrame']
    by_function[(frame['functionName'], frame['url'], frame['lineNumber'] + 1,
                 frame['columnNumber'] + 1)] += elapsed
    if frame['url'].endswith('/src/core/money.ts'):
        money_time += elapsed
top = [{'function': key[0], 'url': key[1], 'line': key[2], 'column': key[3],
        'selfMs': value / 1000, 'percentOfApplySubtree': 100 * value / inside}
       for key, value in by_function.most_common(20)]
timing = []
for source in [464, 469]:
    steps = [step for step in result['steps'] if step['source'] == source]
    assert len(steps) == 40 and all(step['actualReceiptMatched'] for step in steps)
    timing.append({'source': source, 'operations': 40,
                   'wallMs': sum(step['wallMs'] for step in steps),
                   'cpuUserMs': sum(step['cpuUserMs'] for step in steps),
                   'cpuSystemMs': sum(step['cpuSystemMs'] for step in steps)})
report = {
    'profile': 'observe-v1.cpuprofile',
    'profileSha256': hashlib.sha256(profile_bytes).hexdigest(),
    'samples': len(profile['samples']), 'applyRoots': apply_roots,
    'allSampleMs': total / 1000, 'applySubtreeMs': inside / 1000,
    'observerPrefixHashMs': sum(value for key, value in times.items() if key in hash_nodes) / 1000,
    'globalUnattributedGcMs': sum(value for key, value in times.items()
                                if nodes[key]['callFrame']['functionName'] == '(garbage collector)') / 1000,
    'supplierHistoryInclusiveMs': sum(value for key, value in times.items() if key in history_nodes) / 1000,
    'moneySelfMsInsideApply': money_time / 1000,
    'moneySelfPercentOfApplySubtree': 100 * money_time / inside,
    'applySelfTop': top, 'operationTimingObservations': timing,
    'completeCanonicalLedgerPrefixHashesEqual': 40,
    'allActualReceiptFieldsMatched': True, 'sourceExactReported': result['sourceExact'],
    'observerBias': 'Global profile includes full-prefix hashing and GC; only explicit applyLedger subtree is attributed. GC cannot be assigned to business or observer from this profile.',
    'notWholeDateStepAttribution': True, 'notFormalPerformancePass': True,
    'newGameCommands': 0, 'productChanges': 0, 'compatibility': 0,
}
with (root / 'observe-v1.profile-analysis.json').open('x') as output:
    json.dump(report, output, indent=2)
    output.write('\n')
print({key: report[key] for key in ['samples', 'allSampleMs', 'applySubtreeMs',
       'observerPrefixHashMs', 'globalUnattributedGcMs', 'moneySelfPercentOfApplySubtree']})
print(top[:5])
