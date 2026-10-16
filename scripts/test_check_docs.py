"""Repository-scan regressions; these tests do not exercise gameplay."""
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import tempfile
import unittest

from check_docs import check


class DocumentationScanTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.write('README.md', '# Fixture\n[Guide](docs/guide.md)\n')
        self.write('docs/guide.md', '# Guide\n')
        self.write('assets/concepts/manifest.json', json.dumps({'assets': []}))
        self.write('planning/backlog.json', json.dumps({'tasks': [
            {'id': 'P001', 'dependsOn': [], 'acceptanceCriteria': ['Fixture criterion']}
        ]}))

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf-8')
        return path

    def scan(self, *, text_only=True):
        with redirect_stdout(io.StringIO()):
            return check(self.root, text_only=text_only)

    def test_project_documents_are_checked(self):
        self.assertEqual(self.scan(), [])

    def test_dependency_and_output_directories_are_pruned(self):
        for folder in ['node_modules', 'dist', 'coverage', 'playwright-report',
                       'test-results', '.git', '.delivery', '__pycache__',
                       '.vite', '.cache', '.venv', '.pytest_cache']:
            self.write(f'{folder}/broken.md', '[Missing](missing-file.md)')
            self.write(f'{folder}/invalid.json', 'not JSON')
            self.write(f'{folder}/non-utf8.md', '').write_bytes(b'\xff')
        self.assertEqual(self.scan(), [])

    def test_nested_dependencies_are_also_pruned(self):
        self.write('packages/widget/node_modules/third-party/README.md', '[Bad](absent)')
        self.write('packages/widget/node_modules/third-party/data.json', 'invalid')
        self.assertEqual(self.scan(), [])

    def test_source_content_and_goal_documents_are_not_excluded(self):
        for folder in ['docs', 'src/content', 'goal-1', 'packages/widget']:
            self.write(f'{folder}/broken.md', '[Bad](absent.md)')
        errors = self.scan()
        self.assertEqual(len(errors), 4)
        for folder in ['docs', 'src/content', 'goal-1', 'packages/widget']:
            self.assertTrue(any(f'{folder}/broken.md' in error for error in errors))

    def test_project_json_remains_strictly_validated(self):
        self.write('src/content/invalid.json', 'not JSON')
        self.write('planning/invalid.json', 'not JSON')
        errors = self.scan()
        self.assertEqual(len(errors), 2)
        self.assertTrue(all('invalid JSON' in error for error in errors))

    def test_similar_directory_names_are_not_excluded(self):
        self.write('dist-notes/broken.md', '[Bad](absent.md)')
        self.write('coverage-guide/invalid.json', 'invalid')
        self.assertEqual(len(self.scan()), 2)

    def test_bad_encoding_in_project_documents_is_a_validation_error(self):
        self.write('docs/non-utf8.md', '').write_bytes(b'\xff')
        errors = self.scan()
        self.assertEqual(len(errors), 1)
        self.assertIn('docs/non-utf8.md', errors[0])

    def test_link_cannot_escape_repository(self):
        self.write('docs/escape.md', '[Outside](../../outside.md)')
        self.assertTrue(any('broken local link' in error for error in self.scan()))

    def test_missing_original_assets_still_block_full_asset_check(self):
        self.write('assets/concepts/manifest.json', json.dumps({'assets': [
            {'path': 'assets/concepts/missing.png', 'sha256': '0' * 64,
             'bytes': 1, 'width': 1, 'height': 1}
        ]}))
        self.assertEqual(self.scan(), [])
        self.assertEqual(self.scan(text_only=False), [
            'Missing original asset: assets/concepts/missing.png'
        ])


if __name__ == '__main__':
    unittest.main()
