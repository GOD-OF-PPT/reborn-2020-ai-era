# U2 ongoing去重与新today视角静态交回

确认原正常卖单重复：order因其同fill原待交收被判active/carry，ongoing候选又独立加入settlement，Today会把一笔继续列成两项。本次生产仅today-thread.ts的ongoing循环新增窄判断：settlement.kind=sale，且相同账户、sourceId精确属于已成功加入items的原order.fill，才跳过该重复settlement入口。不使用symbol、数组首项或余额猜归属；必须order实际已加入，失效/不可覆盖原单不吞交收。dividend不被本分支去重。

原order继续保原dueAt wait、实际fill与收付sourceRefs/inspect；remaining、season候选/书签、原册和日期/金额完全未改。suppressed的是重复导航入口，不是原交收责任或已发生来源，也不把未付画成实收。

测试变化：既有正常卖单case改为只一个order ongoing、原dueAt不变、独立settlement仍在完整remaining。新增第9项从正常Create→Discover course-studio原分账→个人资本真实Fund5000→个人/企业分别原buy/match/sell/match，核两主体各只一项自己的原order、原交收日期与完整责任。另两个明确public-projection反例都复用上述真实ID/account/date：仅缺一账户原order时保其独立交收，不被另一账户覆盖；dividend-kind分支保留，后者不声称实际发生了分红，不导入/保存、更不制造正常成果。原raw末核仍要求相同。旧R1八绿/原前像与结果未覆盖。

当前按Root要求只读/写：新9case尚未运行、无新增type/test进程，不拿旧8绿覆盖新修。源身份见source-final.json；Root统一C批验证后再记实际终态，原断言与时限未改变。

新day-perspective静态核：core projectRun公开完整committed receipts；helper同run、起点revision不晚于当前且playing，只有起点后五类新安排的真实receipt退Today，AdvanceTime/ChooseEvent继续。父Cinematic及本地Opening effect都在无效时清marker，渲染先dayPerspectiveCurrent，未等effect后才隔离旧run/新安排；候选仍是旧committed receipts，不发布candidate事实。责任门槛仍优先，ChooseEvent处理后可带原feedback回Today；feedback本身沿原App回执条件，不造新的完成。新helper/父子effects没有发现确定新增阻断，未运行或宣称实际Chrome通过。

[杠精审查] 窄UI去重静态通过；不改玩家pin、规则/钱/AP/日期/权限/存储，不删独立交收/分红或其它主体，不把新反例当正常经营执行。仅owned两源和本新证据，P3/旧封存/masters/Git/兼容不动。交回当前源冻结。
