# D10 最终UI语义/安全只读审查 R5

结论：当前git diff HEAD的20份UI源码/测试改动限定静态通过。已先向根代理反馈一处确定P3文案口径，根仅修该两文件后本审复核；当前未发现未闭合的确定命令、资金/AP、权限、保存或入口缺陷。不是测试、浏览器、兼容或完整C-D10/D10验收。

身份：HEAD58fee36f9b124ae07d8ccb8559f7c67dff771244，main，GOD-OF-PPT/reborn-2020-ai-era，owner GOD-OF-PPT，PUBLIC。实际20文件中7份测试、13份生产源码（含1份CSS）；本审不改源码、冻结输入/plan/tasks、旧报告或stage，只父目录guard+wx新建本文。

## 先反馈的问题与版本边界

scene-domain-results.ts:67—70以(accountId,symbol,side)分组多个orderId的成交并合计余量，却写“这份委托仍有N股”。同账户同股多笔部分成交会把合计口径说成单笔。本审先反馈；根仅改“相关委托仍有”，对应test:149只改同一措辞，算法、金额和断言数字不动。当前两文件SHA见表，已静态核同。

R4/build冻结518条与当前比较，恰只差这两文件。因此R4构建保持修词前身份，不能声称当前R5全部源码已被它重新执行；后续新build/C-D10全108由根真实核定。本审不要求为了这次可逆文案变化重复旧93，不将任何旧数量加算为新通过。

## 语义与安全核查

- **原命令与代价：** 只读AST抽取生产文件38处kind/payload/confirm声明/接线，均与HEAD相同；含市场Place/Plan/Submit/Cancel、生活材料/接受/兑现/婉拒/中断、生态原提交与到期收款。DeepSeek各add调用的前8个身份/阶段/active/priority/日期参数也相同。Market解析、空草稿、报价/股票资格/只读/候选/冲突/日期锁和原确认未放宽；当前footer仅移股票步骤导航，完整条款未删。core/application/content/persistence、依赖/配置无diff。
- **五路线与原记录：** 原Navigation、App、CommandButton、ClockAdvance、ScreenBook均无diff。资料卡合并后footer保留各原可访问名称/onOpen；人物p.onPeople、年度p.onYear和当前生活页、业务主体/对象定位仍在。原委托/持仓/改单、客户/材料/费用/权限/退款、历史和年度均经原册/分页到达；不同Decline/Interrupt/Cancel旁路保留。数字键仍依当前真实DOM及原disabled按钮，不自行提交或保留旧卡假序号。
- **已保存回响：** App原committedEcho入口未变；committedEcho、savedSceneResult、domainSceneResult的同run、新revision、saved、无candidate条件相同。失败/只读候选不能藉简明文案发布新成功。日期仅对视觉正文开头的精确当前ISO日期+中文逗号/句号去重，完整Echo原text保留，其他历史/里程碑日期和React转义不变。
- **预留、实付与尾声：** Echo直接读原available/reserved/spent，展示预留与开工已用的区别，不从可用下降推算支出；quarterChanged用原budget.quarter，所以2026有限尾声仍沿2025-Q4，不显示新发四点。StartFirstOrder回响按已保存planned/running分别说预留或原已付制作成本，客户款仍明确未到账；没有UI加钱/返AP/免费完成。
- **对象与账户：** 市场成交/取消/到期按完整accountId+symbol+side分组，交收外层再区分sale/dividend，不把个人/企业同股合成一笔。生态按原contractId逐份说明客户/部署或培训，并分生产80%与支持20%；实收仍核原到期应收减额、原业务cash增额相同与原recognizedIncome不变。权益按原业务/账户归属说明投入、转让应收与收取，不采用玩家此刻查看的另一账户。预款、未到期应收、预留、供方资产和估值均未转写为新增到账。
- **公开事实与责任：** 三progress保留原实体选择/已揭示状态和日期条件；文案区别planned/running/完成、邀请/接受/兑现/NPC自主撤回，未编隐藏结果。生活首层可省长ID，但完整references及原payload对象、材料details仍保留，展开不选择。urgent只计原紧急输入，长期约定完整另组；原缺口、到期义务、风险、授权/融资/支持边界没有被普通信息预算隐藏。
- **测试与输入安全：** 七份测试变更同步文案并增加原个人/企业同股、预留/开工、真实尾声跨年和日期去重检查，旧金额/状态/不变档/guard断言与时限保持。仅阅读源，不执行。19份TS/TSX按实际扩展名静态解析无语法诊断；首次通用TSX读取.ts泛型不适用已校正，不当源码或测试红档。无新增eval、HTML执行、网络/真实支付、凭据/SDK或第二保存路径。

