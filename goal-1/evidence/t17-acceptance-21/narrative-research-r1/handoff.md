# 研究结果同对象修复交回

仅修改src/ui/NarrativeScene.tsx，新增src/ui/narrative-market-research.test.tsx。完成/中断的有效原研究用同ID playerThread公开标题/状态/结果及显式accountId+recordId原册入口；marketSceneProgress不再将其替换为另一委托/持仓/opening。原pause/交付屏障、无效目标、只读/候选旧事实语义保留。未改其它src或规则。

新两测试从正常CreateRun实际安排另一份计划委托和公开研究，再完成或中断研究，核同ID叙事、原册入口、没有另一委托/新下单主选项；只读/候选是明确的有界公共UI副本，不另称真实故障档。新测试+既有NarrativeScene与market场景共3文件17项通过，strict targeted TS0，最终源哈希与source-after-r1.json一致。

请根重建R5并采最终来源；对实际ResearchMarket→完成/中断→同对象查看/重进与完整Create回放继续取证。本交回不是浏览器、兼容、视觉或真人/全游戏验收，R4原件保留。
