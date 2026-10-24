# U2 Today纯模型交回

固定exports：TodayThreadInput、TodayThreadClassification、TodayThreadItem、TodayDirection、TodayThreadView，以及todayThread(p,focus?,focusQuarter?):TodayThreadView|null。仅playing且原当前journey章可核时给View；缺章返回null给原fallback，不用空数组伪称无责任。View.source为run/revision/实际date/quarter；primary保原thread/完整focus与originQuarter/sourceRefs，不改书签/季度标签。

classification为entry/active/carry/result/history/invalid/other。工作按同period、原limit/在岗段及实际季末判断，首笔工资actual仍active；运行生活job/已接受promise仍active或carry；市场planned/pending/partial、同fill未付交收与正持仓仍active或carry。完成/退出且无公开后续才按原scope显示result/history。旧对象本季才完成保本季真实回响，不凭源季度归档；选择用的rest/person名不是记录时仍entry。三适配之外other/supported=false，原深业务不接管。

ongoing保全部已公开工作/生活/投资原对象，不slice，不把普通新邀请当自动关注。remaining原样复用当季留页完整责任；question也复用原下一问题。View.wait只取原nextDate/nextQuarterDate，经原playableAdvanceDate与pause/delivery/有限年末界限，费用/权限/保存仍由原Clock/preview守卫。Direction只有work/life/market的label/line/screen，不带命令/payload/自动focus。

unit-r1实际8/8过、exit0，wall10518ms，Vitest9.12s；单worker、原默认时限未变，6绑定源码初末同。前7项由正常Create+原evaluateCommand/codec与原公开projectRun/runtime投影取得，原文每次复核不变；缺journey一项明确是公开context反例，不冒充正常运行。最后一项真实IDB head.put abort、独立reader读锁与原retry，候选始终旧revision/旧事实，保存后才出现实际新job；模型本身仍不改传入primary。不是只照字段造断言或伪业务状态。

正常边界覆盖：工作Jan31首薪→Mar31本季结果→Apr1原Q1历史、不自动续约；Mar28实际休整→Apr1carry→Apr4实际完成且行动不返；实际买入持仓与卖出待交收/到账分开；原强制事件/pause全来源仍在；0AP合法原等待；错run/account/entity明确invalid、其它业务other。

[杠精审查] 本纯模型限定通过：未按actual直接判结束，没有另立任务/业务状态、存储/preview/随机/隐藏原档或规则变更。依赖sequence新三文件已在本次定向前落地，开工后差异在source-final单列，不把别owner变化当自己改动。统一strict、Root正式UI、实际Chrome/钱AP日期/故障与完整Create、真人理解及整个goal仍另核；不称已通过。无全仓/兼容/浏览器/Git/masters/旧sealed/P3改动。Root可用当前源统一严格类型；此owner两源冻结，交回后停止写。
