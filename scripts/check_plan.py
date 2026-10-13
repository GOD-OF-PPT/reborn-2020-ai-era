#!/usr/bin/env python3
"""Validate the v0.2 planning graph and arithmetic examples, not the game engine."""
from __future__ import annotations
import json
import sys
from pathlib import Path


def validate(plan: dict) -> None:
    scope = plan['scope']
    if scope['quarters'] != (scope['endYear'] - scope['startYear'] + 1) * 4:
        raise ValueError('Quarter count does not match the year range')
    routes = scope['routeIds']
    required = {'a_share', 'ai_video', 'ai_course', 'api_relay', 'deepseek_opportunity'}
    if len(routes) != len(set(routes)) or not required.issubset(routes):
        raise ValueError('Missing or duplicate core routes')
    tasks = plan['tasks']
    by_id = {task['id']: task for task in tasks}
    if len(by_id) != len(tasks):
        raise ValueError('Duplicate task IDs')
    active: set[str] = set()
    visited: set[str] = set()

    def visit(task_id: str) -> None:
        if task_id not in by_id:
            raise ValueError(f'Unknown dependency: {task_id}')
        if task_id in active:
            raise ValueError(f'Cyclic dependency: {task_id}')
        if task_id in visited:
            return
        active.add(task_id)
        for dep in by_id[task_id]['dependsOn']:
            visit(dep)
        active.remove(task_id)
        visited.add(task_id)

    known_cases = {f'Q{n:02}' for n in range(1, 25)}
    referenced: set[str] = set()
    for task in tasks:
        visit(task['id'])
        if not task.get('acceptanceCriteria') or not task.get('deliverableDoc'):
            raise ValueError(f"Missing task specification: {task['id']}")
        ids = set(task['acceptanceIds'])
        if not ids or not ids.issubset(known_cases):
            raise ValueError(f"Invalid acceptance IDs: {task['id']}")
        referenced.update(ids)
    if referenced != known_cases:
        raise ValueError('Some acceptance cases have no task reference')

    cases = [
        ('tutorial cash', 30000 + 24000 - 12000 - 3000 - 12000, 27000),
        ('delivered course revenue', (200 - 20) * 199, 35820),
        ('course net', 35820 - 1791 - 6000 - 2000 - 3000, 23029),
        ('relay net', 30000 - 18000 - 3000 - 2000 - 1500, 5500),
        ('released cash', 10000 - 2000 - 5000, 3000),
        ('new equity basis points', 200 * 10000 // (800 + 200), 2000),
    ]
    for name, actual, expected in cases:
        if actual != expected:
            raise ValueError(f'Arithmetic mismatch: {name}')
    print(f'PASS: {len(tasks)} tasks; acyclic dependencies; Q01-Q24 referenced; {len(routes)} routes; {scope["quarters"]} quarters; {len(cases)} arithmetic examples.')
    print('This checks planning structure and fixed arithmetic only, not implemented gameplay, document text or release readiness.')


if __name__ == '__main__':
    try:
        root = Path(__file__).resolve().parents[1]
        data = json.loads((root / 'planning/backlog.json').read_text(encoding='utf-8'))
        validate(data)
    except (OSError, ValueError, KeyError, TypeError, RecursionError) as exc:
        print(f'FAIL: {exc}', file=sys.stderr)
        raise SystemExit(1)
