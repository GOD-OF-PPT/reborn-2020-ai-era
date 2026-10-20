# P2采集器R2载荷归一化修正复核

本次只读复核当前scripts/collect_course_shape_evidence.ts及保留的R1源码/失败分析，没有改源码，没有执行测试、类型检查、回放、模拟或浏览器。R2采集器SHA-256为9e3a0e734924cecb86d57d31fe8b65d6baad95ac3b2affe6e9bfb9d7985317e4；原R1源码SHA-256为2ee047a1c97a2c9c398882543e9224c578a4d581c9c682aabcaec705e8c948cd，已保留在tool-history/collect-course-shape-r1.ts。

## R1实际失败与原因

matrix-r1已终态1，原288注册中首项出现HARNESS_COMMANDS_DISAGREE_WITH_ACTUAL_RECEIPTS，余287项保留未执行。首项业务实际执行15条成功命令并闭班，但独立后缀验证未通过，不能把其业务闭环说成整项验收通过。具体原报告为goal-1/evidence/t17-acceptance-06/matrix-r1-failure-analysis.json；原输出和源码均不覆盖。

原比较漏用了CommandRegistry.normalize。StoryHarness把调用者原payload保留到h.commands，而权威receipt使用原registry归一化后的payload。例如AdvanceTime省略phase时schema补snapshot；CreateCourseAudience省略resources时schema补空数组。两者本来是合法同一指令的两种表示，直接按原始JSON比较会出现采集器false。来源：src/testing/story-harness.ts:16、src/core/commands.ts:85-92、src/core/commands.ts:123、src/core/commands.ts:165-173、src/application/course-commands.ts:9。

## 修正范围及不会放宽的内容

差异检查确认修正仅新增normalizedCommands，并在两处成功历史序列比较中调用原codec.registry.normalize：

1. h.commands与实际receipts-derived全部命令序比较，见scripts/collect_course_shape_evidence.ts:270。
2. 独立回放成功attempt序与权威suffix比较，见scripts/collect_course_shape_evidence.ts:284。

归一化只作用于比较用的payload副本；使用原schema.safeParse处理默认值和合法类型，没有手写补字段、丢字段、改ID、改revision或改随机结果。CommandEnvelope其余字段通过对象展开原样保留。相同registry正是原evaluateCommand和receipt身份的权威处理路径，不是另造一份宽松投影。来源：scripts/collect_course_shape_evidence.ts:154-156、src/core/commands.ts:110-118。

原始actualAttempts、原harnessRecordedSuffix与权威suffixCommands继续分别保留。独立执行仍逐条把原attempt.command送入evaluateCommand；拒绝仍须同sourceRevision/date、同reasonCodes且拒绝前后原文不变；成功仍须每步strict codec、实际revision/date一致、所有完整milestone和final原文逐字相同。gzip解压回读和原前史不可变断言没有改动。来源：scripts/collect_course_shape_evidence.ts:178-194、scripts/collect_course_shape_evidence.ts:268-292。

## 同类比较复查

- P1的commandsOf(actual)对input.row.commands，以及每个分支的前史命令切片对prefix.commands，双方均从原权威receipts重建；继续原精确比较正确，不需要对一方补默认值。来源：scripts/collect_course_shape_evidence.ts:204、scripts/collect_course_shape_evidence.ts:269。
- rejectedReason比较原harness错误载荷与已捕获原attempt.payload，双方均是调用者原payload，继续精确比较正确。真实拒绝不放进成功命令归一化队列，非命令异常也不因此变成政策拒绝。来源：scripts/collect_course_shape_evidence.ts:162-167。
- 完整public投影、原前史、milestone和final字节比较不受本修正影响，没有为绕过false而删除或重写这些证据。

[杠精审查] 本次源码修正范围通过：根因是原命令默认载荷与权威receipt表示差异，当前改动使用同一原registry处理比较；没有削弱实际命令、拒绝或完整原文验证。未发现当前P2指令路径还会发生同类collector false；这不是对后续业务结果或R2整批通过的保证。

R2严格类型与新matrix-r2全288实际结果由父任务独立执行、保存并核验。原R1失败始终保留；P3原90关键、完整5b/T17/QX/goal及原PNG/真人缺口均未因本复核关闭，页面兼容开发和测试继续暂停。
