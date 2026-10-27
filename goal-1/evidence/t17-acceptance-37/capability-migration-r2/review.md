# 原33能力与完整字段迁移核定 R2

本次是U4-B内部一次有界静态阅读，不是第9项任务或实机验收。原authority是root33/capability-map-r1.md（原f9前像33种正式UI命令及对象字段）；本片基线为8545eece，通过只读git cat-file读取。27份当前consumer/模型/接线首末身份见scope.json；审查期间变化0份。19份在8545已存在，8份是本片新路径；其中7份原现逐字相同，其余逐项追实际JSX、载荷构造及实例，而非仅查命令名字。

没有改源码、旧R1审查/前像、master/P3或Git索引；没有运行测试/type/build/Browser/HTTP/投影或游戏命令。Root告知的6新文件66/66实际结果保留其root37/u4b-new-cases-r7身份，本文不把它换算为33种动作均已实机操作。

## 一、逐项原33映射

表内“保留”只指当前源码有具对象/字段的消费链。共同下游为CommandButton→journeyIntent→makeSharedAction当前snapshot/只读/候选/冲突/保存保护→App.request的prepare/preview→原confirm modal→同CommandEnvelope.submit；其结果只在完整saved后进入onSubmission/committedEcho/savedSceneResult。原免确认读信或低成本调用没有被本文冒称全部新加强制确认；有费用/AP或显式confirm仍走原确认。

