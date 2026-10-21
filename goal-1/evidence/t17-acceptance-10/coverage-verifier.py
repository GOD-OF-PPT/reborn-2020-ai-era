"""P4-only readback of original 288 + supplemental72 + critical90 evidence; no engine execution."""
from pathlib import Path
from collections import Counter
import argparse, base64, gzip, hashlib, json, lzma, os, posixpath, re, stat, subprocess, threading, time

ROOT = Path(__file__).resolve().parents[3]
TASK = Path(__file__).resolve().parent
ANCHORS = {
    "06": "0679d645da0a41cb1d84551ed638dcae44a38f52",
    "08": "5727873cfdea34013bbd8d12d30e715ed927fd78",
    "09": "c244c85f9a92634e12dec47576264c7b7602fb2a",
}
ROOTS = {key: "goal-1/evidence/t17-acceptance-" + key for key in ANCHORS}
MATRICES = {"06": ROOTS["06"] + "/matrix-r2", "08": ROOTS["08"] + "/matrix-r2", "09": ROOTS["09"] + "/matrix-r3"}
AUDITS = {"06": ROOTS["06"] + "/audit-r2-results.json", "08": ROOTS["08"] + "/audit-r4/course-delegated-verification.json", "09": ROOTS["09"] + "/audit-r3/course-critical-verification.json"}
SUMMARY_NAMES = {"06": "course-shape-results.json", "08": "course-delegated-results.json", "09": "course-critical-results.json"}
INPUT = "goal-1/evidence/t17-acceptance-04/course-shape-coverage-registration.json"
P4_PLAN = "goal-1/evidence/t17-acceptance-05/plan.md"
ENV = dict(os.environ, GIT_OPTIONAL_LOCKS="0")


def require(value, code):
    if not value:
        raise RuntimeError(code)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def regular(name):
    path = ROOT / name
    require(not Path(name).is_absolute() and ".." not in Path(name).parts, "PROJECT_PATH_REQUIRED:" + name)
    current = path
    while True:
        require(not stat.S_ISLNK(current.lstat().st_mode), "INPUT_SYMLINK:" + name)
        if current == ROOT:
            break
        current = current.parent
    require(stat.S_ISREG(path.lstat().st_mode), "REGULAR_INPUT_REQUIRED:" + name)
    return path


def bytes_of(name):
    return regular(name).read_bytes()


def load(name):
    return json.loads(bytes_of(name))


def file_digest(name):
    path = regular(name)
    h = hashlib.sha256()
    count = 0
    with path.open("rb") as source:
        before = os.fstat(source.fileno())
        while True:
            part = source.read(1024 * 1024)
            if not part:
                break
            h.update(part)
            count += len(part)
        after = os.fstat(source.fileno())
    require((before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns) ==
            (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns), "INPUT_CHANGED_DURING_READ:" + name)
    return {"bytes": count, "sha256": h.hexdigest()}


def ref_read(base, reference):
    name = base + "/" + reference["file"]
    raw = bytes_of(name)
    require(len(raw) == reference["bytes"] and sha(raw) == reference["sha256"], "FILE_REFERENCE_CHANGED:" + name)
    return raw


