# P2 工具独立只读审查 R1

记录时间：2026-10-22T02:30:02.773Z。审查对象为下表实际源快照；完整读本轮 input/plan/tasks/policy-r1 后，只读复核 collector、runner、prefix replay、writer、independent verifier 及 shape 接口。未修改源码、未运行新游戏/测试/pilot/288/浏览器/兼容或提交。

结论：固定范围、账务/检查点、独立重放与有限分类主合同可以成立；异常保全仍有一项确定控制流缺口，当前快照不能称完全满足“未知 fatal 保全已有候选/里程碑”的要求。以下是工具故障路径，不是已观测到生产游戏或正常 pilot 的失败。该问题已即时发给根代理，并由 preservation 代理独立只读确认。

## 确定问题：收尾异常可使已有候选不可达

位置：scripts/relay-shape-run.ts:37—47、55—59、82—98；scripts/collect_relay_shape_evidence.ts:45—60。evaluateCommand 已返回 proposed 时，旧态 export/check 在候选 export/putMember 之前执行；若旧态不变校验抛错，已生成 proposal 尚未保留。catch 中实时 fingerprint 又可抛出，掩盖原异常。更直接地，terminal export、commandsOf、终态 member、三项 public projection 或 case-record 序列化的任一收尾异常均会在 runRelayShapeBranch 返回 execution 前退出。collector 的赋值尚未完成，execution 仍为 null，恢复 JSON 的 completeOriginalMembers 因而是空数组；已有内存候选/里程碑/尝试不能到达恢复端，虽然磁盘 journal 与原 source 仍在。

最小修缮：proposed 时先保存可导出的完整候选，再保留原旧态不变校验；异常 fingerprint 单独保护，失败明确 after 未核，保留首个错误；让 runner 的同一个最末异常出口携带已有 members/attempts/milestones 与最后已核 raw 给 collector，即使完整 execution 未产生也能保全这些原内容。不能合法导出的对象只能明确记录未核 proposal/导出错误，不能标成合法 canonical raw。无需改业务规则或建立通用框架。当前未运行故障注入，也未以静态分析声称磁盘完全不可写时仍能保存新文件。

## 当前成立的桥接

- 固定288/六身份/48形态/十检查点：prefix:23—56 从原 Git 锚定 registration 和 P1 输入逐项核；case ID 顺序、背景/seed、supplier/offer/customer/support tuple 和十个原名强等。collector:20—41 先核完六份完整 Create 前史，42—44 才允许任一分支开始，未换成晚档 ready 或少数 pilot。
- 原前史：prefix:76—128 从原 CreateRun 重建，原 attempted/previewed/accepted/rejected journal 完整 LF 比较；逐封套求值、旧态不变、严格候选导入/导出、全部原 milestone 完整 raw、每接受 revision 的原 finance/AP trace、终档和 public projections、receipt 命令/readiness 均核。前史归档保留原 initial/final 与原里程碑引用；每步原候选均实际求值并核指纹，不把仅 hash 文件存在当原前史通过。
- 独立性：verifier 不调用 runRelayShape 或 builder 生成替代动作；先重新执行自身六 Create，再执行原 suffix。它有独立 fixedRequest 白名单与原日期/资金/资源/授权载荷核定，并调用共同的独立账务/检查点断言，不把 producer 的 assessment 自报当事实。prefix:242 及 collector:28 均把真实 requests.jsonl 放进归档，verifier:250—261 对原 prefix proof、磁盘 journal 与全部归档成员逐字比较。
- suffix 完整记录：每尝试先同步 attempted，后做 money-before、真实服务 preview 与求值；正常/已捕获异常路径中，完整 candidate 在导入/commit/accounting 前进入成员表。verifier:117—129 将 attempted 初始字段（money null、after=before、无候选等）、previewed 和 result/exception 与 record 一一比较，拒绝缺尾 LF、缺失/额外事件；147—184 逐候选完整字节、严格回环、money-before/after、里程碑、terminal、规范化 suffix receipts 和 public views 重放。上述“正常/已捕获”界限不能覆盖前述未收口异常。
- 正向与有限：verifier:92—114 要求有限原因有实际拒绝或当前公开状态证据；187—190 只有 completed、assessment.positive、十项 passed、真实 Mar14 才 verified_positive。policy_refused 单列 verified_limited 且 positive=false；fatal/未执行或未知有限码为 invalid_or_unproven。整批 errors=0 且288均独核才 allRowsIndependentlyVerified；all288Positive 另要求288正向，byShape 保留缺正向形态。
- 真实费用与原账：断言只取新客户/新 period 的源，区分 meter income、period fee、现金、保护、供应资产/应收应付；low 服务费0不误判失败，managed 只认本 period 正费，均不要求盈利或抹清旧余额。按供应实际账期/源引用允许 prepaid 更正应收、青桥更正7日应付和后付已付账单负更正的供应贷项；旧 P1 客户/period/meter/原账和分账户保留。审计分母取原实际已供应记录而非硬28，完成公开 audit 后才核实计/更正；零更正不证明正负更正覆盖。
- delegated：scenario 的公开信号分支才本人真实 investigate/等待/Confirm；单独 cross_flow 同业务预算/期限及外部范围在 fixedRequest 校验，ACK 只接实际 pause，不当风险处置。公开 violation 停自有权限、声明当时原责任并有限退出；没有伪称外部撤回或换 mode/seed 绕过。
- 封存与安全：writer 固定 fresh root18 matrix/audit、祖先 seal/链接/已提交目录保护；wx/nofollow、创建 dev/inode/nlink1、追加只认 writer-owned 文件。启动/每 prefix/case 有2GiB可用空间门槛，非未来磁盘保证。XZ 原 container/member 长度/SHA、顺序分包与立即完整解包回读；不是截断或只留 hash。auditor 对全输入文件集合、无链接、打开前后物理标识与 bytes/SHA 初末复核；执行源/原输入另核冻结哈希。
- 已修旧关切已在当前源码：verifier:231—232 确认原 collector passed=true 且 finalGuardError=null；摘要 counts/status/positive 与实际逐案 proof 核；不能恢复当前 source hash 后无视原 collector 曾失败。生产 src/core/application/content/persistence/ui 与 package/lock 的 HEAD diff 实读为空，未改生产 codec、数值、命令或权限。

