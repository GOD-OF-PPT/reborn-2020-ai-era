# T17 / 5c-U1 读信回响增量独立审查 R6

审查者：/root/relay_final_review。结论：本次增量限定通过，未发现新的、可确定触发的代码缺陷。范围仅为scene-result.ts新增ReadRelaySupplyDecision分支、relay-scene-result.test.ts新增三项及relay-audit-dates.ts最终版本。不是游戏、Chrome、全5c、T17或goal验收。

写前只读核实：GOD-OF-PPT/reborn-2020-ai-era，owner GOD-OF-PPT，PUBLIC；main，HEAD 7f7f0dfcb5d6f86e46ac11585f94c32817f16caa。源码仍是该HEAD之上的未提交工作树。原R2报告物理SHA256保持ee5587c68a0124b47027554b5161aba27d84fe415034b250418baa46a4a6b62f，本报告不回写或替换它。

## 具体核查

- 新分支仍先经committedRelayChange：同runId、current.revision大于previous、saved且无candidate。之后只识别同applicationId由previous未读且原job已完成，到current已读且公开approved非null的唯一回信。未读、重复读、无previous和非唯一变化均不给专用审批结论。
- 批准文字只使用本次已读投影的supplier label和expiresAt；不读取隐藏事实、不预知审批结果、不增加许可、付款或行动。“实际适配与启用条件仍须分别核对”保留申请、实际适配和启用的区别。
- 拒绝文字依据公开approved===false，保留原费用与申请记录，仅提示原冷却/资源条件；不承诺下一次成功或虚构可重试日期。若已公开批准但没有expiresAt，保守返回null，不编造许可期限。
- 三项新增测试源分别表达实际批准与有限期限/未保存和旧revision保护、公开拒绝与旧费用、未读/未变/空previous不宣告审批。共享same-runId保护在原函数入口继续存在；此处只读源码，不声称运行结果。
- 日期助手仍只捕获RuleError的INVALID_DATE、DATE_OUT_OF_RANGE并返回null供局部预计文字使用；原日期草稿和原命令preview不被替代。其他错误继续抛出，固定3日参数没有放宽底层日数检查。该文件SHA256与原R2审阅版本相同。

主控报告的Chrome R5旧generic回响、r72原文及R6测试运行属于各自历史/执行证据，本次未重放、未改写，也不把预计159项当作已通过结果。新的实际Chrome回响验证和测试终态由主控另记。

本审查未修改源码/测试/任务文件，未运行测试、类型检查、build或浏览器；兼容性开发与测试为0。仅经父目录保护以wx新建本报告，写前后核对以下实际字节不变。

[杠精审查] 限定通过：已回查唯一回信变化、公开结果、保存边界、原费用/权限区别与日期极值处理；没有用测试源存在代替运行，也没有扩大原R2的冻结身份或整体通过范围。

## 审阅字节 SHA256

| 文件 | SHA256 |
|---|---|
| src/ui/scene-result.ts | c725d7a2c0e1555ce0cec8e92fcbe24371b00b301b61dee8cd419b1d7c030329 |
| src/ui/relay-scene-result.test.ts | 3d14d84afd5f667b465b28ad219a7a2b5a9598f151ba342dd08fc675e72d8815 |
| src/ui/relay-audit-dates.ts | f971ec7926a17b4b6ab844179b80acb6a8f4c83147e8d8805a6b6e02ce20ea82 |
| goal-1/evidence/t17-acceptance-11/independent-code-review-r2.md | ee5587c68a0124b47027554b5161aba27d84fe415034b250418baa46a4a6b62f |
