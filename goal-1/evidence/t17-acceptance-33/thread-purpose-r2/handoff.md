# 共享目的第二轮修缮（源码冻结，未运行新检查）

仅修改thread-purpose.ts与thread-purpose.test.tsx。实际Chrome原67材料running的整链终点、71亲读申请落records、76/77实际获客后的offer/customers与customer资金阶段为问题来源。当前API不变，未改原journey/progress/App或规则。

修缮：
- 材料/基础/独立适配/获客的planned、running按同主体公开job实际kind/startAt/completeAt/status；与operations同job不一致或多项不唯一则明确核对，不取第一或最新。材料完成只结束材料，申请另定；其它任务各自保留边界。
- 申请按明确application与原job读：未读不消费approved/expires，审查完成仍要亲读；已读records成功/拒绝与历史保实际已知日期和原结果，不回退整链泛终点，也不许当前资格永久化。
- 完成audience/customer与Root既有relayJourneyAction/Scene同一offer/customers/customer-funds决定。已签部分后可Next，不要求补签整份名单；零名单不虚构合同。
- 对照当前24个RelayScenePhase确切命名：invalid→原invalid入口；opening→明确对象/新站；preparation→materials/basics原job或下一明确准备；supplier-letter/supply→原申请/适配及亲读；marketing→原获客job；intake/terms/funding/planning→共享显选；planned/service/support/audit-waiting/audit-ready/correction/collection/settling/period-closed保原履约与账款；market-change/paused/stopping/closed/records分别保原变化、暂停/退出或具体原结果，未以records猜许可。

验证边界：本owner按Root要求没有跑Vitest、tsc、build、preview、游戏命令或浏览器。新增9个参数化/handler外纯投影case身份，仅为正常保存66基础的完整公开显示变体，未称新正常经营/批准。原8case正文、course目的块、courseAttemptClosed块字节保持，见source-final.json；新17项及类型仍待Root实际运行。互动审查代理另纯文本快审未发现确定红点，不当运行时通过。

原R1红/中间timeout/各绿批保原身份；本r2不得倒写它们。实际67/71/76/77图仍为旧R4，须Root新构建/自然Chrome验收后再报修复通过。P3/旧sealed/master/其它源码未由本owner修改。
