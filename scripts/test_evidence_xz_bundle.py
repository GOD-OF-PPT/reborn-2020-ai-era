#!/usr/bin/env python3
"""Real-file checks for the isolated evidence storage protocol, not game acceptance."""
from __future__ import annotations

import hashlib
import importlib.util
import json
import lzma
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import threading
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

    def framing_flags(self, raw: bytes) -> list[str]:
        return ["--container-bytes", str(len(raw)), "--container-sha256", hashlib.sha256(raw).hexdigest()]

    def framed_call(self, raw: bytes, flags: list[str] | None = None) -> subprocess.CompletedProcess[bytes]:
        return subprocess.run(["rtk", "proxy", sys.executable, str(SCRIPT), "pack", "--output", str(self.output),
                               *(self.framing_flags(raw) if flags is None else flags)],
                              cwd=ROOT, input=raw, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                              timeout=30, check=False)

    def close_owned_test_process(self, process: subprocess.Popen[bytes]) -> tuple[bytes, bytes]:
        # Close only this test's input/process group. Never touch a matrix or another task.
        if process.stdin is None and process.poll() is not None and process.stdout is not None and process.stdout.closed:
            return b"", b""
        if process.stdin is not None:
            try:
                process.stdin.close()
            except BrokenPipeError:
                pass
            process.stdin = None
        try:
            return process.communicate(timeout=30)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            return process.communicate(timeout=30)

    def pack_while_input_remains_open(self, original: bytes) -> dict[str, object]:
        process = subprocess.Popen(
            ["rtk", "proxy", sys.executable, str(SCRIPT), "pack", "--output", str(self.output),
             *self.framing_flags(original)], cwd=ROOT, stdin=subprocess.PIPE,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, start_new_session=True, bufsize=0)
        write_errors: list[BaseException] = []
        sent = [0]
        input_stream = process.stdin
        assert input_stream is not None

        def write_without_eof() -> None:
            try:
                view = memoryview(original)
                while sent[0] < len(view):
                    size = input_stream.write(view[sent[0]:sent[0] + 64 * 1024])
                    if size is None or size <= 0:
                        raise OSError("TEST_INPUT_WRITE_MADE_NO_PROGRESS")
                    sent[0] += size
                input_stream.flush()
            except (OSError, ValueError) as error:
                # An old helper may reject the flags before accepting the full input.
                write_errors.append(error)

        writer = threading.Thread(target=write_without_eof, daemon=True)
        try:
            # Bound the entire real input transport and child completion, not just the wait
            # after a potentially blocking 48 MiB write. This thread never closes stdin.
            writer.start()
            try:
                code = process.wait(timeout=30)
            except subprocess.TimeoutExpired:
                self.fail("FRAMED_PACK_WAITED_FOR_EOF_AFTER_COMPLETE_CONTAINER")
            stdout, stderr = self.close_owned_test_process(process)
            self.assertEqual(code, 0, stderr.decode("utf-8", errors="replace"))
            writer.join(timeout=1)
            self.assertFalse(writer.is_alive(), "FRAMED_INPUT_WRITER_DID_NOT_FINISH")
            self.assertEqual(write_errors, [])
            self.assertEqual(sent[0], len(original))
            proof = json.loads(stdout)
            self.assertEqual(proof["containerBytes"], len(original))
            self.assertEqual(proof["containerSha256"], hashlib.sha256(original).hexdigest())
            expected = [{"name": item["name"], "bytes": len(item["raw"].encode("utf-8")),
                         "sha256": hashlib.sha256(item["raw"].encode("utf-8")).hexdigest()}
                        for item in json.loads(original)["members"]]
            self.assertEqual(proof["members"], expected)
            self.assertEqual(lzma.decompress(self.output.read_bytes()), original)
            restored = self.call("unpack", self.output)
            self.assertEqual(restored.returncode, 0, restored.stderr.decode())
            self.assertEqual(restored.stdout, original)
            return proof
        finally:
            self.close_owned_test_process(process)
            writer.join(timeout=1)

    def test_framed_complete_utf8_body_exits_without_stdin_eof(self) -> None:
        self.pack_while_input_remains_open(container())

    def test_framed_48_mib_transport_keeps_all_members_without_raw_staging(self) -> None:
        # About 48 MiB of complete raw strings in memory, each below the original 12 MiB limit.
        # Only the small compressed artifact reaches disk; no original JSON staging file.
        members = [{"name": f"milestone-{n:02d}.json", "raw": "原字节🌅\r\n" + "x" * (8 * 1024 * 1024)}
                   for n in range(6)]
        original = container(members)
        self.assertGreater(len(original), 48 * 1024 * 1024)
        self.assertLess(len(original), 49 * 1024 * 1024)
        proof = self.pack_while_input_remains_open(original)
        self.assertEqual(len(proof["members"]), 6)
        self.assertEqual({path.name for path in self.folder.iterdir()}, {self.output.name})

    def test_legacy_complete_body_still_waits_for_eof(self) -> None:
        original = container()
        process = subprocess.Popen(
            ["rtk", "proxy", sys.executable, str(SCRIPT), "pack", "--output", str(self.output)],
            cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            start_new_session=True)
        try:
            assert process.stdin is not None
            process.stdin.write(original)
            process.stdin.flush()
            with self.assertRaises(subprocess.TimeoutExpired):
                process.wait(timeout=2)
            self.assertFalse(self.output.exists())
            stdout, stderr = self.close_owned_test_process(process)
            self.assertEqual(process.returncode, 0, stderr.decode("utf-8", errors="replace"))
            proof = json.loads(stdout)
            self.assertEqual(proof["containerBytes"], len(original))
            self.assertEqual(proof["containerSha256"], hashlib.sha256(original).hexdigest())
            self.assertEqual(lzma.decompress(self.output.read_bytes()), original)
        finally:
            self.close_owned_test_process(process)

    def test_framing_requires_both_valid_flags_and_never_leaves_output(self) -> None:
        raw = container()
        sha = hashlib.sha256(raw).hexdigest()
        variants = [
            ["--container-bytes", str(len(raw))],
            ["--container-sha256", sha],
            ["--container-bytes", "0", "--container-sha256", sha],
            ["--container-bytes", "-1", "--container-sha256", sha],
            ["--container-bytes", "1.5", "--container-sha256", sha],
            ["--container-bytes", "abc", "--container-sha256", sha],
            ["--container-bytes", str(BUNDLE.MAX_CONTAINER_BYTES + 1), "--container-sha256", sha],
            ["--container-bytes", str(len(raw)), "--container-sha256", "short"],
            ["--container-bytes", str(len(raw)), "--container-sha256", "G" * 64],
        ]
        for flags in variants:
            with self.subTest(flags=flags):
                result = self.framed_call(raw, flags)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stdout, b"")
                self.assertFalse(self.output.exists())

    def test_framing_rejects_wrong_length_sha_short_frame_and_empty_body(self) -> None:
        raw = container()
        flags = self.framing_flags(raw)
        cases = [(raw[:-1], flags), (b"", flags),
                 (raw, ["--container-bytes", str(len(raw) - 1), "--container-sha256", hashlib.sha256(raw).hexdigest()]),
                 (raw, ["--container-bytes", str(len(raw)), "--container-sha256", "0" * 64])]
        for body, declared in cases:
            with self.subTest(actualBytes=len(body), flags=declared):
                result = self.framed_call(body, declared)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stdout, b"")
                self.assertFalse(self.output.exists())

    def test_framing_does_not_bypass_complete_json_and_member_validation(self) -> None:
        cases = [b"not-json", b"\xff",
                 b'{"format":"course-evidence-bundle-v1","members":[],"members":[]}',
                 container([{"name": "../escape.json", "raw": "original"}]),
                 container([{"name": "same.json", "raw": "a"}, {"name": "same.json", "raw": "b"}])]
        for body in cases:
            with self.subTest(bodyBytes=len(body)):
                result = self.framed_call(body)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stdout, b"")
                self.assertFalse(self.output.exists())


if __name__ == "__main__":
    unittest.main()
