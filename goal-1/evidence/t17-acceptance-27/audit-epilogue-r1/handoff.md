# 有限尾声旧计量复核：冻结交回

仅RelayServiceChoice.tsx与其test改动。原共享2025 cap误挡合法尾声审计；现在仅slot audit且view.phase epilogue时要求startAt===view.date，日期输入min/max同今天，其他日期保稿提示显选。新服务和普通playing仍保原2025上限。原CommandButton/preview/请求载荷/金额/AP/核心均不包装、不改写。

原规则：core/epilogue.ts guardJourney允许StartRelayAudit并要求startAt今天；core/operations.ts #jobCheck仍核tailQuarterLock/真实资源/费用/AP/旧债。测试先真实暴露OVERDUE_OBLIGATION，以原PayObligation逐项付清原企业义务后，旧UI的null与原preview allowed构成red-r3；原义务/实际付款未删除或伪造。

最终green-r2为原文件6/6（原4+新2），新handler2572ms；owned strict-r1 exit0。默认原时限/断言保留；green-r1早一版6/6及全部三红另存，不合并新分母。最终两源码精确SHA/字节见source-freeze.json。

来源与未验：合法normal旧epilogue-s99已官方import但没有relay业务。新增case使用现有正常planned原meter及明确phase/date/tail-lock公开/原规则preview变体，不导入或执行该变体，也不把它导出为正常历史；实际控制器原存档前后字节同。候选/只读实际handler拒绝、原preview今天允许¥100/1AP且明天拒绝；没有新浏览器、正常24季前史、完整Create复放或兼容检查。不是整R1/S4/goal验收。

全受控变更2files，所有跟踪核心/通用按钮/target/draft/fixture/锁/配置依赖字节同；P3和根App/Narrative/Panel未触。Root可用冻结源构建并做其实际当前状态验收。