r1曾发现的逗号日期/尾声新季度两问题及根修缮，r4的逻辑页footer/限定字色补正保持各自报告身份，本文不覆盖。CSS未引兼容media/视口条件或裁切；无几何/浏览器/兼容操作，book-layout两多宽用例继续paused。实际阅读、键鼠、保存/重载及完整原文/C-D10由根后续证据负责；真人0、T17/goal和后续原范围不变。

[杠精审查] 当前静态限定通过：逐文件核身份/命令/门槛/资产口径和原入口，先交出P3再核最小修缮；没有用绿色旧报告、语法解析或短文案冒充当前运行/玩家理解。全文唯一新写，源码与r1/r4报告写前后保持下列字节。

## 当前20文件与保留报告 SHA256

| 文件 | SHA256 |
|---|---|
| src/ui/CinematicRoom.tsx | 9c2e715e152f7348a4681a9bf8dc5f680f8670df40fe67dc125c4438e04a5141 |
| src/ui/LifeReferenceChoice.tsx | 17b0ab83c34bc9c281f9ee836351fad95f0f4367467be6e770fcf075ce2c6dac |
| src/ui/MarketSceneChoice.tsx | 9b00c4757d85e6323670b81915022dc08a4568857eafd3a22d0b2cd0317506d3 |
| src/ui/NarrativeScene.test.tsx | ddabada9ce4f0f5b48c714d8cbcfdadc41fd53adfc04e5930fbd20f0ba43d80e |
| src/ui/NarrativeScene.tsx | 0d7e2ea15d548c2e0e787ca2da93fc728523a4bdcc14199b08fab6be76b598a9 |
| src/ui/RoomMoment.test.tsx | 64c2a47bcc869306267fd8397d1acaa82b09c208153650a79c2e0f5c4e9ae105 |
| src/ui/RoomMoment.tsx | 2c2b0f1f1375c4a3f801f8c7e1c67eec077438cc20f8a46289f573f2af8b6a46 |
| src/ui/SceneEcho.test.tsx | baa4ca9f0f1a6c178bb382bf33af371f68c41e2d0bd8b25f0077413f25de9e0e |
| src/ui/SceneEcho.tsx | dacac2d9202f7738a87d91f97ea6a1a09ce5a94f02320dc99f7d5faf75b77bb7 |
| src/ui/deepseek-scene-progress.test.ts | a399afc1f5b811f204f5d347491419eb61fd1afc6116513fe1d748ba07f48717 |
| src/ui/deepseek-scene-progress.ts | 6f40eca4df8ddc9b5bc5bc199f0331a36d547cf19060529e7778d309b21afb4f |
| src/ui/game-text.ts | af2a163ebb678928681ee4cfb5da29cfc70e8c903e4a2a39ebb8d8bd6ce923e4 |
| src/ui/life-scene-progress.test.ts | 57e852d677ce3b3671eae55c8ab5931075ea384b8367a746d3348708ab28360b |
| src/ui/life-scene-progress.ts | 909b2c5736f56c0215a81432d9155801ba7a9de341afc32d63a46c0745ecc453 |
| src/ui/market-scene-progress.test.tsx | 5689d64d212168103f9ddae1c1604b8705d94f6d554f22f0be29b65738e3a10e |
| src/ui/market-scene-progress.ts | 5cb676e933b48b2ff7b36c7d1e2834630b257cf9588c8d5bf8cb4b19506f3152 |
| src/ui/scene-domain-results.test.ts | a6b65ab8b5e264b716e98fe113aebe471e418f763c8caab9ff44fab429b0b5f5 |
| src/ui/scene-domain-results.ts | 4af490ce293b578a40a5fa858805637b60dc021a4afdcc654b51e5bcf86cf28b |
| src/ui/scene-encounters.css | 8f356e062aea2043f70d9a6fa6bc77c4a8aadf247a1f890df99d4ac8f0b43479 |
| src/ui/scene-result.ts | 019676d41078ef2dde802664ed656cec88508a50b6b54b8d73ce84452936b54e |
| goal-1/evidence/t17-acceptance-15/d10-ui-integration-review-r1.md | 4a4ea5cc1e77f9016ccf8456a572348fef2df020f657fc30635e9f536ed7b761 |
| goal-1/evidence/t17-acceptance-15/d10-navigation-fix-review-r4.md | 2b782f2d8a2e59f2e47bfc4138e368745979cc7c78da7836814d29abc463c02d |
