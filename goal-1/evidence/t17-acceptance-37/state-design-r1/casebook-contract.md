# 应用层原财务读片接口合同 R1

本合同按Root后续明确授权补充state-design：允许新application投影解析已验证LedgerReceipt.signature，只按严格白名单读取既有已发生财务operation，UI只收安全摘要，绝不收signature/raw对象。这是受控应用层只读接缝，区别于UI禁止读私有账；不改core/P326、schema、命令、经济规则或随机。当前只设计，尚未写产品代码/测试。Root仅独占campaign.ts调用接线和game-types.ts可选casebook类型；候选新增文件为src/application/relay-casebook-projection.ts。

## 1. 外形与完整性

导出enrichRelayCasebook(run:GameRun,relay:RelayProjection)，原null原样返回；非null保原relay所有字段不变并附casebook。建议导出RelayCasebook/EnrichedRelayProjection类型，game-types仅令casebook可选兼容原stub。casebook至少含sourceRunId/revision/asOf与读取状态；完整可用时才返回整套历史数组，歧义时返回unavailable＋可读reason，不返回半套空数组被当“无责任”。base relay及原账/原允许动作仍保持，不能因为新历史读片失效而静默改变原业务权限。旧stub无casebook只说明明细未取得，不猜0/已付/成功。

数组：recharges、collections、renewals、obligationHistory、cashTransactions、actions、operations；另receipt metadata若需要可由operations中的receiptOrder/kind/status获得，不必重复另列完整账本。所有返回对象显式白名单拷贝，不能传播可变run引用、任意原对象、facts/privateNotes/随机种子/未来queue/未经亲读审批或未复核实计。

## 2. 事件已发生与未来承诺

recharge/collection/renewal/operation/实际cash/metric的发生date<=asOf；不要将“任意日期都不晚于今天”写成过滤规则。obligation.date本身可为未来到期日，incur_supplier_usage原逻辑直接把payable.date设为dueAt；已创建债务无论未来与否都保留。action按plannedAt<=asOf纳入，原startAt/completeAt/settlementAt和合同effectiveAt/dueAt可以是已明确承诺的未来日期。非null executedAt/finishedAt必须已发生<=asOf；未执行/未完成不虚构日期。原序用ledger原索引，不按date重新排列同日因果。

## 3. 必要字段与最小作用域

- recharges：id/customerId/date/amountFen/operationId/usedFen/refundedFen。仅同原公开customer属于原relay business，原批次未用净额保原值，不凭总余额倒拆。
- collections：id/receivableId/date/operationId/amountFen。必须唯一原单→原客户→企业→账户；原客户全到期收款的一次命令可以有多条collection，不能当多次新命令。
- renewals：id/customerId/date/termEnd/mode/creditLimitFen；日期与合同旧terms不抹。未到effectiveAt的未来条款仍是已作出的公开承诺，不能当当前价。
- obligationHistory：原id/accountId/businessId/contractId/counterpartyId/date/sourceEventId/originOperationId/kind/amountFen/remainingFen/protectionReservationId，含remaining=0历史与未来due。原null business不可被伪装成原op已声明business；若按唯一公司账户或原义务反查，另明确scopeBusinessId/归属依据，无法唯一则读片不可用或留本站未知归属，不猜到本期。
- cashTransactions：原transactionId、ledgerOrder、lineIndex、date、accountId、deltaFen、sourceId、referenceId、businessId、contractId；保原账户行和序。同一资本转移可能有两个本人受控账户行，唯一键用transactionId+lineIndex（不把两行算两笔收入）。按原business/明确原ref限定，个人共享账户不能整账户抓入其他业务或生活收支。
- actions：按公开relay preparation/application/adapter/audience/service/support/audit/quote的job.actionId，严格唯一匹配economy.actions与原job/business/account。列原definition.id/definitionId/accountId/businessId/actionPoints/costFen/cashReservationId/startAt/completeAt/settlementAt/fundingPurpose及原status/plannedAt/executedAt/finishedAt。实际预留/已耗来自此原记录；本版RELAY_JOBS仅是规则定义，不替历史原动作事实。
- operations：每条只含原id/kind/status/ledgerOrder和date/sourceEventId/accountId/businessId/contractId/referenceId/amountFen；相关类型再加prepaymentId/obligationId/dueAt/reservationId/originId/newOriginId/bucket/counterpartyId等必要关联。没有的字段null或省略，不补0。业务归属若推自唯一本义务，保原businessId空值，并另给scopeBusinessId/attribution，不篡改原声明。receipt.status是当时操作结果，尤其due不等于现在仍欠，当前余额看obligationHistory.remainingFen。