## 验证事实与未完成边界

组件验证真实元数据另存 assertions-component-verification-r1.json（SHA f7c631d07d7d2f53dcdc0b7e4cd2f6d8a84602a0fc64bdba4a25c3c74935df7a）：在线原 console 未落盘且未重构。它只证明 owned module strict0 与5个边界，不证明完整 Create/经营闭环/288。

本次实读 pilot-r1-execution/terminal.json：exit0，268.158316秒；文件 scope 明确“五个 suffix pilot，formal288/new六Create=0”。根代理交回4positive+1真实独立违规有限；本审查未重新执行或独立把该交回提升为正式288审计。pilot-R2 的当前只读 running.json 表示正在执行；未见终态前不计通过，也不据减少重复 export 的静态等价声称提速。fresh R2 与 R1 全 XZ member 的实际逐字比较由根代理继续完成。

原P3关键62、例行22、其余5c/T17/goal、旧PNG0/3、真人0、M01暂停与T18责任保持。当前仅工具静态审查；没有新 Chrome、几何、兼容、性能或人类理解度结论。GJ：未把类型、小样本或 producer 结果冒充验收；异常保全一项打回，其余上述合同限定通过。REPEAT：复用原 codec/harness、writer/guard/XZ/receipt/replay 资产，未新建通用工具框架或 Skill。

## 实读源身份

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| scripts/verify_relay_shape_evidence.ts | 33289 | e25abff525b971e40003f4b7f1841450f671962cd841c5ed022b3a7e9b70108a |
| scripts/relay-shape-run.ts | 9016 | e5987cb96f4b5df8ea71e4b210a9d799e5c0039cfda901b96066c8f4aa6f2fa8 |
| scripts/relay-shape-prefix.ts | 14917 | 3a5d8254e92a8f9d159aedd3f23352ad6b986bdfef4a7f39036880c8fd33e79d |
| scripts/relay-shape-evidence.ts | 19470 | 7519daf15b6054a4cef68e2d32bdeb6104cc1120e8f9f4280c5eebfcca2b8f70 |
| scripts/collect_relay_shape_evidence.ts | 7556 | 106a7bbbedd8a994600a35afd1e1368986820a2f574688ce9b03cd802ffef312 |
| src/testing/relay-shape-scenario.ts | 16119 | a7733de631096114459baa03ff0ea501d99c176f97aba1ead9caededc5797758 |
| src/testing/relay-shape-assertions.ts | 33830 | 2b9737ba0568c2e3c35860d236da6b640ff668db5b6f44d05b9ed95a7318ce53 |
| src/testing/relay-shape-types.ts | 2150 | cef092d39bc3642d7659407001055b32c0bc0bfb2b8c1770f946fbbfe4d5756d |
| goal-1/evidence/t17-acceptance-18/policy-r1.md | 6243 | 936a0ca9ccbca66186a491b204bb4d0670572baf23e4e9fa871ec500208a7ef4 |
