# R2 independent fork review — terminal addendum

Observed at 2026-10-21T16:06:31.096820+00:00. This fresh addendum preserves the earlier static review as its actual observation; it does not overwrite it.

Read actual browser-audit-complete-r2.json: wrapper exit 0, driver exit 0, validationErrors empty, elapsed 135.60966181755066 seconds. Read the complete audit report and root terminal readback: 6 normal CreateRun identities, 146 unique replayed commands, 27 original raw files (5 source-bound import buffers / 22 non-buffers); 129 source and 44 input hashes. The root readback records all frozen hashes unchanged. Audit flags are passed=true, allByteEqual=false, allCanonicalReplayMatches=true, allNonBufferBytesEqual=true, allInputBufferOriginalSourcesEqual=true, boundSourcePhysicalIdentitiesUnchanged=true; exact five bindings consumed, two original one-LF differences separately recorded.

The two differences remain the original eco-normal-c16-r70 and normal-c16-signed-equity-r94 input buffers. Their original bytes were not rewritten. The successful audit does not turn their bytes into canonical saved-export equality. The fork/helper keep strict non-buffer comparisons, exact source/role binding and the original full Create/receipt/cache algorithm; the two corrected terminal path guards and final fork SHA remain as reviewed. No further definite issue found in that scope.

Final fork SHA-256: bdbc2f432b1d04916eeea3ca4ea7ead349c8303a12a29c282c546a1aa67f21cc.

| Read artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| browser-audit-complete-r2.json | 447 | 69fd5a8e5b94fbdd73414b30633a104f58c7670668dec6b22d154324baf847c5 |
| current-chrome-audit-r2/normal-browser-export-audit.json | 49863 | 13e8b618930b54f18379518d12a234bfcefa3a11ae730f1f27d6ea31c404c89f |
| browser-audit-r2-terminal-readback.json | 1640 | 64d9f5a017a1f896092d11c4153106dd1ea0989d1b903f774ef3ebfed461a179 |

Helper 17/17 remains helper/codec-boundary evidence only. Full R2 above is now actual Create/replay and original-byte evidence; it is not a new browser visual, performance, compatibility, human-understanding or full-business acceptance. Reviewer ran no tests or browser actions and injected no concurrent replacement race. The earlier R1 failure, pre-guard fork and source originals remain preserved. All output ancestors and the repository browser-evidence guard passed; root14 unsealed/unindexed; this addendum is wx-created.
