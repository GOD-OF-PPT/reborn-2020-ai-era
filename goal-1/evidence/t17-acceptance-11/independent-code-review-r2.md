# T17 / 5c-U1 独立只读代码审查 R2

审查者：/root/relay_final_review。结论：限定通过；在下列冻结文件和指定责任内，未发现新的、可确定触发的代码缺陷。此结论只覆盖静态代码与已有测试源审阅，不是游戏、Chrome、全5c、T17或goal验收。

## 身份与权限

- 仓库：GOD-OF-PPT/reborn-2020-ai-era；owner GOD-OF-PPT；PUBLIC。写前由 GitHub 只读查询核实。
- 分支 main；HEAD 7f7f0dfcb5d6f86e46ac11585f94c32817f16caa。本轮改动尚在工作树，以下 SHA256 固定实际审阅字节。
- 先读本根 input.md、plan.md、tasks.md；并对照 README、经济02、核心01、流程18、技术08、实施09/19、内容15、验收14及30号合同。
- 本审查没有修改源码、测试或任务文件，没有执行测试、类型检查、构建或浏览器操作；页面兼容开发/测试为0。只新建本报告，使用父目录保护和 wx，不覆写已有证据。

## 已核对的具体行为

1. **公开事实与未读许可**：relay-scene-progress.ts:34、38、72、80从公开 auditedUnits、原 audit/job、应用 read 状态取值；未读且已完成的申请先进入 supplier-letter，不根据 supplyOptions 的派生许可提前宣告批准。原 core/relay-projection.ts继续遮蔽未读 approved/expiresAt、审计前实计和其他隐藏字段；新场景不读取隐藏profile、未来需求或故障。ReadRelaySupplyDecision 原 payload仅 applicationId，confirm:false，保留免费阅读语义；更正与收款仍为 confirm:true。

2. **旧周期、支持与真实账**：relay-scene-progress.ts:45保留全部 periodIds；默认可聚焦已揭示且未更正的旧期，显式旧periodId仍可逐份选择。planned/running判定已经收窄；服务、支持、审计等待、停止和企业关闭分开处理。RelaySceneChoice.tsx:13只读取原服务单，报告用量、已有记录日数、不足/停止原因和中断支持均未改称成功履约。更正条件排除已更正记录和仅有历史累计计数；原计量/价格数组没有写入口。

3. **原命令与收款范围**：relay-scene-progress.ts:73、77的命令分别保留 periodId 和 customerId；收款说明明确按该客户全部已到期原单。RelaySceneChoice.tsx:43的复核 payload严格为 periodId/resources/startAt，没有把仅作展示上下文的businessId塞进严格命令。与 application/relay-commands.ts 的原严格shape及 core/relay.ts:75、76、78、107、108、110一致，未创建替代账务路径。

4. **日期、资源与预览**：RelayAuditChoice仅保存本地草稿；资源消失时ResourceSelect显示不可用，命令保留原资源供原preview拒绝，不静默换成本人。RelayCommandDetails.tsx按捕获的同一公开快照、原period/单meter范围、实际所属企业账户展示3日/1点/100元。relay-audit-dates.ts只捕获INVALID_DATE和DATE_OUT_OF_RANGE；极端或空日期返回null用于估算文字，原草稿及原payload继续保留，其他异常仍抛出。已修复的日期边界在当前源码中存在，未把日期错误改成可提交成功。

5. **只读、候选与原子保存**：新读信/更正/收款/复核全部接原CommandButton；其readOnly、hasCandidate、busy和原preview拒绝会禁用提交。打开复核、翻原期、改资源日期只改UI局部状态。Session.view仍从已提交record.run投影。scene-result.ts:4的中转专用回响要求同run、更新revision、saved且无candidate；按新增job/correction及真实账户cost/reservation和原audit引用核对后才给专用结果，不把预约、计量结束、支持完成、差额更正说成回款。

6. **原册与原责任保全**：NarrativeScene中转分支新增的主操作之外，持续保留“翻看全部中转、客户与原安排”；服务纸页也能打开原册并逐份翻旧period。CommandDetails只追加复核上下文，原确认费用、差额、权限和其他正文仍在。中转阶段文案保留客户未消费余额、供方资产、应收/应付、停站和历史责任；暂停新合同与暂停交通分别说明。未发现删除原RelayPanel业务能力或改写core规则/金额/随机/schema的变更。

## 测试源与限度

已逐份读取 relay-scene-progress.test.ts、RelaySceneChoice.test.tsx、relay-scene-result.test.ts。它们分别表达公开阶段/旧期/隐藏哨兵/纯读、日期与捕获确认/只读候选/原账、真实夹具的预约-支付-完成-更正及保存回响边界。测试中的展示变体和F04明确保留夹具身份。本审查不声称执行这些用例，不替主控的独立运行结果背书。

现有源码支持上述限定结论；实际Chrome操作、当前画面、正常Create前史、完整原命令重放、存储失败与重载、其余5c形态和真人/资产核验仍由主控各自证据负责。本报告未开展尺寸、缩放、移动、跨浏览器或原生离页专项，不产生任何兼容验收结论。

[杠精审查] 限定通过：回查原payload、实际底层审计/收款/更正过滤、Session已提交投影与原册接线，未以测试文件存在代替执行，也未将只读代码审查扩大成业务整体通过；未添加新规则或泛化兼容建议。

## 审阅字节 SHA256

| 文件 | SHA256 |
|---|---|
| src/ui/relay-scene-progress.ts | a559e5f66e0ba33e00312a54cff33ea733bf00c3a2767a4e194a016c4afd52cf |
| src/ui/RelaySceneChoice.tsx | eae0232ffd1f161ff8909a58f126cc58a2b64415de8664d9fc4164ee0df590c4 |
| src/ui/RelayCommandDetails.tsx | b24d5c79f973eff96c11217c8cf0004d2c840029ccd8e4a5727d4cb7c138fb8b |
| src/ui/relay-audit-dates.ts | f971ec7926a17b4b6ab844179b80acb6a8f4c83147e8d8805a6b6e02ce20ea82 |
| src/ui/NarrativeScene.tsx | 929b65b01466e318306c640c881bc88e1419245af67e3bcbe5c1dc2a7a336054 |
| src/ui/scene-result.ts | 033a3e1f4b8655a68c2a9e7db707583f5c40ba48c2270bde5773593a0da5a514 |
| src/ui/relay-scene-progress.test.ts | 8b271fbd5f078d1a12bad6ff836d239801123a9b7afbdb67cff8c8576a9958fb |
| src/ui/RelaySceneChoice.test.tsx | 5993da66093079d177aebd0143caa6dd167e0e4fce08f2d8b11aabfbf43b6811 |
| src/ui/relay-scene-result.test.ts | a787aa1730be2bea6eae17b5a0c4ced0ed09e593dd0f2d098f25410db7e31a6e |
| src/ui/CommandDetails.tsx | 3a22f9a25326d8ab537364d1bade35acbcf7c683a0b2011669b59e101dbbc5b0 |
| src/core/relay-projection.ts | 448313a8d7046b6bc319c4c42d1a1553430ec6d79103bb6385cae8a39448a3e1 |
| src/application/relay-commands.ts | a6e74a7e827dbae5c6f9dc0d435996419116ca44a8f9e227e0cb8b0d08f210ca |
| docs/30-relay-routine-contract.md | 40252a69862d5c7e71a5735069dec08593d46e7c948bbd0cc46e5873814118c3 |
