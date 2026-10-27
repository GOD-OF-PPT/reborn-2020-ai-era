# 五P2后的最终Root合同，当前不执行

本目录同组唯一入口build-final-registry-candidate.mjs，配audit-io/freeze-final-cut/run-once-candidate；旧18件完整前像在prior-candidate，仅作来源，不能混用其旧CLI/协议。没有final spec/registry/contract/GO、没有未来命令总数。原origin/source/旁sourceRole、source纠错引用、fullpayload trie、reader-closed与byte aliases/Native贡献原合同继续。

## A｜完整producer和fresh覆盖

Root最终spec新增finalProducerSet：declaredCompleteBy=/root、finalInventoryComplete=true、completeDirectories为最终所有producer目录（逐一等spec.producers.directory集合）、freshDirectories为所有新增producer的目录，至少chrome-main-r7与chrome-main-r8。原R1—R6/negative-atomic/service-stop/support-interrupt/physical共10root仍必需，任何其它未来root也必须fresh。每producer提供确切cut identity/directory/captureRole。R7/R8 cut缺失、未stop或reader未closed直接拒，当前活源不造cut。

每最终record保producerDirectory，严格等identity.path原父目录。每fresh_readback requirement显式producerDirectories非空且属于final fresh集合；recordKeys必须精确等这些原producer全部最终capture keys，含buffer/候选/物理/别名，不能挑旧86或同字节新别名充当前facts。fresh producer只能分配一次，所有fresh集合必须全覆盖；可一scope覆盖R7+R8，但不能只配scope名字。builder/freeze/runner结果验证共用该规则；report.coverage fresh项也必须回报同producerDirectories精确集合。

CLI不再用仅--cut-r7；Root各cut都在最终spec.producers，由finalProducerSet显式声明全量：

```text
rtk proxy /Users/gordon/.nvm/versions/node/v22.12.0/bin/node --experimental-strip-types goal-1/evidence/t17-acceptance-37/final-create-registry-fix-r1/build-final-registry-candidate.mjs --spec <Root最终spec> --fresh-registry-output <freshRegistryOutput>
```

该形状不是当前授权。原spec的authority/operation/freshRegistryOutput/formalPlan/formalTasks/roles/nativeContributions/derivedInputDependencies/publicReadback/referenceFiles等仍完整必需；最终数字仅等真实全输入齐后metadata登记，不能沿用当前51或预填未来52。

## B｜旧35/31只能继承原来源集合

positive_service35、negative_stop_and_atomic31继续只引用原result/facts/manifest/frozenInputs/script/terminal，不重跑旧once。新io对原manifest每capture按identity(path/bytes/SHA/mode)+manifest完整identity+原行号/行SHA+origin/source/run/revision，在最终records必须唯一找到一条；推导expectedKeys后要求scope.recordKeys双向精确等集。正向15capture/负向25capture有任何漏行/额外R7/R8行都拒。相同bytes不同原path或manifest来源别名不能映射成继承原件，只能原byteEqualGroups旁证明，fresh来源仍走freshscope。

不能把31检查说成31raw，原25raw/48冻结输入与正15raw/31输入仍逐原身份核。新R7/R8全部事实由最终独立新JSON entry按同contract执行，metadata协议不是会计算法。coverage结果保确切contract identity、scope/mode/recordKeys/producerDirectories（fresh）/checks/passedChecks/failedChecks=0/passed及reusedResult/reusedFacts（继承）。

## C｜整个producer tree首末核

requireProducerTree适配R1.files与其它cut.tree：递归lstat拒symlink和特殊文件，包含根目录、每空目录，逐file path/bytes/SHA/mode、directories路径集合、directoryModes集合和每mode精确等原cut。多文件、少空目录、目录mode变均拒，不写/删源producer。builder与freeze各自开始/结束重扫，runner预检/终态也复核；旧“只核cut列文件”已撤。Root需保持整个producer树到正式终态不写。

## D｜原101历史窗，不拿旧任务限制当前

每derivedInputDependency保identity/provenance/result/role与0新Native，另必填sourceBefore/sourceAfter/executionContract/terminal四份完整identity。sourceBefore与sourceAfter固定原run-r1两文件270321B/9c3955b277b025c76d7c8db3d675b2af12aa6d7eab97508adc42c6480773e7bc且原bytes同；核内部127sources/901deps/P32626/37refs/3authority两窗与历史executionContract精确一致。result须1attempt/completed Create、117attempt/proposed/success、118逐字等原、prefixPublished、errornull和五类differences全空，terminal0/passed，原raw/provenance和原118/manifest/seal引用仍一致。

历史references中的root37/tasks5618B/6a6df5…只在冻结proof内部识别，不逐条require这些历史references当前文件相同，不恢复当前tasks或当前source，也不再执行派生。当前contract只绑定这些不可变proof/authority/原输入文件本身。

如果当前正式Root还要reference root37/tasks.md：spec.mutableFinalReferences必须有{identity:<当前最终snapshot>,role:final_snapshot_until_runner_terminal}，并与当前referenceFiles身份同。builder→freeze→runner终态持这一当前值；写新进度须等终态或另新cut，不能热换hash。它与历史5618是两层身份，绝不混用；freeze另写mutable-final-reference-policy.json说明。没有此声明的当前tasks引用拒绝。

## E｜完整依赖跨阶段绑定

registry新增runtimeDependencies保存builder实际dependencies()全部path/bytes/SHA/mode（含Node），数量实际得出，不盲填901。freeze先requireIdentitySet等路径全集/bytes/mode、拒重复，再核count并写同一runtime到contract.dependencies；同count换Node或包bytes不能通过。runner原source/dependencies首末绑定继续；历史D的901只是当时窗，不要求等于当前runtime。

## 保持一次正式engine与失败保原

builder是纯filesystem/receiptmetadata；freeze仍只准备同源snapshot，二者都不启动codec/registry/engine。Root最终独审精确同组候选/spec/全部cut/独立entry后，才另GO运行一次原verifier→独立readback。原verifier内部read-only git rev-parse属于未来明确授权边界，本轮Git0。

verifier已经通过而readback/协议错：保report/stdout/stderr/terminal/source/input，另fresh readback-correction只补读回，绝不再次完整Create或runner。preflight/中途异常收外层真实终态，不因result缺失称0执行。当前所有正式门槛未过，U4B/C-S4-R/goal不关闭；compat0。
