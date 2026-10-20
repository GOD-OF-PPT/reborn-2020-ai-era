#!/usr/bin/env python3
"""Real, small APFS fixtures for storage_cow_recovery; never apply to the repo.

Run only after the helper is ready.  All mutable files are retained underneath a
fresh storage-cow-tests-rN directory beside this file.  Existing report roots,
symlink ancestors, and sealed-evidence ancestors are refused before fixture IO.
"""

from __future__ import annotations

import argparse
import ctypes
import datetime as dt
import errno
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import pwd
import re
import stat
import subprocess
import sys
import time
import traceback
import unittest


sys.dont_write_bytecode = True
HERE = Path(__file__).absolute().parent
HELPER_FILE = HERE / "storage_cow_recovery.py"
DEFAULT_OUTPUT = HERE / "storage-cow-tests-r1"
REPORT_FORMAT = "storage-cow-self-owned-fixtures-v1"
PAYLOAD = (b"self-owned APFS COW fixture; no game or evidence input\n" * 257)
SOURCE_TIMES = (1_600_000_000_123_456_789, 1_600_000_001_987_654_321)
TARGET_TIMES = (1_610_000_000_987_654_321, 1_610_000_001_123_456_789)
PRESERVED_KEYS = (
    "bytes", "sha256", "mode", "uid", "gid", "atimeNs", "mtimeNs",
    "nlink", "flags", "xattrs", "aclEntries",
)
INSPECT_KEYS = frozenset((*PRESERVED_KEYS, "ctimeNs", "ino"))
HELPER = None
OUTPUT = None
OBSERVATIONS: dict[str, list[dict]] = {}
NATIVE = None


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat()


def refuse_protected_ancestors(path: Path) -> None:
    for ancestor in (path, *path.parents):
        if ancestor.is_symlink():
            raise RuntimeError(f"symlink path component refused: {ancestor}")
        if (ancestor / "sealed-evidence.json").exists():
            raise RuntimeError(f"sealed ancestor refused: {ancestor}")


def exclusive_bytes(path: Path, raw: bytes) -> None:
    with path.open("xb") as handle:
        handle.write(raw)
        handle.flush()
        os.fsync(handle.fileno())


def native_xattr_api():
    global NATIVE
    if NATIVE is None:
        native = ctypes.CDLL("/usr/lib/libSystem.B.dylib", use_errno=True)
        native.listxattr.argtypes = [ctypes.c_char_p, ctypes.c_void_p,
                                     ctypes.c_size_t, ctypes.c_int]
        native.listxattr.restype = ctypes.c_ssize_t
        native.getxattr.argtypes = [ctypes.c_char_p, ctypes.c_char_p,
                                    ctypes.c_void_p, ctypes.c_size_t,
                                    ctypes.c_uint32, ctypes.c_int]
        native.getxattr.restype = ctypes.c_ssize_t
        native.setxattr.argtypes = list(native.getxattr.argtypes)
        native.setxattr.restype = ctypes.c_int
        native.removexattr.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_int]
        native.removexattr.restype = ctypes.c_int
        NATIVE = native
    return NATIVE


def native_checked(value: int, operation: str, path: Path) -> int:
    if value < 0:
        error = ctypes.get_errno()
        raise OSError(error, f"{operation}: {os.strerror(error)}", str(path))
    return value


def actual_xattr_value(path: Path, name: str) -> bytes:
    native = native_xattr_api()
    # XATTR_NOFOLLOW=0x0001, from this machine's Darwin sys/xattr.h.
    size = native_checked(native.getxattr(os.fsencode(path), os.fsencode(name),
                                         None, 0, 0, 1), "getxattr(size)", path)
    value = ctypes.create_string_buffer(max(1, size))
    read = native_checked(native.getxattr(os.fsencode(path), os.fsencode(name),
                                         value, size, 0, 1), "getxattr", path)
    if read != size:
        raise RuntimeError("self-owned xattr changed while independently reading")
    return value.raw[:read]


def actual_xattrs(path: Path) -> dict[str, str]:
    native = native_xattr_api()
    size = native_checked(native.listxattr(os.fsencode(path), None, 0, 1),
                          "listxattr(size)", path)
    if size == 0:
        return {}
    names = ctypes.create_string_buffer(size)
    read = native_checked(native.listxattr(os.fsencode(path), names, size, 1),
                          "listxattr", path)
    if read != size:
        raise RuntimeError("self-owned xattr names changed while reading")
    listed = sorted(os.fsdecode(name) for name in names.raw[:read].split(b"\0")
                    if name)
    return {name: actual_xattr_value(path, name).hex() for name in listed}


