# R12复核与下一修缮

R11的两条新测试驱动问题已经纠正：时间真实发生会按原规则消耗随机，正确比较对象是同日期原直接推进的结果；取消前await另一个拒绝Promise会让已安排的微任务先开工，现改为同步请求停止后再await。本体未为这些断言改规则。R12五项真实基本/取消/部分保存/原candidate retry/幂等通过，正常课程整段仍原5秒超时，旧红保。

当前controller.prepare及rangeBlocks仅需已发布runId/revision/date/phase/receipts/quarter flag，却每次重建整个session.view（包括全部feature投影）。改为使用已由原session订阅同步更新的controller.snapshot.view，原session.preview/submit权限、版本、范围与原子保存仍逐笔执行。会话绑定/分离/保存的订阅保证其身份，外部原操作仍按原忙碌与范围门槛。此为减少重复只读投影，不移入renderer规则、不改时限或跳过原验证。须用正常班期与原controller/保存检查核对。
