# Root publication复用示例

`import {relaySupportSettlement,type RelaySupportSettlement} from './relay-support-settlement.ts'`

`const p={view:current,features:current.features as unknown as PlayFeatures,accountId:business.accountId};`
`const settlement=relaySupportSettlement(p,{kind:'period',runId:current.runId,accountId:business.accountId,businessId:business.id,stationId:station.id,periodId:period.id});`

status==='known'时，四金额为已核原事实，summary可直接作原支持真实回响；必须由Root原saved transition确认同period原support新结算或canonical赔付新形成才发布，普通查看/旧历史重进不重复。pending和unavailable的金额都是null；分别说明还在等待或原依据尚未核齐，不出版0/假成功。settledAt是原compensatedAt，sourceRefs保原period/job/op/debt/metric/cash/date/账户与客户原ID。

返回类型RelaySupportSettlement：status pending|known|unavailable；reason string|null；periodId/businessId/accountId/supportJobId/settledAt string|null；incomeFen/compensationCostFen/compensationPaidFen/compensationDueFen number|null；readonly summary/lines；readonly RelaySupportSettlementSourceRef[]，ref kind period|job|operation|obligation|transaction|metric，id/date/accountId/businessId及可选customerId/amountFen。

本作者未修改Rootscene-result/campaign或其它消费者。原支持动作1500费用仍在records原action行；helper新200赔付不重复算成1700赔付，不改真实业务总cost。已确认支持收入也不称本次到账，旧应收13.28不自动收。