def create_actual_xattr(path: Path, name: str, value: bytes) -> None:
    native = native_xattr_api()
    raw = ctypes.create_string_buffer(value)
    # NOFOLLOW | CREATE: only the fresh named fixture attribute is created.
    native_checked(native.setxattr(os.fsencode(path), os.fsencode(name), raw,
                                   len(value), 0, 3), "setxattr", path)


def actual_acl_entries(path: Path) -> list[str]:
    """Read the native ACL presentation independently of the helper's ACL API."""
    completed = subprocess.run(
        ["/bin/ls", "-lde", str(path)],
        text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True,
        env={**os.environ, "LC_ALL": "C"},
    )
    return [line.strip() for line in completed.stdout.splitlines()[1:]
            if re.match(r"\s*\d+:\s", line)]


def actual_snapshot(path: Path) -> dict:
    """Read-only independent probe; report atime before and after our own reads."""
    before = path.lstat()
    if not stat.S_ISREG(before.st_mode):
        raise RuntimeError(f"fixture snapshot requires a regular file: {path}")
    raw = path.read_bytes()
    attrs = actual_xattrs(path)
    acls = actual_acl_entries(path)
    after = path.lstat()
    return {
        "bytes": len(raw), "sha256": digest(raw),
        "mode": stat.S_IMODE(before.st_mode),
        "uid": before.st_uid, "gid": before.st_gid,
        "atimeNs": before.st_atime_ns, "mtimeNs": before.st_mtime_ns,
        "ctimeNs": before.st_ctime_ns, "ino": before.st_ino,
        "nlink": before.st_nlink, "flags": before.st_flags,
        "xattrs": attrs, "aclEntries": acls,
        "probeReadAtimeAfterNs": after.st_atime_ns,
    }


def prepared_snapshot(path: Path) -> dict:
    """Fixture setup only: restore controlled input times before the operation."""
    snapshot = actual_snapshot(path)
    os.utime(path, ns=(snapshot["atimeNs"], snapshot["mtimeNs"]),
             follow_symlinks=False)
    snapshot["ctimeNs"] = path.lstat().st_ctime_ns
    snapshot["probeReadAtimeAfterNs"] = snapshot["atimeNs"]
    return snapshot


def preserved(snapshot: dict, *, atime: bool = True) -> dict:
    return {key: snapshot[key] for key in PRESERVED_KEYS
            if atime or key != "atimeNs"}


def load_helper():
    spec = importlib.util.spec_from_file_location(
        "self_owned_storage_cow_recovery", HELPER_FILE)
    if spec is None or spec.loader is None:
        raise RuntimeError("cannot load the exact adjacent recovery helper")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    for required in ("Recovery", "clone_strict"):
        if not hasattr(module, required):
            raise RuntimeError(f"missing helper API: {required}")
    return module


class InjectedFailure(RuntimeError):
    pass


