#!/usr/bin/env python3
"""Store exact evidence containers; validate before writing or returning any bytes."""
from __future__ import annotations

import argparse
import hashlib
import json
import lzma
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
from typing import BinaryIO


PROJECT_ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_ROOT = PROJECT_ROOT / "goal-1" / "evidence"
FORMAT = "course-evidence-bundle-v1"
MAX_CONTAINER_BYTES = 256 * 1024 * 1024
MAX_MEMBER_BYTES = 12 * 1024 * 1024
MAX_MEMBERS = 512
# Includes the small framing overhead of an incompressible maximum-size container.
MAX_ARCHIVE_BYTES = MAX_CONTAINER_BYTES + 1024 * 1024
DECOMPRESS_MEMORY_LIMIT = 64 * 1024 * 1024
CHUNK_BYTES = 64 * 1024
SAFE_NAME = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]*\Z")


class BundleError(ValueError):
    """A failed evidence boundary; never a successful partial bundle."""


def require(condition: bool, code: str) -> None:
    if not condition:
        raise BundleError(code)


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def unique_object(pairs: list[tuple[str, object]]) -> dict[str, object]:
    result: dict[str, object] = {}
    for key, value in pairs:
        require(key not in result, "DUPLICATE_JSON_KEY")
        result[key] = value
    return result


def reject_constant(_value: str) -> None:
    raise BundleError("NON_JSON_CONSTANT")


def validate_container(raw: bytes) -> tuple[list[dict[str, object]], list[dict[str, str]]]:
    require(len(raw) <= MAX_CONTAINER_BYTES, "CONTAINER_SIZE_LIMIT")
    try:
        value = json.loads(raw.decode("utf-8", errors="strict"),
                           object_pairs_hook=unique_object, parse_constant=reject_constant)
    except (UnicodeError, json.JSONDecodeError, RecursionError) as error:
        raise BundleError("INVALID_UTF8_JSON_CONTAINER") from error
    require(isinstance(value, dict) and set(value) == {"format", "members"}, "INVALID_CONTAINER_FIELDS")
    require(value["format"] == FORMAT, "UNKNOWN_CONTAINER_FORMAT")
    members = value["members"]
    require(isinstance(members, list) and 0 < len(members) <= MAX_MEMBERS, "MEMBER_COUNT_LIMIT")
    seen: set[str] = set()
    descriptors: list[dict[str, object]] = []
    for member in members:
        require(isinstance(member, dict) and set(member) == {"name", "raw"}, "INVALID_MEMBER_FIELDS")
        name, text = member["name"], member["raw"]
        require(isinstance(name, str) and len(name) <= 255 and SAFE_NAME.fullmatch(name) is not None,
                "SAFE_FLAT_MEMBER_NAME_REQUIRED")
        require(name not in seen, "DUPLICATE_MEMBER_NAME")
        seen.add(name)
        require(isinstance(text, str), "COMPLETE_RAW_STRING_REQUIRED")
        try:
            original = text.encode("utf-8", errors="strict")
        except UnicodeError as error:
            raise BundleError("INVALID_MEMBER_UTF8") from error
        require(len(original) <= MAX_MEMBER_BYTES, "MEMBER_SIZE_LIMIT")
        descriptors.append({"name": name, "bytes": len(original), "sha256": digest(original)})
    return descriptors, members


