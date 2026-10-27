# Root最终字段与正式入口合同，当前未填写

本目录只提供builder和三metadata helper候选。唯一当前builder是build-final-registry-candidate-r2.mjs；第一未执行草稿的转义问题及静态纠正保原。没有最终spec、registry、contract或GO，也没有最终unique命令数。本轮没有读取活R7的完整exports/tree。

## 等所有producer停写后，Root提供的spec字段

- authorizedBy=/root、operation=build_final_registry_metadata_only、freshRegistryOutput、cutR7（三者与CLI精确相等）；auditDirectory为fresh full-create-audit-rN，formalPlan/formalTasks完整非空。freshRegistryOutput父目录先存在且guard可写，文件必须不存在。
- producers每行directory/cut完整identity(path/bytes/sha256/mode)/captureRole；writer必须stopped_writer且原cut.explicitProducerStop或last.type=producer-stop。physical读者是closed_physical_reader，原last.type=reader-closed；不把它改称producer-stop。原cut tree.files或files.files逐file必须当前全同。
- 目前必须逐根包含R1–R6六个chrome-main-rN、chrome-negative-atomic-r6、chrome-service-stop-r6、chrome-support-interrupt-r6共9个已停主writer，以及chrome-negative-physical-r6辅助关闭读者；另chrome-main-r7需要自己的真正cut。口头“8cuts”不能拿来漏根。Root可显式新增root，builder不自动扫目录认领，R7cut缺失直接拒绝。
- recordRoles每个最终exports.jsonl原行必须恰1行，key=<原目录basename>:<原file>；给branchId/auditRole/sourceRole/newNativeSavedCommands/nonnegative整型及notCountedAsNew说明（包括备份/重进/候选/物理/导入/旧史）。所有原行都保留，不能按一个runId/revision去重而丢分支；不能多出没原capture的role。
- native_saved_ui的sourceRole必须saved_ui，sourceRoleExplanation明确这是原已保存UI导出；builder生成sourceRoleMapping.from/to/rule/原manifestPath/line/lineSha/cut身份。其它sourceRole等原origin；backup/reentry不是凭文件名改变origin，而是具体auditRole。
- s09-saved98-stopped-service-one-day-full-support-fee.json原source误称赔付0必须保原字面，recordRoles该行另带sourceClaimCorrection.identity（原journal）、line、lineSha256；builder核原source-label-correction/file引用，不覆盖原manifest/raw。正式roleledger也保这条纠错引用。
- nativeContributions每producer目录给newNativeCreates/newNativeSavedCommands/evidence；writer新保存严格等原stop.newGameplayCommands，physical两者0；全局newNativeCreates/newNativeSavedCommands等各Root贡献之和。Create贡献原cut未明确字段时仍须Root有据说明，builder不从capture数/旧历史replay数杜撰新局数；最终新读回仍须核每branch的真实新增receipt。
- derivedInputDependencies包含原101 identity/provenance/result、role=derived_normal_prefix_input_only、两项newNative均0。原派生文件不能是records；future真实UI import_buffer/restore capture可原字节相等，但按自己的原manifest身份另登记。原118/manifest/seal/旧failed93输入若被后续流程引用，完整identity也进referenceFiles，分清输入与本轮新成果。
- publicReadback是未来最终新独立入口完整identity，referenceFiles包含其全部额外imports/配置/原review/来源；publicReadbackWiring见下段。正式公开脚本未齐时builder拒绝，不能用一份空passed:true占位。
- distinctBranchPairs按原分支明确；byteEqualGroups由builder对当前bytes/SHA并逐Buffer.equals自动列，仅等字节别名，不代表新command。

## Builder未来只做filesystem/已保存receipt metadata

全部producer/cut/source/继承脚本齐后，Root显式运行当前r2 builder才读取完整最终exports，每manifest原origin/source/line hash及raw bytes/run/revision角色保。脚本不导入codec/projectors/registry、不spawn任何进程、不触游戏存储；最后只wx写Root指定freshRegistryOutput。expectedReplay三种历史计数来自原receiptInventory，不在本轮预填；官方source/dependency数量实际扫描，不能拿611 UI或旧127/901盲填。Root随后还要精确source/spec/cut独立复核才准正式freeze。

同一creation envelope及完全同command前缀可由原verifier trie复用：root完整Create signature+commandId+versions，children完整canonical command含payload/run/actor/kind/commandId/expectedRevision，再核commandText碰撞和每份终态逐字。相同runId/normal-relay-N不并成一条经营账，原branchId/各capture/新保存贡献持续分列。不会伪造runId或改原verifier。

