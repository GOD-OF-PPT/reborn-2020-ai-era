# 5c-P1 最终审核器独立只读审查 R1

结论：当前最终审核器与公开readiness helper限定静态通过，未发现阻碍正式六身份采集／独审的新确定缺陷。本文只评审核机制，不证明六份正常前史已经实际完成或6/6正向ready；完整288核心、62关键、22例行及后续原验收仍未由本次审查执行。

当前HEAD a7a45f5f0920d4f739ee96e4b18a7f0ca03d8d84，本轮为root17恢复原5c-P1，不是D12。已全读root17 input/plan/tasks，对照root12固定政策与当前policy-r2，保持生产规则、钱/AP/日期、权限和旧账；本审不修改三源、collector、业务、测试、三文件或commit，不运行六历史、测试、审核器、浏览器或兼容。本文唯一新写，项目父目录guard检查无封存/链接后wx落盘。

## 请求、原文与独立重放

- 审核器不导入或调用builder；固定技术/内容两背景×原t16-campaign-0/1/2及顺序、runId/create与relay-prefix-revision均独立核对。每份normal原initial从Create重建并与完整原文逐字比较；每个accepted/rejected按原codec.registry/evaluate重放，before/after revision和SHA、精确拒绝原因、里程碑原规范原文及最终全字节均核，不仅检查终态或若干金额。
- requestJournal要求完整LF JSONL（记录行，不是给存档附LF），逐attempt校验attempted→服务原preview→accepted/rejected事件；StartRelayServicePeriod恰有一个原preview，其余请求没有伪preview。事件与case attempts/previews完整一一匹配，额外／缺失／未完成行拒绝。预览、拒绝前后原文SHA不变。未解attempt不能作为已接受／已拒绝证明。
- trace合同当前为每个accepted revision一条，无Create trace；collector与审核器一致。personal用accountFunds(personal)，company为api_relay企业accountPosition或null，actionPoints为当日actionBudget；每条独立从重放run重算核对。先前读到的accepted+1是并发旧快照，已更正，不给当前collector补造Create trace。
- 固定动作白名单、最多一次的开站／营销／部署／签约／充值／服务／启用、各准备及两原offer分别限一次。固定金额、本人资源、日期、先全首轮读信后重申、decisionAt+31、最多3次和两背景实际准备保持，禁止为了获得成功改seed、金额或增权。

## 全输入与来源冻结

- 对整个输入目录先登记精确文件集合并逐文件guardedRead，结束再次比较集合并重读已观察文件；不只核被JSON引用的少数原文。路径拒绝绝对逃逸、..、反斜线/换行与symlink，父目录到文件的物理身份、O_NOFOLLOW打开FD前后及读取后路径身份均核；bytes/SHA和UTF8往返检查保留。
- 原initial/final/milestone先校metadata bytes/SHA，再通过当前严格codec，并用重放规范原文逐字比较；没有补LF、转写旧存档或把engine输入伪称Chrome导出。
- 当前运行时源码集合／源字节初末冻结，登记sourceHashes与summary一致并逐项读回，policyText与对应policyFile逐字一致。审核器自己的readiness helper及脚本、原runtime/deps均进入独立观察冻结；不依赖调用策略时的隐藏真值或选择过的结果。
- 显式fresh输出复用现有evidenceDirectory／fresh-path保护；结果只写独立新输出，不能写回输入子树。唯一报告写入前重查全部输出祖先未sealed、无链接；新增／消失／改变的输入、源码或物理身份进入errors，不能报passed。

## 公开后置与财务含义

