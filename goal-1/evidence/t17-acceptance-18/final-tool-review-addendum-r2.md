# P2 工具审查增量 R2

记录时间：2026-10-22T03:07:07.170Z。本文件补充原 final-tool-review-r1.md，保留其原源身份与未闭合 finding，不覆盖旧报告/原证据。本轮授权仅最小修 verifier 的独立违规有限来源链及必要纯测试；run/collector 由 preservation 独占修改，本人只读复核。未执行新 Create、游戏 suffix、pilot/288、浏览器或兼容；未提交。

## 收口与新增校验

原异常保全 finding 在下表新 run/collector 快照上静态收口：proposal 可导出的完整 raw 先进入 member Map，再核旧态不变、严格导入或提交；catch 的实时 fingerprint 与 exception journal 分开保护，保留 primaryError，不能核 after 时明确未核诊断，不把 before 当新验证结果。branch 总 catch 涵盖 source/constructor/commandsOf/终档 export/public projections/case-record；RelayShapeBranchFailure.snapshot 携既有成员、尝试、里程碑、可能为空的 record、sourceRaw、最后已核 canonical raw、首错/次错和实际可读 journal。collector 即使 execution 未返回，也能从该 payload 直接保存已有原字符串，并在 case 目录未建时尝试 cases 根同级恢复。正常记录字段与成员顺序未加失败诊断。另由 final_checks 独立静态复核同意。

此为有条件保全：对象本身无法 JSON 表示、原始导出失败、内存耗尽或磁盘完全不可写时不能保证生成新文件；现有诊断/最后合法 raw 与新未核对象分开，不把恢复文件或静态审查当完整业务通过。受控故障 probe 的实际红/绿另列下文。

定向审 violation 有第二项确定缺口：旧 verifier 的 finiteProof 只看最终 violation/stoppedAt 和任意 accepted Declare。原核 incident_deadline 会自动 stopOwned，故这不足以证明 policy-r1 明确要求的本人 Stop。旧 fixedRequest 允许推进至 Mar14，Declare 仅要求当时 stoppedAt；真实 Confirm 后拖至 deadline 自动停止再 Declare 的记录可落入旧有限 gate。该结论是原规则和控制流分析，未运行一个新自动停止游戏反例。

现仅在 verifier 增加 export relayShapeExplicitViolationChain(attempts, publicStory, businessId, deploymentId): RelayShapeViolationChain|null。它要求同原业务/部署、agent 公共 violation、已完成本人 investigate 原 job/原 command ID、实际费用/AP/资源及公开 boundary_trace；随后必须有同 incident 的真实 Confirm→本人显式 Stop→Declare，命令顺序/revision/run/actor、同决策日期、Stop 报告 source、Declare 责任 source 和原 snapshot 相连。每个来源须是 accepted 且有完整 candidate 描述和对应 after 指纹。finiteProof 只在 delegated 且未新签客户的 violation 分支调用它，并返回该来源证据；其他有限 reason 的逻辑未改，没有宽松兜底。

纯 helper 本身不重放候选 bytes：完整审核仍先由 replayRelayShapeCase 重算原 envelope、逐 candidate 完整 raw/严格回环、before/after/journal/规范化 receipt/public views，再传入这些已核来源。不能单凭 runner 自报 accepted、最终状态或一份 candidate hash 使整项通过。verified_limited 仍 positive=false；fatal/未知/未执行仍 invalid_or_unproven，正向仍须 completed+原十项 passed+真实完成日期。

## 实际纯验证与执行边界

唯一新执行为 rtk proxy npm run test:unit -- src/testing/relay-shape-violation-proof.test.ts --maxWorkers=1。终态 exit0，1文件/6测试全过，Vitest报告1.09秒、子进程wall2.10667099秒；实际 stdout/stderr/running/terminal 和执行前后源 SHA 存 violation-proof-check-r1，未重构输出。测试只读取已封存 matrix-r9002/RLY-C224 原 case-index：原真实调查/确认/显式停止/责任链通过；去掉本人 Stop 而保留 stoppedAt/改成自动 deadline 报告、无候选的伪 accepted、错 incident/顺序/部署/报告 source/责任 source/snapshot 均被拒绝。没有 Create/evaluateCommand/完整 suffix 调用，也没有把这些变形输入说成实际正常游戏存档。新 strict 类型由根代理统一跑，本人未另执行。

实际读回 pilot R2 terminal：exit0/213.963709秒；pilot-full-member-equivalence-r2.json passed=true，五项共140 member/201526134原 bytes，与R1全部逐字同，4 verified_positive 与1 verified_limited。它绑定优化后、此轮保全与来源链修缮前的 R2 快照；不能冒充当前新源五pilot或正式288。顺序观测不控制机器负载，不声称通用性能提升。正式288仍0。

实际读回 failure-probe-r1 terminal：exit1/13.643134秒，stderr 为 ENRICHED_BRANCH_FAILURE_REQUIRED_candidate-before-old-guard。failure-probe-r1-correction.json 保留原红并明确：fixture 漏建 probes 父目录，非递归 writer.mkdir 在任何游戏尝试前已失败；只有 registration，无 requests。该原因是有据静态诊断，不重构原运行记录，不把此红判成生产保全 bug 已复现。root 交回 fresh R2 fault probe session83618 与 type R4 session45205 尚在执行；本报告不计它们通过，根代理将另存实际终态。

## 最终接口复核

当前 registration→六原 Create 前史先行→288固定 suffix 的链保持；原48形态/六身份/十checkpoint 名、账务旧P1保护和本项费用隔离均未缩减。auditor 的原 collector passed/finalGuardError 核、source/input freeze 强等与末次 guard、全输入集合/物理 bytes 初末读回、prefix 原 journal/preview/trace/milestone/terminal 与 suffix 原 journal/candidate/fullraw 仍在。未改生产规则、权限、payload、数值或 policy-r1。

GJ：原 R1 静态判断未提前替代执行；新来源链用真实记录和纯负例验证，故障 probe 红仍保留、后续待终态不计绿。REPEAT：沿既有 writer/codec/receipt/XZ/replay 接口最小补正，未造通用框架。原62关键/22例行、其他5c/T17/goal、真人/旧PNG、M01暂停与T18责任不变。

| 当前文件 | bytes | SHA-256 |
| --- | ---: | --- |
| scripts/verify_relay_shape_evidence.ts | 37513 | 7719248924e161a4179b7907c127de6d38e3ce51bd1eff700fd556f2d59f3f17 |
| scripts/relay-shape-run.ts | 13326 | 18816ff9fcf89f33c345fa15ac147f7e06f0918deab021e2f031a4836852d31d |
| scripts/collect_relay_shape_evidence.ts | 8134 | af36bb784b64054ffc35273fef261d75471a671fcc80001e576106ab77178f27 |
| src/testing/relay-shape-violation-proof.test.ts | 3561 | b6987dc866517341891e9018d0cac80c3879134a54f17b4e1edd769cb3d20639 |
