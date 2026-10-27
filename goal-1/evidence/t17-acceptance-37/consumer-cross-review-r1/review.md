# U4-B消费者跨Owner只读审 R1

**发现5项确定P2，当前候选尚不能按本审宣称消费者全链通过。** 前4项Root已接受为同轮修复，第5项为最后合并报告；Root后续修复/检查另按新身份交回，本审现在冻结，不继续扩散静态切面。未见可据源码确认的新增金融写权限绕过、未保存成功回响或隐藏实计泄露P1。

1. **指定票Key被Panel丢失。** Panel45的onFullRecord忽略_record，继而App317清relayRecordId；Panel key含initialFocusId会重挂载，已指定invoice进入原册后再次点完整原册会丢票、转回meter/default。金额草稿虽还在canonical memory，指定票不是同张。需把Key随同对象一路保留。
2. **meter已有active audit仍让安排新审计。** Book只以auditedUnits===null显示新委托，而该字段在已安排/运行阶段仍null；Meter无jobId等待，SceneProgress/Purpose也未接已有原复核。Core会拒重复，并无免费复核，但实际下一步错误。应唯一绑定active audit/job/batch的原等待/日期，无active才新安排。
3. **续签最终确认缺真正条件。** Renew Editor传完整新期限/付款模式/信用额度，原confirm弹窗却无相应内容，只剩通用账户/零费用。需在捕获同command的确认显示旧约和新条件，不改原preview。
4. **未来重报价确认缺对象与收费模式。** 原确认只有人数/价/effectiveAt，未列选中客户身份及offerKind/支持费承诺。需原编号/旧合同、方案、资源和日期齐全。
5. **原Job日期按钮缺旧snapshot点击守卫。** Panel22直接props.request AdvanceTime，locked只有旧view flags/controller.busy；旧handler可在新saved view后让App按新snapshot prepare旧UI日期。Core仍守费用/屏障，UI来源却失效。应复用makeSharedAction/原ClockAdvance，保原日期和确认。

准确trigger、源文件与修复门槛见findings.json。以上分别是票身份、等待对象、合同确认与旧画面激活缺口，没有把未运行的测试或可能布局问题硬算产品缺陷。

## 已核的真实链与边界

- **Producer→Reader：** campaign生产正常runtime.project时明确enrichRelayCasebook；PlayFeatures只增optional casebook兼容旧stub。Book调relayRecordRows，按完整target和recordKey唯一找row；显式missing key进入重选说明，不默认第一张，只有无指定子票的business入口可推荐首记录。summary首层/完整lines原依据仍并存。
- **原scope与草稿：** response context重核run/account/business/station/period/meter/batch/customer/invoice/supplier/debt；Draft canonical key含run/主体/mode/subject原ID，不含rev/date，取消/分页/近景原册共memory。失效人选/资源不自动删替，余额变化使旧金额不合法则保稿说明，不clamp。Panel丢票Key是上述P2，不等于草稿跨主体串写。
- **N1/0实计：** ticket correction只复制唯一已完成、同meter/batch、过去完成日期且与auditedUnits一致的实际值，0不用truthy。原量/价和version不改。report==actual可停留，不强迫制造差额；原整期Correct仍在。未知实计从不自由填写。
- **N2和原33分层：** 单单CollectRelayReceivable以原invoice+显选金额，原CollectRelayDue仍整客户全部到期、可跨期。客户/供应部分退款沿原已有命令；Pay为共享旧义务操作。全部经CommandButton→makeSharedAction当前view→原controller.preview→App捕获confirmation→submit，不把显示理由当权限。原33的准备/签约/充值/服务/支持/复核/更正/收款/有限停止/招聘解聘/旧任务等待及原册高级能力未被新票目录替代。
- **提交与回响：** App有workspace run/screen/account/epoch/target-key fence，失败候选存原payload/workspace且关闭新操作；原retry复用候选，不重新prepare。专门echo只认新saved revision、同run/date/budget/末receipt.kind/revisionAfter和canonical op。视图receipts不读不存在的revisionBefore。Collect/退款/供应退回/Pay均按原op/源/账户/日期/现金与原义务核，不因余额正数称收入；Pay用operatingId(cmdId,kind)，退款op.ref是充值付款而cash.ref是payable，两者分别验证。
- **只读和旧态：** 稳定readonly只开放读绑定，CommandButton原preview/共享写锁禁写；candidate/conflict/saving和旧view pointer均挡新票动作。原Panel日期handler是列出的唯一额外旧UI来源缺口，不能用新Book保护冒原33所有入口都已覆盖。

## 源时点与未执行

源首像为本目录source-before.json。期间Root明确在原type-R1终态后修Book类型接缝、增加单meter/原service/support/audit目的，并改Obligations共享一句说明为核当前资金与本笔对应保护，匹配原obligationPaymentCapacity；无金额/默认/命令变化。作者模型两P2及测试类型在另state-fix-r2授权修，producer两源仍R1冻结。源末像、受控变化和后补读取范围见source-after.json，**不是同一组始终不变的源**。当前四/五P2修后表现不在本审冒验。

本审只读消费者/已冻结6mode/原共享绑定与实际caller，未改Root产品/原报告、未执行tests/type/build/Browser/Git/codec投影，也未看当前实机图或重演保存。Root首轮类型/运行及后续修复结果各保原身份；C-S4-R真实小循环、当前画面/鼠标、原子物理旧新/原retry/完整Create与账务、原33+N1/N2/共享Pay仍须统一验证。原P3/封存/兼容0、PNG/正式真人、M01暂停与全部goal责任保持；不勾U4-B。
