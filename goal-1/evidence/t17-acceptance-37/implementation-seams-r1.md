# U4-B实施接缝与设计准入

当前仅第8项U4-B；三文件/基线及art-design-r1完整逐幕稿先于产品修改。Root已全读该稿及原33具体载荷，状态代理已全读原规则与goal三master。原33不含CorrectRelayUsage/CollectRelayReceivable，本片保原33＋首次接这2个既有核心API，不新增ReportRelayUsage伪操作。

## 必要的最小只读公开接缝

现有projectRelay缺已提交recharges/collections/renewals；workbench现金缺referenceId、义务仅剩未结，job也缺实际ActionRecord。只用当前字段无法逐笔证明退款后付款、分次实收或供应贷项抵账，paidFen更不是累计现金充值。不能靠总余额猜、读隐藏真值或把缺口永久改称完成。

新增src/application/relay-casebook-projection.ts：enrichRelayCasebook(run,原relay)只追加casebook，null仍null。Root仅在campaign.ts原projectRelay产物后接此适配，UI PlayFeatures.relay采用原RelayProjection＋可选casebook读型。原projectRelay/core/P326、schema/命令/RNG/经济日期与保存格式不变；正常Session仍只发布实际已提交view。新字段不写入存档，不改变原Create重放命令或收益。

casebook含：已存在原充值（amount/used/refunded/op）、实收（invoice/amount/date/op）、续签；同主体历史及未结义务（含origin/protection）；现金原referenceId/source/business/contract/account单腿金额/顺序；同原job.actionId的ActionRecord安全摘要（原定义成本/AP/占款/资源日期、status/plannedAt/executedAt/finishedAt）；实际财务操作安全摘要。

操作摘要在该application投影内读取已验证LedgerReceipt.signature，严格白名单解析/类型和身份核验，只输出id/kind/status/order/date/amount/account/business/contract/source/reference/prepayment/obligation等必要原事实，绝不传signature/raw对象到UI。只允许实际中转财务（供应预付/消耗/应付/更正/退回/贷项抵账，客户预款/交付/应收/收款/退款，原费用/付款/预留）及其唯一原关联，不读许可factId/未审actualUnits/隐藏需求/世界队列/随机。不能eval或执行数据；不重放ledger或推演未来。

发生日/已存在身份须不晚于today；已创建的义务date是未来dueAt，原动作start/complete、报价effective和到期日是已承诺信息，可以未来，不能过滤掉。来源重复/不匹配/不支持则该历史读片明确不可核，保完整旧原账，不回落另主体或拿半套数字当完整。缺casebook的旧测试stub保明确未知；新正常provider必须实际供给和验收。当前供应池是跨期资产，精确原序/操作及本次保存前后变化分别呈现，不把全池余额分摊成单期利润。

## 记录与表单接口

relayRecordRows仍纯公开阅读，不预览/不命令。行key保持kind+原ID完整身份，新增recordId以及适用periodId/jobId/meterId/auditId/receivableId/obligationId/refundId/correctionId/quoteId/customerId/supplierId元数据；行的失效target必须整体拒绝，不能只删导航却继续印错事实。原customer/条款/已知许可/充值实收续签/原支持投入等缺项补齐；可扩kind但不把种类目录当主线。导出relayRecordKindLabel用于中文票种。原应用/客户/单meter/job/batch/纯period/本站都应有明确原记录终点。

新relay-response-draft.ts / RelayResponseEditor.tsx的mode为collect/customer-refund/supplier-refund/renew/requote，subject为receivable/customer/supplier/business＋原ID。读取原target重新核唯一归属，草稿canonical key含run/account/business/station/mode/原subjectID（不含revision/date），取消/翻页/原册与近景保稿；跨对象不复活别稿，失效不过滤后偷提交。初值全空；填全部只由显选按钮赋当前值。

collect精确receivableId+amountFen，退款精确customer或business/supplier+amountFen；renew完整termEnd/mode/credit，requote完整customers/offerKind/unitPrice/effective/resources/startAt。全部CommandButton与原preview/独立confirm/Session，金额只parse整数分，不能用类型或展示理由替代最终原检查。Root在App/game-types接每人生独立relayResponseDraftMemory，其余原草稿不改。

## Consumer与美术

Root负责RelayRecordBook新组件及SceneChoice/Thread/Panel/App/确认/实际回响接线。当前单票/客户/原job直接到该票决定；完整资料依同视口分页按需读，指定recordKey失效不自动取首行。原册保原33/高级全部字段，每个完整入口传原身份并实际定位，不只AX有按钮。物件与主念头共享同一原binding；逐票已知更正用已完成audit的公开实计，整期更正另确认；原单部分收与整客户全到期分开。

art代理仅RelayServicePaper.tsx/relay-service-paper.css/relay-continuity.ts及其必要物件test；模型代理仅新application投影/测试、relay-records.ts/测试；表单代理仅新response模块/Editor及必要测试；Root独占其余接线，互不覆盖。先各自静态review后冻结，Root统一运行必要工程检查，不在活源变更时跑。

美术具体要求沿art-design-r1：预付/后付与旧保护并存、单票/batch、未核/已核/差额/追加、部分收款与余联、客户退款/供应退回、支持中断和有责/无责停止。责任须并列而非三选一；同次未收起回响/全部责任/Clock/阅读入口一起核。复用kit/SVG/DOM，无必须位图缺口不生成图片；无新音效或依赖。

[杠精审查] 设计准入通过：这是补真实逐票动作与完整经历，不是十类软件目录；原33及新增2分别留责，必要公开引用缺口已指定生产者/consumer/验证，不以静态图或单测代Chrome及原文/真人。尚未实施/验证/勾U4-B；C-S4-R累计与原R2/R3映射必须逐项交回，所有compat0/原目标责任继续。

## 原财务前史的显式许可与复核

Root已完整读取state-design-r1的casebook-contract/review与art-design-r1；上述接口采纳其future义务/已承诺动作、原行ledgerOrder+lineIndex、保原business空值并另列scope归属等约束。另允许仅属于本中转站、原引用所需的owner_transfer/open_business_account/borrow_cash安全摘要，以保资本与旧借款前史；不纳入股票/股权/任意其它路线。没有signature/raw传UI、不执行业务规则。新casebook投影与2个新UI原API均须实际producer→consumer→Native验证；P3/core原文件全字节不改。

## 逐笔原义务支付的同一编辑器接线

原共有PayObligation本就接受accountId/obligationId/amountFen并支持部分支付（不在旧RelayPanel33之内）。为让退款后欠款或供应欠款直达同一原单，而不是回财务目录再找，response额外增加mode pay、subject obligation，仍显选空金额、同canonical原义务草稿及原preview/confirm。保原财务Obligations全部能力；不重认费用、不自动付款，也不新加core API。当前剩余义务可用原workbench精确条目核，已结历史由casebook只读核，未来到期不凭UI增设原规则之外的禁令。