|#|原命令与全部原载荷|当前实际对象/入口|迁移核定|
|---:|---|---|---|
|1|OpenRelayStation: capitalFen|SceneChoice open/原Panel无站入口→PreparationEditor open→preparation-draft|仅明确personal且target=null；资本初值空，parse整数分，原confirm；不拿开站当营业。|
|2|FundBusiness: businessId,amountFen|原BusinessLedger公司分支→PreparationEditor capital|保b.company条件和原企业ID；自有转资不记收入；原confirm。|
|3|StartRelayPreparation: businessId,preparation,resources[],startAt|原技术/材料Editor basics/materials；每条preparations原article+RelayJob|两preparation种类和实际资源日期齐；每实例仍有日期/等待/InterruptJob，未缩成单一代表任务。|
|4|ApplyRelaySupply: businessId,supplierId,resources[],startAt|Editor application；每家supplier下所有原application|显选供应/资源/日期，原applicationId稳定；未读不露批准，确认和原投入保。|
|5|ReadRelaySupplyDecision: applicationId|每原application article、SceneProgress同原已完成回信→ThreadAction/CommandButton|仍用该份applicationId；免费亲读语义保，读后原批准/拒绝与expiresAt分别刊出。|
|6|StartRelayAdapter: businessId,supplierId,resources[],startAt|Editor adapter；每原adapter的RelayJob|全部字段及原独立适配保；首批准附带基础验证不伪装成再次付费。|
|7|ActivateBusiness: businessId|BusinessLedger preparing分支；JourneyAction同站原启用command|原准备/资金/许可等由preview核；不自动获客或开服务。|
|8|StartRelayMarketing: businessId,segment,mode；paid时resources[],startAt；video_referral时videoCohortIds[]|Editor marketing两原模式/三客群；RelayIntake逐audience article+RelayJob|保真实视频id/date/segment/members显选与paid资源日期；未完成没有名单；每获客任务等待/中断仍在。|
|9|SetRelayOffer: businessId,offerKind,unitPriceFen|Editor offer→两catalog方案/单位价|原方案、价格和已保存offer供后续签约；不重写旧约，原confirm保。|
|10|SignRelayCustomers: businessId,audienceId,offerId,personIds[],termEnd,mode,creditLimitFen|Editor customers三步：原名单/原报价→逐身份→原收款条件期限|全部字段齐；预付信用0，后付必须显填且可0；原count曾为UI截取值而非载荷，现逐位显选不删身份。|
|11|RechargeRelayCustomer: customerId,amountFen|Editor customer-funds；Book客户其它决定也到同Editor|客户身份、金额、月充值额度说明、等额保护齐；不自动替换客户，不记服务收入。|
|12|TopUpRelaySupplier: businessId,supplierId,amountFen|Editor supplier-funds；Book原供应可另核该准备|原资产池/供应/主体齐，自有钱转供应资产；预算/保护/成本分开。|
|13|RefundRelaySupplier: businessId,supplierId,amountFen=原remainingFen|原每家SupplierFunds全额按钮仍在；Book另接显选部分Response supplier-refund|原全余额/贷项取回没有删；新增部分不是缩成仅部分。确认列全站跨期池/未付，保存后精确原op/cash才回响。|
|14|StartRelayServicePeriod: businessId,customerIds[],supplierIds[],resources[],startAt,maxUnits,maxSupplierCostFen,supportMode,deploymentId|同一RelayServiceChoice原册/SceneChoice；business target才另拟新期|ServiceChoice及scene-draft与8545逐字同；四支持、原deployment、供应顺序/备选、明确零预算齐；原服务/支持两任务一起预留。|
|15|StartRelayAudit: meterId或periodId二选一,resources[],startAt|原期/原meter→RelayAuditEditor；Book未知meter同Editor|构造保二分支；原已委托planned/running走同batch等待，cancelled/interrupted不阻原新显委托，未核仍未知。完整batch/当前子集分清。|
|16|CorrectRelayPeriod: periodId|每期PeriodCard原按钮；原场景整期差额command仍在|原整期更正与confirm保；N1单票新增未替掉它，不以closed/settled blanket禁原允许动作。|
|17|CollectRelayDue: customerId|每原客户RelayCustomer原按钮；SceneProgress/ThreadAction；Book客户原约|仍该客户全部到期原单，可跨期；确认明确范围和未来未到期，未缩为当前单/N2。|
|18|RefundRelayBalance: customerId,amountFen=原prepaidFen|原每客户全部未消费余额按钮仍在；Book另接显选部分Response|原全额条件/确认保；退款登记/原现金/尚欠/原保护分别解释，非新消费或利润。|
|19|CloseRelayCustomer: customerId|每原客户关闭按钮；Book客户其它决定|原结清门槛由preview，未加按当前展示阶段的绝对禁止；已关闭客户仍可原记录选择。|
|20|RenewRelayCustomer: customerId,termEnd,mode,creditLimitFen|原客户details改共享Response renew；Book同一customer subject|字段全部保；原默认日期/模式/信用改空值显选，零信用可明确填；原客户/新期/新mode/credit确认和旧预款保护可见。共享草稿详下。|
|21|StartRelayRequote: businessId,customerIds[],offerKind,unitPriceFen,effectiveAt,resources[],startAt|原RequoteForm改共享Response requote；Book客户可显选回同business|原全部字段/原quotes逐任务记录保；原单资源现resources多选仍原payload数组，不漏旧选择能力。生效/工期最终原preview核，旧客户失效保值须显删，不过滤少谈。|
|22|PauseBusiness: businessId|原BusinessLedger operating分支；SceneChoice more同站|暂停新合同，与暂停请求/停站区别保；不抹旧履约。|
|23|ResumeBusiness: businessId|原BusinessLedger paused分支|原重验条件/原主体未删，不合并为ResumeRelayTraffic。|
|24|PauseRelayTraffic: businessId|原BusinessLedger trafficPaused=false分支|仅停止新请求；原支持/费用/余额继续。|
|25|ResumeRelayTraffic: businessId|原BusinessLedger trafficPaused=true分支|同站、原批准范围与preview保，不新扩权。|
|26|StopRelayPeriod: periodId|每原PeriodCard；Book服务票停止旁路|只停本期请求；原支持独立，取消/中断/原Cost/AP/退款欠款按原记录核。|
|27|StopRelayStation: businessId|原Ledger非winding_down分支；SceneChoice more|原停站收尾payload/confirm保；与停流/停期/关企业分开。|
|28|CloseBusiness: businessId|原Ledger winding_down分支|旧债/资产结清原门槛保，不以停止态冒关闭。已关闭企业历史另有Archive。|
|29|AcknowledgeRelayMarket: businessId|原changes未确认提示逐条date/anchorId后原按钮|公开变化、旧价/未来新约/权限重核均保；指定period的主关注不被普通通知替换。|
|30|HireWorker: businessId,definitionId=assistant-zhou|技术材料details内原招聘CommandButton|原500元/1点及月工资说明保，原对象/原confirm费用链；不是免费产能。|
|31|DismissWorker: workerId|同details枚举原operations.workers.filter(to=null)逐位|原在岗枚举范围/workerId及结算确认未缩；未只证明有该名字。|
|32|InterruptJob: jobId|每prep/application/adapter/audience/service/support/audit/requote的原RelayJob；Book原job/已委托meter同任务|原实例均各送自己的job.id；planned/running才给停，原共同preview/confirm保。支持任务不与服务任务混成同一次停。|
|33|AdvanceTime: date=所选原job.completeAt；主场景另原Clock停点|上述每种实例RelayJob；ThreadAction/Book ClockAdvance同原任务start/complete或原款dueAt|原显式任务等待未删；新增makeSharedAction只补旧snapshot保护。原Clock费用/交付/季度/有限尾声核对沿原链，不因票据看似完成跳过屏障。|