class CowRecoveryFixtures(unittest.TestCase):
    def setUp(self) -> None:
        if HELPER is None or OUTPUT is None:
            raise RuntimeError("use this file's guarded report runner")
        self.case_dir = OUTPUT / "fixtures" / self._testMethodName
        self.case_dir.mkdir(parents=True, exist_ok=False)
        self.root = self.case_dir / "workspace"
        self.scope = self.root / ".delivery"
        self.scope.mkdir(parents=True, exist_ok=False)
        self.rec = HELPER.Recovery(self.root)
        OBSERVATIONS[self.id()] = []

    def observe(self, **values) -> None:
        OBSERVATIONS[self.id()].append(values)

    def new_file(self, relative: str, *, raw: bytes = PAYLOAD,
                 mode: int = 0o640, times=TARGET_TIMES) -> Path:
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        exclusive_bytes(path, raw)
        os.chmod(path, mode, follow_symlinks=False)
        os.utime(path, ns=times, follow_symlinks=False)
        # Only construct this run's deliberately clean *new input fixtures*.
        # Never remove attributes from old runs, clone outputs, or real assets.
        automatic = actual_xattrs(path)
        if "com.apple.provenance" in automatic:
            self.assertTrue(path.is_relative_to(self.root))
            native_checked(native_xattr_api().removexattr(
                os.fsencode(path), b"com.apple.provenance", 1),
                "remove newly created fixture provenance", path)
            self.observe(fixtureSetupRemovedAutomaticProvenance={
                "path": path.relative_to(self.root).as_posix(),
                "originalHex": automatic["com.apple.provenance"],
                "freshInputFixtureOnly": True,
            })
        self.assertEqual(actual_xattrs(path), {}, "fresh clean fixture has unknown attributes")
        return path

    def pair(self) -> tuple[Path, Path]:
        src = self.new_file(".delivery/build-a/memory-v1-fixture-source.jpg",
                            mode=0o600, times=SOURCE_TIMES)
        dst = self.new_file(".delivery/build-b/memory-v1-fixture-target.jpg")
        self.assertEqual(src.stat().st_dev, dst.stat().st_dev)
        self.assertNotEqual(src.stat().st_ino, dst.stat().st_ino)
        return src, dst

    def assert_refused_unchanged(self, src: Path, dst: Path,
                                *, expected_reason: str | tuple[str, ...],
                                rec=None) -> Exception:
        rec = self.rec if rec is None else rec
        before = prepared_snapshot(dst)
        source_before = prepared_snapshot(src)
        with self.assertRaises(Exception) as caught:
            rec.replace_one(src, dst)
        self.assertNotIsInstance(caught.exception, (TypeError, AttributeError,
                                                  NotImplementedError))
        reasons = ((expected_reason,) if isinstance(expected_reason, str)
                   else expected_reason)
        self.assertTrue(any(reason in str(caught.exception) for reason in reasons),
                        f"unrelated error is not proof of rejection: {caught.exception!r}")
        after = actual_snapshot(dst)
        source_after = actual_snapshot(src)
        self.assertEqual(preserved(after, atime=False), preserved(before, atime=False))
        self.assertEqual(after["ino"], before["ino"])
        self.assertEqual(after["ctimeNs"], before["ctimeNs"])
        self.assertEqual(preserved(source_after, atime=False),
                         preserved(source_before, atime=False))
        self.assertEqual(source_after["ino"], source_before["ino"])
        self.assertEqual(source_after["ctimeNs"], source_before["ctimeNs"])
        self.observe(refusal=repr(caught.exception), before=before, after=after,
                     sourceBefore=source_before, sourceAfter=source_after)
        return caught.exception

    def test_clone_strict_creates_distinct_inode_and_private_writes(self) -> None:
        src = self.new_file(".delivery/build-a/memory-v1-source.jpg",
                            mode=0o600, times=SOURCE_TIMES)
        dst = self.scope / "build-a" / "memory-v1-clone.jpg"
        HELPER.clone_strict(src, dst)
        initial_src, initial_dst = actual_snapshot(src), actual_snapshot(dst)
        self.assertEqual(initial_src["sha256"], initial_dst["sha256"])
        self.assertEqual(initial_src["bytes"], initial_dst["bytes"])
        self.assertNotEqual(initial_src["ino"], initial_dst["ino"])
        self.assertEqual((initial_src["nlink"], initial_dst["nlink"]), (1, 1))
        marker = b"COW independent fixture write\n"
        with dst.open("r+b") as handle:
            handle.write(marker)
            handle.flush()
            os.fsync(handle.fileno())
        self.assertEqual(src.read_bytes(), PAYLOAD)
        self.assertEqual(dst.read_bytes(), marker + PAYLOAD[len(marker):])
        self.observe(beforeSource=initial_src, beforeClone=initial_dst,
                     sourceAfterSha256=digest(src.read_bytes()),
                     cloneAfterSha256=digest(dst.read_bytes()),
                     actualCloneFileCall=True, independentWriteObserved=True)

    def test_clone_strict_existing_destination_eexist_preserves_both(self) -> None:
        src, dst = self.pair()
        original = b"different existing destination must survive\n"
        with dst.open("wb") as handle:
            handle.write(original)
        before_src, before_dst = src.read_bytes(), dst.read_bytes()
        old_inodes = (src.stat().st_ino, dst.stat().st_ino)
        with self.assertRaises(OSError) as caught:
            HELPER.clone_strict(src, dst)
        self.assertEqual(caught.exception.errno, errno.EEXIST)
        self.assertEqual(src.read_bytes(), before_src)
        self.assertEqual(dst.read_bytes(), before_dst)
        self.assertEqual((src.stat().st_ino, dst.stat().st_ino), old_inodes)
        self.observe(errno=caught.exception.errno,
                     sourceSha256=digest(before_src), targetSha256=digest(before_dst),
                     inodeBefore=list(old_inodes),
                     inodeAfter=[src.stat().st_ino, dst.stat().st_ino])

    def test_replace_preserves_target_mode_and_nanosecond_times(self) -> None:
        src, dst = self.pair()
        before_source, before = prepared_snapshot(src), prepared_snapshot(dst)
        self.assertNotEqual(before_source["mode"], before["mode"])
        self.assertNotEqual(before_source["atimeNs"], before["atimeNs"])
        self.assertNotEqual(before_source["mtimeNs"], before["mtimeNs"])
        report = self.rec.replace_one(src, dst)
        # Stat precedes any independent post-operation data read.
        after = actual_snapshot(dst)
        after_source = actual_snapshot(src)
        self.assertEqual(preserved(after), preserved(before))
        self.assertNotEqual(after["ino"], before["ino"])
        self.assertNotEqual(after["ino"], after_source["ino"])
        self.assertEqual(after["nlink"], 1)
        self.assertEqual(preserved(after_source, atime=False),
                         preserved(before_source, atime=False))
        self.assertEqual(after_source["ino"], before_source["ino"])
        self.assertEqual(after_source["ctimeNs"], before_source["ctimeNs"])
        self.assertEqual(dst.read_bytes(), PAYLOAD)
        projected = self.rec.inspect(dst)
        self.assertTrue(INSPECT_KEYS.issubset(projected.keys()))
        self.assertEqual(projected["bytes"], len(PAYLOAD))
        self.assertEqual(projected["sha256"], digest(PAYLOAD))
        self.assertEqual(projected["ino"], after["ino"])
        self.assertEqual(projected["nlink"], 1)
        self.observe(before=before, after=after, sourceBefore=before_source,
                     sourceAfter=after_source, helperReport=report,
                     helperInspection=projected,
                     inodeAndCtimeIdentityPreservationClaimed=False)

    def run_fault(self, expected_stage: str) -> None:
        src, dst = self.pair()
        before, source_before = prepared_snapshot(dst), prepared_snapshot(src)
        stages: list[str] = []
        def fault(stage: str) -> None:
            stages.append(stage)
            if stage == expected_stage:
                raise InjectedFailure(f"owned-fixture-fault:{stage}")
        with self.assertRaises(Exception) as caught:
            self.rec.replace_one(src, dst, fault=fault)
        self.assertIn(expected_stage, stages)
        self.assertNotIsInstance(caught.exception, (TypeError, AttributeError,
                                                  NotImplementedError))
        after, source_after = actual_snapshot(dst), actual_snapshot(src)
        self.assertEqual(preserved(after, atime=expected_stage == "after_replace"),
                         preserved(before, atime=expected_stage == "after_replace"))
        self.assertEqual(preserved(source_after, atime=False),
                         preserved(source_before, atime=False))
        self.assertEqual(source_after["ino"], source_before["ino"])
        self.assertEqual(source_after["ctimeNs"], source_before["ctimeNs"])
        if expected_stage == "before_replace":
            self.assertEqual(after["ino"], before["ino"])
            self.assertEqual(after["ctimeNs"], before["ctimeNs"])
            self.assertNotIn("after_replace", stages)
        self.observe(faultStage=expected_stage, observedStages=stages,
                     error=repr(caught.exception), before=before, after=after,
                     sourceBefore=source_before, sourceAfter=source_after,
                     inodeAndCtimeIdentityPreservationClaimed=False)

    def test_fault_before_replace_preserves_existing_target(self) -> None:
        self.run_fault("before_replace")

    def test_fault_after_replace_restores_bytes_and_metadata(self) -> None:
        self.run_fault("after_replace")

    def test_refuses_real_target_xattr(self) -> None:
        src, dst = self.pair()
        name = "com.codex.storage-cow-fixture"
        value = b"owned fixture attribute must not be discarded\x00\xff"
        create_actual_xattr(dst, name, value)
        self.assertEqual(actual_xattr_value(dst, name), value)
        with self.assertRaises(HELPER.CowError) as inspected:
            self.rec.inspect(dst)
        self.assertIn("XATTR_UNSUPPORTED", str(inspected.exception))
        self.observe(unsafeInspectRefusal=str(inspected.exception),
                     actualXattrs=actual_xattrs(dst))
        self.assert_refused_unchanged(src, dst, expected_reason="XATTR_UNSUPPORTED")
        self.assertEqual(actual_xattr_value(dst, name), value)

    def test_refuses_real_source_xattr(self) -> None:
        src, dst = self.pair()
        create_actual_xattr(src, "com.codex.storage-cow-fixture", b"source-attribute")
        self.assert_refused_unchanged(src, dst, expected_reason="XATTR_UNSUPPORTED")

    def test_refuses_symlink_source(self) -> None:
        src, dst = self.pair()
        link = src.with_name("memory-v1-fixture-symlink-source.jpg")
        link.symlink_to(src.name)
        before, source_before = prepared_snapshot(dst), prepared_snapshot(src)
        with self.assertRaises(Exception) as caught:
            self.rec.replace_one(link, dst)
        self.assertNotIsInstance(caught.exception, (TypeError, AttributeError))
        self.assertIn("REGULAR_FILE_REQUIRED", str(caught.exception))
        self.assertTrue(link.is_symlink())
        after, source_after = actual_snapshot(dst), actual_snapshot(src)
        self.assertEqual(preserved(after, atime=False), preserved(before, atime=False))
        self.assertEqual(after["ino"], before["ino"])
        self.assertEqual(preserved(source_after, atime=False),
                         preserved(source_before, atime=False))
        self.observe(refusal=repr(caught.exception), before=before, after=after,
                     sourceSymlinkStillPresent=link.is_symlink())

    def test_refuses_symlink_destination(self) -> None:
        src, dst = self.pair()
        link = dst.with_name("memory-v1-fixture-symlink-destination.jpg")
        link.symlink_to(dst.name)
        before, source_before = prepared_snapshot(dst), prepared_snapshot(src)
        with self.assertRaises(Exception) as caught:
            self.rec.replace_one(src, link)
        self.assertNotIsInstance(caught.exception, (TypeError, AttributeError))
        self.assertIn("REGULAR_FILE_REQUIRED", str(caught.exception))
        self.assertTrue(link.is_symlink())
        after = actual_snapshot(dst)
        self.assertEqual(preserved(after, atime=False), preserved(before, atime=False))
        self.assertEqual(after["ino"], before["ino"])
        self.assertEqual(preserved(actual_snapshot(src), atime=False),
                         preserved(source_before, atime=False))
        self.observe(refusal=repr(caught.exception), before=before, after=after,
                     targetSymlinkStillPresent=link.is_symlink())

    def test_refuses_hardlinked_destination(self) -> None:
        src, dst = self.pair()
        other = dst.with_name("memory-v1-fixture-hardlink.jpg")
        os.link(dst, other)
        self.assertEqual(dst.stat().st_nlink, 2)
        self.assert_refused_unchanged(src, dst, expected_reason="INDEPENDENT_NLINK_ONE_REQUIRED")
        self.assertEqual(other.stat().st_ino, dst.stat().st_ino)
        self.assertEqual(other.read_bytes(), PAYLOAD)

    def test_refuses_hardlinked_source(self) -> None:
        src, dst = self.pair()
        other = src.with_name("memory-v1-fixture-source-hardlink.jpg")
        os.link(src, other)
        self.assertEqual(src.stat().st_nlink, 2)
        self.assert_refused_unchanged(src, dst, expected_reason="INDEPENDENT_NLINK_ONE_REQUIRED")
        self.assertEqual(other.stat().st_ino, src.stat().st_ino)

    def test_refuses_equal_length_different_bytes(self) -> None:
        src, dst = self.pair()
        changed = bytes([PAYLOAD[0] ^ 1]) + PAYLOAD[1:]
        with dst.open("wb") as handle:
            handle.write(changed)
        self.assertEqual(src.stat().st_size, dst.stat().st_size)
        self.assertNotEqual(digest(src.read_bytes()), digest(dst.read_bytes()))
        self.assert_refused_unchanged(src, dst, expected_reason="COMPLETE_BYTES_DIFFER")

    def test_refuses_destination_outside_delivery_scope(self) -> None:
        src, _ = self.pair()
        outside = self.new_file("outside-delivery/memory-v1-fixture-target.jpg")
        self.assert_refused_unchanged(src, outside, expected_reason="DELIVERY_SCOPE_REQUIRED")

    def test_refuses_tracked_destination(self) -> None:
        src, dst = self.pair()
        relative = dst.relative_to(self.root).as_posix()
        rec = HELPER.Recovery(self.root, tracked_paths=frozenset({relative}))
        self.assert_refused_unchanged(src, dst, rec=rec, expected_reason="TRACKED_OR_FROZEN_FILE")

    def test_refuses_frozen_destination(self) -> None:
        src, dst = self.pair()
        relative = dst.relative_to(self.root).as_posix()
        rec = HELPER.Recovery(self.root, frozen_paths=frozenset({relative}))
        self.assert_refused_unchanged(src, dst, rec=rec, expected_reason="TRACKED_OR_FROZEN_FILE")

    def test_refuses_setuid_destination(self) -> None:
        src, dst = self.pair()
        os.chmod(dst, 0o4640, follow_symlinks=False)
        self.assertTrue(dst.stat().st_mode & stat.S_ISUID)
        self.assert_refused_unchanged(src, dst, expected_reason="SPECIAL_MODE_UNSUPPORTED")

    def test_refuses_special_flags_destination(self) -> None:
        src, dst = self.pair()
        os.chflags(dst, stat.UF_HIDDEN, follow_symlinks=False)
        self.assertTrue(dst.stat().st_flags & stat.UF_HIDDEN)
        self.assert_refused_unchanged(src, dst, expected_reason="SPECIAL_FLAGS_UNSUPPORTED")

    def test_refuses_real_extended_acl_destination(self) -> None:
        src, dst = self.pair()
        completed = subprocess.run(
            ["/bin/chmod", "+a",
             f"user:{pwd.getpwuid(os.getuid()).pw_name} allow read", str(dst)],
            text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            check=True,
        )
        entries = actual_acl_entries(dst)
        self.assertTrue(entries)
        with self.assertRaises(HELPER.CowError) as inspected:
            self.rec.inspect(dst)
        self.assertTrue(any(reason in str(inspected.exception) for reason in
                            ("EXTENDED_ACL_UNSUPPORTED", "XATTR_UNSUPPORTED")))
        self.observe(unsafeInspectRefusal=str(inspected.exception))
        self.assert_refused_unchanged(src, dst, expected_reason=(
            "EXTENDED_ACL_UNSUPPORTED", "XATTR_UNSUPPORTED"))
        self.assertEqual(actual_acl_entries(dst), entries)
        self.observe(aclEntries=entries, chmodStderr=completed.stderr)

    def test_refuses_symlink_parent_directory(self) -> None:
        src, dst = self.pair()
        linked_directory = self.scope / "symlinked-build"
        linked_directory.symlink_to(dst.parent.name, target_is_directory=True)
        indirect = linked_directory / dst.name
        before = prepared_snapshot(dst)
        with self.assertRaises(Exception) as caught:
            self.rec.replace_one(src, indirect)
        self.assertNotIsInstance(caught.exception, (TypeError, AttributeError))
        self.assertIn("PARENT_SYMLINK_OR_NON_DIRECTORY", str(caught.exception))
        after = actual_snapshot(dst)
        self.assertEqual(preserved(after, atime=False), preserved(before, atime=False))
        self.assertEqual(after["ino"], before["ino"])
        self.assertTrue(linked_directory.is_symlink())
        self.observe(refusal=repr(caught.exception), before=before, after=after)

    def test_find_candidates_is_dry_run_and_excludes_current_deliveries(self) -> None:
        paths = [
            self.new_file(".delivery/build-a/assets/memory-v1-shared-fixture.jpg",
                          mode=0o600, times=SOURCE_TIMES),
            self.new_file(".delivery/build-b/assets/memory-v1-shared-fixture.jpg"),
            self.new_file(".delivery/t17-risk-final/assets/memory-v1-shared-fixture.jpg"),
            self.new_file(".delivery/t17-course-r10/assets/memory-v1-shared-fixture.jpg"),
            self.new_file(".delivery/build-c/assets/unrelated-fixture.jpg"),
        ]
        before = {p.relative_to(self.root).as_posix(): prepared_snapshot(p)
                  for p in paths}
        found = self.rec.find_candidates(("memory-v1",))
        self.assertEqual(found["groups"], ["memory-v1"])
        self.assertIsInstance(found["eligible"], list)
        self.assertIsInstance(found["skipped"], list)
        self.assertIsInstance(found["inspected"], int)
        self.assertGreaterEqual(found["inspected"], 2)
        self.assertEqual(len(found["eligible"]), 1)
        row = found["eligible"][0]
        expected_pair = {p.relative_to(self.root).as_posix() for p in paths[:2]}
        self.assertEqual({row["src"], row["dst"]}, expected_pair)
        self.assertEqual(row["bytes"], len(PAYLOAD))
        self.assertEqual(row["sha256"], digest(PAYLOAD))
        for excluded in ("t17-risk-final", "t17-course-r10"):
            self.assertTrue(any(
                excluded in Path(item["path"]).parts and item["reason"]
                for item in found["skipped"]
            ), f"missing explicit dry-run exclusion: {excluded}")
        after = {p.relative_to(self.root).as_posix(): actual_snapshot(p)
                 for p in paths}
        for relative in before:
            self.assertEqual(preserved(after[relative], atime=False),
                             preserved(before[relative], atime=False))
            self.assertEqual(after[relative]["ino"], before[relative]["ino"])
            self.assertEqual(after[relative]["ctimeNs"], before[relative]["ctimeNs"])
        self.assertIn("targetFirstSeen", row)
        first_seen = row["targetFirstSeen"]
        self.assertEqual(first_seen["atimeNs"], before[row["dst"]]["atimeNs"])
        self.assertEqual(first_seen["mtimeNs"], before[row["dst"]]["mtimeNs"])
        report = self.rec.replace_one(self.root / row["src"], self.root / row["dst"],
                                      target_snapshot=first_seen)
        installed = actual_snapshot(self.root / row["dst"])
        self.assertEqual(preserved(installed), preserved(before[row["dst"]]))
        self.assertNotEqual(installed["ino"], before[row["dst"]]["ino"])
        self.observe(dryRun=found, before=before, afterReadOnlyScan=after,
                     afterExplicitOwnedApply=installed, ownedApplyReport=report,
                     naturalAtimeChanges={relative: {
                         "before": before[relative]["atimeNs"],
                         "after": after[relative]["atimeNs"]}
                         for relative in before})

    def test_external_same_inode_write_after_first_swap_is_retained(self) -> None:
        src, dst = self.pair()
        source_before, target_before = prepared_snapshot(src), prepared_snapshot(dst)
        original_swap = HELPER.swap_strict
        calls: list[dict] = []
        external_raw = b"EXTERNAL OWNED FIXTURE WRITE\n" + PAYLOAD[29:]
        external_ino = None

        def swap_then_external_write(left: Path, right: Path) -> None:
            nonlocal external_ino
            original_swap(left, right)
            calls.append({"left": str(left), "right": str(right)})
            if len(calls) == 1:
                external_ino = dst.lstat().st_ino
                with dst.open("r+b") as handle:
                    handle.write(external_raw)
                    handle.truncate(len(external_raw))
                    handle.flush()
                    os.fsync(handle.fileno())

        HELPER.swap_strict = swap_then_external_write
        try:
            with self.assertRaises(HELPER.CowError) as caught:
                self.rec.replace_one(src, dst)
        finally:
            HELPER.swap_strict = original_swap
        self.assertEqual(len(calls), 1, "external installed content must not be swapped away")
        self.assertEqual(dst.lstat().st_ino, external_ino)
        self.assertEqual(dst.read_bytes(), external_raw)
        self.assertEqual(src.read_bytes(), PAYLOAD)
        old_inode_paths = [path for path in self.scope.rglob("*")
                           if path.is_file() and not path.is_symlink()
                           and path.lstat().st_ino == target_before["ino"]]
        self.assertTrue(old_inode_paths, "actual displaced original must remain retained")
        for retained in old_inode_paths:
            self.assertEqual(retained.read_bytes(), PAYLOAD)
        source_after = actual_snapshot(src)
        self.assertEqual(preserved(source_after, atime=False),
                         preserved(source_before, atime=False))
        self.assertEqual(source_after["ctimeNs"], source_before["ctimeNs"])
        self.observe(error=repr(caught.exception),
                     helperFailureReport=getattr(caught.exception, "report", None),
                     realAtomicSwaps=calls, externalInode=external_ino,
                     externalBytes=len(external_raw), externalSha256=digest(external_raw),
                     retainedDisplacedOriginalPaths=[str(p) for p in old_inode_paths],
                     sourceBefore=source_before, sourceAfter=source_after)


