"""Regression tests for the specification validator, not for gameplay."""
from copy import deepcopy
import json
from pathlib import Path
import re
import unittest
from check_plan import validate, validate_event_sample

ROOT = Path(__file__).resolve().parents[1]


class SpecificationValidatorTests(unittest.TestCase):
    def setUp(self):
        self.plan = json.loads((ROOT / 'planning/backlog.json').read_text(encoding='utf-8'))
        self.spec = json.loads((ROOT / 'planning/playable-spec.json').read_text(encoding='utf-8'))
        text = (ROOT / 'docs/15-content-contracts.md').read_text(encoding='utf-8')
        self.event = json.loads(re.findall(r'```json\s*\n(.*?)\n```', text, re.S)[0])

    def rejected(self):
        with self.assertRaises((ValueError, KeyError, TypeError)):
            validate(self.plan, self.spec)

    def test_valid_spec(self):
        self.assertEqual(validate(self.plan, self.spec)['cases'], 40)

    def test_missing_core_route(self):
        self.plan['scope']['routeIds'].remove('ai_course'); self.rejected()

    def test_wrong_quarter_count(self):
        self.plan['scope']['quarters'] = 16; self.rejected()

    def test_dependency_cycle(self):
        self.plan['tasks'][0]['dependsOn'] = ['P002']; self.rejected()

    def test_unknown_dependency(self):
        self.plan['tasks'][0]['dependsOn'] = ['P999']; self.rejected()

    def test_unknown_acceptance_case(self):
        self.plan['tasks'][0]['acceptanceIds'].append('Q99'); self.rejected()

    def test_duplicate_task(self):
        self.plan['tasks'].append(deepcopy(self.plan['tasks'][0])); self.rejected()

    def test_done_without_evidence(self):
        self.plan['tasks'][0]['status'] = 'done'; self.rejected()

    def test_missing_full_game_dependency(self):
        self.plan['tasks'][19]['dependsOn'].remove('P007'); self.rejected()

    def test_slice_before_campaign(self):
        self.spec['slices'][0]['from'] = '2019-01-01'; self.rejected()

    def test_equity_slice_not_counterfactual(self):
        self.spec['slices'][3]['classification'] = 'simulation'; self.rejected()

    def test_wrong_cash_result(self):
        self.spec['cashExamples'][0]['expectedCashFen'] += 1; self.rejected()

    def test_bool_is_not_money(self):
        self.spec['cashExamples'][0]['initialCashFen'] = True; self.rejected()

    def test_negative_cost(self):
        self.spec['cashExamples'][0]['outflowsFen'][0] = -1; self.rejected()

    def test_duplicate_reservation(self):
        e = self.spec['cashExamples'][6]; e['reservations'].append(deepcopy(e['reservations'][0])); self.rejected()

    def test_wrong_equity_dilution(self):
        self.spec['equityExamples'][1]['expectedPriorHoldingBps'] = 2000; self.rejected()

    def test_missing_default_choice(self):
        self.event['defaultChoiceId'] = 'missing'
        with self.assertRaises(ValueError): validate_event_sample(self.event)

    def test_default_requires_action(self):
        self.event['choices'][1]['command']['actionPoints'] = 1
        with self.assertRaises(ValueError): validate_event_sample(self.event)

    def test_valid_event_example(self):
        validate_event_sample(self.event)


if __name__ == '__main__':
    unittest.main()
