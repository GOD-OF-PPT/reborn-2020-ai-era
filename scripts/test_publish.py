"""Offline safety-path tests. No GitHub connection, repository creation or push."""
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from publish_github import PublishError, publish


class FakeCommands:
    def __init__(self, root, **options):
        self.root = root
        self.options = options
        self.exists = options.get('exists', False)
        self.calls = []
        self.sha = 'a' * 40
        self.pushed = False

    def __call__(self, args, cwd):
        self.calls.append(args)
        out, err, code = '', '', 0
        if args == ['git', 'rev-parse', '--show-toplevel']:
            out = str(self.root)
        elif args == ['git', 'branch', '--show-current']:
            out = self.options.get('branch', 'main')
        elif args == ['git', 'status', '--porcelain']:
            out = ' M README.md' if self.options.get('dirty') else ''
        elif args == ['git', 'rev-parse', 'HEAD']:
            out = self.sha
        elif args[:4] == ['git', 'remote', 'get-url', 'origin']:
            out = self.options.get('origin', '')
            code = 0 if out else 2
        elif args[:2] == ['gh', 'api'] and args[4] == 'user':
            out = self.options.get('login', 'GOD-OF-PPT')
        elif args[:2] == ['gh', 'api']:
            if self.exists:
                out = json.dumps({'full_name': 'GOD-OF-PPT/reborn-2020-ai-era',
                                  'private': not self.options.get('public', False), 'default_branch': 'main'})
            else:
                code = 1; err = self.options.get('meta_error', 'gh: Not Found (HTTP 404)')
        elif args[:3] == ['gh', 'repo', 'create']:
            assert '--private' in args
            self.exists = True
        elif args[:2] == ['git', 'ls-remote']:
            if '--heads' in args:
                out = self.options.get('refs', '')
            else:
                out = (('b' * 40) if self.options.get('bad_verify') else self.sha) + '\trefs/heads/main\n'
        elif args[:3] == ['git', 'merge-base', '--is-ancestor']:
            code = 1 if self.options.get('diverged') else 0
        elif args[:2] == ['git', 'push']:
            assert '--force' not in args
            self.pushed = True
        elif args[:3] in (['gh', 'auth', 'setup-git'], ['git', 'remote', 'add']):
            pass
        else:
            raise AssertionError(f'Unexpected command: {args}')
        return subprocess.CompletedProcess(args, code, out, err)


class PublishSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / '.git').mkdir()
        (self.root / 'planning').mkdir()
        (self.root / 'planning/repository.json').write_text(json.dumps({
            'owner': 'GOD-OF-PPT', 'name': 'reborn-2020-ai-era', 'visibility': 'private',
            'defaultBranch': 'main', 'description': 'Design materials'}), encoding='utf-8')

    def execute(self, allow=False, **options):
        fake = FakeCommands(self.root, **options)
        result = publish(self.root, allow_existing=allow, runner=fake, check_tools=False)
        return result, fake

    def rejects(self, allow=False, **options):
        fake = FakeCommands(self.root, **options)
        with self.assertRaises(PublishError):
            publish(self.root, allow_existing=allow, runner=fake, check_tools=False)
        self.assertFalse(fake.pushed)
        return fake

    def test_new_private_repository_and_verified_receipt(self):
        result, fake = self.execute()
        self.assertTrue(fake.pushed)
        self.assertTrue(result['created_by_this_run'])
        self.assertTrue((self.root / '.delivery/publish-receipt.json').exists())

    def test_dirty_worktree_rejected(self):
        self.rejects(dirty=True)

    def test_wrong_account_rejected_without_creation(self):
        fake = self.rejects(login='someone-else')
        self.assertFalse(any(c[:3] == ['gh','repo','create'] for c in fake.calls))

    def test_wrong_branch_rejected(self):
        self.rejects(branch='feature/test')

    def test_unrelated_origin_rejected(self):
        self.rejects(origin='https://github.com/other/project.git')

    def test_existing_requires_explicit_retry(self):
        self.rejects(exists=True)

    def test_public_existing_repository_rejected(self):
        self.rejects(allow=True, exists=True, public=True)

    def test_unexpected_remote_branch_rejected(self):
        self.rejects(allow=True, exists=True, refs=('a'*40)+'\trefs/heads/master\n')

    def test_diverged_history_rejected(self):
        self.rejects(allow=True, exists=True, refs=('b'*40)+'\trefs/heads/main\n', diverged=True)

    def test_empty_private_retry(self):
        result, fake = self.execute(allow=True, exists=True)
        self.assertTrue(fake.pushed)
        self.assertFalse(result['created_by_this_run'])

    def test_unknown_network_failure_does_not_create(self):
        fake = self.rejects(meta_error='Connection timed out')
        self.assertFalse(any(c[:3] == ['gh','repo','create'] for c in fake.calls))

    def test_failed_remote_verification_has_no_success_receipt(self):
        fake = FakeCommands(self.root, bad_verify=True)
        with self.assertRaises(PublishError):
            publish(self.root, runner=fake, check_tools=False)
        self.assertTrue(fake.pushed)
        self.assertFalse((self.root / '.delivery/publish-receipt.json').exists())


if __name__ == '__main__':
    unittest.main()
