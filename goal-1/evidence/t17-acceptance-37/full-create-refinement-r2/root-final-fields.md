# Root最后必须给齐的字段（字段合同，非最终registry）

当前没有填最终raw集合/unique命令数，没有registry/contract/GO。以下仅供Root最终cut时逐项核对；所有identity均是path/bytes/sha256/mode具名字段，不用对象键序判断财务语义。

## A. 原R1已有且继续必需

- state=frozen、frozenBy=/root、scope=U4-B-only、outputDirectory为fresh full-create-audit-rN；formalPlan/formalTasks完整非空。冻结时先三文件，不在准备目录执行。
- officialSources完整实际列表及expectedOfficialSourceCount；expectedDependencyFiles实际发现值，含Node22.12.0/所用包/配置和原io来源；不能盲填旧127/901。baseline P326每份完整身份。
- 每条record：key唯一、branchId、auditRole、identity、origin/source原字面、runId、revision、snapshotFolder(chrome-*)/snapshotFile、安全basename；manifest.identity/原line(1-based)/lineSha256。newNativeSavedCommands/notCountedAsNew按原producer贡献说明。
- producerCuts每份完整identity，真正producer-stop与tree中raw/manifest/journal逐文件同；R5 cut待Root实际写，R6后续新producer仍须停写。journals[].identity/producerStopped:true/auditRole齐。原journal不能晚加事件后仍称全同。
- byteEqualGroups、distinctBranchPairs按实际原件；同run/revision不同branch绝不混；备份/重进/候选/物理不是新增command。
- expectedReplay.creationHistories/uniqueHistoricalCommands/artifactRows/literalImportBufferRows只在最终records纯metadata inventory后给值；不把derived-only依赖算行，不把各独立组共享历史简单相加。newNativeCreates/newNativeSavedCommands来自真正Native范围，不由replay命令数反推。
- publicReadback完整脚本identity；referenceFiles完整额外只读helper/原输入/封存引用及依赖，独立审查报告与RootGO另等freeze后才写。

## B. 新增原来源映射字段

每条record显式sourceRole。origin=native_saved_ui时sourceRole=saved_ui，并给sourceRoleMapping：

- from=native_saved_ui，to=saved_ui；
- rule=exact_original_manifest_and_stopped_producer_cut；
- manifestPath/manifestLine/manifestLineSha256与本record.manifest完全同；
- explanation写明这是原producer“已保存UI导出”的字面，不是把candidate/physical/buffer冒作保存。

其余origin sourceRole保持同原origin；backup/reentry/old/new等具体用途仍由auditRole/branchId说明。原manifest任一字节不改。literalImportBufferRows只等origin===import_buffer，current_buffer不算这个旧字段，但原可见buffer角色仍在ledger可核。

## C. 派生101输入依赖

derivedInputDependencies每行：role=derived_normal_prefix_input_only、identity、provenance、result、newNativeCreates:0、newNativeSavedCommands:0。候选核passed result及full118ByteEqual/prefixPublished、provenance.fullEndpointByteEqual/role、prefix bytes/hash、0Native/0headwrite；原118/manifest/seal自动纳reference。原derived文件不放records、不复制到input/chrome-*。

未来R6实际buffer/Restore capture若逐字等101，仍登记自身真实capture路径/manifest和用途，不把原派生文件改称Native。未来单Usage102与旧wholePeriod102分branch。若复用旧failed93作UI输入，原93/manifest/seal也需作为referenceFiles绑定并说明输入用途；未来实际capture才纳自己的record，不把原93当本轮新保存。

## D. 独立读回接线（外部脚本真正产生事实，此处只有接口）

publicReadbackWiring.apiVersion=u4b-public-readback-v1，requirements每行：

- scope唯一；至少positive_service、negative_correction、save_fault_and_retry，可按真实范围补support_interruption等独立scope；
- mode=inherited_result或fresh_readback；recordKeys是该scope确切覆盖的最终registry key集合（不能凭revision猜），expectedChecks是该脚本真正有意义断言数，不是未来command数；
- 推荐positive_service用inherited_result、expectedChecks=35，inheritance含result/facts/manifest/frozenInputs/script/terminal六份完整identity。候选会核原result passed/exit0/35of35；该35只对应原正向15capture/14state/21新保存。原脚本已跑且硬编码once，禁止再次执行旧路径。
- negative_correction、save_fault_and_retry必须fresh_readback，expectedChecks等新独立读回入口最后实际实现的断言数，recordKeys包含其真实前后/候选/物理/retry/重进角色；不可把positive35填进这些scope。没有原文就保持缺口，不能先填passed。

候选目前也允许Root明确选择fresh_readback正向重新做单独公开算术；这不是重跑Create的理由，且不能把它称原35继承。review.md中“要求positive明确继承”是本轮推荐路径；代码实际强制的是：只有positive可以继承，任何继承必须准确35，负向/故障绝不能继承35。最终Root方案宜直接继承已有正向，不重造审计器。

最终readback脚本只在U4B_AUDIT_DIRECTORY指定新正式根工作，读取同frozen-contract/snapshot，不执行新经营或未来模拟。真正独立公开JSON/投影断言由负责Owner按最终raw编写并独审；本三个metadata adapter没有声称代做这些断言。Root须确认额外import helpers均在referenceFiles。

脚本最终以原io.put新写readback-result.json，结构字段为passed、auditDirectory、contract（确切frozen-contract identity）、coverage数组。每scope回报scope/mode/recordKeys/checks/passedChecks/failedChecks(整数0)/passed；inherited_result另有reusedResult/reusedFacts精确identity。runner除实际readback进程exit0，还会核contract身份、scope集合、原record keys及检查数。不得只输出一个passed:true。可直接复用候选audit-io的validatePublicReadbackResult预核结构，再用原put写结果；这不是新会计算法。

## E. 最终一次执行形状

以下是未来命令形状，不是当前授权；具体registry/rN由Root最后固定，不执行此文档。候选实际文件名始终run-once-candidate.mjs：

```text
rtk proxy /Users/gordon/.nvm/versions/node/v22.12.0/bin/node --experimental-strip-types goal-1/evidence/t17-acceptance-37/full-create-refinement-r2/freeze-final-cut.mjs --registry <Root最终registry相对路径> --output-dir <fresh正式根>
rtk proxy /Users/gordon/.nvm/versions/node/v22.12.0/bin/node --experimental-strip-types goal-1/evidence/t17-acceptance-37/full-create-refinement-r2/run-once-candidate.mjs --audit-directory <同一fresh正式根> --root-go <准确RootGO相对路径>
```

freeze前所有producer停、最终source/raw/refs/readback齐；freeze后独立读审精确contract/候选，Root另GO固定authorizedBy/operation/auditDirectory/contract/independentReview。read-only git rev-parse是原verifier内部既有行为，未来执行授权须明说，不写索引/commit。本轮全部not_run。
