#!/usr/bin/env python3
"""Check research/specification references and UX01 arithmetic; not a game test."""
from __future__ import annotations

import argparse
from datetime import date
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlparse

ROUTES = {'a_share', 'ai_video', 'ai_course', 'api_relay', 'deepseek_opportunity'}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def unique(rows: list[dict], name: str) -> dict[str, dict]:
    require(isinstance(rows, list) and bool(rows), f'{name}: non-empty list required')
    result: dict[str, dict] = {}
    for row in rows:
        require(isinstance(row, dict) and isinstance(row.get('id'), str), f'{name}: invalid ID')
        require(row['id'] not in result, f'{name}: duplicate ID {row["id"]}')
        result[row['id']] = row
    return result


def validate(data: dict, task_ids: set[str], root: Path) -> dict[str, int]:
    require(data['method'] == 'desk_research', 'This specification is a desk research record')
    require(data['handsOnTested'] is False, 'Do not claim hands-on testing in this research record')
    date.fromisoformat(data['observedDate'])
    require(re.fullmatch(r'[0-9a-f]{40}', data['baseCommit']) is not None, 'Invalid base commit')
    scope = data['scope']
    require(scope['startYear'] == 2020 and scope['endYear'] == 2025, 'Unexpected campaign range')
    require(scope['quarters'] == 24 and scope['actionPoints'] == 4, 'Unexpected quarter/action scope')
    require(set(scope['routeIds']) == ROUTES and len(scope['routeIds']) == 5, 'Missing or duplicate routes')

    sources = unique(data['sources'], 'sources')
    for row in sources.values():
        parsed = urlparse(row['url'])
        require(parsed.scheme == 'https' and bool(parsed.netloc), 'Invalid research source URL')
        require(row['evidenceType'] in {'primary_page', 'primary_search_excerpt'}, 'Invalid evidence classification')
        require(bool(row['supports']) and bool(row['limitation']), 'Missing evidence boundary')
        date.fromisoformat(row['observedDate'])
        require(row['tier'] in {'core', 'candidate'}, 'Invalid source tier')
        if row['evidenceType'] == 'primary_search_excerpt':
            require(row['tier'] == 'candidate', 'Index-only evidence must remain a candidate')

    cases = unique(data['acceptanceCases'], 'acceptance cases')
    require(set(cases) == {f'X{i:02}' for i in range(1, 15)}, 'X01-X14 registry incomplete')
    for row in cases.values():
        require(bool(row['taskIds']) and set(row['taskIds']) <= task_ids, 'Unknown base task in acceptance')
        require(row['status'] == 'not_run', 'This delivery does not certify game acceptance')

    decisions = unique(data['decisions'], 'decisions')
    covered: set[str] = set()
    for row in decisions.values():
        require(bool(row['sourceIds']) and set(row['sourceIds']) <= set(sources), 'Unknown evidence reference')
        require(any(sources[x]['tier'] == 'core' for x in row['sourceIds']), 'A design claim needs verified core evidence')
        require(bool(row['acceptanceIds']) and set(row['acceptanceIds']) <= set(cases), 'Unknown acceptance reference')
        covered.update(row['acceptanceIds'])
    require(covered == set(cases), 'Acceptance lacks design decision mapping')

    packages = unique(data['workPackages'], 'work packages')
    active: set[str] = set()
    visited: set[str] = set()
    package_cases: set[str] = set()

    def visit(key: str) -> None:
        require(key in packages, f'Unknown work package: {key}')
        require(key not in active, f'Cyclic work package: {key}')
        if key in visited:
            return
        active.add(key)
        for parent in packages[key]['dependsOn']:
            visit(parent)
        active.remove(key)
        visited.add(key)

    for row in packages.values():
        visit(row['id'])
        require(bool(row['baseTaskIds']) and set(row['baseTaskIds']) <= task_ids, 'Unknown work package base task')
        require(bool(row['acceptanceIds']) and set(row['acceptanceIds']) <= set(cases), 'Invalid package acceptance')
        require(row['status'] == 'todo' and row['remoteIssueNumber'] is None, 'Do not claim implementation/remote Issues')
        package_cases.update(row['acceptanceIds'])
    require(package_cases == set(cases), 'Acceptance lacks work package mapping')

    flow = data['flow']
    require(flow['steps'] == ['brief', 'plan', 'resolve', 'receipt', 'continue'], 'Unexpected flow contract')
    for key in ('mandatoryEventsCapped', 'autoAcceptNewCommitments', 'routinePlansImplicitlyGrantAgentAuthority', 'permanentProfitMultiplier'):
        require(flow[key] is False, f'Unsafe or conflicting flow policy: {key}')
    require(flow['freeReading'] is True and flow['crossQuarterRoutineRequiresConfirmation'] is True, 'Reading/confirmation policy mismatch')

    fixture = data['uxFixture']
    require(fixture['classification'] == 'fictional' and fixture['id'] == 'UX01', 'Wrong tutorial classification')
    require(all(type(x) is int and x >= 0 for x in fixture['actionCosts']), 'Invalid action cost')
    require(sum(fixture['actionCosts']) <= scope['actionPoints'], 'Tutorial action budget exceeded')
    require(type(fixture['startCashFen']) is int and fixture['startCashFen'] >= 0, 'Invalid starting cash')
    cash = fixture['startCashFen']
    lowest = cash
    business_net = 0
    previous = date(2020, 1, 1)
    for row in fixture['flows']:
        current = date.fromisoformat(row['date'])
        require(previous <= current <= date(2020, 3, 31), 'Unordered or out-of-window tutorial date')
        require(type(row['deltaFen']) is int, 'Money must be integer fen, not bool/float')
        require(row['kind'] in {'living', 'salary', 'business_cost', 'delivered_receipt'}, 'Unexpected cash-flow kind')
        cash += row['deltaFen']
        require(cash >= 0, 'Tutorial borrows future cash')
        lowest = min(lowest, cash)
        if row['kind'] in {'business_cost', 'delivered_receipt'}:
            business_net += row['deltaFen']
        previous = current
    require(cash == fixture['expectedCashFen'] == 4280000, 'Tutorial ending cash mismatch')
    require(lowest == fixture['expectedMinimumCashFen'] == 2550000, 'Tutorial minimum cash mismatch')
    require(business_net == fixture['expectedBusinessNetFen'] == 80000, 'Tutorial business net mismatch')
    legacy = fixture['legacyFixture']
    require(legacy == {'id': 'Q01', 'expectedCashFen': 2700000, 'changed': False}, 'Legacy Q01 was changed')
    require(data['participantsActual'] == 0 and data['playtest']['results'] is None, 'Do not fabricate playtest results')
    require(data['playtest']['remoteTelemetryDefault'] is False, 'Unexpected telemetry')

    root = root.resolve()
    for name in data['documents']:
        path = (root / name).resolve()
        require(path.is_relative_to(root) and path.is_file(), f'Missing/unsafe document path: {name}')
    acceptance_text = (root / 'docs/19-research-implementation-plan.md').read_text(encoding='utf-8')
    listed = set(re.findall(r'^\| (X\d{2}) \|', acceptance_text, flags=re.M))
    require(listed == set(cases), 'Document and acceptance registry differ')
    return {'sources': len(sources), 'decisions': len(decisions), 'acceptance_cases': len(cases), 'work_packages': len(packages), 'cash_flows': len(fixture['flows'])}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-index', type=Path, help='Optional local task-ID index read from the pinned remote baseline; never replaces backlog.')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    try:
        data = json.loads((root / 'planning/competitive-design.json').read_text(encoding='utf-8'))
        if args.base_index:
            index = json.loads(args.base_index.read_text(encoding='utf-8'))
            require(index['baseCommit'] == data['baseCommit'], 'Baseline index commit mismatch')
            task_ids = set(index['taskIds'])
        else:
            base = json.loads((root / data['baseTaskFile']).read_text(encoding='utf-8'))
            task_ids = {t['id'] for t in base['tasks']}
        result = validate(data, task_ids, root)
        print('PASS specification checks:', json.dumps(result, ensure_ascii=False))
        print('Not game execution, competitor playtesting, UI validation, or publication verification.')
        return 0
    except (OSError, KeyError, TypeError, ValueError, RecursionError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
