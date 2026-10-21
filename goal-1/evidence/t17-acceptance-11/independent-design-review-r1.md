# 5c-U1 独立设计边界复核 r1

结论：当前root11 input/plan/tasks限定范围合理，原完整5c及后续责任没有被本子任务替代。场景应把玩家带到真实周期/原账与真实复核选择，不重做经营规则或自动安排资源。以下是实施前只读边界审查，不是新代码/游戏/Chrome/兼容验收；未修改代码或计划，未运行场景或测试，仅新增本文件。当前画面与Chrome基线由根代理负责。

## 多周期与原主体

公开类型可直接使用 `NonNullable<RelayProjection>['periods'][number]`、`['meters'][number]`、`['auditJobs'][number]`、`['applications'][number]`，避免另造隐藏状态。`GamePanelProps`提供view/features/controller/request；所有聚焦都只是UI草稿，不能改GameRun。

先明确businessId，再从period.businessId精确选本主体周期；不能取全局periods[0]/at(-1)作为唯一周期，也不能用顶部查看账户代替period真实主体。旧企业已closed的周期仍有只读历史，不自动当作新营业主体；本期closed也不表示整家公司或客户余额已结清。原RelayPanel.tsx:15–29保留完整经营/客户/供应/退出入口，新的电影入口不能取代或隐藏原册。

应复用 `src/ui/work-visibility.ts:4–8` 的relayPeriodGroups：对本主体周期集合，只有 `meter.auditedUnits!==null && meter.auditedUnits!==meter.reportedUnits && meter.correctionId===null` 才是公开待更正。一个已closed周期被后续复核揭示差额时仍留在current。已追加correctionId的旧差额、matching audited zero均不是新任务。`period.knownCorrections`是累计历史数，已更正后仍可能大于0；不能直接把它当待处理数。

当前业务可以同时有A旧周期待更正、B当前服务、C未来支持。默认聚焦可优先已公开未解决的原责任，但玩家显式选择B后应稳定保留B的原periodId，另在持续牵挂中保留A/C，不因每次渲染或新回执跳回第一个/最新周期。选中周期消失或换run后才明确回退；日期、资源草稿同时绑定runId/periodId，不能把上一周期选择悄悄套到另一周期。不同主体的audit/meter/债务不能串入当前聚焦。

## 复核可安排性和精确原命令

原 `application/relay-commands.ts:11` 的严格schema：

- `StartRelayAudit` 只能二选一 `{periodId, resources:[chosenResourceId], startAt}` 或 `{meterId, resources:[chosenResourceId], startAt}`，periodId/meterId严格XOR；不能额外发送businessId、amount、actualUnits等字段。
- `CorrectRelayPeriod` 是 `{periodId}`；`CorrectRelayUsage` 是 `{auditId, correctUnits}`，correctUnits只能来自已完成复核公开的audit.actualUnits，不可来自未复核meter隐藏真值。
- `ReadRelaySupplyDecision` 是 `{applicationId}`，已完成但未读的供应回信必须经这个独立命令；`AdvanceTime`仍为原 `{date}`，不能在UI直接改job/period状态。

原 `core/relay.ts:75` 能复核的是当时已经存在、supplierId不为null、没有planned/running/completed审计任务占住的meter。取消/中断的原审计不授予完成真值，可以再次按原费用与资源安排。不能以meterCount−auditedMeters粗算候选：无supplier记录不可审；进行中的旧审计已覆盖的meter不可重复；同一period在旧审计开始后新发生的其他meter仍可能可审。不能以“全局有一个审计job”就屏蔽另一period的合法复核。

period已closed不禁止对原账做真实复核/更正；但business真正closed时Operations不再接受新审计job，只显示历史/原原因。存在待更正时可直接原CorrectRelayPeriod预览确认；没有差额只能说“已完成的这批复核未发现待更正差额”，不能说未复核部分或未来用量绝无问题。原零差额Correct命令仍可在原册由原预览决定，不需替它新增收费或特殊完成规则。

选择复核应有实际资源和日期：startAt不早于当前view.date，而不是period.from；历史服务结束后仍可复核。1AP/10000分/3日，使用开工季度预算，原有视频/课程/服务/世界/故事任务仍占同一资源。调用现有ResourceSelect及CommandButton；失效/离岗雇员必须提示重新选择，保留原ID直到玩家改选，不默换player。原preview负责AP/现金/容量/主体/日期守卫，不在UI猜测可用性或预留。普通期日期按当前正常可玩范围；有限尾声沿原命令允许的旧事项/current date，不以硬编码旧日期做回溯。

