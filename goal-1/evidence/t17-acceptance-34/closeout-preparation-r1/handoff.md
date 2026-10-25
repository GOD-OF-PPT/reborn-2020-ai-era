# C-UX06收口辅助候选（未执行）

生成文件：closeout.mjs 与 browser-probes.mjs。它们是将来由Root显式调用的候选；本轮没有import/link/evaluate候选，更没有调用任何导出函数或reject-action。只用vm.SourceTextModule解析字符串，两个模块均status=unlinked，语法0错误；Node实验模块提示不是业务或测试结果。

已适配root34、post=goal-1/evidence/t17-cux06-post-commit-01；docs白名单仅AGENTS.md与docs/36-mainline-and-art-reconstruction-plan.md。最终源绑定暂定root34/cux06-build-r1.source-before.json，当前不宣称该最终构建已存在或验证通过；Root若另一次构建须显式更新此唯一绑定后再核候选。没有自动选择latest构建。

保留原源码/extra精确集合与byte/mode、仅src/ui delta、P326/index保护；root19精确1197文件/110目录及mode；122 ordinary marker与2字面symlink；最新root33/post完整payload；三master原HEAD与唯一2304B/14LF插入、原input61B/SHA20c73原字节。lastSealed已用当前baseline的ordinaryFiles字段比较；新增明确122+2/3master计数、已有symlink baseline mode比较，并通过root34所锚定root32/baseline SHA再读取其root19完整树，避免未绑定的manifest替换。以上是代码保留/静态审读，不是本轮已实际跑过保全。

feature路径为UI变化＋两文档＋root34自有证据/marker，排除3master实际路径；NUL名单、scope核验、逐blob原bytes/SHA/Git mode读回不变。master record仍是原HEAD去掉唯一P3插入后的文本＋本轮原序追加，不重排旧后缀、不重复拼接已提交内容；working master保持原P3。

stageRecord关键修复：只对prepareRecord已写且recordRows核hash的现有readFrom文件运行 git hash-object -w --no-filters -- <readFrom>；输出oid与已计算r.oid相等后才对该master update-index。没有 --stdin，未向旧git wrapper第二参数喂数据，避免stdin阻塞。未来记录提交建议限定描述“docs: record limited C-UX06 checkpoint verification”；feature候选message已限定“fix(ui): align course preparation state and material for C-UX06”。seal scope明确C-UX06 checkpoint，不冒fullgoal/真人完成。

browser-probes仅接受实际root34或其子目录绑定的native，先verifySeal(root34)，再将4标准wrapper和9实际native入口的拒写分开；目标/post均新root34，不能向root33写。本轮0浏览器/0拒写/0UI动作。CLI两探针亦只是未来导出函数，未运行。

待调用条件：Root完成实际累计检查与必要修缮/最终冻结构建、当前Chrome/新raw审核、文档与完成后缀、停止所有evidence writers后，再审定prepare/seal/feature阶段；record-intent与NUL生成后post须停写封存，后续真实record读回须独立保存。此处没有创建post，也未stage/commit/seal任何根。

完整候选SHA见candidate-identities.json；原sealed两helper、旧共享lib/guard与root34 baseline初末SHA/mode相同，见origin-identities.after.json。不改src/scripts/3masters/旧seal，未跑Git（包括read）、测试、type、build、业务/浏览器或兼容几何。writer停止。

[杠精审查] 通过限定候选准备：ordinaryFiles与现有文件hash-object两项明确修正，保护链和NUL/blob策略保留；未以语法绿替代未来执行/最终验收。
