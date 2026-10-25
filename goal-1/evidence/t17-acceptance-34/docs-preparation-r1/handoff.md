# C-UX06文档检查准备（当前未执行）

候选run-check.mjs基于root33/docs-r1与docs-r2的原Python check_docs.py调用适配，未修改原脚本/原input/旧helper。只有vm.SourceTextModule内存语法解析，模块unlinked/未link/evaluate，未跑任何Docs、测试、type/build、collector、浏览器或Git。当前不宣称wholeDocs通过。

CLI输出为fresh docs-scope-rN或docs-authored-rN，已有目录直接拒绝，不重用原日志；全部自写使用guard+wx。示例仅供Root在所有实际captures/audit和最终作者文档停写后调用，审计目录名须按实际替换：

```sh
rtk proxy node goal-1/evidence/t17-acceptance-34/docs-preparation-r1/run-check.mjs scope r1 --audit-result goal-1/evidence/t17-acceptance-34/audit-final-r1/result.json --captures goal-1/evidence/t17-acceptance-34/audit-final-r1/input-after.json --writers-stopped
rtk proxy node goal-1/evidence/t17-acceptance-34/docs-preparation-r1/run-check.mjs authored r1 --audit-result goal-1/evidence/t17-acceptance-34/audit-final-r1/result.json --captures goal-1/evidence/t17-acceptance-34/audit-final-r1/input-after.json --writers-stopped --scope-classification goal-1/evidence/t17-acceptance-34/docs-scope-r1/classification.json
```

运行门槛：同root34的audit result实际exit0/passed/sourceEqual/inputEqual/extraReferencesEqual/p3Equal/officialIdentityEqual与replay.allByteEqual全部true；captures必须同审计目录的input-after.json，且未知JSON清单为空（若该字段存在）；Root明确writers-stopped。不是只用旧正常前缀manifest替代当前captures完成。源绑定暂定cux06-build-r1.source-before.json，578精确set/byte/mode/SHA，全部extra逐项同且必须包含当前run-long-step-r2；后续构建重试只由Root显式更新绑定。准备期没有实际运行这些保护，不冒保全已验。

scope provider动态列当前root34全部MD/JSON＋AGENTS.md、docs36、3master。authored provider动态列root34的MD但排所有受保护input.md，加同两文档/三master及明确的先前scope classification JSON；不把导入raw或原input冒作者新文。完整JSON语法仍由scope检查，不由author pass覆盖。实际名单、MD/JSON数与所有参考文件在before/command/after原件中列明，不固定八篇或任意估数。

输入保护始末重算：源/extra/实际runner与原check工具/隐含资产及planning数据；当前root34全部普通文件和目录（包括Native JSONL/AX/图/审计日志）、provider、文档直接本地引用。只排这一次已声明的9个自输出路径，不排整个docs目录、不排旧运行、不排其它新文件；新输入或仍写入造成before/after不等即失败。文档本次输出引用只在watch中声明，原checker仍正常报告尚不存在的链接，不把坏链接静默放过。

原Python函数仍check(repo,text_only=True)，只替project_files限定provider，不改错误规则；原stdout/stderr与退出码保留。新增JSON sentinel捕获函数真实errors列表，才做精确分类：必须是已选input.md路径，完整错误恰为“<该路径>: broken local link /Users/gordon/.codex/plugins/cache/openai-curated-remote/game-studio/0.1.2/skills/game-studio/SKILL.md”。其它链接、invalid JSON、资产错误或检查异常都留unclassified，不抹错、不改原绝对链接。分类不改变checker退出；scope真实exit1仍exit1。原PNG PENDING行完整另列，text-only不等于原PNG通过。

checker-errors/classification/result分开保存。authored实际exit0只表示其明确scope在本次冻结输入下通过，不能把scope的非零/未分类错误或原PNG责任抵销；原check_plan/competitive未作为此检查再次执行。

文件SHA见candidate-identities.json，两个旧sealed模板/原check_docs/guard/R2runner/原root34input初末字节mode同。预备状态仅候选，尚无本轮实际Docs结果；源码/masters/冻结149/旧seal未改。

[杠精审查] 通过限定准备：范围动态明确、自输出仅精确声明、旧input精确诊断不泛化、原非零退出保留，实际执行等Root完整captures/audit与作者停写。writer停止。
