# S1原册定位交回

本子任务仅修改src/ui/MarketPanel.tsx、QuarterPanel.tsx、LifePanel.tsx及新增opening-record-targets.test.tsx。未修改App、NarrativeScene、game-types、样式、规则、schema或P3，也未运行Git/浏览器/全仓测试。

三个Panel均增加可选initialRecordId?:string|null。Market核同账户order/settlement/position，research仅个人账户；历史委托及交收自动展开原记录，原表单和草稿保留。Quarter核首单offer/contract/job和真实employment，定位quarter-first-order或quarter-work，并按原阶段选择plan/decision/result；无目标时账户切换不重置原手选phase。Life核job/promise，个人休整/改善仍在today，人物记录定位实际person，完成的个人工作也可翻阅。

目标仅从本次已提交投影查找。错账户、消失或空ID显示失效原因与显式重选，不代换另一个对象，不提交命令。页码定位复用revealBookTarget；不增加几何或兼容测试。

验证：最终npm run test:unit -- src/ui/opening-record-targets.test.tsx --maxWorkers=1，1文件/6项通过（35.45秒）；npm run typecheck退出0。四个源码哈希与handoff-source-index.json一致。此前两轮6项通过和类型记录均保留，最终以handoff-*为准。

新测试使用正常Create的真实订单/撮合/交收、首单、就业、休整和人物约定，验证对应对象文案/DOM入口、不同账户拒绝、缺失/空ID解释及翻阅前后完整导出字节不变。SSR与fake-indexeddb只证明本层接线和事务输入，不是实机可见性、真人理解或乐趣证据。

集成：root传原实例ID，research不能传definitionId，尚无job的rest/work只用原initialPane/initialPhase，不传虚构记录ID。首单可传公开offerId。外层run/完整目标身份仍由App入口核对。原initialPane/initialPersonId/initialYear及四季度tab合同保留。

旧测试影响：无target调用保留原默认路径，不需要将原册旧测试改成新交易规则；App/NarrativeScene的三开局及实际同对象往返属于根集成复核。当前窗口实际分页定位仍由root21步骤4/5验证。全部移动/尺寸/缩放/跨浏览器/几何/原生离页兼容专项未启动。

[杠精审查] 通过本子范围：未删原功能、未用余额差伪造结果、未将定位当执行；完成物件与保存/候选边界沿原投影。原PNG、真人、原P3/62/22及整体goal责任保留。
