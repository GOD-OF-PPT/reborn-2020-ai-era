# S1 最终只读审阅 R1

以`build-r4/source-before.json`为来源，对照HEAD检查本次UI差异及新增S1文件；读取时清单中138个src/ui文件的现字节均与R4哈希一致。本轮未浏览器、兼容、测试或修改源码，不审P3无关WIP。根报告的Chrome R3三独立路径/原候选故障与R4目标分页不在本轮重新取证。

发现一项需要修复的确定问题：**[P2] 有效完成/中断研究目标在中间叙事幕被静默替换。** `NarrativeScene.tsx:131–133`先用playerThread判定marketRecordId有效，再把它交给marketSceneProgress；后者只将running研究加入可选ID。完成/中断研究从住处进入市场时，会显示另一委托/持仓或普通opening，原研究原册虽仍可定位，不能补足这段身份断裂。应以同ID公开研究结果保留标题、状态及携原accountId/recordId的原册入口；不另造研究或交易。已即时报根，随后获授权的修复在`narrative-research-r1/`独立记录，R4保留，不把后续源码算成已验证R4。

其余本次重点未发现新增确定问题：完整payload贯穿保存与原候选retry；focus先于导航屏幕检查更新，仍受同run/相邻已提交revision保护；强制独立责任不会被首单自身交付豁免；有效S1账户HUD与焦点主体一致；自由重进保留实际记录、失效目标不静默替换；`review-choice`不执行休整。确认动作移到原Dialog页外固定footer仍使用同一原命令；近景共享MarketSceneChoice，没有自动交易。ScreenBook新增RAF仅延后同一本仍存活书册的原target通知，没有新规则事件或保存。

此结论限代码及来源核对。上述修复后须重建R5、重核受影响研究目标路径及正式导出审计；不代表全24季、整体T17/T18、兼容、原PNG或真人理解/趣味性验收通过。
