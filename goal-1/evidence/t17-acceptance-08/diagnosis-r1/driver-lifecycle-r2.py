"""Execute the original driver lifecycle AST with a real, tiny owned child only."""
from __future__ import annotations

import argparse
import ast
from contextlib import redirect_stdout, redirect_stderr
import errno
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time
import traceback
from types import SimpleNamespace
from unittest.mock import patch

HERE = Path(__file__).absolute().parent
TASK = HERE.parent
PROJECT = TASK.parents[2]
SOURCES = {"old": TASK / "source-r2-preflight" / "run-matrix-r2.py",
           "new": TASK / "run-matrix-r2.py"}
CASES = {"old-running-write-failure": ("old", "matrix-r2-running.json", 1),
         "new-running-write-failure": ("new", "matrix-r2-running.json", 1),
         "new-normal": ("new", None, 0),
         "new-terminal-write-failure": ("new", "matrix-r2-complete.json", 1)}
SCOPE = "Driver lifecycle only: original AST, parent-only metadata ENOSPC injection, real short owned child; no game/prerequisite simulation or compatibility work."


def require(condition, code):
    if not condition:
        raise RuntimeError(code)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def writable(directory):
    directory = Path(directory).absolute()
    require(directory == HERE or directory.is_relative_to(HERE), "DIAGNOSIS_SCOPE_REQUIRED")
    for ancestor in [directory, *directory.parents]:
        require(not ancestor.is_symlink(), "DIAGNOSIS_SYMLINK_FORBIDDEN")
        require(not (ancestor / "sealed-evidence.json").exists(), "EVIDENCE_SEALED_USE_NEW_ROOT")
        if ancestor.name == "evidence" and ancestor.parent.name == "goal-1":
            return directory
    raise RuntimeError("PROJECT_EVIDENCE_REQUIRED")


def save(path, value):
    writable(path.parent)
    with path.open("x") as out:
        json.dump(value, out, ensure_ascii=False, indent=2)
        out.write("\n")
        out.flush()
        os.fsync(out.fileno())


def lifecycle(source):
    original = source.read_bytes()
    tree = ast.parse(original.decode("utf-8"), filename=str(source))
    starts = [index for index, node in enumerate(tree.body) if isinstance(node, ast.With)
              and any(isinstance(child, ast.Constant) and child.value == "matrix-r2-console.txt"
                      for child in ast.walk(node))]
    require(len(starts) == 1, "EXACT_CONSOLE_LIFECYCLE_REQUIRED")
    nodes = tree.body[starts[0]:]
    last = nodes[-1]
    require(isinstance(last, ast.Expr) and isinstance(last.value, ast.Call)
            and isinstance(last.value.func, ast.Attribute) and last.value.func.attr == "exit"
            and isinstance(last.value.func.value, ast.Name) and last.value.func.value.id == "sys",
            "ORIGINAL_SYS_EXIT_REQUIRED")
    lines = original.splitlines(keepends=True)
    selected = b"".join(lines[nodes[0].lineno - 1:last.end_lineno])
    identity = {"file": str(source), "bytes": len(original), "sha256": sha(original),
                "fromLine": nodes[0].lineno, "throughLine": last.end_lineno,
                "lifecycleBytes": len(selected), "lifecycleSha256": sha(selected)}
    return compile(ast.Module(body=nodes, type_ignores=[]), str(source), "exec"), identity, selected