class RecordingResult(unittest.TextTestResult):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.rows: list[dict] = []
        self.started: dict[str, float] = {}

    def startTest(self, test):
        self.started[test.id()] = time.monotonic()
        super().startTest(test)

    def row(self, test, status, detail=None):
        self.rows.append({
            "id": test.id(), "status": status,
            "seconds": time.monotonic() - self.started[test.id()],
            "detail": detail, "observations": OBSERVATIONS.get(test.id(), []),
        })

    def addSuccess(self, test):
        self.row(test, "passed")
        super().addSuccess(test)

    def addFailure(self, test, err):
        self.row(test, "failed", self._exc_info_to_string(err, test))
        super().addFailure(test, err)

    def addError(self, test, err):
        self.row(test, "error", self._exc_info_to_string(err, test))
        super().addError(test, err)

    def addSkip(self, test, reason):
        self.row(test, "skipped", reason)
        super().addSkip(test, reason)


def main() -> int:
    global HELPER, OUTPUT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    output = args.output_dir.absolute()
    if output.parent != HERE or not re.fullmatch(r"storage-cow-tests-r[1-9]\d*",
                                                output.name):
        raise RuntimeError("report must use a fresh adjacent storage-cow-tests-rN")
    refuse_protected_ancestors(output)
    output.mkdir(exist_ok=False)
    OUTPUT = output
    started_at = utc_now()
    stream = io.StringIO()
    test_raw = Path(__file__).read_bytes()
    report = {
        "format": REPORT_FORMAT, "startedAt": started_at,
        "scope": "new self-owned fixture roots only",
        "realDeliveryOrMatrixTouched": False,
        "compatibilityDevelopmentOrTests": False,
        "helper": {"file": str(HELPER_FILE)},
        "test": {"file": str(Path(__file__).absolute()), "bytes": len(test_raw),
                 "sha256": digest(test_raw)},
        "platform": {"system": sys.platform, "python": sys.version},
        "passed": False,
    }
    exit_code = 1
    try:
        if sys.platform != "darwin":
            raise RuntimeError("real Darwin clone fixtures require macOS")
        helper_raw = HELPER_FILE.read_bytes()
        report["helper"].update({"bytes": len(helper_raw),
                                "sha256": digest(helper_raw)})
        HELPER = load_helper()
        registered = unittest.defaultTestLoader.getTestCaseNames(CowRecoveryFixtures)
        report["registeredTests"] = registered
        suite = unittest.defaultTestLoader.loadTestsFromTestCase(CowRecoveryFixtures)
        runner = unittest.TextTestRunner(stream=stream, verbosity=2,
                                         resultclass=RecordingResult)
        result = runner.run(suite)
        report.update({
            "testsRun": result.testsRun,
            "passedCount": sum(row["status"] == "passed" for row in result.rows),
            "failureCount": len(result.failures), "errorCount": len(result.errors),
            "skippedCount": len(result.skipped), "cases": result.rows,
            "passed": result.wasSuccessful() and not result.skipped,
        })
        if result.testsRun != len(registered):
            raise RuntimeError("registered fixture set did not execute completely")
        source_stable = (HELPER_FILE.read_bytes() == helper_raw
                         and Path(__file__).read_bytes() == test_raw)
        report["helperAndTestSourcesUnchanged"] = source_stable
        if not source_stable:
            report["passed"] = False
            raise RuntimeError("helper or test source changed during fixture execution")
        exit_code = 0 if report["passed"] else 1
    except BaseException:
        detail = traceback.format_exc()
        report["passed"] = False
        report["fatalError"] = detail
        stream.write(detail)
    finally:
        report["finishedAt"] = utc_now()
        report["exitCode"] = exit_code
        report["fixturesRetained"] = str(output / "fixtures")
        raw_json = (json.dumps(report, ensure_ascii=False, indent=2,
                               default=str) + "\n").encode()
        text = stream.getvalue() + "\n" + json.dumps({
            "format": REPORT_FORMAT, "passed": report["passed"],
            "exitCode": exit_code, "report": str(output / "report.json"),
            "reportSha256": digest(raw_json),
        }, ensure_ascii=False) + "\n"
        exclusive_bytes(output / "report.json", raw_json)
        exclusive_bytes(output / "report.txt", text.encode())
        print(text, end="")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
