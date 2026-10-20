#!/usr/bin/env python3
"""Real-file checks for the isolated evidence storage protocol, not game acceptance."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import lzma
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().with_name("evidence_xz_bundle.py")
ROOT = SCRIPT.parents[1]
EVIDENCE = ROOT / "goal-1" / "evidence"
SPEC = importlib.util.spec_from_file_location("evidence_xz_bundle_for_test", SCRIPT)
assert SPEC is not None and SPEC.loader is not None
BUNDLE = importlib.util.module_from_spec(SPEC)
sys.dont_write_bytecode = True
SPEC.loader.exec_module(BUNDLE)


def container(members: list[dict[str, str]] | None = None) -> bytes:
    return json.dumps({"format": "course-evidence-bundle-v1", "members": members or [
        {"name": "milestone-01.json", "raw": '{ "中文": "晨光🌅", "note": "原文\\n" }\r\n'},
        {"name": "shape-evidence.json", "raw": '{\n  "actual": true,\n  "note": "原 record 字节"\n}\n'},
        {"name": "command-attempts.jsonl", "raw": '{"event":"attempt"}\n{"event":"result"}\n'},
    ]}, ensure_ascii=False, indent=2).encode("utf-8") + b"\n\n"


class EvidenceXzBundleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        # Only this freshly created, untracked task root is removed by these tests.
        cls.temporary = tempfile.TemporaryDirectory(prefix="tmp-xz-bundle-", dir=EVIDENCE)
        cls.task = Path(cls.temporary.name)

    @classmethod
    def tearDownClass(cls) -> None:
        cls.temporary.cleanup()

    def setUp(self) -> None:
        self.folder = self.task / self._testMethodName
        self.folder.mkdir()
        self.output = self.folder / "case-bundle.json.xz"

    def call(self, command: str, path: Path, raw: bytes = b"") -> subprocess.CompletedProcess[bytes]:
        flag = "--output" if command == "pack" else "--input"
        return subprocess.run(["rtk", "proxy", sys.executable, str(SCRIPT), command, flag, str(path)],
                              cwd=ROOT, input=raw, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              timeout=30, check=False)

    def packed(self, raw: bytes | None = None) -> tuple[bytes, dict[str, object]]:
        original = container() if raw is None else raw
        result = self.call("pack", self.output, original)
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        return original, json.loads(result.stdout)

    def rejected_pack(self, raw: bytes, code: bytes) -> None:
        result = self.call("pack", self.output, raw)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(code, result.stderr)
        self.assertEqual(result.stdout, b"")
        self.assertFalse(self.output.exists())

    def test_exact_utf8_container_members_and_record_bytes(self) -> None:
        original, proof = self.packed()
        stored = self.output.read_bytes()
        self.assertEqual(proof["encoding"], "xz")
        self.assertEqual(proof["file"], self.output.name)
        self.assertEqual(proof["storedBytes"], len(stored))
        self.assertEqual(proof["storedSha256"], hashlib.sha256(stored).hexdigest())
        self.assertEqual(proof["containerBytes"], len(original))
        self.assertEqual(proof["containerSha256"], hashlib.sha256(original).hexdigest())
        expected = [{"name": item["name"], "bytes": len(item["raw"].encode("utf-8")),
                     "sha256": hashlib.sha256(item["raw"].encode("utf-8")).hexdigest()}
                    for item in json.loads(original)["members"]]
        self.assertEqual(proof["members"], expected)
        self.assertEqual(lzma.decompress(stored), original)
        restored = self.call("unpack", self.output)
        self.assertEqual(restored.returncode, 0, restored.stderr.decode())
        self.assertEqual(restored.stdout, original)

    def test_existing_output_is_not_overwritten(self) -> None:
        self.packed()
        before = self.output.read_bytes()
        result = self.call("pack", self.output, container([{"name": "different.json", "raw": "different"}]))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"OUTPUT_ALREADY_EXISTS", result.stderr)
        self.assertEqual(self.output.read_bytes(), before)

    def test_corrupted_truncated_and_trailing_data_never_return_partial_stdout(self) -> None:
        self.packed()
        stored = self.output.read_bytes()
        damaged = bytearray(stored)
        damaged[len(damaged) // 2] ^= 0x40
        variants = {"corrupted": bytes(damaged), "truncated": stored[:-1], "empty": b"",
                    "concatenated": stored + stored, "trailing": stored + b"extra bytes"}
        for name, value in variants.items():
            with self.subTest(name=name):
                path = self.folder / (name + ".xz")
                with path.open("xb") as target:
                    target.write(value)
                result = self.call("unpack", path)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stdout, b"")
                self.assertIn(b"EVIDENCE_XZ_BUNDLE:", result.stderr)

    def test_duplicate_and_unsafe_member_names_are_rejected_before_writing(self) -> None:
        for name in ["../escape.json", "/absolute.json", "sub/record.json", "sub\\record.json", ".", ".."]:
            with self.subTest(name=name):
                self.rejected_pack(container([{"name": name, "raw": "all original bytes"}]),
                                   b"SAFE_FLAT_MEMBER_NAME_REQUIRED")
        self.rejected_pack(container([{"name": "same.json", "raw": "first"},
                                      {"name": "same.json", "raw": "second"}]), b"DUPLICATE_MEMBER_NAME")

    def test_invalid_json_utf8_fields_and_duplicate_json_keys_are_rejected(self) -> None:
        cases = [(b"not-json", b"INVALID_UTF8_JSON_CONTAINER"),
                 (b"\xff", b"INVALID_UTF8_JSON_CONTAINER"),
                 (b'{"format":"wrong","members":[]}', b"UNKNOWN_CONTAINER_FORMAT"),
                 (b'{"format":"course-evidence-bundle-v1","members":[],"members":[]}', b"DUPLICATE_JSON_KEY"),
                 (b'{"format":"course-evidence-bundle-v1","members":[{"name":"a","raw":1}]}', b"COMPLETE_RAW_STRING_REQUIRED"),
                 (b'{"format":"course-evidence-bundle-v1","members":[{"name":"a","raw":"\\ud800"}]}', b"INVALID_MEMBER_UTF8")]
        for raw, code in cases:
            with self.subTest(code=code):
                self.rejected_pack(raw, code)

    def test_member_and_count_limits_do_not_strip_original_content(self) -> None:
        raw = "x" * (BUNDLE.MAX_MEMBER_BYTES + 1)
        self.rejected_pack(container([{"name": "too-large.json", "raw": raw}]), b"MEMBER_SIZE_LIMIT")
        self.rejected_pack(container([{"name": f"member-{n}.json", "raw": ""}
                                      for n in range(BUNDLE.MAX_MEMBERS + 1)]), b"MEMBER_COUNT_LIMIT")

    def test_bounded_decompression_rejects_a_small_compression_bomb(self) -> None:
        # Exercise the real file/decoder limit without allocating a 256 MiB test fixture.
        with self.output.open("xb") as target:
            target.write(lzma.compress(container([{"name": "raw.json", "raw": "x" * 2048}]), preset=6))
        with patch.object(BUNDLE, "MAX_CONTAINER_BYTES", 128):
            with self.assertRaisesRegex(BUNDLE.BundleError, "CONTAINER_SIZE_LIMIT"):
                BUNDLE.unpack(str(self.output))

    def test_parent_seal_blocks_nested_write_but_sealed_archive_remains_readable(self) -> None:
        original, _proof = self.packed()
        (self.folder / "sealed-evidence.json").write_text('{"sealed":true}\n')
        nested = self.folder / "nested"
        nested.mkdir()
        target = nested / "new.xz"
        result = self.call("pack", target, container())
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"EVIDENCE_SEALED_USE_NEW_ROOT", result.stderr)
        self.assertFalse(target.exists())
        restored = self.call("unpack", self.output)
        self.assertEqual(restored.returncode, 0, restored.stderr.decode())
        self.assertEqual(restored.stdout, original)

    def test_symlink_directory_and_archive_are_rejected_even_inside_project(self) -> None:
        real = self.folder / "real"
        real.mkdir()
        alias = self.folder / "alias"
        alias.symlink_to(real, target_is_directory=True)
        result = self.call("pack", alias / "new.xz", container())
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"EVIDENCE_DIRECTORY_SYMLINK_OR_NON_DIRECTORY", result.stderr)
        self.assertFalse((real / "new.xz").exists())
        self.packed()
        linked = self.folder / "linked.xz"
        linked.symlink_to(self.output)
        result = self.call("unpack", linked)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"REGULAR_NON_SYMLINK_ARCHIVE_REQUIRED", result.stderr)

    def test_outside_goal_evidence_and_relative_paths_are_refused_without_writes(self) -> None:
        outside = ROOT / "xz-bundle-outside-test.xz"
        self.assertFalse(outside.exists())
        result = self.call("pack", outside, container())
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"PROJECT_GOAL_EVIDENCE_REQUIRED", result.stderr)
        self.assertFalse(outside.exists())
        result = self.call("pack", Path("relative-test.xz"), container())
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"ABSOLUTE_NORMAL_EVIDENCE_PATH_REQUIRED", result.stderr)

    def test_git_tracked_third_level_task_is_refused(self) -> None:
        # Read existing Git identities only; this test never creates a file in an old task.
        result = subprocess.run(["rtk", "proxy", "git", "ls-files", "-z", "--", "goal-1/evidence"],
                                cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30, check=True)
        paths = [value.decode("utf-8").split("/") for value in result.stdout.split(b"\0") if value]
        task = next(parts[2] for parts in paths if len(parts) >= 4)
        with self.assertRaisesRegex(BUNDLE.BundleError, "TRACKED_EVIDENCE_TASK_USE_NEW_ROOT"):
            BUNDLE.assert_untracked_task(EVIDENCE / task)


if __name__ == "__main__":
    unittest.main()