原verifier对任意origin都保recordedOrigin，只对严格origin===import_buffer计inputBuffers；native_saved_ui/current_buffer/unsaved_candidate/physical_readonly没有自动改字面。正式report原值完整保存，旁列literalOriginCounts/sourceRoleCounts/roleledger；若旧工具显示unknown也保unknown，不把role映射倒灌report或填伪0。

## 最小publicReadbackWiring最终合同

apiVersion=u4b-public-readback-v1，requirements至少三scope：

1. positive_service：推荐inherited_result，expectedChecks35，继承native-service-public-readback-r2的原result/public-facts/input-manifest/frozen-inputs/readback-once-r2.mjs/terminal六份identity。实际15capture/14unique，原31输入逐bytes核；其35只正向，非再次执行。
2. negative_stop_and_atomic：推荐inherited_result，expectedChecks31，继承native-negative-and-stop-public-readback-r1同类六份identity。实际25capture/16unique/48冻结输入；31指检查数，绝不是31raw。新io候选逐frozen.inputs及manifest.records raw identity核全同，且每份已继承raw须在最终records/该scope recordKeys有原capture对应。该31包括保存故障的公开原文关系，不代原Native因果重演/当前画面。
3. current_r7_facts：必须fresh_readback；recordKeys为本批R7实际最终原文集合，expectedChecks由最终独立新JSON脚本真实case登记，当前不填。脚本只读固定本批公开钱/日期/AP/保护/旧款/quote生效/停站原实际后果等Root最终明确事实，并核Native贡献、原别名/新保存关系；不能用旧once脚本改输出路径硬重跑，不能借35/31替R7新事实。

每行recordKeys必须是最终registry原key、非空且唯一。继承行inheritance给result/facts/manifest/frozenInputs/script/terminal；io核原result passed/exit0/35或31、原真实rawRows等manifest长度、全部frozen引用和每raw当前身份，并保引用在contract.references。其它新增scope只能fresh_readback。最终entry及casebook/原账算法仍由Root/独立Owner另外准备并审，不是本metadata builder的新会计审核器。

entry读取U4B_AUDIT_DIRECTORY/frozen-contract.json及同snapshot，只写同新正式根readback-result.json/public-facts等guard wx。result含passed/auditDirectory/确切contract identity/coverage。每scope覆盖mode/recordKeys/checks/passedChecks/failedChecks数值0/passed，继承scope另reusedResult/reusedFacts确切身份；io核每scope与contract完全匹配。进入口做原35/31结果读入+当前原件身份复核+新R7事实，不执行旧once，不发经营命令、不读未审隐藏truth/queue/seed。最终entry全部imports必须进referenceFiles。

## 未来命令形状，当前禁止执行

```text
rtk proxy /Users/gordon/.nvm/versions/node/v22.12.0/bin/node --experimental-strip-types goal-1/evidence/t17-acceptance-37/final-create-registry-preparation-r1/build-final-registry-candidate-r2.mjs --spec <Root最终spec相对路径> --fresh-registry-output <Root指定freshRegistryOutput> --cut-r7 <Root真实R7cut相对路径>
rtk proxy /Users/gordon/.nvm/versions/node/v22.12.0/bin/node --experimental-strip-types goal-1/evidence/t17-acceptance-37/final-create-registry-preparation-r1/freeze-final-cut.mjs --registry <同freshRegistryOutput> --output-dir <同fresh正式audit根>
rtk proxy /Users/gordon/.nvm/versions/node/v22.12.0/bin/node --experimental-strip-types goal-1/evidence/t17-acceptance-37/final-create-registry-preparation-r1/run-once-candidate.mjs --audit-directory <同fresh正式audit根> --root-go <独审后Root另写GO>
```

必须使用本目录同组三helper：旧refinement-r2不认识负31继承/closed physical cut，不能混用。runner与r2原字节同；正式engine原verify_normal_browser_exports只运行一次，再独立entry。freeze不执行游戏；builder也不写GO。原verifier内部read-only git rev-parse是已知未来执行范围，不能与本轮Git0混称。

正式verifier exit0但readback非0/协议或字段假设错：保原report/terminal/source/input，再fresh readback-correction按精确原件只补读回；绝不再运行完整Create/runner。任何preflight/中途异常先收外层真实terminal，不因缺result谎称未执行；源/输入/授权漂移保原红，Root另定新cut，不静默重启。
