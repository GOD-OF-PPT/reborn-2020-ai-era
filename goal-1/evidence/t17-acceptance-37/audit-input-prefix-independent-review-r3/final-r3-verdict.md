# R3独立静态准入：只准Root准确GO后一次输入派生

**R3当前冻结cut准入通过，未发现确定阻断；只准Root另写准确GO后执行一次，不是已授权/已执行重放或已生成101。** 本结论只针对derive-prefix-once-r3.mjs（15949B/SHA586bd2d074b0a839d6daa92ce4bd23604d6e3b9b886a1be150faf8b59e55f019/0644）和frozen-contract-r3.json（275026B/SHA14f73d95ba3bf83b7dc264bdc21ef72daaabde423819c017fb782024db2befdf/0644）。

## 最小增量与原阻断

R3源只有frozen-contract-r2.json→frozen-contract-r3.json一个literal，逆变后完整字节等原R2 e110aa4a…；此前全文静态审的原1Create+117完整历史/完整118先逐字同/101仅内存/合法公共已审目标/guard/GO/失败计数/derived角色逻辑全部保持，不借此新增命令或删状态。

R3合同除at、candidate/priorUnexecutedCandidate元数据、cutRefresh与references外，所有原字段逐数据同R2，包括source118、101截点/last/next原commandId、public target、127/901、P326和固定run-r1。35旧引用按实际四字段比较，唯一内容变化是Root合法更新的root37/tasks.md，现5618B/SHA6a6df5f55f853bbee631db0ade7479905443b321c405e1771715f6126bb31bd6/0644；另补R3script和R2contract两引用，共37。gitMode补充不冒内容变更。

R2 B1已对R3关闭：37当前引用及127源/901依赖/P326首末全部0漂移、精确源/依赖集合相符、无声明文件或父路径symlink。P3与root37原baseline26一致。原118/manifest/seal身份仍同先前独审核过的第2行和唯一源entry。R2旧合同本身仍旧cut、原漂移/metadata断言exit1及原初稿/更正/判定全部保留，不恢复新tasks或改原记录。

## 一次执行条件与准确命令

Root另fresh guard+wx写goal-1/evidence/t17-acceptance-37/audit-input-prefix-go-r1.json，须authorizedBy=/root、operation=derive_normal101_via_full118_once、绑定本R3合同准确四字段、本独审最终文件四字段、固定outputDirectory=goal-1/evidence/t17-acceptance-37/audit-input-prefix-run-r1；当前GO/run-r1仍不存在。本报告不替Root写GO或赋予执行身份。

准确候选只使用：

```text
rtk proxy /Users/gordon/.nvm/versions/node/v22.12.0/bin/node --experimental-strip-types goal-1/evidence/t17-acceptance-37/audit-input-prefix-prepare-r1/derive-prefix-once-r3.mjs --root-go goal-1/evidence/t17-acceptance-37/audit-input-prefix-go-r1.json
```

旧execution-candidate.md仍是R2的历史命令，本R3执行不能直接照旧R2命令或not-authorized模板。Root已明确从R3 cut到实际运行终态不改bound refs，特别root37/tasks；如再变更，必须重新freeze，不能忽略严格比较。不能预创建脚本run-r1目录，已存在按设计拒；不能重跑保留R1/R2或第二次Create。

保持实际外层argv/stdout/stderr/同一进程终态收回；门槛前错误可能先throw，脚本自写terminal不代实际OS exit。只有完整118逐字等原、公共101/最终零漂移/发布读回及result.passed=true和provenance/raw身份齐才可后续原UI导入。I/O失败或任何漂移保失败停止，不以raw存在当准入；101bytes/SHA只有实际执行后知道。

## 范围与独立性

本次只读源码delta/合同与metadata，未执行syntax/codec/projector/evaluate/replay/工程/Browser/Git；Node只用于每次证据写前实际原ancestor guard，wx新增。独审者不是候选作者，曾参与游戏UI/test，故不称全项目完全作者隔离或真人。127/901 metadata同不等于当前回放已过，未生成101或新游戏命令。

旧negative118/derived101的业务/账户/期/Mar7日期与当前positive路线分列；不能仅凭同runId或101/102编号拼接，不以旧整期102代当前新single更正。U4-B/R2/R3/C-S4-R/原P3/PNG/真人/M01暂停/T18/整个goal未关闭，compat0。

[杠精审查] R3静态准入通过：真实B1原因被新cut修复并首末核定，未放宽原规则/断言或丢原失败；执行仍由Root新准确GO与一次实际终态证明。