没有新增ReportRelayUsage。原33是正式UI能力集合，不能拿本表宣称core只有33个命令或已全验。

## 二、原33以外单列

|标识|原core能力与字段|实际consumer→确认→保存回响|
|---|---|---|
|N1|CorrectRelayUsage: auditId,correctUnits|Book/SceneProgress/ThreadAction调relayTicketCorrection；唯一同原meter的已完成batch与公开audit.actualUnits/meter.auditedUnits相同才构造。零差额原核对可在明确includeUnchanged路径保；不造报告/实计。RelayResponseCommandDetails逐票列原报告、已核、原价与原审计引用；relayResponseSceneResult核同run相邻revision+canonical correction，原票/原价保持再回响，整期更正独立。|
|N2|CollectRelayReceivable: receivableId,amountFen|Book应收票默认显选Response collect；精确原来源/客户/期和dueAt，金额初值空，可显填净未收。ResponseCommandDetails列gross/collected/reversed/net/dueAt和本次范围；result沿canonical collection/op/同账户cash确认只收本单，无二次收入。|
|Shared Pay|PayObligation: accountId,obligationId,amountFen|Book原未结义务默认/显选Response pay；沿同账户、同business或明确公司/历史归属，保null business原事实；未来到期不额外禁止原允许付款。confirm原欠款/原金额/本次/余款，result核operatingId(commandId,PayObligation)、原obligation/referenceId现金，旧债付款不重复成本。原Finance/Obligations入口未由本片替换。|

N1/N2是原core首次正式接UI，本片不更改它们的规则/schema；Shared Pay本来就是跨路线共有命令，不倒改原33盘点。上述是静态链存在，不是已经执行这些动作。

## 三、完整原对象字段和原账去处

|原对象族|保留/新增可读路径与字段|
|---|---|
|企业/资金|原BusinessLedger保company/lifecycle、cash/available/held/prepaidLiability/receivable/supplierPrepaid/payable、收入/含应计成本/利润、保护/承诺缺口；Book/纸件并列本站责任，未归本期的原款不假归。原完整财务入口仍在HUD/原册。|
|技术/材料/申请/适配|Panel每实例kind/job/status/start/complete/原等待中断，申请id/已读批准拒绝/许可期限；Book再补原action定义的cost/AP/reservation/planned/executed/finished及资源、原job/action/输出引用。未读审批没有secret。R1取消摘要问题在当前records:158后已显分未开工取消，不再落“已执行”。|
|供应/许可/资产|Panel每家label/failureDomain/billing/currentRate/creditLimit/permitted/adapted/remaining/outstanding及原申请/adapter；Book原pool/account/business/counterparty、报价版本/生效锚点、原consume/incur/reverse/settle/refund和后付pay原序/精确现金引用。贷项抵账明确非现金；paidFen未当累计现金充值。|
|获客/报价/客户|Panel原audience article anchor、mode/segment/created/completed/actual members/原job；Editor三客群paid/referral两模式和原video来源；原offers价/支持基准显选。Book补sourceCohortIds/personIds/conversion/最初与当前mode/credit/term、所有terms版本/来源/生效日、余额/原应收/到期款/已确认收入/充值上限。|
|续签/未来重谈|原RelayCustomer续签details与RequoteForm入口未丢，分别共享同subject Editor；原quotes每份job等待/中断/effective/price/实际接受拒绝数仍在；Book完整customerIds/方案/服务基准/资源/任务/响应在原日期完成才披露，旧约不追改。|
|服务/支持|原期status/from/to/客户/供应先后/capacity/maxSupplierBudget、observedDays/reportedUnits/failedDays、两原job与StopPeriod保；Book完整feeQuotes原termsId、feePosted/compensated/stoppedAt、支持已确认收入原metric和观测/故障域/原因。原cost/AP/预留不是现行RELAY_JOBS推算实际历史。|
|计量/复核/更正|Panel原meter date/report/audited未知/price/rate/reason/correction、原后50/全部及指定meter定位保；Book补冻结unitCost/supplierBilling/dueAt/terms/delivery/costOp，完整auditIds/meterIds/periodIds与全部batch count，已完成后才公开实计；更正原报告/实际/客户供方delta/原opIDs/新单自己的dueAt保。|
|实收/退款/原义务|原客户全到期与全部退款保，Book逐单/逐批新增不替它们；原gross/已收/冲回/net/due、充值used/refunded、退款当次cash/后付/remaining/protection、全部历史已结/未来due债务及原账户/合同/来源/op/ref可读。缺casebook明确未知，不把缺明细当0/已清。|
|历史/市场/风险|已闭企业Archive、原已结期折页、已知差额升回currentPeriods仍在；markets date/anchor/ack原入口保；原代理支持四模式只选已有active授权，Story权限/独立风险仍用原导航/原约束，不通过服务确认扩权。|

