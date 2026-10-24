# U3-C1 closeout candidate — preparation only

The only prepared CLI is closeout-final-r1.candidate.mjs. This document is an execution recipe for Root after explicit final freeze; it does not authorize execution. No candidate mode, seal, index write, commit, browser probe, or Create audit ran during preparation. The independent post sibling does not exist yet.

1. Finish Native captures, original complete-Create audit, final docs/checks/validation and all root31 writers. Select the actual final successful build manifest, not a guessed revision. Its files list must exactly match current full source/asset/config identities. The current preparation observation is 556 vs baseline547, 9 new and14 modified UI paths; the helper enumerates dynamically and will reject removals or any non-UI delta.
2. Root decides to execute prepare with that manifest, then seal-root, stage-feature and commit-feature. The feature scope is the dynamic src/ui delta + changed docs36 + exact sealed root31 payload and marker. Three masters, all26 P3 paths, root19 and the post sibling are excluded. AGENTS is not in this candidate whitelist: any later AGENTS change requires a new reviewed candidate rather than silent staging.
3. After the feature commit, inspect actual feature/readback and preserve old failures. In unsealed post write the current whitespace classification and any final independent records. Run the two CLI sealed-parent probes and the13 browser entry probes if Root chooses this gate. Browser probes require the actual already-bound root31 Native helper in the current Cua context; never bind a replacement after sealing, never import the CLI into Cua.
4. Append the actual feature completion to the three working masters and, if needed, docs36. The helper strips only the unique original2304B/14LF P3 insertion, verifies baseline-minus-insert equals d778 HEAD, and selects original HEAD + the entire owned1513B prefix and any later U3-C1 suffix. It does not write working masters. The initial1513B block must occur once; a later real completion appendix is required before prepare-record.
5. Run prepare-record only after all other post writers have finished. It writes selective master blob texts, record intent and exact NUL ordinary-file list. Then stop all post writers, seal-post, stage-record. Stage-record writes Git blobs/index deliberately, so it is a future authorized mutation; do not run now. Root performs the record commit explicitly and stores its console result outside both sealed trees. Finally verify-record <actual-record-SHA> verifies feature parent, exact set/blob/mode, root31 seal at entry and return, post seal and unmodified working P3. No push/deploy is included.

Future CLI commands, from repository root:

~~~sh
rtk proxy node goal-1/evidence/t17-acceptance-31/closeout-preparation-r1/closeout-final-r1.candidate.mjs prepare goal-1/evidence/t17-acceptance-31/<FINAL-BUILD>.source-before.json
rtk proxy node goal-1/evidence/t17-acceptance-31/closeout-preparation-r1/closeout-final-r1.candidate.mjs seal-root
rtk proxy node goal-1/evidence/t17-acceptance-31/closeout-preparation-r1/closeout-final-r1.candidate.mjs stage-feature
rtk proxy node goal-1/evidence/t17-acceptance-31/closeout-preparation-r1/closeout-final-r1.candidate.mjs commit-feature
rtk proxy node goal-1/evidence/t17-acceptance-31/closeout-preparation-r1/closeout-final-r1.candidate.mjs cli-probes
rtk proxy node goal-1/evidence/t17-acceptance-31/closeout-preparation-r1/closeout-final-r1.candidate.mjs prepare-record
rtk proxy node goal-1/evidence/t17-acceptance-31/closeout-preparation-r1/closeout-final-r1.candidate.mjs seal-post
rtk proxy node goal-1/evidence/t17-acceptance-31/closeout-preparation-r1/closeout-final-r1.candidate.mjs stage-record
# Root explicit record git commit; do not redirect into sealed root31 or post.
rtk proxy node goal-1/evidence/t17-acceptance-31/closeout-preparation-r1/closeout-final-r1.candidate.mjs verify-record <ACTUAL-RECORD-SHA>
~~~

Pure Cua import after root seal, using the existing actual Native helper variable:

~~~js
var c1Probes = await import('/Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-acceptance-31/closeout-preparation-r1/browser-probes.mjs');
await c1Probes.browserProbes(actualRoot31Native, 'existing root31 Native capture binding');
~~~

The module never reads process.argv and imports only old25 pure I/O/blob functions plus the original browser guard. Four standard wrapper methods are explicit stubs whose delegation count must remain0; nine methods are from the actual bound Native helper and must reject before UI dispatch. These13 calls are not13 gameplay/browser actions. All exact errors, stdout/stderr, terminal codes and no-target/no-byte-drift evidence remain in the independent post before it is sealed.

Preservation scope: all26 P3 current working bytes/SHA/mode plus original tracked/untracked index state; root19 exact1197 ordinary/110 directory tree;116 ordinary old marker set+identity;2 marker symlink type/target literal, with filesystem mode bound only since this preparation because opening baseline lacked link mode; full payload/tree/mode of baseline.lastSealed roots; original input61B. Old marker identities alone do not claim all historical payloads were re-audited. Seal excludes only its own root marker, rejects symlinks and binds directory modes.

Whitespace must be classified from this task's actual staged diagnostics. Preserve console and unified-diff bytes; do not copy older numeric counts or treat arbitrary txt/patch/preimage as exempt. A no-index diff exit1 with empty stdout/stderr is a difference classification, not exit0 and not a behavior failure.

Native and complete-Create audit, final UI/source counts, human understanding, art acceptance, original PNG restoration, P3 formal62/22, compatibility and the full goal are not proved by this preparation. Compatibility development/testing remains0.