def worker(case, directory):
    writable(directory)
    version, failed_name, _expected = CASES[case]
    code, source, selected = lifecycle(SOURCES[version])
    with (directory / "executed-lifecycle.py").open("xb") as out:
        out.write(selected)
    marker = directory / "owned-child-finished.json"
    child_code = ("import json,os,sys,time\nfrom pathlib import Path\n"
                  "print(json.dumps({'state':'owned-child-started','pid':os.getpid()}),flush=True)\n"
                  "time.sleep(0.2)\n"
                  "with Path(sys.argv[1]).open('x') as out:\n"
                  " json.dump({'pid':os.getpid(),'state':'finished','exitCode':0},out);out.write('\\n')\n"
                  "print(json.dumps({'state':'owned-child-marker-written','pid':os.getpid()}),flush=True)\n")
    command = ["rtk", "proxy", sys.executable, "-B", "-c", child_code, str(marker)]
    events, children = [], []
    original_open = Path.open

    class TrackedProcess:
        def __init__(self, *args, **kwargs):
            self.actual = subprocess.Popen(*args, **kwargs)
            self.pid = self.actual.pid
            children.append(self)
            events.append({"event": "real-popen", "pid": self.pid, "command": args[0], "at": time.time()})

        def wait(self):
            events.append({"event": "driver-wait-start", "pid": self.pid, "at": time.time()})
            result = self.actual.wait()
            events.append({"event": "driver-wait-end", "pid": self.pid, "returnCode": result,
                           "markerExists": marker.exists(), "at": time.time()})
            return result

    def injected_open(path, *args, **kwargs):
        if failed_name is not None and path == directory / failed_name:
            events.append({"event": "injected-parent-open-enospc", "file": failed_name,
                           "childPolls": [child.actual.poll() for child in children],
                           "markerExists": marker.exists(), "at": time.time()})
            raise OSError(errno.ENOSPC, "injected parent-only metadata open failure", str(path))
        return original_open(path, *args, **kwargs)

    environment = {"p": directory, "command": command, "started": time.time(),
                   "bounds": {"lifecycleRegressionOnly": True, "gameCommandsExecuted": 0},
                   "metadata_errors": [], "json": json, "time": time, "sys": sys,
                   "subprocess": SimpleNamespace(Popen=TrackedProcess, STDOUT=subprocess.STDOUT)}
    failure = None
    driver_exit = None
    try:
        with patch.object(Path, "open", injected_open):
            exec(code, environment)
    except SystemExit as error:
        driver_exit = error.code if isinstance(error.code, int) else (0 if error.code is None else 1)
    except BaseException as error:
        failure = {"type": type(error).__name__, "error": str(error), "errno": getattr(error, "errno", None)}
        traceback.print_exc()
        driver_exit = 1
    require(driver_exit is not None, "ORIGINAL_LIFECYCLE_EXIT_NOT_OBSERVED")
    at_exit = {"childPolls": [child.actual.poll() for child in children],
               "markerExists": marker.exists(), "at": time.time(),
               "driverWaitCalls": sum(event["event"] == "driver-wait-start" for event in events)}
    cleanups = []
    # Only reap children created by this regression, even for the deliberately broken old AST.
    for child in children:
        cleanups.append({"pid": child.pid, "returnCode": child.actual.wait(timeout=5),
                         "markerExists": marker.exists(), "at": time.time()})
    terminal = directory / "matrix-r2-complete.json"
    terminal_value = json.loads(terminal.read_bytes()) if terminal.exists() else None
    marker_value = json.loads(marker.read_bytes()) if marker.exists() else None
    record = {"scope": SCOPE, "case": case, "sourceVersion": version, "source": source,
              "faultFile": failed_name, "actualChildCommand": command, "actualChildSleepSeconds": 0.2,
              "driverExitCode": driver_exit, "exception": failure, "events": events,
              "atLifecycleExit": at_exit, "ownedChildCleanupWaits": cleanups,
              "actualMarker": marker_value, "terminalMetadata": terminal_value,
              "driverMetadataErrors": environment["metadata_errors"],
              "sourceBytesUnchanged": sha(SOURCES[version].read_bytes()) == source["sha256"]}
    save(directory / "case-result.json", record)
    return driver_exit


