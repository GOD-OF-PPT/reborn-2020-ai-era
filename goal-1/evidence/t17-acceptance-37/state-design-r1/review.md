# U4-B完整状态与公开记录设计审

本片是唯一第8项，必须接回R2/R3剩余和C-S4-R，交“眼前原票→明确回应→原确认→真实等待/已保存变化→下一取舍”，不交十类记录目录当主线。先保原能力和事实，再做专用近景与物件；原账阅读模型本身没有完成游戏体验。当前只读设计，未修改WIP或产品、未执行任何测试/投影/浏览器。

## 1. 完整能力范围与实际来源

原33的权威盘点是root33/capability-map-r1.md：Panel31＋服务/复核共享编辑器2。该表明确三低层API不在旧33；本片最新授权把两个既有core首次接UI，应记“原33全部保＋2既有core新UI”，不倒改旧盘点或少保两项凑33。

| # | 原命令 | 完整保留的取舍/对象 |
| ---: | --- | --- |
|1|OpenRelayStation|个人显选capitalFen；5000是开站门槛而非全链预算|
|2|FundBusiness|businessId/amountFen；资本转移不作收入|
|3|StartRelayPreparation|materials/basics、资源、日期，两背景真实前提|
|4|ApplyRelaySupply|原business/supplier/resources/startAt，申请不保证批准|
|5|ReadRelaySupplyDecision|原applicationId；任务完成后亲读，未读不揭批准/有效期|
|6|StartRelayAdapter|已许可供应、原资源/日期；首批准基础适配不重收费|
|7|ActivateBusiness|原business，资本/技术/材料/许可/容量原门槛|
|8|StartRelayMarketing|三客群；paid资源日期与video_referral显选来源两分支|
|9|SetRelayOffer|low_margin/managed_support与显选单位价格，旧价不覆盖|
|10|SignRelayCustomers|business/audience/offer/逐位personIds/期限/mode/credit，签约不充值|
|11|RechargeRelayCustomer|同客户显选金额与月额度，现金和保护/负债同增，收入0|
|12|TopUpRelaySupplier|原business/supplier/金额，自有现金变供应资产|
|13|RefundRelaySupplier|原供应未用资产/贷项可退；原整笔入口保，部分显选沿同命令|
|14|StartRelayServicePeriod|原客户/供应顺序/资源/未来开工/容量/预算/四支持方式/合法deployment|
|15|StartRelayAudit|meterId或periodId二选一、资源、日期；仅已发生原记录|
|16|CorrectRelayPeriod|本期所有已完成且尚未更正记录，含零差额；原确认|
|17|CollectRelayDue|该客户所有已到期净未收，可能跨期；不改成只收本期/本单|
|18|RefundRelayBalance|客户/金额；保原全余额入口，部分退款同命令新显选，不清其它债|
|19|CloseRelayCustomer|原客户余额/应收/支持费/退款等结清门槛|
|20|RenewRelayCustomer|customer/termEnd/mode/credit，不能自动续约或抹旧条款|
|21|StartRelayRequote|business/显选客户/方案/价/effectiveAt/资源/日期；客户可拒绝|
|22|PauseBusiness|只停新客户合同，旧义务继续|
|23|ResumeBusiness|原重验恢复，不等于恢复已停流量|
|24|PauseRelayTraffic|停新请求，不清原客户余额/支持/费用|
|25|ResumeRelayTraffic|仅原批准与实际适配范围，不扩权|
|26|StopRelayPeriod|停本期请求，原支持/已耗成本/AP/旧账保留|
|27|StopRelayStation|停站收尾，原应收应付/资产/客户余额继续|
|28|CloseBusiness|原全部资产及义务结清门槛；关闭对象仍可回看|
|29|AcknowledgeRelayMarket|亲认公开变化，旧账原价不动，未来报价/例行重验|
|30|HireWorker|原business/assistant-zhou，招聘500/1点及按实际在岗工资|
|31|DismissWorker|原workerId/结算和确认；不加免费能力|
|32|InterruptJob|准备/申请/适配/营销/服务/支持/复核/重谈各原job，不能漏掉某类|
|33|AdvanceTime|原job日期/公开停点及原Clock/费用/硬屏障，不逐日制造操作|

新增UI N1：CorrectRelayUsage {auditId,correctUnits}，只绑定同meter唯一已完成、当日已公开审计及一致实计；不提供自由猜数。N2：CollectRelayReceivable {receivableId,amountFen}，原单已到期且0<显选整数金额≤amount-collected-reversed；原preview/confirm/save。两项是原core能力首次UI接线，不新增core API。ReportRelayUsage原apply是no-op，不能包装为手动生产用量或刷新真值。共用PayObligation/Finance及独立代理权限/风险处置继续可达，它们不是上述旧RelayPanel33集合，不因计数遗漏责任。

## 2. 必须成套表达的状态/责任

