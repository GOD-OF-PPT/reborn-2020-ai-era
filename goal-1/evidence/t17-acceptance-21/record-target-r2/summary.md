# 原册失效目标的显式重选门槛 R2

本轮仅改MarketPanel.tsx、QuarterPanel.tsx、LifePanel.tsx和opening-record-targets.test.tsx；R1、其他源码、规则与草稿逻辑未改。

先在原六项测试的既有失效/错账户断言中补：失效市场页没有新单表单/预览买单，失效季度页没有WorkQuarter默认按钮，失效生活页没有StartLifeWork默认休整/唐萤活动按钮；失效页只有一个重新选择按钮。没有新增测试矩阵或尺寸用例。

红：原6项中5项失败、1项通过，退出1。五项实际失败均命中默认可执行内容仍被渲染，完整stdout/stderr、源哈希和退出状态保留在red-*。

修复：三个Panel均在全部hook调用之后、正常视图之前检查非null/undefined的目标；目标不存在或不属当前主体时，提前返回唯一警告和重新选择按钮。该按钮仅setDismissedRecord，使本次记录提示清空后恢复原完整原册；不会提交游戏命令。正常有效目标和无目标路径沿原内容，Market的局部表单state及原quote重置策略、四季度tab和生活person/pane合同保留。

绿：同一文件6/6通过（10.25秒），npm run typecheck退出0。green-source-index.json中的四文件哈希与交回当前字节一致。

本轮未运行Git、浏览器、全仓测试、构建或任何页面兼容专项。SSR只证明失效状态不再输出默认执行入口；当前窗口的实际点击重新选择/分页定位仍归root21后续浏览器验证，不冒充实机或真人体验通过。

[杠精审查] 通过本次确定缺陷：警告文案与可执行内容不再并存；未知、空ID、错账户均须先显式重选。原P3/62/22、PNG/真人及整体goal责任保留。
