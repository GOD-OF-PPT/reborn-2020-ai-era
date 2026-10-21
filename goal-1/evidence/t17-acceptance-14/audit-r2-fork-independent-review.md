# D09 R2 audit fork independent static review

Observed at 2026-10-21T16:05:02.144456+00:00. Reviewer: relay_preservation. Scope: read-only code and original-byte review; no audit, tests, browser, compatibility or runtime changes executed by this reviewer. Whole R2 remains pending its actual terminal; this report does not assess that result.

## Result

No remaining definite blocker found within this static review scope after the two bound-source guard corrections below. The original full CreateRun, canonical creation identity, all receipt replay/evaluateCommand, proposed-only result, earned-prefix cache and canonical re-export checks remain unchanged. The shared scripts/verify_normal_browser_exports.ts is unchanged and was compared with its opening baseline Git blob.

The helper has no trim, arbitrary whitespace normalization, CRLF allowance, JSON reserialization or row.origin bypass. Actual non-buffer records must be exactly canonical. An import_buffer must have its exact folder/file/origin binding, match the independently bound original source bytes/SHA, and equal canonical or canonical plus exactly one declared terminal LF. Relabelling a bound buffer as a non-buffer, missing binding, changed source/content, CRLF and double LF are rejected. The caller conditionally supplies binding/sourceText only for a manifest hit; the final used-binding set must exactly equal all five manifest keys.

allByteEqual is computed from actual comparisons and the LF-difference list is computed from accepted differences. If full R2 successfully consumes these observed inputs, its two LF records require allByteEqual=false; canonical replay, all non-buffer bytes and original-source equality remain separately reported. The three true summary flags follow successful throw guards, not a substitute for them.

## Guard corrections and boundary

1. The initial fork froze bound-source hashes but its terminal generic read could follow a replaced bound path. The parent preserved that version as audit-r2-fork-before-bound-source-guard.txt, then added readBoundSourceStable: ancestor/leaf no-symlink checks; O_RDONLY | O_NOFOLLOW | O_NONBLOCK; before/fstat/after physical identities (dev, ino, mode, size, mtime, ctime); remembered first identity; terminal guarded FD reread compared against the original inputHashes value.
2. A subsequent review found the generic terminal hash loop still read those five bound sources before the new guarded loop. Its final condition now skips boundIdentities.has(file); all five source paths are terminal-read only through the guarded FD loop. Both corrections were statically checked in the final fork hash below. No concurrent replacement race was injected or demonstrated; no absolute race-proof claim is made.

## Exact bound inputs

All five original source files, import buffers and corresponding single journal rows were independently byte/SHA/length matched using nofollow source reads. Two have one terminal LF; three have none. These are frozen original-input buffers, not newly saved business outcomes.

| Exact buffer key | Original source | Bytes | Terminal LF | SHA-256 |
| --- | --- | ---: | ---: | --- |
| chrome-deepseek-r8/eco-normal-c16-r70-text-before-import.json | goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeContract.json | 1000082 | 1 | 7171bcf87e60fb63607836e22f17624fa744dc94517641db9aa587c0ad3d9d40 |
| chrome-deepseek-r10/eco-real-original-backup74-restore-text-before-import.json | goal-1/evidence/t17-acceptance-14/chrome-deepseek-r8/eco-original-physical-backup-r74-before-review.json | 1022729 | 0 | c3b1343d811e014f03e4fa24508cbb7fa1296811a48b3e9b04a8567fd58ab7b5 |
| chrome-deepseek-r11/eco-real-original-backup75-restore-text-before-import.json | goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-original-physical-backup-r75-before-support.json | 1030898 | 0 | fca52077dc4b14611ce698d3ac341d57984d82a46920b5d5d9f3643bd91152a5 |
| chrome-equity-r11/normal-c16-signed-equity-r94-text-before-import.json | goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-signed.json | 1242505 | 1 | 5ee2c1fdc5cbb9999edaad1871d677ade51f7aba3f2e2d4571dce5a424d16120 |
| chrome-life-npc-r11/normal-c16-npc-offered-r12-text-before-import.json | goal-1/evidence/t16-c16-final-a1/life/t15-npc-own-calendar-offered.json | 222704 | 0 | 5fd29beaf62409cedc3f61f243614695c92597e909ef884e62f3342898738f12 |

## Observed identities and limited test evidence

The fork freezes its own four inputs (fork/helper/manifest/driver), the original/kernel source inputs, five bound original source bytes and exact used-binding set. Driver success checks canonical replay/non-buffer/source flags and does not falsely require allByteEqual=true.

Read-only inspection of audit-input-boundary-tests-r2/complete.json and console found actual exit 0, 17/17, no frozenSourcesChanged. This is helper byte-boundary/codec evidence only; it does not prove full CreateRun replay or a full browser audit. No test was rerun by this reviewer.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| scripts/verify_normal_browser_exports.ts | 6618 | 68e7c16c6280c86060686c48554f4dc20481307f5988f972a11e390c03520f87 |
| verify_normal_browser_exports-r2.ts | 11022 | bdbc2f432b1d04916eeea3ca4ea7ead349c8303a12a29c282c546a1aa67f21cc |
| audit-input-boundary-r2.mjs | 2827 | bfe32e018c852c3240bbc630c9d17a58f81529ef765f20b6b08075b526559683 |
| audit-input-bindings-r2.json | 2299 | 6809f384f58d383ef5f41105a90f274f7133ed39303bb0f252ae55fcad3cf0eb |
| run-browser-audit-r2.py | 2580 | c76ab8353fc5ba3264a5dfdbac95dde583af9de9158bd9cedcbb6f630e2c7f27 |
| audit-input-boundary-r2-api.md | 2353 | e32133d09d6d62298b076ec74957e6fab28fb7b70c38a6bfe0ee80740df00306 |
| audit-r2-fork-before-bound-source-guard.txt | 9692 | 96d8220efad046bbf80b5772fec5fcc6a7646b23d52663a0248e7856967e7404 |

Write-time repository identity: {"branch": "main", "head": "538032efc898705e4ea155c71df4caa899de5120", "origin": "https://github.com/GOD-OF-PPT/reborn-2020-ai-era.git", "repository": {"defaultBranchRef": {"name": "main"}, "nameWithOwner": "GOD-OF-PPT/reborn-2020-ai-era", "url": "https://github.com/GOD-OF-PPT/reborn-2020-ai-era", "visibility": "PUBLIC"}}.

Output safety: all physical ancestors through / checked as directories without sealed-evidence.json or symbolic links; original browser evidence guard passed; root14 staged path set empty. This new report is exclusive-created; root14 remains unsealed and unindexed. No previous evidence, source, plan or task record was edited.