原Panel没有专门prep/adapter typed child target的既有边界继续保；本片Book用原typed recordId和可核job建立阅读位置。原完整证据row.lines保在可显展开的details里，SceneChoice近景→relay-casebook原key→App.recordId→Panel原Book(original)到同一票；原册展开当前票证据而非再打开同一近景。本文仅核DOM/handler路径，不据此断言任何一页都已实际同屏可见/可点。

## 四、跨册草稿、取消、原stage和保存保护

- App按runId分别useMemo创建service/preparation/response/reading memory并传同props，近景与原册复用同一service/preparation/response组件。response canonical key是run/account/business/station/mode/subjectKind/subjectId，不含revision、date或展示页，所以同客户续签/同business重谈从近景到原册再合上/取消确认都不因换页清稿。回应金额与续签/重谈字段保持空初值，填全额只改本次填写，不提交。
- 续签和重谈不再是原局部form的失联state；所有旧字段仍受控，新期限/模式/零信用显选。重谈遇失效customer/resource不静默filter后提交，有明确移除按钮；日期过期保原值且必须重选。跨run/账户/主体/记录不共用错误草稿。新一期service draft仅同站新period真正保存后generation变化分离；候选/取消/普通等待不清原稿。
- CommandButton当前snapshot identity、readOnly/unsaved/conflict/busy和再次preview拦旧handler；App确认保存时仍提交原command，返回调整只关modal，原memory没有erase。App异步onSubmission先核run和同workspace/screen/epoch，再跟实际saved新对象；原失败候选保旧场景，retry保原candidate，保存后才有回响。只读可读但命令不可写。
- 场景原stage继续区分planned/running/support/audit-waiting/audit-ready/correction/collection/settling/period-closed及暂停停站；未到期票按原dueAt等待，关闭/结清不 blanket 禁新复核或已知更正。独立支持与已停请求并存，待收款仍显且可先续原服务/支持/复核公开反馈，原硬屏障照旧。R2纸件已随唯一原active audit显planned/running，原meter关注不被换成batch；歧义显示未知理由。
- 原ClockAdvance保费用review、同原AdvanceTime和finite-tail转换；relayReviewDate只就已公开原款due日期/既有教学保守停点核，relayDeferredFeedback只给同对象原任务公开start/complete，不读未来队列或新造每日点击。它没有替core分类任意未来事件。
- 实收、客户退款、供应资产退回和Shared Pay新回响均核同run相邻saved revision及原canonical op/source/reference现金，不以总余额正数或kind猜成功。失败/未保存没有新钱；已保存经营失败也没有被藏成未提交。

## 五、结论和未验责任

本次未发现相对原33及8545基线确定的新命令删除、载荷字段丢失或具体原job等待/中断实例遗漏；无需为凑33恢复旧class/form。原准备/服务共享组件及原CommandButton在本片基线到当前字节相同是佐证；新Response/Book/Confirm/Result实际消费链及原Panel保留路径是主要依据。R1跨Owner报告两P2在当前records呈现层已见定向修正，旧红/旧review仍保当时身份，本文不倒改其结论。

仍不能以本文或unit66声称：33动作全分支实机通过、C-S4-R/R2/R3完成、完整Create原文/账务审核通过、自然Chrome所有页可点、同幅长回响/完整责任/Clock已美术通过、真人理解/趣味或原PNG恢复通过。Root必须按原33＋N1/N2＋Shared Pay保实际路径、原确认取消草稿/只读/候选abort/retry/重进、预付后付/部分收退/正负更正/供应贷项及停止责任的原门槛逐项补证。本次不新增ReportUsage、不预勾U4-B/goal、不启动U5或兼容开发/测试。
