# 意外候选在结果日志失败时的最小红绿回归

本计划先于 `candidate-preservation-tests.mjs` 和实际测试建立。仅修 `scripts/course-critical-run.ts` 中 afterAttempt 的候选保存顺序；不改 context、生产规则、参数、资金、日期、种子、原 45 定义、原 90 登记或其他源码。根已保留旧协议完整源码于 `source-protocol-preflight-r2/`；旧红结果不得覆盖。

## 真实 canary 与断言

使用真正 `createCampaignRun` 创建独立正常 run（technical_employee、原 t16-campaign-0、revision1），完整 codec 导出作为 source。测试定义明确标记 sourceRevision=1，仅为工具故障回归 canary，不纳入原业务矩阵。

1. **意外 proposal + after 回调失败**：定义调用 `ctx.reject('WorkQuarter', {}, 故意不匹配的 canary reason)`；原真实命令产生 revision2 proposal，统一 after 回调故意抛 `CANARY_RESULT_JOURNAL_FAILURE`。核尝试/结果实况、record.status=failed、错误保留、真实 run/terminal 仍逐字等于 source 且 revision1；外传 members 应已有 unexpected-candidate-1.json，其完整原文可严格 import/export，revision2、原 WorkQuarter 回执及两点真实计划仍在，但没有发布为当前 run。
2. **普通接受 + after 回调失败对照**：定义实际 send WorkQuarter；核 record failed，最后实际 run 已是 revision2，完整 partial 原文严格读回，原 source 原文不变，候选副本不凭空出现。
3. **真正拒绝 + after 回调失败对照**：WorkQuarter 带原 schema 不允许的额外字段，实际得到 INVALID_PAYLOAD；核具体 reason、expectedRejection=true、真实 run/partial 完整原文不变，且没有 candidate。拒绝不是手工伪造。

各 canary 仅一次真实命令尝试，after 故障是测试主动注入的同步异常，不冒充真实 ENOSPC。before/result 对象先留精确 JSON 文本；完整 source/实际 terminal/已存在候选/record 写入各自新目录，逐文件 wx、bytes/SHA 和读回比较。保存全部断言与实际失败，不把预期旧红算绿。报告含协议/测试/原快照哈希、原始启动命令与实际进程退出状态由外层如实登记。

## 执行顺序

1. 先完成本文件，再新增测试脚本；使用现有 Node22 的 TypeScript 支持，不加依赖。
2. 运行当前旧协议到全新 `candidate-preservation-red-r1/`，以相同要求期待候选存在；旧顺序应真实失败且其他两对照成立。记录完整输出、非0与原始小 raw，不改红报告。
3. 只把 `putMember(unexpected-candidate)` 移到外部 `callbacks.after` 之前，保留意外 proposal 不提交、after 仍早于补充账务/进度；不改变其他语义。
4. 同一脚本/同一 canary 参数运行新 `candidate-preservation-green-r2/`；三项均满足才称本修复限定通过。若出现新失败，保留原结果后只在已授权范围修复并使用新标签，不重写旧输出。

输出显式 `--output-dir`，复用项目 fresh-path/evidenceDirectory 与所有祖先封存/符号链接拒绝；只允许 root09 下本测试标签。测试串行、无完整前史、无原90业务分支、无浏览器/UI/兼容/COW，无当前 Git index/HEAD 或提交变更。根代理随后统一严格类型，本脚本结果不能替代它或原业务验收。

[杠精审查] 执行前限定通过：旧顺序实际红、新顺序同要求绿、真实候选与实际状态分离、两条故障对照、完整原文/原错误/精确身份保留，不用伪造候选对象或更换规则使其通过。