def git(*args):
    result = subprocess.run(["rtk", "proxy", "git", "-c", "core.fsmonitor=false", *args], cwd=ROOT, env=ENV, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    require(result.returncode == 0, "READONLY_GIT_FAILED:" + repr(args) + ":" + result.stderr.decode("utf8", "replace"))
    return result.stdout


class GitReader:
    """One task-owned batch reader; only digest metadata is cached, never evidence contents."""
    def __init__(self):
        self.process = subprocess.Popen(["rtk", "proxy", "git", "cat-file", "--batch"], cwd=ROOT, env=ENV,
                                        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.cache = {}
        self.errors = []
        self.thread = threading.Thread(target=self.drain, daemon=True)
        self.thread.start()

    def drain(self):
        while True:
            chunk = self.process.stderr.read(4096)
            if not chunk:
                return
            if len(self.errors) < 16:
                self.errors.append(chunk.decode("utf8", "replace"))

    def digest(self, object_id):
        if object_id in self.cache:
            return self.cache[object_id]
        self.process.stdin.write(object_id.encode("ascii") + b"\n")
        self.process.stdin.flush()
        header = self.process.stdout.readline().rstrip(b"\n").split()
        require(len(header) == 3 and header[0].decode() == object_id and header[1] == b"blob", "GIT_BLOB_HEADER_CHANGED")
        remaining = count = int(header[2])
        h = hashlib.sha256()
        original = hashlib.sha1(("blob " + str(count) + "\0").encode())
        while remaining:
            part = self.process.stdout.read(min(1024 * 1024, remaining))
            require(part, "GIT_BLOB_TRUNCATED")
            remaining -= len(part)
            h.update(part)
            original.update(part)
        require(self.process.stdout.read(1) == b"\n" and original.hexdigest() == object_id, "GIT_BLOB_FRAME_OR_OID_CHANGED")
        result = {"bytes": count, "sha256": h.hexdigest()}
        self.cache[object_id] = result
        return result

    def close(self):
        self.process.stdin.close()
        code = self.process.wait(timeout=30)
        self.thread.join(timeout=2)
        require(code == 0, "GIT_BATCH_READER_FAILED:" + str(code))


def git_entry(commit, name):
    entries = git("ls-tree", "-z", commit, "--", name).split(b"\0")
    require(len(entries) == 2 and entries[1] == b"", "EXACT_GIT_FILE_ANCHOR_REQUIRED:" + name)
    left, actual = entries[0].split(b"\t", 1)
    mode, kind, oid = left.decode("ascii").split()
    require(os.fsdecode(actual) == name and kind == "blob", "REGULAR_GIT_BLOB_ANCHOR_REQUIRED:" + name)
    return mode, oid


def physical_tree(base):
    found = {}
    def visit(path, name):
        for item in os.scandir(path):
            relative = name + "/" + item.name if name else item.name
            if item.is_symlink():
                literal = os.readlink(os.fsencode(item.path))
                found[relative] = {"kind": "symlink", "bytes": len(literal), "sha256": sha(literal),
                                   "target": literal.decode("utf8"), "gitMode": "120000"}
            elif item.is_dir(follow_symlinks=False):
                visit(item.path, relative)
            else:
                require(item.is_file(follow_symlinks=False), "NONREGULAR_EVIDENCE_ENTRY:" + relative)
                found[relative] = {"kind": "file", **file_digest(base + "/" + relative),
                                   "gitMode": "100755" if os.lstat(item.path).st_mode & stat.S_IXUSR else "100644"}
    visit(ROOT / base, "")
    return found


def seal_and_git(key, reader):
    base = ROOTS[key]
    seal = load(base + "/sealed-evidence.json")
    require(seal["selfExcluded"] in (True, ["sealed-evidence.json"]), "EXPLICIT_PARENT_SEAL_SELF_EXCLUSION_REQUIRED")
    actual = physical_tree(base)
    expected = set(seal["files"]) | set(seal.get("symlinks", {})) | {"sealed-evidence.json"}
    require(set(actual) == expected, "PARENT_SEALED_EXACT_PHYSICAL_SET_CHANGED:" + key)
    for name, ref in seal["files"].items():
        require(actual[name]["kind"] == "file" and actual[name]["bytes"] == ref["bytes"] and actual[name]["sha256"] == ref["sha256"], "SEALED_REGULAR_BYTES_CHANGED:" + name)
    for name, ref in seal.get("symlinks", {}).items():
        require(actual[name] == {"kind": "symlink", "bytes": ref["bytes"], "sha256": ref["sha256"], "target": ref["target"], "gitMode": "120000"}, "SEALED_LITERAL_SYMLINK_CHANGED:" + name)
    original = {}
    for line in git("ls-tree", "-rz", ANCHORS[key], "--", base).split(b"\0"):
        if not line:
            continue
        left, name = line.split(b"\t", 1)
        mode, kind, oid = left.decode("ascii").split()
        name = os.fsdecode(name)
        require(kind == "blob" and name.startswith(base + "/"), "EVIDENCE_GIT_ANCHOR_KIND_CHANGED")
        original[name[len(base) + 1:]] = (mode, oid)
    require(set(original) == set(actual), "FEATURE_COMMIT_EXACT_SEALED_LEAF_SET_CHANGED:" + key)
    for name, (mode, oid) in original.items():
        reference = reader.digest(oid)
        require(mode == actual[name]["gitMode"] and reference["bytes"] == actual[name]["bytes"] and reference["sha256"] == actual[name]["sha256"], "FEATURE_GIT_BLOB_OR_MODE_CHANGED:" + name)
        actual[name]["gitBlob"] = oid
    return {"root": base, "commit": ANCHORS[key], "regularFiles": len(seal["files"]) + 1,
            "literalSymlinks": len(seal.get("symlinks", {})), "exactSetAndGitBlobsMatch": True,
            "hardlinkTopology": "Git does not encode hardlinks or empty directories; no physical-topology restoration claim.", "entries": actual}


def runtime_closure():
    pending = ["src/application/campaign.ts"]
    seen, external, edges = set(), set(), []
    patterns = [r"(?m)^\s*import(?:\s+type)?\s*(?:[^'\"]+?\s+from\s*)?(['\"])([^'\"]+)\1",
                r"(?m)^\s*export\s*(?:type\s+)?(?:\*|\{[^}]+\})\s+from\s*(['\"])([^'\"]+)\1",
                r"\bimport\s*\(\s*(['\"])([^'\"]+)\1"]
    while pending:
        name = pending.pop()
        if name in seen:
            continue
        seen.add(name)
        text = bytes_of(name).decode("utf8")
        specs = {match[1] for pattern in patterns for match in re.findall(pattern, text)}
        for spec in sorted(specs):
            if not spec.startswith("."):
                external.add(spec)
                continue
            target = posixpath.normpath(posixpath.join(posixpath.dirname(name), spec))
            if not (ROOT / target).is_file():
                target = next((candidate for candidate in [target + ".ts", target + ".tsx", target + "/index.ts"] if (ROOT / candidate).is_file()), target)
            require((ROOT / target).is_file(), "ACTUAL_CAMPAIGN_CODEC_IMPORT_UNRESOLVED:" + target)
            edges.append({"from": name, "to": target})
            pending.append(target)
    require("src/persistence/codec.ts" in seen and "src/core/course.ts" in seen and "src/content/course.ts" in seen, "ACTUAL_RUNTIME_CODEC_CLOSURE_INCOMPLETE")
    dependencies = sorted(seen | {"package.json", "package-lock.json", "tsconfig.json", "tsconfig.core.json", "tsconfig.app.json", "tsconfig.node.json"})
    return {"entry": "src/application/campaign.ts:createCampaignRun/createCampaignCodec", "localFiles": dependencies,
            "externalPackages": sorted(external), "imports": edges, "hashes": {name: file_digest(name)["sha256"] for name in dependencies},
            "scope": "Conservative local import closure includes type imports; package manifest/lock and TS configs bind external resolution. No engine, codec or package code is executed."}


def source_binding(key, summary, registration, closure, reader):
    require(summary["sourceHashes"] == registration["sourceHashes"], "REGISTERED_HISTORICAL_SOURCE_HASHES_CHANGED:" + key)
    input_key = "sourceInputHashes" if key != "09" else "inputHashes"
    require(summary[input_key] == registration[input_key], "REGISTERED_HISTORICAL_INPUT_HASHES_CHANGED:" + key)
    sources = summary["sourceHashes"]
    require(set(closure["localFiles"]).issubset(sources), "HISTORICAL_RUNTIME_DEPENDENCY_HASH_MISSING:" + key + ":" + repr(sorted(set(closure["localFiles"]) - set(sources))))
    values = []
    for binding_kind, bindings in [("sourceHashes", sources), (input_key, summary[input_key])]:
      for name, digest in bindings.items():
        mode, oid = git_entry(ANCHORS[key], name)
        anchored = reader.digest(oid)
        require(mode in ("100644", "100755") and anchored["sha256"] == digest, "ORIGINAL_SOURCE_OR_INPUT_GIT_BINDING_CHANGED:" + key + ":" + name)
        current = file_digest(name)
        category = "actual_campaign_codec_dependency" if name in closure["hashes"] else "historical_tool_wrapper_strategy_or_input"
        if category == "actual_campaign_codec_dependency":
            require(current["sha256"] == digest, "ACTUAL_GAME_DEPENDENCY_CHANGED:" + key + ":" + name)
        values.append({"file": name, "bindingKind": binding_kind, "category": category, "originalSha256": digest, "originalGitBlob": oid,
                       "originalCommit": ANCHORS[key], "currentSha256": current["sha256"], "sameCurrentBytes": current["sha256"] == digest})
    return {"dataset": key, "runtimeDependencies": len(closure["localFiles"]), "allActualRuntimeDependenciesEqual": True,
            "historicalWrapperChanges": [v for v in values if not v["sameCurrentBytes"]], "bindings": values}


def inspect_gzip(base, reference, cache, keep=False):
    name = base + "/" + reference["file"]
    old = cache.get(name)
    if old:
        require(old["descriptor"] == reference, "CONTRADICTORY_COMPLETE_GZIP_REFERENCE:" + name)
    else:
        require(reference["encoding"] == "gzip" and reference["losslessReadbackEqual"] is True, "ORIGINAL_GZIP_CONTRACT_REQUIRED")
        stored = file_digest(name)
        require(stored == {"bytes": reference["storedBytes"], "sha256": reference["storedSha256"]}, "COMPLETE_GZIP_STORAGE_CHANGED:" + name)
    h, count, parts = hashlib.sha256(), 0, []
    with gzip.open(regular(name), "rb") as source:
        while True:
            part = source.read(1024 * 1024)
            if not part:
                break
            count += len(part)
            h.update(part)
            if keep:
                parts.append(part)
    require(count == reference["uncompressedBytes"] and h.hexdigest() == reference["uncompressedSha256"], "FULL_ORIGINAL_GZIP_BYTES_CHANGED:" + name)
    cache[name] = {"descriptor": reference, "storedBytes": reference["storedBytes"], "rawBytes": count}
    return b"".join(parts) if keep else None


def walk_gzip(value, base, cache):
    if isinstance(value, dict):
        if value.get("encoding") == "gzip" and "uncompressedSha256" in value:
            name = base + "/" + value["file"]
            if name in cache:
                require(cache[name]["descriptor"] == value, "CONTRADICTORY_GZIP_DESCRIPTOR")
            else:
                inspect_gzip(base, value, cache)
        for item in value.values():
            walk_gzip(item, base, cache)
    elif isinstance(value, list):
        for item in value:
            walk_gzip(item, base, cache)


def unpack(base, folder, descriptor, archives):
    require(descriptor["encoding"] == "xz" and descriptor["file"] in ("case-evidence.xz", "prefix-evidence.xz"), "ORIGINAL_XZ_FILE_IDENTITY_REQUIRED")
    name = base + "/" + folder + "/" + descriptor["file"]
    require(file_digest(name) == {"bytes": descriptor["storedBytes"], "sha256": descriptor["storedSha256"]}, "ORIGINAL_XZ_STORED_BYTES_CHANGED:" + name)
    h, count, parts = hashlib.sha256(), 0, []
    with lzma.open(regular(name), "rb") as source:
        while True:
            part = source.read(1024 * 1024)
            if not part:
                break
            count += len(part)
            require(count <= 256 * 1024 * 1024, "ORIGINAL_CONTAINER_LIMIT_EXCEEDED")
            h.update(part)
            parts.append(part)
    require(count == descriptor["containerBytes"] and h.hexdigest() == descriptor["containerSha256"], "FULL_XZ_CONTAINER_BYTES_CHANGED:" + name)
    container = json.loads(b"".join(parts))
    require(container["format"] == "course-evidence-bundle-v1", "ORIGINAL_XZ_BUNDLE_FORMAT_CHANGED")
    members, checked = {}, []
    for row in container["members"]:
        require(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", row["name"]) and row["name"] not in members and isinstance(row["raw"], str), "UNIQUE_ORIGINAL_FLAT_TEXT_MEMBER_REQUIRED")
        raw = row["raw"].encode("utf8")
        members[row["name"]] = row["raw"]
        checked.append({"name": row["name"], "bytes": len(raw), "sha256": sha(raw)})
    require(checked == descriptor["members"], "ALL_FULL_ORIGINAL_MEMBER_BYTES_CHANGED:" + name)
    archives.append({"file": name, "storedBytes": descriptor["storedBytes"], "containerBytes": count, "containerSha256": descriptor["containerSha256"], "members": checked})
    return members


def member(members, ref):
    raw = members[ref["member"]]
    require(len(raw.encode("utf8")) == ref["bytes"] and sha(raw.encode("utf8")) == ref["sha256"], "FULL_RAW_MEMBER_REFERENCE_CHANGED:" + ref["member"])
    return raw


def state(raw):
    value = json.loads(raw)
    require(isinstance(value, dict) and "checksum" in value and "state" in value, "ORIGINAL_COMPLETE_CODEC_ENVELOPE_REQUIRED")
    run = value["state"]
    require(run["origin"] == "normal" and run["revision"] >= 1, "ORIGINAL_NORMAL_RUN_REQUIRED")
    return run


def command_list(run):
    return [{**json.loads(r["payloadSignature"]), "commandId": r["commandId"], "expectedRevision": r["revisionBefore"]} for r in run["receipts"][1:]]


def balances(run, before=None):
    ledger = run["economy"]["ledger"]
    require(all(sum(line["deltaFen"] for line in tx["lines"]) == 0 for tx in ledger["transactions"]), "RAW_UNBALANCED_CASH_TRANSFER")
    budgets = Counter()
    for action in run["economy"]["actions"]:
        if action["status"] in ("reserved", "executed", "completed", "interrupted"):
            date = action["definition"]["startAt"]
            budgets[date[:4] + "-Q" + str((int(date[5:7]) - 1) // 3 + 1)] += action["definition"]["actionPoints"]
    require(all(0 <= points <= 4 for points in budgets.values()), "RAW_QUARTER_EXCEEDS_ORIGINAL_FOUR_POINTS")
    cohorts = run.get("course", {}).get("cohorts", [])
    for co in cohorts:
        students = [e for e in run["course"]["enrollments"] if e["cohortId"] == co["id"]]
        require(len({e["personId"] for e in students}) == len(students), "RAW_DUPLICATE_SAME_COHORT_PERSON")
        contracts = [c for c in ledger["contracts"] if c["id"] == co["id"]]
        prepaid = sum(e["priceFen"] - sum(e["delivered"]) - e["refundedUnearned"] for e in students)
        income = sum(sum(e["delivered"]) - sum(e["refundedDelivered"]) for e in students)
        require(contracts and contracts[0]["prepaidFen"] == prepaid and contracts[0]["recognizedIncomeFen"] == income or not students and not contracts and prepaid == income == 0, "RAW_COURSE_PREPAYMENT_OR_INCOME_IDENTITY_CHANGED")
        for stage in co["stages"]:
            require(stage["amountFen"] == sum(e["delivered"][stage["index"]] for e in students), "RAW_STAGE_SUM_CHANGED")
        for refund in [r for r in run["course"]["refunds"] if r["cohortId"] == co["id"]]:
            operations = {r["id"]: json.loads(r["signature"]) for r in ledger["receipts"]}
            payment_ops = {p["operationId"] for p in run["course"]["payments"] if p["cohortId"] == co["id"]}
            stage_ops = {s["operationId"] for s in co["stages"] if s["operationId"] is not None}
            for operation_id in refund["operationIds"]:
                op = operations[operation_id]
                require(op["referenceId"] in (payment_ops if op["kind"] == "refund_undelivered" else stage_ops), "RAW_REFUND_ORIGINAL_PAYMENT_OR_STAGE_REFERENCE_CHANGED")
    if before is not None:
        old = before["economy"]["ledger"]
        require(ledger["transactions"][:len(old["transactions"])] == old["transactions"], "RAW_REWROTE_ORIGINAL_CASH_PREFIX")
        old_accounts = {a["id"]: a for a in old["accounts"]}
        delta = Counter()
        for tx in ledger["transactions"][len(old["transactions"]):]:
            for line in tx["lines"]:
                delta[line["accountId"]] += line["deltaFen"]
        for account in ledger["accounts"]:
            if account["kind"] != "external":
                require(account["balanceFen"] - old_accounts.get(account["id"], {"balanceFen": 0})["balanceFen"] == delta[account["id"]], "RAW_ACTUAL_ACCOUNT_CASH_DELTA_CHANGED")
    return {"quartersChecked": len(budgets), "cohortsChecked": len(cohorts), "balancedTransactions": len(ledger["transactions"])}


def shape_key(shape):
    return "--".join(shape[key] for key in ("productId", "topicId", "edition", "supportMode"))


def actual_shape(run, prefix, shape):
    old_courses = {c["id"] for c in prefix["course"]["courses"]}
    old_cohorts = {c["id"] for c in prefix["course"]["cohorts"]}
    courses = [c for c in run["course"]["courses"] if c["id"] not in old_courses]
    cohorts = [c for c in run["course"]["cohorts"] if c["id"] not in old_cohorts]
    jobs = {j["id"]: j for j in run["operations"]["jobs"]}
    closed = len(courses) == len(cohorts) == 1 and all(courses[0][k] == shape[k] for k in ("productId", "topicId", "edition")) and cohorts[0]["courseId"] == courses[0]["id"] and cohorts[0]["closedAt"] is not None and all(s["deliveredAt"] is not None for s in cohorts[0]["stages"]) and any(not slot["recovery"] and slot["mode"] == shape["supportMode"] and jobs[slot["jobId"]]["status"] == "completed" for slot in cohorts[0]["slots"])
    students = [e for e in run["course"]["enrollments"] if e["cohortId"] in {c["id"] for c in cohorts}]
    retained = [e for e in students if e["priceFen"] - e["refundedUnearned"] - sum(e["refundedDelivered"]) > 0 and e["outcome"] == "helped" and e["refundedUnearned"] + sum(e["refundedDelivered"]) == 0]
    conversions = {c["id"]: c for c in run["video"]["conversions"]}
    for e in retained:
        require(conversions[e["conversionId"]]["outcome"] == "retained" and conversions[e["conversionId"]]["sourceId"] == e["id"], "RAW_RETAINED_HELPED_CONVERSION_CHANGED")
    return {"actualClosedShape": bool(closed), "helpedRetainedStudents": len(retained), "courseIds": [c["id"] for c in courses],
            "cohortIds": [c["id"] for c in cohorts], "supportJobs": [{"cohortId": c["id"], "mode": slot["mode"], "recovery": slot["recovery"], "jobId": slot["jobId"], "status": jobs[slot["jobId"]]["status"], "startAt": jobs[slot["jobId"]]["startAt"], "completeAt": jobs[slot["jobId"]]["completeAt"]} for c in cohorts for slot in c["slots"]], "closedAt": [c["closedAt"] for c in cohorts]}


def core_rows(summary, registration, audit, prefixes, gzip_cache, report_rows):
    base = MATRICES["06"]
    require(summary["registered"] == summary["recorded"] == summary["attempted"] == 288 and summary["fatal"] == summary["unexecutedDueToFatal"] == 0, "ORIGINAL288_NOT_COMPLETE")
    require(len(summary["results"]) == len(registration["registered"]) == 288, "ORIGINAL288_REGISTERED_ROW_MISSING")
    statuses, milestones, accepted = Counter(), 0, 0
    for index, (registered, row) in enumerate(zip(registration["registered"], summary["results"], strict=True), 1):
        require(row["identity"] == registered["identity"] and row["shape"] == registered["shape"], "ORIGINAL288_REGISTRATION_IDENTITY_CHANGED")
        raw = ref_read(base, row["evidence"])
        require(audit["branchRecordHashes"][row["evidence"]["file"]] == sha(raw), "ORIGINAL288_AUDIT_RECORD_HASH_CHANGED")
        record = json.loads(raw)
        require(record["status"] == row["status"] and record["shape"] == row["shape"] and record["identity"] == row["identity"] and record["backgroundId"] + "-" + record["seed"] == row["identity"], "ORIGINAL288_RECORD_CHANGED")
        require(record["suffixReplayBytesEqual"] and record["rejectedReplayEqual"] and record["prefixUnchanged"] and record["earnedPrefix"]["fromCreateVerified"], "ORIGINAL288_HISTORICAL_REPLAY_INCOMPLETE")
        walk_gzip(record, base, gzip_cache)
        terminal = state(inspect_gzip(base, record["terminal"], gzip_cache, True))
        prefix = prefixes[row["identity"]]
        require(terminal["backgroundId"] + "-" + terminal["seed"] == row["identity"] and terminal["revision"] == record["revision"] and terminal["timeline"]["cursor"]["date"] == record["date"], "ORIGINAL288_TERMINAL_IDENTITY_CHANGED")
        require(command_list(terminal)[len(command_list(prefix)):] == record["suffixCommands"], "ORIGINAL288_FULL_RAW_SUFFIX_RECEIPTS_CHANGED")
        business = actual_shape(terminal, prefix, row["shape"])
        require(business["actualClosedShape"] == row["actualClosedShape"] == record["actualClosedShape"] and business["helpedRetainedStudents"] == row["helpedRetainedStudents"] == record["helpedRetainedStudents"], "ORIGINAL288_ACTUAL_BUSINESS_CHANGED")
        require(row["status"] in ("completed", "policy_refused") and (row["status"] != "completed" or business["actualClosedShape"] and business["helpedRetainedStudents"] > 0), "ORIGINAL288_UNKNOWN_OR_EMPTY_POSITIVE")
        if row["status"] == "policy_refused":
            require(record["policyRefusal"] and record["policyRefusal"]["code"] == "actual_authorized_support_interrupted" and not business["actualClosedShape"], "ORIGINAL288_FINITE_RESULT_CHANGED")
        require(len(record["suffixCommands"]) == row["suffixCommands"] and all(a["status"] == "committed" for a in record["actualAttempts"]) and row["actualRejectedCommands"] == record["actualRejectedCommands"] == 0, "ORIGINAL288_REAL_COMMANDS_CHANGED")
        for milestone in record["milestones"]:
            require(milestone["independentMoneyStatus"] == "passed" and milestone["independentMoneyError"] is None and all(v["independentChecks"]["allFinancialIdentitiesPassed"] for v in milestone["moneyEvidence"]) and all(v["allCashIdentitiesPassed"] for v in milestone["cashEvidence"]), "ORIGINAL288_ORIGINAL_MONEY_MILESTONE_FAILED")
        proof = balances(terminal, prefix)
        report_rows.append({"dataset": "original288", "identity": row["identity"], "shape": row["shape"], "status": row["status"],
                            "record": {"file": base + "/" + row["evidence"]["file"], **file_digest(base + "/" + row["evidence"]["file"])}, "historicalAudit": AUDITS["06"],
                            "terminal": {**record["terminal"], "file": base + "/" + record["terminal"]["file"]}, "business": business, "parsedCashAndCourseIdentities": proof,
                            "finite": record["policyRefusal"], "historicalAcceptedSuffixCommands": row["suffixCommands"], "historicalRawMilestones": len(record["milestones"]), "currentEngineCommandsExecuted": 0})
        statuses[row["status"]] += 1
        milestones += len(record["milestones"])
        accepted += row["suffixCommands"]
        if index % 24 == 0:
            print(json.dumps({"phase": "core-full-raw-readback", "checked": index, "total": 288}), flush=True)
    require(statuses == Counter({"completed": 216, "policy_refused": 72}) and statuses == Counter(audit["statuses"]) and milestones == audit["actualMilestones"] == 3234 and accepted == audit["actualAcceptedSuffixCommands"] == 4594, "ORIGINAL288_COUNTS_CHANGED")
    for identity in prefixes:
        prefix_proof = load(base + "/" + identity + "/prefix-create-replay.json")
        require(prefix_proof["status"] == "verified" and prefix_proof["fullCreateAndEveryP1MilestoneBytesEqual"], "ORIGINAL288_CREATE_PROOF_CHANGED")
        walk_gzip(prefix_proof, base, gzip_cache)
    require(set(gzip_cache) == {str(p.relative_to(ROOT)) for p in (ROOT / base).rglob("*.json.gz")}, "ORIGINAL288_FULL_GZIP_REFERENCE_SET_CHANGED")
    return {"registered": 288, "statuses": dict(statuses), "historicalAcceptedSuffixCommands": accepted, "rawMilestonesRead": milestones,
            "gzipArtifactsRead": len(gzip_cache), "completeRawBytesRead": sum(v["rawBytes"] for v in gzip_cache.values())}


def delegated_rows(summary, registration, audit, prefixes, archives, report_rows):
    base, audit_base = MATRICES["08"], ROOTS["08"] + "/audit-r4"
    require(summary["registered"] == summary["recorded"] == summary["attempted"] == audit["verified"] == 72 and summary["fatal"] == summary["unexecutedDueToFatal"] == 0 and audit["invalid"] == audit["missing"] == audit["partial"] == audit["fatal"] == audit["unknown"] == 0 and not audit["setupErrors"], "SUPPLEMENTAL72_INCOMPLETE")
    by_proof = {r["rowId"]: r for r in audit["rows"]}
    statuses, accepted, members_count, milestone_count = Counter(), 0, 0, 0
    for position, row in enumerate(summary["results"], 1):
        audit_row = by_proof[row["rowId"]]
        require(audit_row["status"] == "verified", "SUPPLEMENTAL72_PROOF_ROW_NOT_VERIFIED")
        proof = json.loads(ref_read(audit_base, audit_row["proof"]))
        index = json.loads(ref_read(base, row["evidence"]))
        require(index["rowId"] == proof["rowId"] == row["rowId"] and index["shape"] == proof["shape"] == row["shape"] and index["status"] == proof["sourceStatus"] == row["status"] and proof["status"] == "verified" and proof["error"] is None, "SUPPLEMENTAL72_INDEX_PROOF_IDENTITY_CHANGED")
        members = unpack(base, row["folder"], row["archive"], archives)
        require(proof["archive"] == index["archive"] == row["archive"] and proof["checkedRawMembers"] == row["archive"]["members"], "SUPPLEMENTAL72_FULL_MEMBER_AUDIT_CHANGED")
        record = json.loads(member(members, index["caseEvidence"]))
        terminal = state(member(members, index["terminal"]))
        require(record["identity"] == row["identity"] and record["shape"] == row["shape"] and record["status"] == row["status"] and terminal["timeline"]["cursor"]["date"] == "2025-12-31" and terminal["timeline"]["cursor"]["phase"] == "snapshot", "SUPPLEMENTAL72_ORIGINAL_TERMINAL_OR_STATUS_CHANGED")
        require(record["suffixReplayBytesEqual"] and record["rejectedReplayEqual"] and index["monitoringComplete"] and proof["monitoringComplete"], "SUPPLEMENTAL72_HISTORICAL_REPLAY_OR_MONITORING_MISSING")
        require(bytes_of(base + "/" + row["folder"] + "/command-attempts.jsonl").decode() == members["command-attempts.jsonl"], "SUPPLEMENTAL72_EXTERNAL_JOURNAL_CHANGED")
        for milestone in record["milestones"]:
            member(members, milestone["raw"])
        prefix = prefixes[row["identity"]]
        require(command_list(terminal)[len(command_list(prefix)):] == record["suffixCommands"], "SUPPLEMENTAL72_FULL_RAW_SUFFIX_CHANGED")
        business = actual_shape(terminal, prefix, row["shape"])
        require(business["actualClosedShape"] == row["actualClosedShape"] == proof["actualClosedShape"] and business["helpedRetainedStudents"] == row["helpedRetainedStudents"] == proof["helpedRetainedStudents"], "SUPPLEMENTAL72_ACTUAL_CLOSED_OR_RETAINED_CHANGED")
        require(row["status"] in ("completed", "policy_refused") and (row["status"] != "completed" or business["actualClosedShape"] and business["helpedRetainedStudents"] > 0 and proof["positiveDelegatedBusiness"]), "SUPPLEMENTAL72_UNKNOWN_OR_EMPTY_POSITIVE")
        require(proof["allOriginalMilestonesMatched"] == len(record["milestones"]) and proof["independentlyReplayedAccepted"] == row["suffixCommands"] and proof["independentlyReplayedRejected"] == row["actualRejectedCommands"] == 0, "SUPPLEMENTAL72_HISTORICAL_REPLAY_COUNTS_CHANGED")
        original = row["originalRow"]
        require(file_digest(original["file"]) == {"bytes": original["bytes"], "sha256": original["sha256"]} and original["status"] == "policy_refused", "SUPPLEMENTAL72_ORIGINAL288_LINK_CHANGED")
        finite = proof["finite"]
        if row["status"] == "policy_refused":
            require(finite is not None and not business["actualClosedShape"], "SUPPLEMENTAL72_FINITE_RESULT_LOST")
        report_rows.append({"dataset": "supplemental72", "rowId": row["rowId"], "identity": row["identity"], "shape": row["shape"], "status": row["status"],
                            "record": {**row["evidence"], "file": base + "/" + row["evidence"]["file"]}, "historicalProof": {**audit_row["proof"], "file": audit_base + "/" + audit_row["proof"]["file"]},
                            "terminal": index["terminal"], "archiveFile": base + "/" + row["folder"] + "/case-evidence.xz", "business": business,
                            "parsedCashAndCourseIdentities": balances(terminal, prefix), "finite": finite,
                            "externalControlScope": "Original local business completion/year-end monitoring does not prove external delegation revocation or global recovery.", "currentEngineCommandsExecuted": 0})
        statuses[row["status"]] += 1
        accepted += row["suffixCommands"]
        members_count += len(members)
        milestone_count += len(record["milestones"])
        if position % 12 == 0:
            print(json.dumps({"phase": "supplement-full-xz-readback", "checked": position, "total": 72}), flush=True)
    require(statuses == Counter({"completed": 48, "policy_refused": 24}) and accepted == summary["actualAcceptedSuffixCommands"] == 2006 and milestone_count == 1574 and members_count == 1862, "SUPPLEMENTAL72_COUNTS_CHANGED")
    return {"registered": 72, "statuses": dict(statuses), "historicalAcceptedSuffixCommands": accepted, "rawMilestonesRead": milestone_count, "fullMembersRead": members_count}


def critical_rows(summary, registration, audit, archives, report_rows):
    base, audit_base = MATRICES["09"], ROOTS["09"] + "/audit-r3"
    require(summary["registered"] == summary["recorded"] == summary["attempted"] == summary["targetVerified"] == audit["verified"] == 90 and summary["failed"] == summary["unexecutedDueToFatal"] == audit["invalid"] == audit["missing"] == 0 and summary["fatal"] is None and summary["finalGuardError"] is None and not audit["setupErrors"] and audit["summaryAudit"]["fullResultRowsCompared"], "ORIGINAL90_NOT_COMPLETE")
    require(len(summary["results"]) == len(registration["registered"]) == len(audit["rows"]) == 90, "ORIGINAL90_REGISTERED_ROW_LOSS")
    accepted = rejected = milestones = members_count = 0
    prefix_sources = {}
    for identity in {r["identity"] for r in registration["registered"]}:
        p = load(base + "/" + identity + "/prefix-index.json")
        parts = unpack(base, identity, p["archive"], archives)
        require(p["record"]["status"] == "verified" and len(p["record"]["originalMilestonesMatched"]) == 25, "ORIGINAL90_CREATE_HISTORY_NOT_VERIFIED")
        for checkpoint in p["record"]["checkpoints"]:
            prefix_sources[(identity, checkpoint["revision"])] = checkpoint["raw"]["sha256"]
            member(parts, checkpoint["raw"])
    for position, (row, registered, audit_row) in enumerate(zip(summary["results"], registration["registered"], audit["rows"], strict=True), 1):
        require(row["rowId"] == registered["rowId"] == audit_row["rowId"] and row["caseId"] == registered["caseId"] == audit_row["caseId"] and row["sourceRevision"] == registered["sourceRevision"] == audit_row["sourceRevision"], "ORIGINAL90_FIXED_ID_OR_EARLY_SOURCE_CHANGED")
        index = json.loads(ref_read(base, row["evidence"]))
        proof = json.loads(ref_read(audit_base, audit_row["proof"]))
        require(index["status"] == row["status"] == "target_verified" and proof["status"] == "verified" and row["error"] is None and row["recovery"] is None and index["archive"] == row["archive"] == proof["archive"], "ORIGINAL90_INDEX_PROOF_OR_STATUS_CHANGED")
        members = unpack(base, row["folder"], row["archive"], archives)
        record_raw = members["case-record.json"]
        record = json.loads(record_raw)
        require(sha(record_raw.encode()) == proof["exactFullRecordBytes"]["sha256"] and len(record_raw.encode()) == proof["exactFullRecordBytes"]["bytes"], "ORIGINAL90_COMPLETE_RECORD_REFERENCE_CHANGED")
        require(proof["completeOriginalMembersCompared"] == row["archive"]["members"] and proof["source"] == record["source"] and proof["terminal"] == record["terminal"] and proof["finalMoney"] == record["finalMoney"], "ORIGINAL90_PROOF_FULL_MEMBERS_OR_MONEY_CHANGED")
        source_raw = member(members, record["source"])
        terminal_raw = member(members, record["terminal"])
        require(record["source"]["sha256"] == prefix_sources[(row["identity"], row["sourceRevision"])], "ORIGINAL90_SOURCE_NOT_EARNED_CREATE_CHECKPOINT")
        source, terminal = state(source_raw), state(terminal_raw)
        codes = [v["code"] for v in record["observations"]]
        require(record["status"] == "target_verified" and record["error"] is None and record["requiredChecks"] == registered["requiredChecks"] == proof["requiredChecks"] and set(record["requiredChecks"]).issubset(codes) and record["observations"] == proof["actualTargetAssertions"], "ORIGINAL90_SPECIFIC_TARGET_OR_ASSERTIONS_MISSING")
        require(row["targetChecks"] == len(record["observations"]) and record["acceptedCommands"] == proof["actualAcceptedCommands"] == row["acceptedCommands"] and record["rejectedCommands"] == proof["actualRejectedCommands"] == row["rejectedCommands"], "ORIGINAL90_REAL_ATTEMPT_OR_TARGET_COUNTS_CHANGED")
        journal = members["command-attempts.jsonl"]
        require(bytes_of(base + "/" + row["folder"] + "/command-attempts.jsonl").decode() == journal, "ORIGINAL90_EXTERNAL_JOURNAL_CHANGED")
        events = [json.loads(line) for line in journal.splitlines()]
        require(len(events) == 2 * len(record["attempts"]), "ORIGINAL90_ACTUAL_ATTEMPT_JOURNAL_INCOMPLETE")
        for sequence, attempt in enumerate(record["attempts"], 1):
            before, after = events[2 * sequence - 2:2 * sequence]
            require(attempt["sequence"] == sequence and before["event"] == "attempt" and after["event"] == "result" and before["command"] == after["command"] == attempt["command"] and {k: v for k, v in after.items() if k != "event"} == attempt and attempt["status"] == ("rejected" if attempt["expectedRejection"] else "accepted"), "ORIGINAL90_ACCEPTED_REJECTED_JOURNAL_CHANGED")
        for milestone in record["milestones"]:
            member(members, milestone["raw"])
        require(record["fullCommands"] == command_list(terminal) and record["suffixCommands"] == command_list(terminal)[len(command_list(source)):], "ORIGINAL90_COMPLETE_RAW_RECEIPTS_CHANGED")
        require(len(record["milestones"]) == proof["independentlyRecomputedMilestones"] and row["exactAttemptReplay"] == index["exactAttemptReplay"] == {"status": "verified-exact-actual-history", "accepted": row["acceptedCommands"], "rejected": row["rejectedCommands"], "milestones": len(record["milestones"]), "terminalMatched": True}, "ORIGINAL90_HISTORICAL_EXACT_REPLAY_CHANGED")
        report_rows.append({"dataset": "original90", "rowId": row["rowId"], "identity": row["identity"], "caseId": row["caseId"], "sourceRevision": row["sourceRevision"], "status": "target_verified",
                            "requiredChecks": record["requiredChecks"], "actualObservationCodes": codes, "historicalAccepted": row["acceptedCommands"], "historicalRejected": row["rejectedCommands"],
                            "proof": {"file": audit_base + "/" + audit_row["proof"]["file"], "bytes": audit_row["proof"]["bytes"], "sha256": audit_row["proof"]["sha256"]},
                            "archiveFile": base + "/" + row["folder"] + "/case-evidence.xz", "source": record["source"], "terminal": record["terminal"],
                            "parsedCashAndCourseIdentities": balances(terminal, source), "currentEngineCommandsExecuted": 0})
        accepted += row["acceptedCommands"]
        rejected += row["rejectedCommands"]
        milestones += len(record["milestones"])
        members_count += len(members)
        if position % 15 == 0:
            print(json.dumps({"phase": "critical-full-xz-readback", "checked": position, "total": 90}), flush=True)
    require((accepted, rejected, milestones, members_count) == (328, 60, 442, 802), "ORIGINAL90_COMPLETE_COUNTS_CHANGED")
    return {"registered": 90, "targetVerified": 90, "historicalAccepted": accepted, "historicalRejected": rejected, "rawMilestonesRead": milestones, "fullMembersRead": members_count}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", required=True)
    args = parser.parse_args()
    require(re.fullmatch(r"r[1-9][0-9]*", args.label), "FRESH_COVERAGE_LABEL_REQUIRED")
    current = TASK
    while True:
        require(current.is_dir() and not current.is_symlink() and not os.path.lexists(current / "sealed-evidence.json"), "OUTPUT_PARENT_SEALED_OR_LINK")
        if current == ROOT:
            break
        current = current.parent
    output = TASK / ("coverage-" + args.label)
    output.mkdir()
    started = time.time()
    source = Path(__file__).read_bytes()
    report = {"scope": "New P4 readonly full-evidence readback of historical same-runtime original378 and separate supplemental72. No engine/codec/Create replay, GameRun, Chrome, build, save-failure, compatibility, human or whole5b acceptance.",
              "started": started, "script": {"file": str(Path(__file__).relative_to(ROOT)), "bytes": len(source), "sha256": sha(source)}, "newEngineCommandsExecuted": 0, "compatibilityDevelopment": 0, "compatibilityTests": 0,
              "sealAndGit": {}, "sourceBindings": [], "rows": [], "archives": [], "errors": [], "passed": False}
    reader = GitReader()
    try:
        baseline = load(str(TASK.relative_to(ROOT)) + "/baseline.json")
        report["baseline"] = baseline
        require(git("rev-parse", "HEAD").decode().strip() == baseline["head"], "CURRENT_P4_BASELINE_HEAD_CHANGED")
        for name, anchor in [(INPUT, ANCHORS["06"]), (P4_PLAN, ANCHORS["06"])]:
            mode, oid = git_entry(anchor, name)
            require(mode == "100644" and reader.digest(oid) == file_digest(name), "ORIGINAL_P4_AUTHORITY_BYTES_CHANGED:" + name)
        original = load(INPUT)
        require(original["registeredCore"] == 288 and original["registeredCritical"] == 90 and original["registeredTotal"] == 378 and len(original["core"]) == 48 and len(original["critical"]) == 45, "ORIGINAL378_SCOPE_CHANGED")
        report["authorities"] = [{"file": INPUT, **file_digest(INPUT)}, {"file": P4_PLAN, **file_digest(P4_PLAN), "P4OriginalText": bytes_of(P4_PLAN).decode().split("4. P4", 1)[1].split("\n", 1)[0]}]
        closure = runtime_closure()
        report["actualRuntimeDependencyClosure"] = closure
        summaries, registrations, audits = {}, {}, {}
        for key in ("06", "08", "09"):
            print(json.dumps({"phase": "sealed-original-git-tree", "dataset": key}), flush=True)
            report["sealAndGit"][key] = seal_and_git(key, reader)
            summaries[key] = load(MATRICES[key] + "/" + SUMMARY_NAMES[key])
            registrations[key] = load(MATRICES[key] + "/registration.json")
            audits[key] = load(AUDITS[key])
            report["sourceBindings"].append(source_binding(key, summaries[key], registrations[key], closure, reader))
        p1 = load("goal-1/evidence/t17-acceptance-05/prefix-r1/course-prefix-results.json")
        prefixes = {r["name"]: state(ref_read("goal-1/evidence/t17-acceptance-05/prefix-r1", r["final"])) for r in p1["results"]}
        expected_core = {(x["backgroundId"] + "-" + x["seed"], shape_key(s)) for x in original["coreIdentities"] for s in original["core"]}
        actual_core = {(r["identity"], shape_key(r["shape"])) for r in summaries["06"]["results"]}
        require(len(actual_core) == 288 and actual_core == expected_core, "ORIGINAL288_CARTESIAN_SCOPE_CHANGED")
        expected_delegated = {(identity, shape) for identity, shape in expected_core if shape.endswith("--delegated_group")}
        require({(r["identity"], shape_key(r["shape"])) for r in summaries["08"]["results"]} == expected_delegated and len(summaries["08"]["results"]) == 72, "SUPPLEMENTAL72_FIXED_ORIGINAL_SCOPE_CHANGED")
        expected_critical = {(x["backgroundId"] + "-" + x["seed"], case) for x in original["criticalIdentities"] for case in original["critical"]}
        require({(r["identity"], r["caseId"]) for r in summaries["09"]["results"]} == expected_critical and len(summaries["09"]["results"]) == 90, "ORIGINAL90_CARTESIAN_SCOPE_CHANGED")
        gzip_cache = {}
        report["original288"] = core_rows(summaries["06"], registrations["06"], audits["06"], prefixes, gzip_cache, report["rows"])
        report["supplemental72"] = delegated_rows(summaries["08"], registrations["08"], audits["08"], prefixes, report["archives"], report["rows"])
        report["original90"] = critical_rows(summaries["09"], registrations["09"], audits["09"], report["archives"], report["rows"])
        positives = []
        for shape in original["core"]:
            key = shape_key(shape)
            dataset = "supplemental72" if shape["supportMode"] == "delegated_group" else "original288"
            rows = [r for r in report["rows"] if r["dataset"] == dataset and shape_key(r["shape"]) == key and r["status"] == "completed" and r["business"]["actualClosedShape"] and r["business"]["helpedRetainedStudents"] > 0]
            require(rows, "ORIGINAL48_ACTUAL_POSITIVE_MISSING:" + key)
            positives.append({"shape": shape, "positiveSource": dataset, "actualPositiveRows": len(rows),
                              "evidence": [{"identity": r["identity"], "record": r["record"], "business": r["business"]} for r in rows]})
        require(len(positives) == 48 and Counter(p["positiveSource"] for p in positives) == Counter({"original288": 36, "supplemental72": 12}), "ORIGINAL48_POSITIVE_SOURCE_SPLIT_CHANGED")
        report["positive48"] = positives
        report["original378ResultsBound"] = 288 + 90
        report["supplemental72KeptSeparate"] = 72
        require(runtime_closure()["hashes"] == closure["hashes"], "ACTUAL_GAME_DEPENDENCIES_CHANGED_DURING_READBACK")
        for key, original_tree in report["sealAndGit"].items():
            after = physical_tree(ROOTS[key])
            require({name: {k: v for k, v in row.items() if k != "gitBlob"} for name, row in original_tree["entries"].items()} == after, "SEALED_ORIGINAL_TREE_CHANGED_DURING_READBACK:" + key)
        require(Path(__file__).read_bytes() == source, "COVERAGE_VERIFIER_SOURCE_CHANGED_DURING_EXECUTION")
        report["passed"] = True
    except Exception as caught:
        report["errors"].append(repr(caught))
    finally:
        try:
            reader.close()
        except Exception as caught:
            report["errors"].append(repr(caught))
            report["passed"] = False
        report["elapsedSeconds"] = time.time() - started
        path = output / "coverage-results.json"
        with path.open("x", encoding="utf8") as target:
            json.dump(report, target, ensure_ascii=True, indent=2)
            target.write("\n")
        receipt = {"file": str(path.relative_to(ROOT)), **file_digest(str(path.relative_to(ROOT))), "passed": report["passed"], "errors": report["errors"], "rowsRead": len(report["rows"]), "newEngineCommandsExecuted": 0}
        with (output / "coverage-results.txt").open("x") as target:
            target.write(json.dumps(receipt, indent=2) + "\n")
        print(json.dumps(receipt), flush=True)
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
