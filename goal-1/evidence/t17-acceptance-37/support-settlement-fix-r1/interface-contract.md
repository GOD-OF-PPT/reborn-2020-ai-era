# 纯公开支持结算接口

export relaySupportSettlement(p:Pick<GamePanelProps,'view'|'features'|'accountId'>, target:RelaySceneTarget):RelaySupportSettlement。

返回status pending/known/unavailable；reason:string|null；periodId/businessId/accountId/supportJobId/settledAt:string|null；incomeFen/compensationCostFen/compensationPaidFen/compensationDueFen:number|null；summary/lines只读字符串数组；sourceRefs只读{kind:period/job/operation/obligation/transaction/metric,id,date,accountId,businessId,customerId?,amountFen?}。类型均导出供Root publication复用。

非valid同period/owner、casebook非ready或run/revision/asOf不合、必要财务引用缺失/重复/跨主体均unavailable且四金额null，不回落/不猜0。feePostedAt或compensatedAt未实际发生为pending且四金额null；已承诺future支持日期可保，不预报任何赔付。两marker发生后，income仅原finance.metrics[sourceEventId=period.id,kind=income]并交叉原operation；赔付仅客户canonical relayId('service-compensation',period.id,customerId)的已提交due_expense，原obligationId=relayId('compensation-due',opId)。对应cost metric/amount/date/owner唯一；cash直接id或后续pay_obligation→debtId，精确scope/account/source/ref/date/amount，对每笔原债paid+remaining=cost，receipt due不等现欠。

summary会明确本期已确认支持收入、赔付成本/实际付款/尚欠，与原job行动费分列，并提醒原应收不自动收。lines保完整period/job/op/debt/metric/tx/日期与原客户业务序号（不编姓名）；sourceRefs完整身份用于Root精确publication。无signature/raw/隐藏需求/未来queue或规则执行。

Root示例：const result=relaySupportSettlement({view:current,features:current.features as PlayFeatures,accountId:business.accountId},periodTarget); 只有status==='known'且比previous同period新增settledAt或canonical原赔付才发布result.summary；不是每次查看/后续普通Advance都播完成或付款。Root自己负责原scene-result调用处；本作者只接records。