- 主体与入口：未选/明确失效重选、两企业/同账户/跨run、准备/经营/暂停新客/收尾/关闭，客户原来源和固定编号不按筛选重排；关闭不额外禁原允许更正或收旧账。
- 供应：申请待安排/进行/完成未读/亲读批准或拒绝/到期，首验证与后续适配分开；同故障域备援与独立供应，失许可/适配/额度/预算/真实资源不足均显示原原因。获客未完无名单，已完零潜客/未签/部分显选/已签均成立。
- 客户：预付/后付、信用上限/月单位上限/充值额度、原价与effectiveAt条款历史、续签/重谈安排/运行/接受/拒绝/未来生效/中断；客户付款、实际消费确认收入和应收分开。
- 同一期：planned/running/support/settling/closed/stopped及服务与支持两job的planned/running/completed/interrupted/cancelled分别表达。暂停流量/停本期/停站/停新客不是同一决定；部分服务仍有实际支持费/赔付/退款/供应账与旧成本。
- 计量：未服务或部分服务的真实reason、报告量/冻结收费价/供价版本/原terms/rate/billing/日期/deliveryIds/costOp/supplierDueAt。未复核实计未知，不能写0；复核安排/运行/中断/完成、同一job跨期完整batch/当前子集分开。
- 更正：零差额仍可留下已核原记录；正负客户/供应调整分别列，单条和整期scope明确；原量/价不覆盖。新应收/应付沿新开单日期/自己的dueAt。负向客户更正可能先冲未收、再现金退款/形成欠款；负向供应先冲未付，已付部分才回资产/贷项，不能都称已退款。
- 收退款：未到期/到期/部分已收/全部已收/部分冲回/净额0分别可读；部分实收只改变现金/应收，不重记收入。客户未消费退款按原充值批次引用、当次实付与尚欠退款、保护余额分别核；供应退资产不作收入，池跨期共享。
- 保护叠加：只读/保存中/未保存候选/冲突/重试/失效快照与业务非成功分开，旧物件在存储失败保留，业务已保存失败须真实呈现。0AP/缺钱保原有限停止与Clock，不免费完成支持/复核。

原R2补回的准备/供应资产/后付等分支及R3逐客户/单计量/跨期batch/支持中断/逐票结果/退款与退出必须逐条有consumer和证据；C-S4-R核完整服务小循环与受挫退出、原子保存、完整Create、实图及受影响累计，不用U4-A首次循环或原33名字集合代替。

## 3. 未接线WIP的具体问题

WIP身份21252B/SHA1759394109642a25423ee7e4ec16f7bb3ccd9f08654ed67ab8a104cfd83a6ca2。以下均是模型/设计缺口，未声称它已造成上线事故。

1. **供应池术语不准确（143行）。** credit.paidFen写“累计入池”易等同累计现金充值；原reverse_supplier_usage会将已付后贷项也加paidFen。应标原池记账累计（含贷项），实际现金另用原交易，remaining/outstanding仍标“本站共用”，不能当本期净额。
2. **单条回应无类型身份（10—19、98—118行）。** row只carry customerId/supplierId和大scope target；应收没有原单target，meter行没有auditId/公开correctUnits元数据，116行还写“这里不选择部分金额”。须给recordId/receivableId/auditId/meterId等显式只读身份，Root按此做原金额/确认，不能解析key或长文ID。
3. **只核入口不等于核所有派生事实（30—48、84—95行）。** business/period入口不自动验证每个audit/batch/correction/finance来源；safeTarget失败只是删链接，仍可能打印不一致记录。必须先校验相关原ID唯一性/同业务/父子/完整batch，再生成行；重复或歧义明确reason，不静默find首个。主目标resolver已经严核，不能用它替全部派生引用证明。
4. **叶对象与本站旁账分层不够（34—43、121—164行）。** meter目标只缩meters，customerIds仍是整期，退款列出同期间所有客户再标station；job叶目标不加period来源，可能少见source=period.id支持费。保明确对象行与标注本站旁账的独立组，不能用空列表断言无责任；客户编号沿原business顺序。
5. **合法对象可空白（32行及后续）。** application直接reason=null/rows=[]，未签audience也无自身来源/job，customer无原合同/条款/上限/余额头。原33能力虽还在Panel，此模型不能冒完整通用Reader；须同对象明确委派原申请/客群/客户近景，或补typed上下文。客户信息不要混成service记录。
6. **更正与新单关联没讲完整（98—118行）。** 正更正新invoice.sourceId是meter.id，invoice.operationId才在correction.operationIds；应显式原meter→audit→correction→新单，严格校验一致，直接读新date/dueAt。不能按旧计量日期推新账期或拿总调整额当已收钱。
7. **退款仍缺已公开支付和欠款去处（121—132行）。** 同命令原operationIds对应的现有现金交易可精确列，originOperationId对应未结退款可列；不能只有“原退款已记录”。稍后独立支付的来源缺口见下一节，不按客户总负现金猜。
8. **原任务/支持事实不足（50—75、86—95行）。** 目前列job身份/资源/日期/status，没有原工作标准AP/费用、已记成本/现金/未付和部分支持实际收入引用。可用finance.metrics原sourceEventId/operationId列已记成本/收入及period支持费；新决定费用/AP仍原preview。不能把静态标准价当已支付或把observedDays当实际服务天数。
9. **默认呈现仍像技术记录目录。** CollectRelayDue英文、raw planned/prepaid等、反复“公开/隐藏真值/没有读取”等实现术语不应进玩家主流程；保读者可理解的中文状态，原ID/引用留依据层。kinds优先排序适合作为资料排序，不能变十类主菜单。字符串localeCompare不应承担跨环境稳定排序合同，采用固定kind序、ISO日期/明确null策略、原ID的简单确定比较。