Scope先由已公开relay businesses/customers/periods/meters/audits/refunds/quotes/供应池和原job建立ID集合，核controlled account/原operations业务一致。原opId种子来自已公开deliveryIds/costOperationId/correction.operationIds/refund.operationIds、公开cash/metric/obligation及新recharge/collection。所属关系须唯一；不以account相同就把个人其它路线或另一企业算作本站。pay_obligation可沿唯一obligationId反查原业务/合同/源，不需签名声明businessId。供应池跨期共享，不能因对应某meter就把全池记作本期。

## 4. 财务operation白名单

原core真实名称：supplier_prepay、consume_supplier、incur_supplier_usage、reverse_supplier_usage、refund_supplier、settle_supplier_credit；receive_prepayment、deliver_prepaid、deliver_on_credit、collect_receivable、refund_undelivered、refund_delivered；expense、due_expense、pay_obligation；reserve_cash、move_reservation、release_reservation。资本/借款若作为原本站责任引用链的必要前史，可在Root明列后纳入owner_transfer/open_business_account/borrow_cash，不泛纳股票、股权、世界效果或其它路线。

每个kind须有单独必填/可选字段规则，核plain JSON对象、id/kind与receipt一致、字段类型/有界整数分/ISO日期/必要引用一致，reject原型污染键与未知字段；不eval，不动态加载，不执行parsed kind。原ledger操作各字段以core union为准，原record identity顺序和业务引用为核定依据。对于不在允许范围的无关记录不出版；遇所需原引用缺失、重复、跨主体或不合法，不回落另一个/解析成0，而使这份历史读片fail closed且保原base relay。原validated run本应通过，恶意stub/缺边反例验证本接缝防错，不冒已发生存档损坏。

只输出白名单安全字段而非完整JSON/签名。signature只在新application模块内部按Root授权读取；RelayRecordRows和UI消费者均不得导入GameRun或接触原signature。不要通过“全JSON spread再删signature”防漏；按kind新建允许字段对象。

## 5. 这些字段现在是否足够

按Root新增的operations金额/引用与actions，**足以闭合当前UI缺失的原充值批次、逐单实收、原退款后付、支持投入及供应贷项原序解释**；此前仅receipt id/kind/status本身不够，现已由受控安全摘要补足。

客户退款：refund.operationIds→refund operation→原obligationHistory，直接原tx.id识别当次现金，稍后pay_obligation用obligationId＋cash.referenceId识别后付；不再按客户总负现金猜。部分收款以collection.receivableId与原operationId/现金对应；全客户CollectDue仍多原单独立金额，同一原命令原scope不变。

供应：reverse_supplier_usage.referenceId指原consume/incur；同原义务的先前现金付款、冲回和settle_supplier_credit均有原序/金额，才能区分当时未付冲回与已付恢复资产。后续settle原金额是贷项抵账、非现金；refund_supplier才是取回资产现金。任何读者解释/汇总只归并这些已存在财务事实与原引用，不调用业务命令、applyLedger、advance/preview或未来模拟；无法完整闭合原链就明确不可核，而不按当前总池余额反推。可保安全操作原始列表作为完整依据，不必再造第二套通用账本或规则执行器。

支持费：finance.metrics已含sourceEventId/operationId，可按原period/客户读真实已记支持收入；不能拿period.observedDays/failedDays推实际有服务日数，也不能拿季度finance.incomeFen作本期累计。服务预算是上限、供应池是资产、保护是负债占用，现金/原收入/成本和原动作预留分别组织。

## 6. 必要回归与消费者门槛（尚未执行）

1. enrich原null仍null；正常committed run与原公开projection输出base字段逐字不变，运行前后原codec导出不变；无facts/RNG/private/queue/未读审批/未审实计访问。
2. 两业务/同个人账户、资本双账户行、pay_obligation缺原business但可沿唯一义务定位；重复IDs/缺边/跨业务/account/kind与signature不一致fail closed，不选first。
3. future due债务与future support已预留action保留；所有实际operation/cash/执行完成时间不超today，planned不画actual。
4. 退款当次付/资金不足→旧应付→另一次部分或全付款/保护释放，原tx.referenceId、collection/充值批次金额可核，序号正确。
5. 供应预付消费、后付未付与已付后的正负更正、同日原序、贷项恢复→抵另一原供应单→退未用资产，paidFen含贷项不冒现金总额，旧cost/rate/dueAt不覆写。
6. 模型兼容缺casebook旧stub明确未知；无效读片不改base权限/原账，新增逐条动作不由显示reason当权限。Root接真实consumer时核显选金额/原payload/confirm取消/草稿/保存失败与原retry，不用helper行数或白名单存在冒完成。

实施边界仍以Root后续明确GO为准：模型与新application模块/必要测试可独立Owner；campaign/game-types接线Root独占。正式新source改变后须冻结新身份再跑适用检查/完整Create与独立公开账务，不能沿用旧126源“完全同”的话术。本设计不启动验证，不关U4-B/C-S4-R、P3正式62/22、真人/PNG/M01/T18或整体goal。
