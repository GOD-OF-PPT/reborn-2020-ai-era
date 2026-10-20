# 意外候选保全：实际红绿限定结果

本轮只修 `scripts/course-critical-run.ts` afterAttempt 中的顺序：已产生但未提交的 proposal 先放入外传 members，再调用可能失败的外部 after 回调，账务仍在回调之后。context、生产规则、参数、原种子、原45/90、Git index/HEAD 未修改。本轮的正常 Create 单命令 canary 不计入 P3 业务结果。

计划 `candidate-preservation-test-plan.md` 先于测试脚本与执行建立；同一 `candidate-preservation-tests.mjs` 在两次进程中原字节不变，SHA256 `7953cc52e76e323982e406133be55684ffb37348c15fa18a87f67fbb8911d24c`。真正正常 Create 使用 technical_employee/t16-campaign-0/revision1；没有预制存档、改钱、改点、改日期或虚构候选。

| 实际批次 | 原协议 SHA256 | 真实退出 | 结果 |
|---|---|---:|---|
| candidate-preservation-red-r1 | 8167fa4113d37f585401d027870d9141b8561ea33b3f71de9a8cde191d087114 | 1 | 3项中2对照通过；意外 proposal 的完整 candidate 缺失，相关3断言失败，原失败未覆盖。此源与 source-protocol-preflight-r2 原快照逐字同。 |
| candidate-preservation-green-r2 | d59063c8ff932f336545a9f4eb6901e52f929c7756522c89eb6435da546cea3e | 0 | 同3项全部通过；意外 candidate 在回调异常前已保全，真实当前 run 未提交该 candidate。 |

三项实际边界：

- 意外 proposal：ctx.reject WorkQuarter 的真实 evaluate 得到 proposed；主动 after 同步故障使 record.failed，partial/current/callback 实际原文均为 revision1 source。保留的 candidate 可严格 codec import/export，revision2/WorkQuarter 回执/实际2AP完整，并且与普通接受对照的完整 terminal 原文逐字一致。
- 普通接受：WorkQuarter 在 after 故障前已真实写入 harness 当前状态；failed record 的完整 partial/callback/current 均为 revision2，原 source 不变。没有额外 unexpected candidate。
- 真正拒绝：WorkQuarter 的额外字段由原严格 schema 实际拒绝 INVALID_PAYLOAD；after 故障后 partial/callback/current 仍为 revision1 source，无 candidate。

故障是测试主动抛出的 `CANARY_RESULT_JOURNAL_FAILURE`，不是声称现场再次 ENOSPC。before/result 实际观察 JSON、完整 source/partial/candidate、case-record、每项 checks 与原始 stdout/stderr/启动命令均另文件保留。两份 launch.json 记录 RTK/Node 命令与真实1/0退出；Node22.12 的实验性类型警告保留在 stderr，不冒充业务错误。报告自身明确 selfExcluded，避免自引用哈希。

写入方式单列：canary脚本的全部原文/报告与两批stdout/stderr均为wx；旧红批次的外层 launch.json 在明确不存在检查后用普通新建写入，实际没有覆盖旧文件，但不将它表述成原子排他创建。绿色外层launch已用xb。原红文件与命令原文保留，不为统一表述重写它。

实际命令仅分别为：

```text
rtk proxy node --experimental-transform-types goal-1/evidence/t17-acceptance-09/candidate-preservation-tests.mjs --output-dir goal-1/evidence/t17-acceptance-09/candidate-preservation-red-r1
rtk proxy node --experimental-transform-types goal-1/evidence/t17-acceptance-09/candidate-preservation-tests.mjs --output-dir goal-1/evidence/t17-acceptance-09/candidate-preservation-green-r2
```

红 report SHA256 `75f66a63366dd13e181153e761dc0dd385586e1e08e4b2d3f82a7933687e5516`；绿 report SHA256 `608ce66bc23ecdbdb38e1a39af4a5d7137d7036b9c63cd95d314f60be0f0cffd`。`candidate-preservation-readback-r2.json` 逐项重核33个原文/记录的bytes/SHA、两个完整叶文件集、每次源未漂移、测试/plan/context/快照不变、两批完整 source 相同及 candidate=真实接受原文，8项全部成立，SHA256 `d83a5b49c1fd11c597548fea4b349fadc20807f1a1848aeea8edfb291e6c2628`。

未执行：项目/CLI严格类型（交根代理随后统一）、完整共同前史、原45/90分支、浏览器、UI、所有兼容开发测试或 COW。不是完整 P3/P4/5b/T17/goal 通过，不代为提交。

[杠精审查] 本故障修复限定通过：旧顺序确实红且保留，新顺序同数据/同断言绿；候选与当前状态分别证明，不用 collector 布尔充数，不掩盖故障或扩大业务验收。REPEAT复用原 harness/codec/fresh-path/证据工具，无新依赖或全局框架。
