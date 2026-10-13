#!/usr/bin/env python3
"""Check v0.3 planning references and arithmetic; this is NOT a game engine test."""
from __future__ import annotations
import json
import re
import sys
from datetime import date
from pathlib import Path

ROUTES = {'a_share', 'ai_video', 'ai_course', 'api_relay', 'deepseek_opportunity'}
LIMIT = 9_000_000_000_000


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def amount(value: object, context: str, *, signed: bool = False) -> int:
    require(type(value) is int, f'{context}: expected integer, not bool/float')
    require((-LIMIT if signed else 0) <= value <= LIMIT, f'{context}: amount out of range')
    return value


def unique(items: list, context: str) -> set:
    require(isinstance(items, list), f'{context}: expected list')
    require(len(set(items)) == len(items), f'{context}: duplicate value')
    return set(items)


def validate(plan: dict, spec: dict) -> dict:
    require(plan['version'] == 3 and plan['designVersion'] == '0.3', 'Unsupported plan version')
    require(spec['specVersion'] == '0.3', 'Unsupported specification version')
    require(spec['status'] == 'design_only_not_game_engine', 'Specification must not claim game implementation')
    require(spec['moneyUnit'] == 'fen' and spec['currency'] == 'CNY', 'Unexpected monetary units')
    require(spec['amountLimitFen'] == LIMIT, 'Amount limit mismatch')
    scope = plan['scope']
    require(scope['quarters'] == (scope['endYear'] - scope['startYear'] + 1) * 4 == 24, 'Quarter range mismatch')
    require((scope['startYear'], scope['endYear']) == (2020, 2025), 'Campaign range mismatch')
    for key in ('startYear', 'endYear', 'quarters'):
        require(spec['scope'][key] == scope[key], f'Scope mismatch: {key}')
    require(type(spec['scope']['actionPointsPerQuarter']) is int and spec['scope']['actionPointsPerQuarter'] == 4, 'Action budget mismatch')
    require(unique(scope['routeIds'], 'plan routes') == ROUTES, 'Missing core route')
    require(unique(spec['routeIds'], 'spec routes') == ROUTES, 'Missing specification route')
    known_cases = {f'Q{i:02}' for i in range(1, 41)}
    require(unique(plan['acceptanceCaseIds'], 'acceptance cases') == known_cases, 'Expected Q01-Q40')
    tasks = plan['tasks']
    ids = unique([task['id'] for task in tasks], 'task IDs')
    require(ids == {f'P{i:03}' for i in range(1, 23)}, 'Keep P001-P022 stable')
    by_id = {task['id']: task for task in tasks}
    active, visited, referenced = set(), set(), set()

    def visit(task_id: str) -> None:
        require(task_id in by_id, f'Unknown dependency: {task_id}')
        require(task_id not in active, f'Cyclic dependency: {task_id}')
        if task_id in visited:
            return
        active.add(task_id)
        for dep in by_id[task_id]['dependsOn']:
            visit(dep)
        active.remove(task_id)
        visited.add(task_id)

    for task in tasks:
        visit(task['id'])
        require(task['acceptanceCriteria'] and task['deliverableDoc'].startswith('docs/'), f'Missing specification: {task["id"]}')
        require(task['status'] in {'todo', 'in_progress', 'blocked', 'done'}, 'Invalid task status')
        if task['status'] == 'done':
            require(bool(task.get('evidence')), f'Done task lacks evidence: {task["id"]}')
        cases = unique(task['acceptanceIds'], task['id'])
        require(cases and cases <= known_cases, f'Invalid case reference: {task["id"]}')
        referenced |= cases
    require(referenced == known_cases, 'Unreferenced acceptance case')
    require({'P006', 'P007', 'P009', 'P011'} <= set(by_id['P020']['dependsOn']), 'P020 lacks full-game completion dependencies')

    slices = spec['slices']
    require(unique([s['id'] for s in slices], 'slice IDs') == {f'S{i:02}' for i in range(1, 6)}, 'Expected S01-S05')
    covered_routes = set()
    for item in slices:
        start, end = date.fromisoformat(item['from']), date.fromisoformat(item['to'])
        require(date(2020, 1, 1) <= start <= end <= date(2025, 12, 31), f'Invalid slice dates: {item["id"]}')
        require(item['classification'] in {'simulation', 'fictional', 'counterfactual'}, 'Invalid slice classification')
        require(set(item['taskIds']) <= ids and item['taskIds'], 'Unknown slice task')
        require(set(item['acceptanceIds']) <= known_cases and item['acceptanceIds'], 'Unknown slice acceptance case')
        routes = unique(item['routeIds'], item['id'])
        require(routes <= ROUTES and routes, 'Unknown slice route')
        covered_routes |= routes
        if item['id'] == 'S04':
            require(item['classification'] == 'counterfactual', 'Direct equity slice must be counterfactual')
    require(covered_routes == ROUTES, 'Slices omit a core route')

    cash_cases = spec['cashExamples']
    require(unique([x['id'] for x in cash_cases], 'cash example IDs') == {f'F{i:02}' for i in range(1, 11)}, 'Expected F01-F10')
    for ex in cash_cases:
        context = ex['id']
        cash = amount(ex['initialCashFen'], context)
        cash += sum(amount(x, context) for x in ex['inflowsFen'])
        cash -= sum(amount(x, context) for x in ex['outflowsFen'])
        amount(cash, context)
        reservations = ex['reservations']
        unique([r['id'] for r in reservations], f'{context} reservations')
        for res in reservations:
            require(res['kind'] in {'customer_protection', 'frozen', 'plan', 'order'}, f'{context}: unknown reservation kind')
            amount(res['amountFen'], context)
        held = sum(r['amountFen'] for r in reservations)
        protected = sum(r['amountFen'] for r in reservations if r['kind'] in {'customer_protection', 'frozen'})
        expected = (amount(ex['expectedCashFen'], context), amount(ex['expectedAvailableFen'], context), amount(ex['expectedProtectionShortfallFen'], context))
        require((cash, max(0, cash - held), max(0, protected - cash)) == expected, f'{context}: cash/protection arithmetic mismatch')
        if 'recognizedIncomeFen' in ex:
            profit = amount(ex['recognizedIncomeFen'], context) - amount(ex['recognizedCostFen'], context)
            require(profit == amount(ex['expectedProfitFen'], context, signed=True), f'{context}: profit mismatch')

    equity = spec['equityExamples']
    require(unique([e['id'] for e in equity], 'equity example IDs') == {'E01', 'E02'}, 'Expected E01/E02')
    for ex in equity:
        require(ex['classification'] == 'counterfactual', 'Equity example requires counterfactual label')
        pre, new = amount(ex['preMoneyFen'], ex['id']), amount(ex['newMoneyFen'], ex['id'])
        total = pre + new
        require(0 < total <= LIMIT, 'Invalid post-money amount')
        prior = amount(ex['priorHoldingBps'], ex['id'])
        require(prior <= 10000, 'Invalid share basis points')
        new_bps = (new * 10000 + total // 2) // total
        old_bps = (prior * pre + total // 2) // total
        require((new_bps, old_bps) == (ex['expectedNewInvestorBps'], ex['expectedPriorHoldingBps']), 'Equity arithmetic mismatch')
    return {'tasks': len(tasks), 'cases': len(known_cases), 'slices': len(slices), 'cash_examples': len(cash_cases), 'equity_examples': len(equity)}


def validate_event_sample(event: dict) -> None:
    """Check only the documented course example, not arbitrary production content."""
    require(event['classification'] == 'fictional', 'Course example must be fictional')
    require(date.fromisoformat(event['effectiveWindow']['from']) <= date.fromisoformat(event['effectiveWindow']['to']), 'Invalid example window')
    choices = event['choices']
    ids = unique([c['id'] for c in choices], 'choice IDs')
    require(event['defaultChoiceId'] in ids, 'Default choice missing')
    for choice in choices:
        command = choice['command']
        require(command['kind'] in {'StartCourseRefresh', 'PauseNewEnrollment'}, 'Unknown example command')
        amount(command['costFen'], 'event cost')
        require(type(command['actionPoints']) is int and 0 <= command['actionPoints'] <= 4, 'Invalid event action budget')
        if choice['id'] == event['defaultChoiceId']:
            require(command['kind'] == 'PauseNewEnrollment' and command['costFen'] == 0 and command['actionPoints'] == 0, 'Default path must remain available without resources')
        if command['kind'] == 'StartCourseRefresh':
            require(command['payer'] == 'bound_business_owner' and command['durationDays'] == 7 and command['capacityUnits'] == 1, 'Incomplete refresh job contract')


if __name__ == '__main__':
    try:
        root = Path(__file__).resolve().parents[1]
        plan = json.loads((root / 'planning/backlog.json').read_text(encoding='utf-8'))
        spec = json.loads((root / 'planning/playable-spec.json').read_text(encoding='utf-8'))
        result = validate(plan, spec)
        matrix = (root / 'docs/14-acceptance-matrix.md').read_text(encoding='utf-8')
        table_ids = re.findall(r'^\| (Q\d{2}) \|', matrix, re.M)
        require(unique(table_ids, 'matrix IDs') == set(plan['acceptanceCaseIds']), 'Matrix and task case IDs differ')
        contracts = (root / 'docs/15-content-contracts.md').read_text(encoding='utf-8')
        samples = re.findall(r'```json\s*\n(.*?)\n```', contracts, re.S)
        require(len(samples) == 1, 'Expected one documented event sample')
        validate_event_sample(json.loads(samples[0]))
        print('PASS specification checks:', json.dumps(result, ensure_ascii=False))
        print('PASS matrix references and documented course-example structure.')
        print('Not game execution, production-content reachability, browser tests, asset validation or release readiness.')
    except (OSError, ValueError, KeyError, TypeError, RecursionError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        raise SystemExit(1)