def run(directory):
    writable(directory.parent)
    require(directory.parent == HERE and not directory.exists(), "FRESH_RESULT_DIRECTORY_REQUIRED")
    directory.mkdir()
    bindings = {version: lifecycle(source)[1] for version, source in SOURCES.items()}
    save(directory / "registration.json", {"scope": SCOPE, "sources": bindings,
         "cases": [{"case": name, "version": value[0], "faultFile": value[1], "expectedExitCode": value[2]}
                   for name, value in CASES.items()]})
    results = []
    for name, (_version, _fault, expected) in CASES.items():
        folder = directory / name
        folder.mkdir()
        command = ["rtk", "proxy", sys.executable, "-B", str(Path(__file__).absolute()),
                   "--case", name, "--case-dir", str(folder)]
        with (folder / "worker-stdout.txt").open("xb") as stdout, (folder / "worker-stderr.txt").open("xb") as stderr:
            result = subprocess.run(command, cwd=PROJECT, stdout=stdout, stderr=stderr, timeout=15, check=False)
        record = json.loads((folder / "case-result.json").read_bytes())
        checks = {"actualWorkerExitMatches": result.returncode == record["driverExitCode"] == expected,
                  "oneRealOwnedChild": len(record["ownedChildCleanupWaits"]) == 1,
                  "realChildExitedZero": all(row["returnCode"] == 0 for row in record["ownedChildCleanupWaits"]),
                  "markerWritten": record["actualMarker"] is not None,
                  "sourceUnchanged": record["sourceBytesUnchanged"]}
        waits = [event for event in record["events"] if event["event"] == "driver-wait-end"]
        if name.startswith("old-"):
            checks.update({"oldNeverCalledWait": record["atLifecycleExit"]["driverWaitCalls"] == 0,
                           "oldExitedWhileChildLive": record["atLifecycleExit"]["childPolls"] == [None],
                           "oldParentOpenReallyFailed": record["exception"] is not None and record["exception"]["errno"] == errno.ENOSPC,
                           "oldNoTerminalClaim": record["terminalMetadata"] is None})
        else:
            checks.update({"newWaitedOnce": record["atLifecycleExit"]["driverWaitCalls"] == len(waits) == 1,
                           "newChildEndedBeforeDriverExit": record["atLifecycleExit"]["childPolls"] == [0],
                           "waitObservedMarkerAndZeroExit": len(waits) == 1 and waits[0]["returnCode"] == 0 and waits[0]["markerExists"]})
            if name == "new-terminal-write-failure":
                faults = [event for event in record["events"] if event["event"] == "injected-parent-open-enospc"]
                checks.update({"terminalFailureAfterWait": len(faults) == 1 and faults[0]["childPolls"] == [0] and faults[0]["markerExists"],
                               "failedTerminalNotInvented": record["terminalMetadata"] is None})
            else:
                checks["terminalHasRealCollectorZero"] = record["terminalMetadata"] is not None and record["terminalMetadata"]["exitCode"] == 0
        rows = {"case": name, "workerCommand": command, "actualWorkerExitCode": result.returncode,
                "checks": checks, "passed": all(checks.values())}
        results.append(rows)
        print(json.dumps(rows), flush=True)
    unchanged = all(sha(path.read_bytes()) == bindings[version]["sha256"] for version, path in SOURCES.items())
    report = {"scope": SCOPE, "scriptSha256": sha(Path(__file__).read_bytes()), "sources": bindings,
              "registered": len(CASES), "executed": len(results), "results": results,
              "sourcesUnchanged": unchanged, "allPassed": unchanged and all(row["passed"] for row in results)}
    save(directory / "driver-lifecycle-results.json", report)
    return 0 if report["allPassed"] else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir")
    parser.add_argument("--case", choices=CASES)
    parser.add_argument("--case-dir")
    arguments = parser.parse_args()
    if arguments.case:
        require(arguments.case_dir is not None and arguments.output_dir is None, "EXPLICIT_CASE_DIRECTORY_REQUIRED")
        raise SystemExit(worker(arguments.case, Path(arguments.case_dir).absolute()))
    require(arguments.output_dir is not None and arguments.case_dir is None, "EXPLICIT_FRESH_OUTPUT_REQUIRED")
    raise SystemExit(run(Path(arguments.output_dir).absolute()))
