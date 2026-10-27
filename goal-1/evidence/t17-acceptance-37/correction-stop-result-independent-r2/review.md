# 两项P2修后有限静态准入

原红见independent-r1/review.md。Root补正目录实际名为new-effects-type-and-budget-fix-r1（不是消息中省略new前缀的短称），其三文件和前像已读。本次只读取，不源改/不运行checks/Browser/codec/Git；首末6份source/test当前身份相同，全部精确SHA见scope.json。

1. **P2-1对应代码已实际修。** StopStation仍可因真实取消预留而与其它回应不同，但其分支不再无条件相信budget变化。原current quarter须等quarterOf(isoDate(previous.date))；current quarter/total/spent与previous严格相同。本站每个原planned job的prior action必须reserved、executedAt null，变为cancelled；running必须executed且原executedAt非null，变为interrupted；同job/action/definition/account/scope和执行日保持。只将本站planned action开工季度等当前quarter的原actionPoints合计releasedPoints，要求不超过原reserved，current reserved=old−release、available=old+release。未来季度取消不加本季点。副作用不在可核范围（例如共享员工引发另业务动作变化）时不能借此强称已用点不退，返回原generic/原记录，而不改command权限。新第5个station测试保spent/total/quarter三反例，原4case未删，尚未运行。

2. **P2-2对应代码已实际修。** progress新增stoppedOnOrBefore通过原core isoDate try/catch校验stoppedAt有效，并要求≤today。原字段无效/未来/null时不说该虚构停止日；winding_down仍可独立说“本站收尾”，保原阶段、CollectRelayDue及其它主旁动作，不把无日期误判成恢复经营。新真实100（Mar5）case明确Feb30、未来、缺失、乱串反例，原真实95纸件case原样保。paper的strict stop helper未改，不额外强制新动作。尚未运行。

其余R1已审原范围保：更正single/bulk用各原canonical IDs/同period/audit/原价格；原退款实退与供应资产恢复、正AR/AP与各自due、原预款消费/应收冲回分列，unknown局部理由不编0；旧period167原更正count不被现金净额替代。Stop维护/工资48.38只来自原新bill/dueexpense/metric/obligation/tx.ref守恒，旧支持已用投入与客户保护/AR/供应资产不被停站消除；主线仅title/line不更原phase/command/wait。未发现修补引入的新确定P1/P2，不据此证明全部未改命令实机或所有恶意stub均已测试。

[杠精审查] **仅本两P2的源码对应静态关闭，允许Root继续冻结后原门槛工程与新Native。** Root原6correct cases/原4station加1/原paper1加1属于已写not_run，本审不称已过；原19interval断言未由本Owner改或执行，真实回响优先级仍待新候选实图。原Type15红/原R16和R1审红保留，不改称同次全绿。当前U4-B/R2/R3/C-S4-R、P326/全部goal/原PNG/真人/M01暂停/T18责任继续；compat0。
