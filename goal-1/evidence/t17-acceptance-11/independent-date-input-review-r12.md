# T17 / 5c-U1 日期实时输入与常驻操作区独立审查 R12

审查者：/root/relay_final_review。结论：此次末次展示/输入增量限定通过，未发现新增确定可触发的代码缺陷。范围仅为RelaySceneChoice.tsx及CommandButton.tsx改动，并对照其已有日期估算、Dialog、捕获确认和原复核命令。不是Chrome交互、测试/生产包、实际复核提交、全5c、T17或goal验收。

写前只读核实：GOD-OF-PPT/reborn-2020-ai-era，owner GOD-OF-PPT，PUBLIC；main，HEAD 7f7f0dfcb5d6f86e46ac11585f94c32817f16caa。对象为当前冻结工作树；原R10报告哈希保持原值。本报告wx独立新增，不回写既有报告或原日期证据。

## 具体核查

- chooseDate由onInput/onChange/onBlur立即读取各自currentTarget.value，只更新该组件局部date草稿；同source、同value时返回原对象，避免相同输入反复重建状态。没有异步读取已失效事件、没有默认改成合法日期，也没有提交业务。原view.date变化时重新以当前日作草稿来源的规则保持原样。
- dateInvalid仅用于aria-invalid、日期旁的范围说明和showReason选择；计算涵盖空/非法/极值估算失败、早于当前日和晚于2025-12-31。原startAt仍原样进入payload；relayAuditCompletion只捕获原两类日历错误，不修改底层日期和资源条件。
- CommandButton相对HEAD仅新增可选showReason=true及small.reason展示条件。controller.preview始终照常调用；disabled中的!preview.allowed、busy、hasCandidate、readOnly、conflict逐字保留；request的kind/payload/label/confirm也未改。此次抑制说明不等于抑制preview或允许非法命令。
- showReason的唯一传入位置是该复核委托，且仅日期无效时为false；日期旁同位置仍解释允许的开工范围。日期合法后原generic首因说明恢复，其他CommandButton调用因默认true维持原行为。原资源不可用提示、工资/排程、资金/行动/天数、独立复核/差额更正与不收取应收等责任正文仍保留，没有以该选项删除其他业务责任。
- 复核操作移到Dialog已有footer槽，仍由同一RelayAuditChoice局部状态产生，与正文共享period.id、resource、startAt。主体与已有计量、成本和责任说明仍在同一Dialog的原ScreenBook中；footer没有复制第二套表单或账务状态，也没有改分页/隐藏正文。原“翻看全部原计量、资源与责任”入口仍在。
- paid preview继续保留：StartRelayAudit payload仍严格为periodId/resources/startAt，CommandButton仍confirm primary，原App再次prepare/preview并捕获同一CommandDetails；复核100元/1点/3日的原条款与资源/日期确认没有绕过。App、RelayCommandDetails、日期助手、Dialog、relay-commands和core/relay的当前哈希与上次对应审阅版本相同。

主控报告的R12日期focus/inert、Mar5往返草稿和Mar5—Mar8确认是其实际Chrome证据，本审查未重放或代替核验。实际保存委托、后续完成、最终UI/生产build和完整原文审核仍由主控分别完成；不把预计用例数当通过结果。

本次未修改源码/测试/任务文件，未运行测试、build、浏览器或兼容检查；页面兼容开发/测试为0。报告经父目录保护和wx创建，写前后核对以下物理字节不变。

[杠精审查] 限定通过：已核对提示隐藏与guard分离、三输入事件的局部草稿、footer与正文同一载荷、原有付费确认和其他责任说明；没有把静态阅读扩大为实时焦点/页数/保存验证，也没有提出未触发的兼容建议。

## 写前后保持不变的 SHA256

| 文件 | SHA256 |
|---|---|
| src/ui/RelaySceneChoice.tsx | 0ccde60aefd407fdac545bafd71a66f3827aa73f0e14220dc7195ca43484d3bd |
| src/ui/CommandButton.tsx | 17fa2e2799afb252392afb2fa10e3253023c1b5f2a5f77e079c3ea783eeebf43 |
| src/ui/relay-audit-dates.ts | f971ec7926a17b4b6ab844179b80acb6a8f4c83147e8d8805a6b6e02ce20ea82 |
| src/ui/Dialog.tsx | c41652816ceeb77a98bf281ee3d5c8bfba243c531e1175fc82fe7f8fff3d8083 |
| src/ui/RelayCommandDetails.tsx | 363f7f077726af1630a183f6f5dfe8ef13b158def86ee01e4d36dda9b410c9a4 |
| src/ui/App.tsx | f1e35804b73813b46fdc7e7253d0bd42894f665a1a36f56e708dc430bef58c77 |
| src/application/relay-commands.ts | a6e74a7e827dbae5c6f9dc0d435996419116ca44a8f9e227e0cb8b0d08f210ca |
| src/core/relay.ts | 979ee69da37af324b422313d2665f9d98b38a601919b095e2513a2ba6e269a72 |
| goal-1/evidence/t17-acceptance-11/independent-collection-review-r10.md | 99396704be55c60dbccd669fac515090b7534387e93bbc34d2c91838de6a96ab |
