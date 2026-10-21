"""Small P4 readback of prefix links, complementary to the immutable coverage-r1 report."""
from pathlib import Path
import importlib.util, json, os, time

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("p4_coverage_helpers", HERE / "coverage-verifier.py")
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
started = time.time()
report = {"scope": "Complementary current readonly prefix-reference and twelve gzip raw readback. R1 input-base error is retained; source verifier lines136/155 bind historical prefix refs to P1 input, not audit output. No new Create/codec/GameRun/browser/compatibility execution.",
          "mainReport": {"file": str((HERE / "coverage-r1/coverage-results.json").relative_to(helpers.ROOT)),
                         "bytes": 7561431, "sha256": "fbb4cc8afba5fcf4cf135db6fae591e966ecc429833035dc37e51b209807ab6c"},
          "source": {"file": str(Path(__file__).relative_to(helpers.ROOT)), **helpers.file_digest(str(Path(__file__).relative_to(helpers.ROOT)))},
          "prefixes": [], "errors": [], "passed": False, "newEngineCommandsExecuted": 0, "compatibilityTests": 0}
try:
    current = HERE
    while True:
        helpers.require(current.is_dir() and not current.is_symlink() and not os.path.lexists(current / "sealed-evidence.json"), "NEW_PREFIX_REPORT_PARENT_SEALED_OR_LINK")
        if current == helpers.ROOT:
            break
        current = current.parent
    helpers.require(helpers.file_digest(report["mainReport"]["file"]) == {k: report["mainReport"][k] for k in ("bytes", "sha256")}, "IMMUTABLE_PRIMARY_COVERAGE_REPORT_CHANGED")
    main = helpers.load(report["mainReport"]["file"])
    helpers.require(main["passed"] and not main["errors"] and len(main["rows"]) == 450, "COMPLETE_PRIMARY_COVERAGE_REQUIRED")
    p1_base = "goal-1/evidence/t17-acceptance-05/prefix-r1"
    p1 = {row["name"]: row for row in helpers.load(p1_base + "/course-prefix-results.json")["results"]}
    supplement = helpers.load(helpers.MATRICES["08"] + "/course-delegated-results.json")
    audit08_base = helpers.ROOTS["08"] + "/audit-r4"
    audit08 = {row["name"]: row for row in helpers.load(helpers.AUDITS["08"])["prefixAudits"]}
    raw_cache = {}
    for summary in supplement["prefixProofs"]:
        identity = summary["identity"]
        raw08 = helpers.ref_read(helpers.MATRICES["08"], summary["evidence"])
        raw06 = helpers.bytes_of(helpers.MATRICES["06"] + "/" + identity + "/prefix-create-replay.json")
        helpers.require(raw08 == raw06, "P2_AND_SUPPLEMENT_PREFIX_RECORD_BYTES_DIFFER")
        record = json.loads(raw08)
        helpers.require(record["name"] == identity and record["status"] == "verified" and record["fullCreateAndEveryP1MilestoneBytesEqual"] and len(record["commands"]) == summary["commands"] and len(record["milestones"]) == 25, "SUPPLEMENT_PREFIX_FULL_CREATE_LINK_CHANGED")
        for label in ("initial", "final"):
            raw = helpers.inspect_gzip(helpers.MATRICES["08"], record[label], raw_cache, True)
            original = helpers.ref_read(p1_base, p1[identity][label])
            independent = helpers.ref_read(p1_base, audit08[identity][label])
            helpers.require(raw == original == independent, "PREFIX_FULL_ORIGINAL_P1_COLLECTOR_AUDIT_RAW_DIFFER:" + identity + ":" + label)
        report["prefixes"].append({"identity": identity, "historicalDatasets": ["original288", "supplemental72"],
                                   "record": {"file": helpers.MATRICES["08"] + "/" + summary["evidence"]["file"], "bytes": len(raw08), "sha256": helpers.sha(raw08)},
                                   "commands": len(record["commands"]), "originalMilestones": 25,
                                   "initialRaw": record["initial"], "finalRaw": record["final"], "collectorRawEqualsP1AndHistoricalAuditReferencedOriginalRaw": True, "auditReferenceBase": p1_base, "auditReferenceScope": "Historical auditor references its P1 input; no new raw copy is invented."})
    helpers.require(len(raw_cache) == 12, "EXACT_TWELVE_SUPPLEMENT_PREFIX_GZIP_REFS_REQUIRED")
    report["supplementPrefixGzipArtifacts"] = 12
    report["supplementPrefixRawBytes"] = sum(row["rawBytes"] for row in raw_cache.values())
    audit09_base = helpers.ROOTS["09"] + "/audit-r3"
    for audit in helpers.load(helpers.AUDITS["09"])["prefixAudits"]:
        identity = audit["identity"]
        produced_name = helpers.MATRICES["09"] + "/" + identity + "/prefix-index.json"
        produced = helpers.bytes_of(produced_name)
        independent = helpers.ref_read(audit09_base, audit["proof"])
        helpers.require(produced == independent, "ORIGINAL90_PRODUCER_AND_AUDIT_PREFIX_INDEX_BYTES_DIFFER")
        record = json.loads(produced)["record"]
        helpers.require(record["status"] == "verified" and len(record["originalMilestonesMatched"]) == 25 and record["acceptedCommands"] == audit["actualFromCreateCommands"], "ORIGINAL90_PREFIX_HISTORY_LINK_CHANGED")
        helpers.require(record["initial"]["sha256"] == p1[identity]["initial"]["sha256"] and record["final"]["sha256"] == p1[identity]["final"]["sha256"], "ORIGINAL90_PREFIX_ORIGINAL_P1_RAW_HASH_CHANGED")
        report["prefixes"].append({"identity": identity, "historicalDatasets": ["original90"],
                                   "index": {"file": produced_name, "bytes": len(produced), "sha256": helpers.sha(produced)},
                                   "commands": record["acceptedCommands"], "originalMilestones": 25,
                                   "producerAndIndependentAuditIndexBytesEqual": True,
                                   "fullArchiveMembersReadByPrimaryReport": True})
    helpers.require(len(report["prefixes"]) == 8, "SIX_P2_AND_TWO_P3_HISTORY_LINKS_REQUIRED")
    report["passed"] = True
except Exception as caught:
    report["errors"].append(repr(caught))
report["elapsedSeconds"] = time.time() - started
out = HERE / "coverage-prefix-links-r2.json"
with out.open("x") as target:
    json.dump(report, target, ensure_ascii=True, indent=2)
    target.write("\n")
print(json.dumps({"file": str(out.relative_to(helpers.ROOT)), **helpers.file_digest(str(out.relative_to(helpers.ROOT))),
                  "passed": report["passed"], "errors": report["errors"], "newEngineCommandsExecuted": 0}), flush=True)
raise SystemExit(0 if report["passed"] else 1)
