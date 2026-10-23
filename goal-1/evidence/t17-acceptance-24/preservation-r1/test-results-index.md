# 本轮结果身份索引

以下为原文件读取，不是新运行；详细原result/terminal的字节SHA、命令/源身份及56份日志摘要见test-results-index.json。索引37份JSON包含1份integration-r5副本、validation汇总与0新测试的只读review，不能按37次独立测试计。不同source/子集不得相加为累计全绿。

| 原目录/轮次 | 实际逐轮结果 | 界限/旧红去向 |
|---|---|---|
| model-r1/progress-red；license-wait-red | 16过2败/18；1败2未选，均code1 | targeted元数据/entry旧行为；同course许可等待旧断点，保原红 |
| model-r1/model-r1、r2、r3 | 32/32（3文件）；74/74（5文件）；22/22（2文件），各code0 | 三个不同范围/源；validation只是汇总 |
| ui-r1/targeted-r1、r2、r3、r4 | 7/7（2文件）；2/2、2/2、2/2（各1文件） | 原log有完成摘要，没有独立terminal code，不据此造code |
| ui-r1/type-r1、type-r2 | 原log9、11条TS诊断 | 并行接线红；未单独持久化exit |
| confirmation-r1/unit-r1→r2→r3；confirmation-r2/unit-r1 | suite失败/4项未执行→4/4→4/4；另4/4 | 最初runtime.project helper错误；不把fixture称正常前史 |
| confirmation类型日志 | r1的type-r1/r2、r2的type-r1空输出 | exit无独立terminal；handoff称strict0另作来源，空log本身不证明0 |
| book-r1/draft-r1→r2-red→r3-red→r4-green | 4/4→4过1败→5过1败→6/6，code0/1/1/0 | 两挂载消费者旧稿、连续functional旧稿覆盖；红保留 |
| book-r1/target-r1→r2→r3 | 14/14（3文件）→1过1败5未选→3过4未选，code0/1/0 | r2的parsed.payload undefined来自硬编码Jan20已过期；handler/inspect槽此前已过。r3用公开today+10/20，不放宽规则/时限 |
| book-r1/strict-owned-r1/r2/r3 | 各code0，40.028/25.348/23.690秒wall | scoped --ignoreConfig；r1无sourceAfter，r2/r3有 |
| choice-reselect-r1/red→green | 1/1败code1→3/3（2文件）code0 | A→B→外部A复活B的旧红保留 |
| choice-license-r1 | 新2/2 code0；scoped strict code0 | A78真实导入/实际handler+reader+abort/retry；非Chrome |
| app-legacy-review-r1 | 原4/4 code0 | helper/fixture检查，不直接驱动新App onSubmission分支 |
| integration-r1/type；integration-r2/type | exit2→exit0 | 原并行接线类型红保留 |
| integration-r3 | 49文件344项：343过1原5秒超时，exit1 | 原344整批仍红，不改记全过 |
| integration-r4/original-timeout-retest | 原时限1过27未选，exit0 | 精确超时补跑；不等于344全套重跑 |
| integration-r4/course-clock-art | 4文件26/26，exit0 | 独立定向范围 |
| integration-r5 | 9文件75项：74过1旧locator失败，exit1 | obsolete“核对案例1”中间按钮；原红保留 |
| book-bridge-r2 | 原20000时限精确1过6未选，exit0 | 只修驱动，全部原断言保留；不是75项整体重跑 |
| reading-r5/red→green | 1败2未选code1→2文件23/23 code0 | 精确旧title断言修缮；原时限不改。两模型源与build-r5同 |
| build-r1/r2/r3/r4/r5 | 各exit0、changes[]；源数437/438/438/441/441 | 实际tsc-b+Vite构建；不关闭旧单测红或真人/业务边界 |

上表原生用时和wrapper墙钟分别保存在JSON/log；不累加重叠时段或重复用例。最后R5构建47.302秒wall/Vite817ms。读取时progress f40c6c…、模型测试a492d0…与reading-r5/green源和build-r5源逐项同；另course-target 165aeb…及App af9bc…的当前/构建绑定见JSON。这是源绑定，非重新运行验证。

另有两份完整Create前缀审核记录：prefix-audit-r1各1Create/69不同后续命令/1文件+1input buffer；prepared-prefix-audit-r1各1Create/77不同后续命令/1文件+1buffer，均allByteEqual=true、126源/2输入。二者是同人生的不同前缀，不能相加成两个人生；原JSON没有独立exitCode字段，此处只报告其实际审核内容，不代替本轮最终全exports审核。
