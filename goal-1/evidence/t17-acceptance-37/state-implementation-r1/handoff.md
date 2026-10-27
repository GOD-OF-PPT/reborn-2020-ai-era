# 模型实施交回：源码冻结，待Root统一验证

仅修改4份独占文件：新增application/relay-casebook-projection.ts及其test，修改ui/relay-records.ts并新增test。原P326元数据末读26/26保持，core/campaign/game-types/Root consumer/三master/旧root35/36未由本作者修改。准确bytes/SHA见source-freeze.json。

公开类型RelayCasebookHistory与enrichRelayCasebook(run,relay)已写。原null仍null，原relay字段原样保留；casebook为ready或unavailable/中文reason，携runId/revision/asOf。新视图包含recharges/collections/renewals、历史含已结及未来到期义务、现金原referenceId与单腿金额/原序、同job.actionId原ActionRecord及资源、白名单实际财务operation安全摘要。签名仅此application层解析，核原id/kind/account/contract、主体/引用/类型/日期；失配整片空历史且unavailable，不出版signature/raw/fact/未审真值/world/queue/RNG。没有调用preview/evaluate/applyLedger/advance或规则重放。

transactions.order是原现金交易数组序、lineIndex是原账户腿；operations.order是原ledger receipt数组序，两种order不可直接互比，应先按原id对应。pay_obligation保原businessId可空，scopeBusinessId沿唯一本义务归属。receipt.status是原操作结果，不是当前是否仍欠；当前义务看remainingFen。已创建未来due、已承诺支持future日程保持，非null实际执行/完成日期不晚于today。

记录模型增加recordId和原period/job/meter/audit/receivable/obligation/refund/correction/quote/customer/supplier等元数据；audit.recordId=jobId完整batch，supplier.recordId=supplierId而key含business，correctUnits合法0保留（consumer勿用truthy）。单票target失效整组拒绝，不只删链接后印错事实。新增准备/申请/适配/需求/客户/充值/实收/续签记录，原18种票类只作为资料分类，Root主层仍是一张票/一个回应。

每行summary首层列关键钱/日期/AP/责任且不含长原ID/API术语，lines保完整引用。客户模式/原保护/应收、job预留或已执行/成本、meter未知或已核、invoice金额/已收/冲回/净未收/due、correction两边调整与新单、refund精确现金和尚欠、supplier本站资产/贷项/未付、obligation原额/剩余/保护分别表达。当前客户合同不把旧充值抹去，原池paidFen含已付后贷项、不作累计现金充值。原batch跨期完整计数与子集、本站共用资产/退款/义务归属明确；单job/meter仍可见本站相关退款责任。

退款以原refund.operationIds→原obligation.originOperationId→原现金referenceId及后续pay_obligation核，不按客户总负现金猜；paid+remaining须等登记额。正更正新invoice用operationId关联correction并保meter source，date/dueAt从新单读。新API动作仍归Root：原CollectDue按客户全部到期；单单部分金额与逐条Correct是原core首次UI接线，原33全部保留。

已编写18个有意义case（application10/model8），**本作者没有运行**。含真实已审normal87的收据/未到期720分/历史投入，隐藏getter禁止读、duplicate/错账户/额外签名字段failclosed，实际F04原命令审计/负更正及退款/贷项引用；模型含真实87未知meter、失效/重复/伪实计、旧stub未知、稳定排序、readonly/candidate旧态、明确public fixture跨期batch与100元退款60+后付40的精确ref。F04和public-view fixture不冒本轮正常Create或Native，原raw不改。

Root统一核类型/必要tests/build及真实consumer；作者没有独立跑任何test/type/build/browser/Git/codec或projection。原C-S4-R、实际逐票新命令/资金/只读原retry/物理旧新/完整Create、艺术和主线均尚待，U4-B不勾完成。若发现确定问题请按同所有权发修复，不在活源改动时跑重检查。
