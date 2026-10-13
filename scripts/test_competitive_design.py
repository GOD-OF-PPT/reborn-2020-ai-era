"""Regression tests of the documentation validator, not the proposed game."""
from copy import deepcopy
import json
from pathlib import Path
import unittest

from check_competitive_design import validate

ROOT = Path(__file__).resolve().parents[1]
BASE = json.loads((ROOT / 'planning/competitive-design.json').read_text(encoding='utf-8'))
TASKS = {f'P{i:03}' for i in range(1, 23)}


class CompetitiveDesignValidatorTests(unittest.TestCase):
    def setUp(self):
        self.data = deepcopy(BASE)

    def invalid(self):
        with self.assertRaises((ValueError, KeyError, TypeError)):
            validate(self.data, TASKS, ROOT)

    def test_current_spec(self):
        self.assertEqual(validate(self.data, TASKS, ROOT)['acceptance_cases'], 14)

    def test_duplicate_source(self):
        self.data['sources'].append(deepcopy(self.data['sources'][0])); self.invalid()

    def test_unknown_source(self):
        self.data['decisions'][0]['sourceIds'] = ['C999']; self.invalid()

    def test_candidate_cannot_be_only_basis(self):
        self.data['decisions'][0]['sourceIds'] = ['C08']; self.invalid()

    def test_unknown_base_task(self):
        self.data['acceptanceCases'][0]['taskIds'] = ['P999']; self.invalid()

    def test_cyclic_work(self):
        self.data['workPackages'][0]['dependsOn'] = ['W406']; self.invalid()

    def test_case_not_mapped(self):
        self.data['decisions'][0]['acceptanceIds'] = ['X01']; self.invalid()

    def test_missing_route(self):
        self.data['scope']['routeIds'].pop(); self.invalid()

    def test_hands_on_claim(self):
        self.data['handsOnTested'] = True; self.invalid()

    def test_index_evidence_as_core(self):
        self.data['sources'][-1]['tier'] = 'core'; self.invalid()

    def test_mandatory_capped(self):
        self.data['flow']['mandatoryEventsCapped'] = True; self.invalid()

    def test_implicit_agent_authority(self):
        self.data['flow']['routinePlansImplicitlyGrantAgentAuthority'] = True; self.invalid()

    def test_wrong_cash(self):
        self.data['uxFixture']['expectedCashFen'] += 1; self.invalid()

    def test_wrong_net(self):
        self.data['uxFixture']['expectedBusinessNetFen'] = 130000; self.invalid()

    def test_bad_date_order(self):
        self.data['uxFixture']['flows'][0]['date'] = '2020-03-10'; self.invalid()

    def test_money_bool(self):
        self.data['uxFixture']['flows'][0]['deltaFen'] = True; self.invalid()

    def test_overspent_actions(self):
        self.data['uxFixture']['actionCosts'] = [2, 2, 2]; self.invalid()

    def test_legacy_changed(self):
        self.data['uxFixture']['legacyFixture']['changed'] = True; self.invalid()

    def test_fabricated_participants(self):
        self.data['participantsActual'] = 10; self.invalid()

    def test_unknown_package(self):
        self.data['workPackages'][0]['dependsOn'] = ['W999']; self.invalid()


if __name__ == '__main__':
    unittest.main()
