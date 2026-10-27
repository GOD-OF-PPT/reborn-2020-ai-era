# 复核任务到原行动的查询补正完成（静态）

原统一8文件104case实际103pass/1fail、exit1/34811ms已保。唯一helper test65误把通用ActionRecord.definition.definitionId当具体任务名，导致audit undefined；没有据此修改生产helper或原资料。

仅替换这一处查询块：after公开auditJobs按同business/原period/Nov14且job.definitionId=relay-meter-audit筛出唯一原批次，再用其jobId唯一取casebook.actions。新增明确periodIds=[原period]、meterCount=1、唯一原audit→原meter、原job planned/Nov14、原action reserved/executedAt null及job.actionId/account/business对应检查。原150000支持投入/10000复核费用/1点断言逐字保留，全部其它source字节不变。

去新块复原旧单行后整文件逐字等前像；所有it/it.each声明、原21运行case展开身份、setup20秒/默认it5秒与原金额/AP/AR/日期/未知/退款支付负例保持，无case增删、无产品或其它test改动。原配置/门槛不变。

[杠精审查] 静态补正通过：使用了公开job→action的实际唯一身份链，不加mock数据、不吞undefined、不放宽金额或删除原断言。每个证据文件都在实际原JS祖先guard后以wx新增；tasks.md保初始快照，静态完成在本新文件，不覆盖旧记录。

本子项未执行工程/type/test/codec/runtime/Browser/Git；修后实际是否通过由Root统一新轮证明，不把旧103通过与源码补正拼成一次104全绿。本test冻结，U4-B#8/C-S4-R/完整goal未由此关闭，不启动U5，compat0。