当前WIP对真实有效投影没有发现主动揭未审计实计：meter.auditedUnits来自原projection，batch又核completedAt≤today；报价response未完成仍不展示；未读批准经knownRelayState屏蔽。这些保护必须保留并补重复/错链反例，不自行读取raw隐藏值。

## 4. 最小公开接缝与Owner分离

模型Owner仅relay-records.ts及必要纯模型测试：输入仍只view/features/accountId与明确target，纯读取、稳定排序/归属/安全身份，不preview/发命令/推未来/解析ledger receipt signatures。保现有export，类型元数据至少明确原recordId；单票、审计、客户、供应和原账期的可回应身份由类型表示。Root负责Reader/Editor/主念头物件共享binding、显选金额/条款、原preview/confirm/cancel/save/retry和分页草稿；最终consumer测试证明同一操作，不把行数当完成。

当前projection有硬界限：projectRelay未输出recharges/collections/renewals（客户terms只覆盖部分合同史）；workbench交易丢referenceId，且obligations只保remaining>0。原refund的充值ID/操作ID可读，但无法逐批读已用/已退/后续付款；后续PayObligation现金通过referenceId指向原payable而当前投影丢此边。job投影也无原ActionRecord的实际spent/reserved状态。若本片要精确交付这些逐笔细节，需要Root先确认最小纯读取projection合同：原recharge/collection/renewal公开摘要、原交易referenceId/必要已结义务摘要、原job.actionId对应的已提交action状态/金额/AP。只加已发生玩家本人物件事实，不加未来/审批真值/新命令/schema；P3/core受控归属要另明确。未获授权前不改这些源，不以猜测或“未知”冒逐笔全量已完成。供应更正精确冲应付/恢复资产/抵账拆分若无已公开引用，保原调整与本站池余额并明确未有拆分，不能造出资金去向。

现有finance.metrics保sourceEventId/operationId，可按period精确看支持收入、按原action/job来源看已记成本；它不是季度finance.incomeFen。当前季度口径与同业务累计metrics须分列，cash交易仅当现金，不靠正负猜收入。

## 5. 最有意义的验证组合（本轮未执行）

| 组合 | 必须同时证明的结果 |
| --- | --- |
|同business两期＋同客户跨期原单|新单/旧单原价与dueAt；单票显选一部分后净未收正确，CollectDue仍全客户全部到期；收入/AP/个人不变，未来单不能收|
|单meter＋跨期完整audit batch|对象filter不漏完整batch来源/计数；未完/中断实计未知；完成才显，已知零差额也成立，重复audit/meter/period/错业务不选首个|
|正负更正与供应预付/后付|正更正新date+原dueAt；负更正先冲未收/再已付退款，供应先冲欠款/再贷项；prepaid供应正更正仍可能生新应付，不用原billing猜|
|多充值批次部分退款＋资金不足后补付|原批次ID/退款总额/当次现金/未结义务/保护释放/后续付款分别核，缺公开引用不得偷用总现金或signature|
|服务部分执行＋支持中断＋有限停止|已耗成本/AP不退；周期支持费按原实际记录，停止无责任中性/有责任纸签，原支持/赔付/退款/供应旧债继续|
|未知/失效/重复与两主体|未读审批、未完成重谈/复核无真值；跨run/account/station/period/meter/audit/customer严格拒绝；同账户双business不串，原编号不重排|
|同对象金额/资源草稿与保存|取消/翻页/原册/物件保稿，切对象隔离；余额变化重新核对不替填；candidate/conflict/readonly不写，真实head.put后abort物理旧/原retry新/重进逐字同|
|当前整幕与累计|一条真实服务回应到实际结果/下一生活去向；物件与主操作同binding、全部责任/Clock同幅；受影响原33＋2分支和C-S4-R实际累计，兼容/几何0|

纯模型先用已公开投影形状的有意义反例，再实际consumer核原payload/确认/保存；正常原文完整Create及独立账务只在Root冻结源和输入后执行，原前史/导入/重复/候选不算新成果。真人0/原PNG0/3、P3正式62/22、M01暂停、U5以后和完整goal保持。
