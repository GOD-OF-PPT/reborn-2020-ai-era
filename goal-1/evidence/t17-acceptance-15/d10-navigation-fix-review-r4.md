# D10 导航/字色补正独立静态复核 R4

结论：本次三文件限定静态通过，未发现新增确定问题。只读对照R3精确原源与当前补正；未运行测试、类型/build、浏览器、几何或兼容检查。当前R4实际画面/点击与构建由根代理随后核定，原R3的93项执行保持原身份，不称重跑。

- MarketSceneChoice把股票步骤两按钮搬至Dialog原footer，仅page=stock时出现。原disabled=!stock||!draft.accountId、setPage(terms)、setOpen(false)+onFullRecord回调逐字相同；按钮依然只切逻辑步骤或导航，不产生订单。选股/账户内容仍完整按原书页阅读。
- 静态AST核同：完整market-terms、全部market-scene-stocks、marketDraftPayload、原draft/逻辑页状态及locks、两CommandButton的kind/payload/confirm/primary，和全部事件/disabled属性均与R3一致。terms没有改成自动填值或绕过确认；Dialog两逻辑页仍共用外层draft。
- NarrativeScene仅把opening/position的主卡明确为“填写一份买卖委托”；history/settlement仍明确新的委托。原显示条件、onClick=open、完整原册入口/账户/对象不改。
- 新CSS限定market/life深色Dialog的标题/关闭、说明和分页文字色，以及market footer按钮排版；没有新media、width/height/视口条件、裁切或缩字。间距/flex只承载常驻逻辑导航，不改原阅读分页或删内容。此处仅核样式范围，不冒充对比度/实际画面已验。

R3 rationale保留实际Chrome发现、exactlabel超时、读取页与逻辑页区别及原17字节未变；本审未重新操作或改写这些证据。该可逆结构/字色补正无须为数量重跑旧93；根代理R4构建和当前Chrome小循环、最终全108按其真实新轮分别核定。没有要求兼容或扩大实现。

[杠精审查] 限定通过：不是只改“下一步”文案，逻辑导航确实移出reading flow；完整股票/条款/费用/期限/真实不同按钮仍在，禁止/确认合同未放宽。唯一写入为本wx报告，父目录sealed/symlink保护，源码和R3原快照写前后未变。

| 文件 | SHA256 |
|---|---|
| src/ui/MarketSceneChoice.tsx | 9b00c4757d85e6323670b81915022dc08a4568857eafd3a22d0b2cd0317506d3 |
| src/ui/NarrativeScene.tsx | 0d7e2ea15d548c2e0e787ca2da93fc728523a4bdcc14199b08fab6be76b598a9 |
| src/ui/scene-encounters.css | 8f356e062aea2043f70d9a6fa6bc77c4a8aadf247a1f890df99d4ac8f0b43479 |
| goal-1/evidence/t17-acceptance-15/review-source-r3/index.json | f40aba6eef59b35516d271a12472a9b440c3e6a609a942b93e39f56bef2b8aa6 |
| goal-1/evidence/t17-acceptance-15/review-source-r3/src__ui__MarketSceneChoice.tsx.txt | 4b0167bcb8286af0f34074ff981940d5d488f713cd0ad2f8c2875658b3eb5b99 |
| goal-1/evidence/t17-acceptance-15/review-source-r3/src__ui__NarrativeScene.tsx.txt | b785fcd41de439f5541e24e06f97173e27cd5141d122f9cbc7385a3274774fc7 |
| goal-1/evidence/t17-acceptance-15/review-source-r3/src__ui__scene-encounters.css.txt | 102aa41917311c5531c9d5774400289ca9295dd1263153c7ed6299dc6585b3dc |
| goal-1/evidence/t17-acceptance-15/debug1-r3-browser-navigation-addendum.md | 143f27804318731251188771b2677ce9c632835727360ea705369660b015836c |