点“复核”应先打开有意义的资源日期选择，再按原预览/确认提交；取消、返回、翻页、选择聚焦均不扣钱、不执行。确认可用原CommandDetails扩展说明本周期、已发生候选条数、实际资源/开工日/预计完成日与100元/1点，不能把预期完成说成已完成。忙、只读、hasCandidate、conflict、原风险暂停等仍沿原守卫，不能为了场景按钮绕过Session或直接调用规则执行。

## 支持中断、停止和结清

不要只按period.status一条分支压掉另一项真实job：service仍running时，supportJob可能已经cancelled/interrupted；应该明确原支持中断与旧责任，而不是继续承诺“到时自动完成支持/领取服务费”。service完成后也不等于support完成；support planned/running只显示原约定日期与真实任务。

原 `core/relay.ts:116` StopRelayPeriod只中断service job并记录stoppedAt，原supportJob可能继续；它不是“全部任务已经停止”。PauseBusiness停新增客户合同，PauseRelayTraffic停止后续请求并留meter原因，StopRelayStation走全企业WindDown/中断原任务，三者不能混叫“已结清”。撤代理权限可能中断原绑定支持，本方停止不等外部撤回。

`core/relay.ts:198–204` 只有支持job实际completed且发生真实服务才确认周期服务费，按实际服务天数/28分摊；支持未完成不收该费，可能产生原赔付义务。不能凭feeQuotes/报价或观察天数提前显示收入/现金。period.feePostedAt或status=closed只表示本期相应处理状态，客户未消费保护、企业应收/应付、供应资产及其他周期责任仍独立。settling不能叫“本期利润已到账”；原CollectRelayDue按customerId处理该客户全部已到期应收，不应伪标为只收当前period的一笔钱。

## 只用公开已提交事实

`core/relay-projection.ts:10` 已剔除meter.actualUnits/requestedUnits/missedUnits/factId/maxBillableUnits/blocked，auditedUnits只有已完成审计后才非null；quotes.responses在谈判未完成前为空；applications.approved/expiresAt在read=false时为null。不能通过读取原run/RELAY_CONTENT风险参数、raw字段或预览候选补全这些未知值。即使supplyOptions.permitted/初始adapter等派生信息已存在，未读申请也先显示“回信待查看”，不能以这些旁路替玩家宣告获批。

period.reportedUnits明确叫“报告用量”；observedDays叫“已记录天数”，不是成功服务天数。failedDays/observations/reason是已发生公开故障与不足记录，不预测未来故障或称普通故障为AI作恶。待更正金额可由已揭示auditedUnits与原单价/供价解释，最终仍显示原Correct预览knownAdjustments并按原确认提交，不改旧meter/price/rateId。

聚焦的纯投影不调用Date.now、随机、隐藏profile或任何提交；输入不变输出稳定，不能在render/打开原册/回信阅读中自动充值、签约、迁移或扩权。只有保存成功的view才能切到“复核完成/已更正/已支付”回响；head.put后abort仍保旧场景/物理旧档和同candidate，重试不能双扣。

## 最小有意义的边界测试建议（未执行）

1. A closed旧周期有公开未更正差额、B最新period正在服务：A仍在attention/current；选择B只读且A仍可达；其他business差额不串入。
2. 已corrected但knownCorrections仍大于0、audited zero匹配、reported zero但auditedUnits=null三种分别不误报新差额、不推断真值。
3. A正在审计而B有未审meter；同period旧审计仅覆盖前几天，后来新增meter可另复核；supplierId=null不可审；interrupted/cancelled可重做而completed不可重复。
4. 真实选择future date/已雇资源后精确发送XOR payload，返回保留草稿；切周期/换run不串草稿；员工离岗不替为player；原preview拒绝AP/资源冲突保留实际原因。
5. service running/support interrupted，以及StopRelayPeriod后support继续两种状态，文案保留真实旧责任，不误称服务/支持全部完成或已免费恢复。
6. 未读已完成申请、未完成审计、未完成谈判，只显示公开未知；同公开投影附带不同隐藏多余字段时渲染不变，输入/命令数/原文与随机不变。
7. 当前正常S03实际服务/支持/审计/更正与重载逐步核对本period/资源/日期/原原因。基础“阶段函数几个返回值”不足以证明最终App的按钮、草稿、确认与保存回响正确；需要受影响UI/原子保存集成及根代理当前Chrome原图/原文。

[杠精审查] 设计前限定通过：本轮只交5c-U1实际美术交互子检查点，完整三供应/两offer/预付后付/四支持/故障域/价格/更正/例行/权限及原后续不减；待代码落盘后再做具体实现复核。无兼容开发/测试、无新矩阵、无原封存目录修改。