def checked_evidence_path(argument: str, *, writing: bool) -> Path:
    require(os.path.isabs(argument) and os.path.normpath(argument) == argument,
            "ABSOLUTE_NORMAL_EVIDENCE_PATH_REQUIRED")
    path = Path(argument)
    try:
        relative = path.relative_to(EVIDENCE_ROOT)
    except ValueError as error:
        raise BundleError("PROJECT_GOAL_EVIDENCE_REQUIRED") from error
    require(len(relative.parts) >= 2, "NEW_TASK_EVIDENCE_ROOT_REQUIRED")
    require(SAFE_NAME.fullmatch(relative.parts[0]) is not None, "SAFE_TASK_EVIDENCE_ROOT_REQUIRED")
    require(SAFE_NAME.fullmatch(path.name) is not None and path.name.endswith(".xz"),
            "SAFE_XZ_FILENAME_REQUIRED")
    # Check each physical ancestor, including symlinks which remain within the project.
    for current in (path.parent, *path.parent.parents):
        info = current.lstat()
        require(stat.S_ISDIR(info.st_mode) and not stat.S_ISLNK(info.st_mode),
                "EVIDENCE_DIRECTORY_SYMLINK_OR_NON_DIRECTORY")
    if writing:
        current = path.parent
        while True:
            require(not os.path.lexists(current / "sealed-evidence.json"), "EVIDENCE_SEALED_USE_NEW_ROOT")
            if current == EVIDENCE_ROOT:
                break
            current = current.parent
        assert_untracked_task(EVIDENCE_ROOT / relative.parts[0])
        require(not os.path.lexists(path), "OUTPUT_ALREADY_EXISTS")
    else:
        info = path.lstat()
        require(stat.S_ISREG(info.st_mode) and not stat.S_ISLNK(info.st_mode),
                "REGULAR_NON_SYMLINK_ARCHIVE_REQUIRED")
    return path


def assert_untracked_task(task: Path) -> None:
    relative = task.relative_to(PROJECT_ROOT).as_posix()
    try:
        result = subprocess.run(
            ["rtk", "proxy", "git", "--literal-pathspecs", "ls-files", "-z", "--", relative],
            cwd=PROJECT_ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30, check=False)
    except (OSError, subprocess.SubprocessError) as error:
        raise BundleError("CANNOT_VERIFY_EVIDENCE_TASK_TRACKING") from error
    require(result.returncode == 0, "CANNOT_VERIFY_EVIDENCE_TASK_TRACKING")
    require(not result.stdout, "TRACKED_EVIDENCE_TASK_USE_NEW_ROOT")


def decompress_path(path: Path) -> tuple[bytes, int, str]:
    """Accept one complete XZ stream, with bounded output and decoder dictionary."""
    decoder = lzma.LZMADecompressor(format=lzma.FORMAT_XZ, memlimit=DECOMPRESS_MEMORY_LIMIT)
    output = bytearray()
    stored_hash = hashlib.sha256()
    stored_bytes = 0
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(descriptor, "rb") as source:
        info = os.fstat(source.fileno())
        require(stat.S_ISREG(info.st_mode), "REGULAR_NON_SYMLINK_ARCHIVE_REQUIRED")
        require(info.st_size <= MAX_ARCHIVE_BYTES, "ARCHIVE_SIZE_LIMIT")
        while not decoder.eof:
            chunk = source.read(CHUNK_BYTES) if decoder.needs_input else b""
            if decoder.needs_input:
                require(bool(chunk), "TRUNCATED_XZ_STREAM")
                stored_bytes += len(chunk)
                require(stored_bytes <= MAX_ARCHIVE_BYTES, "ARCHIVE_SIZE_LIMIT")
                stored_hash.update(chunk)
            room = min(CHUNK_BYTES, MAX_CONTAINER_BYTES + 1 - len(output))
            require(room > 0, "CONTAINER_SIZE_LIMIT")
            try:
                output.extend(decoder.decompress(chunk, max_length=room))
            except lzma.LZMAError as error:
                raise BundleError("INVALID_OR_OVERSIZED_XZ_STREAM") from error
            require(len(output) <= MAX_CONTAINER_BYTES, "CONTAINER_SIZE_LIMIT")
        require(not decoder.unused_data and not source.read(1), "TRAILING_XZ_DATA")
    return bytes(output), stored_bytes, stored_hash.hexdigest()