- ready要求实际2025Jan1—Mar31、playing且无公开pause，同一原中转站operating/prepared、真实materials及内容背景basics。三供应分别核公开已读批准、任务完成、许可用途/客群/期限及实际adapter；initial_verification须关联同一原申请job，migration仍须同业务/供应且真实完成。许可剩余天数单列，后续服务整个窗口仍需重验，不赠续期。
- 真实paid/local_merchants受众、两固定offer、同企业/账户原active deployment及approval/relay_support/无externalDelegation逐项核；不把部署当cross_flow／delegated／例行自动授权。
- 同原服务命令→period→supportJob→deployment witness必须连起来：单一原prepaid客户、managed_support报价、杉木单主供、固定maxUnits/budget、28日服务完成、4日assisted支持真实完成且原期未Stop、正服务费已入账，并有公开observedBusinessResult。没有把计划／开始／流量或用量收入替代支持交付。
- relayPeriodFeeProof要求sourceEventId严格为period.id、businessId同企业、kind=income、deltaFen>0且date不晚于当前日；meter来源、别公司、未来金额、零／负项均排除。公开workbench的finance.metrics提供此项实际账目，没有读取未审actualUnits/requestedUnits/missedUnits、隐藏roll/fault/profile作策略。返回明确该项不是现金收款或净利润。
- 个人与该企业保护／承诺缺口、已到期未付义务会阻止正向ready；充值余额、供方资产、未到期应收应付、日常维护／月费及全部旧责任保留输出。publicIncidents单列；ACK不等于风险解除，本文不据pause为空宣称所有风险已清零。

## 有限与fatal分类

- completed只有独立readiness.ready才是verified_ready，且完成记录不得带失败metadata。
- prefix_refusal／policy_refused须有具体有限原因，并以重放公开状态或精确rejected请求独立佐证，才是verified_limited；它不计positiveReady。最终passed允许六身份都有真实正向或已证有限结果，allSixPositiveReady另要求6个真实正向；不能把“六身份均处理”说成“六份全ready”。
- fatal、无evidence ref、丢initial/final、journal不完整、未解请求、未证明有限原因或source/input变化都会invalid_or_unproven／errors，不能因已有部分收入、默认Stop或一个可重放晚档转绿。剩余unexecuted_due_to_fatal无完整证据也不能当有限成功。
- collector此前内存请求在末次写失败可能丢失的缺口已用每身份requests.jsonl修缮：完整请求在evaluate前同步写，结果事件追加；初始化与末存档／record／progress出错标fatal并停后续。若盘完全不可写，原journal／milestone继续保留、stderr明确失败，不承诺不存在的新final原档。审核器不从这种残件补造绿色case。

## 实际已有检查与本审限度

根执行final-checks-r3/terminal.json实际passed：CLI strict types exit0（含noUncheckedIndexedAccess、exactOptional等）、project type exit0、readiness两边界exit0；helper-boundary-r2原7项exit0且helper源保持。两readiness边界核period费排除meter／异主体／未来与初始adapter原申请关联。它们证明对应静态和小边界，不是六历史、完整审核器端到端或正常财富可达证明。本审没有重复执行这些检查。

[杠精审查] 限定通过：分别核记录者与独立重放者、完整请求和末原文、公开后置与真实服务费、正向／有限／fatal分类；没有以types、旧UI105、默认停止、静态投影或small tests替代正式六身份。不存在本审已知未报阻断。

[REPEAT] 复用原codec.registry/evaluate、StoryHarness、项目evidenceDirectory/fresh-path、已有父guard和规范原文SHA，不新造通用框架／全局skill／自动化。兼容开发测试0；原5c完整矩阵、Q/X、真人0、原PNG、M01暂停/T18、T17/goal全部责任保持。正式六与独审实际终态由根随后记录，若新证据揭示缺陷须保留原批次再独立修复，不静默改运行源。

## 最终审查快照 SHA256

| 文件 | SHA256 |
|---|---|
| scripts/verify_relay_prefix_readiness.ts | 9787b64b8d11cd58309f004c2e49ea0ce8c80750e4c752a82e611074797656ba |
| src/testing/relay-prefix-readiness.ts | a1338ded484211577aa1fc1c1ca8b89f14b703bf9abfd5fef06a18f4c22804fb |
| src/testing/relay-matrix-prefix.ts | e6eee541fd408ab002e825ecd08f43622e46f5703322a07ee8fa3fd15e8c3be5 |
| scripts/collect_relay_prefix_evidence.ts | 7e133d1a28eb1e702d591af98b9471ead87bd22ddef186789b445a4dccf694ff |

本审写前后上述四源、root17三文件／政策与已读取的检查原报告均保持原字节。
