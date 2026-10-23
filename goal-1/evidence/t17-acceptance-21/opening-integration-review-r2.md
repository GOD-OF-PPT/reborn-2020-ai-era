# S1 根集成定向复核 R2

2026-10-23。只读核对R1所列两项根修缮，不改源码、不扩任务；未运行SSR、测试、浏览器、Git或矩阵。R1保留的是修缮前读取结果；本文件记录随后实际代码。

**R1两项在当前源码层面均已修复，未发现这两条修正引入的新确定冲突。**

1. `src/ui/OpeningMoment.tsx:39–46`现在先汇总`otherAttention`：原pause、真实缺口/到期未付、强制事件及未解决独立风险；`interrupted`使用`responsibilityOverrideNeeded && (!ownDelivery || otherAttention)`。因此首单自己的交付仍可直接办理，但不会一并豁免其他责任；有其他责任时继续用attention/fallback，原focus没有被覆盖。普通人物邀请/承诺不在otherAttention中，未被新增为强制中断。另确认根已增加`RoomMoment.test.tsx:67`的独立欠款公开UI投影回归；本轮未执行该测试，也不把该投影称为正常财务档。
2. `src/ui/App.tsx:103–105`从同一S1模型导出有效`displayAccountId`，失效focus才回到原accountId。142行的可花、主体标签和打开原账目标均使用displayAccountId。它没有在渲染中写selectedAccount或修改规则账户，明确打开原账才沿原导航处理；修复了原账旧选择与普通S1有效焦点的HUD分离。

R1中完整payload、原候选retry、导航期间保存跟随、S1内存/公开记录恢复、共享MarketSceneChoice近景及`review-choice`休整门槛的核对结论继续按其实际范围保留。三Panel另由原记录目标代理收口，本轮没有提前认证。

这里只关闭上述两项**代码审查问题**。真实Chrome三路径、保存失败/原候选重试、跨导航同对象及画面仍由根代理验证；没有把代码阅读或SSR当最终验收，兼容开发测试继续暂停。