def pack(argument: str, raw: bytes) -> dict[str, object]:
    output = checked_evidence_path(argument, writing=True)
    members, originals = validate_container(raw)
    stored = lzma.compress(raw, format=lzma.FORMAT_XZ, preset=6)
    require(len(stored) <= MAX_ARCHIVE_BYTES, "ARCHIVE_SIZE_LIMIT")
    # Recheck ancestor seals/tracking immediately before the exclusive write.
    checked_evidence_path(argument, writing=True)
    descriptor = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, "wb") as target:
        target.write(stored)
        target.flush()
        os.fsync(target.fileno())
    # A failed write/readback leaves its original artifact; never delete or overwrite it.
    checked_evidence_path(argument, writing=False)
    restored, stored_bytes, stored_sha = decompress_path(output)
    require(restored == raw, "COMPLETE_CONTAINER_READBACK_CHANGED")
    restored_members, restored_originals = validate_container(restored)
    require(stored_bytes == len(stored) and stored_sha == digest(stored), "STORED_XZ_BYTES_CHANGED")
    require(restored_members == members, "MEMBER_DESCRIPTOR_READBACK_CHANGED")
    for before, after in zip(originals, restored_originals, strict=True):
        require(before["name"] == after["name"] and
                before["raw"].encode("utf-8") == after["raw"].encode("utf-8"),
                "COMPLETE_MEMBER_READBACK_CHANGED")
    return {"encoding": "xz", "file": output.name, "storedBytes": stored_bytes,
            "storedSha256": stored_sha, "containerBytes": len(raw), "containerSha256": digest(raw),
            "members": members}


def unpack(argument: str) -> bytes:
    source = checked_evidence_path(argument, writing=False)
    raw, _stored_bytes, _stored_sha = decompress_path(source)
    validate_container(raw)
    return raw


def read_pack_input(source: BinaryIO, container_bytes: str | None,
                    container_sha256: str | None) -> bytes:
    require((container_bytes is None) == (container_sha256 is None),
            "FRAME_FLAGS_REQUIRED_TOGETHER")
    if container_bytes is None:
        # Retain the original EOF-delimited interface for existing callers.
        original = source.read(MAX_CONTAINER_BYTES + 1)
        require(len(original) <= MAX_CONTAINER_BYTES, "CONTAINER_SIZE_LIMIT")
        return original

    require(re.fullmatch(r"[0-9]+", container_bytes) is not None, "INVALID_FRAME_LENGTH")
    digits = container_bytes.lstrip("0")
    require(bool(digits) and len(digits) <= len(str(MAX_CONTAINER_BYTES)), "INVALID_FRAME_LENGTH")
    expected_bytes = int(digits)
    require(0 < expected_bytes <= MAX_CONTAINER_BYTES, "INVALID_FRAME_LENGTH")
    require(container_sha256 is not None and
            re.fullmatch(r"[0-9a-fA-F]{64}", container_sha256) is not None,
            "INVALID_FRAME_SHA256")

    # The caller binds these fields to its entire serialized container. This is one
    # complete frame; probing for a byte after N would reintroduce the EOF wait.
    original = bytearray()
    actual_sha = hashlib.sha256()
    while len(original) < expected_bytes:
        chunk = source.read(min(CHUNK_BYTES, expected_bytes - len(original)))
        require(bool(chunk), "FRAME_LENGTH_MISMATCH")
        original.extend(chunk)
        actual_sha.update(chunk)
    require(len(original) == expected_bytes, "FRAME_LENGTH_MISMATCH")
    require(actual_sha.hexdigest() == container_sha256.lower(), "FRAME_SHA256_MISMATCH")
    return bytes(original)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    pack_command = commands.add_parser("pack")
    pack_command.add_argument("--output", required=True)
    pack_command.add_argument("--container-bytes")
    pack_command.add_argument("--container-sha256")
    commands.add_parser("unpack").add_argument("--input", required=True)
    args = parser.parse_args()
    try:
        if args.command == "pack":
            checked_evidence_path(args.output, writing=True)
            original = read_pack_input(sys.stdin.buffer, args.container_bytes, args.container_sha256)
            sys.stdout.write(json.dumps(pack(args.output, original), ensure_ascii=False) + "\n")
        else:
            sys.stdout.buffer.write(unpack(args.input))
        return 0
    except BundleError as error:
        print("EVIDENCE_XZ_BUNDLE:" + str(error), file=sys.stderr)
    except OSError as error:
        print("EVIDENCE_XZ_BUNDLE:IO_ERROR:" + str(error.errno), file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
