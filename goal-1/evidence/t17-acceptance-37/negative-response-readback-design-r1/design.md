# 已保存负向更正：读者后果需要完整说明

存在一组确定P2经营后果表达缺口，原账正确：Root原结果消费者CorrectRelayUsage在金融casebook核定分支前只return客户收入/供应成本调整泛句；原模型correction summary与专用paper同样只列调整、不是实收，未把本次实际退现金与恢复供应资产常显。实际a11默认AX49—51已见报告1112→1011、收入-6.06/成本-2.02、义务尚欠0；没有实际退6.06或供应资产2.02。Reader首层确实render所有summary，原依据在collapsed details，因此不能称原账可展开已经替代这项说明。供应另票虽能看全站2.02，不等于眼前更正讲清钱去了哪里。

## 本次固定事实与身份

旧101：2744389B/f4198064bd757791d1fd73ef825db2e21f034e42959f5cabddbe02bd72cdfedc；未保存candidate102：2751861B/abe77f4e93e712ed697ddfc0071e25c0b12700e1d1cd9270d49d0561ec5562cc。两者同原run，但不同于旧root27整期102。新correction rly:1ef46bc560fb5f7f3f1071cdc1b3bd88，meter74f69e/audit6ac832、Mar7已核1011/原报告1112/原价6/供率2，customerDelta=-606、supplierDelta=-202。事实详见facts.json，未读meter.actualUnits/seed/queue。

原refund_delivered b089d8… settlement=cash、amount606、ref原delivery1ab1ca…、source=meter74f69e/原客户2，原refundDebt89ff55…remaining0；同id现金的reference是该债ID、samebusiness/account/contract/date/source，实际现金-606。原预款负债/保护717578分前后未变、可花2895554→2894948；这是退已消费多计部分的现金，不是把钱加回充值信用，不是新增收款。reverse_supplier_usage ef3280…ref原costdf85…；原Feb14供应应付2224已经真实现金付清/剩0，新pool aef4…从不存在到paidFen/remaining202，reverse没有现金行。因此供应2.02是未用贷项资产，收入不是资金到账、负成本也不是退回现金。

Root补充a10 retry saved102与p05 freshphysical new102，现已只读核两份bytes/SHA都逐字等candidate；saved-and-physical-aliases.json分列角色。此补证证明文件别名关系，不由本审独立重现head.put/abort/原retry或物理读因果。activeproducer两个manifest已留本次两个读窗的快照；后来可追加，不能称其永久不变。新源修复只能producer真实结束后进行，避免DEV HMR改变原子身份。

## 最小共享read seam：三consumer只读同一份后果

建议新src/ui/relay-correction-effects.ts，纯UI函数relayCorrectionEffects(p:Pick<GamePanelProps,'view'|'features'|'accountId'>,target:RelaySceneTarget,correctionId:string):RelayCorrectionEffects。只读已提交公开relay/casebook/finance，不能收私有signature/rawrun，也不preview/execute命令。原model owner可负责helper+test/records接，Root结果和art paper各改自有consumer；先另Root授权文件范围。本稿只是设计，未写产品。

建议返回：identity(run/revision/asOf/business/account/period/meter/audit/correction/customer/supplier)、status known|partial|unavailable、customer及supplier两个局部status known|unavailable、reason；每侧按各自已核事实返回结构数组与summary/lines/sourceRefs，不用一串allBalance或无意义字段0。未知金额null，真实已核零才0；已有report/correctUnits/收入成本调整即使effects一侧未知仍继续展示。三个consumer共用summary/lines，不把十类目录搬回主幕。

CustomerEffects分列：recognizedIncomeDeltaFen；prepaidConsumedFen（已消费旧款，非本次实收）；newInvoices[{id,date,dueAt,amountFen,collectedFen,reversedFen,remainingFen}]；reversedInvoices[{id,originalOperationId,date,dueAt,reversedByThisFen,currentRemainingFen}]；refunds[{operationId,settlement:'cash',date,originalDeliveryId,obligationId,registeredFen,initialCashPaidFen,laterCashPaidFen,totalCashPaidFen,remainingFen,protectionId,currentProtectedFen}]。正/零/负性质用原operation.kind/settlement而非delta符号决定资金去向。

SupplierEffects分列：recognizedCostDeltaFen；newExpenses[{operationId,referenceCostId,poolId,obligationId,date,dueAt,amountFen,cashPaidFen,creditSettledFen,remainingFen}]；reversals[{operationId,referenceCostId,poolId,date,amountFen,reducedUnpaidFen,restoredAssetFen,splitStatus,sourceKind}]；poolSnapshot[{poolId,currentRemainingFen,paidFen,label:'本站跨期共用'}]。当前池余额与本次恢复额必须不同标签，不说paidFen是现金充值总额。sourceRefs仅安全kind/id/date/account/business/customer/amount，长ID仍完整原依据去处。

## 全正负映射与读法

|原已发生操作|必须首层说明|引用与边界|
|---|---|---|
|正customer deliver_prepaid|从这位客户原未消费保护款确认收入X，未有本次现金|correction.operationIds→原deliver→原recharge.operationId/used，samecustomer/account/source/date；原预款与保护消耗单独列，不默认继续充值|
|正customer deliver_on_credit|新增应收X，原date/dueAt、当前已收/冲回/净未收|原invoice.operationId+sourceId=meter，原income metric；后来collect现金只对应原单，不重复收入|
|负customer refund_delivered settlement receivable|这张原未收冲回X，净未收Y，没有当次退现金|原op.ref=原delivery；唯一原invoice.operationId=ref，原reversedFen；同source/customer，不拿整个contract余额猜|
|负customer refund_delivered settlement cash|登记退已消费多计X，已实际退P、尚欠U；不是返充值余额|原op.obligationId→原history debt(originOp/ref/source/date/account/customer)；同id直接cash.ref=debt.id，再canonical laterPay的cash；P+U=登记X，原匹配保护独列|
|负customer两类并存/多个delivery|分别列冲应收与现金退款，不合并成返还客户信用|每原operationId独立核，再有界合计，不能按净账户差划分|
|正supplier incur_supplier_usage|新增成本X/原应付dueAt，已现金付P、用贷项抵S、尚欠U|op.ref原cost/meter、samepool/debt；Pay与settle各自原id/source/ref日期，P+S+U=原额，账面成本不因付款再次产生|
|正supplier consume_supplier（若出现合法历史）|原资产实际消耗X，非新现金付款|同pool/原cost metric；现规则更正通常走incur，不为完善映射发新consume命令|
|负supplier reverse原consume_supplier|恢复已耗供应资产X；本次不退现金|唯一原referenceCost、samepool/owner+原cost负metric，当前pool余额另作本站跨期|
|负supplier reverse原incur_supplier_usage|冲减原未付R1、已付部分恢复资产R2，本次不是供应现金退回|按下述只读引用守恒核split；unknown时保总-成本与原refs，不把全R猜资产|
|后来supplier settle_supplier_credit|原贷项抵原应付S，非现金、非新成本|同referenceCost/pool/debt/owner/order，原义务余欠可读；不误说原reverse此刻还留全额可退|
|后来supplier refund_supplier|实际取回本站资产X，余池Y，不记收入|必须另当前RefundRelaySupplier命令和canonical原op/cash；不能把这笔旧取回算原更正当次到账|
|零差额correction|已追加核对记录，两边调整为0、无新增金融操作|原audit已完成且确为0，无op才真实0，不将missing casebook当0|

## 供应split不得模拟规则

只允许原事实引用守恒；不在UI重做ledger的min/支付顺序或推未来。对于同一referenceCost唯一一条reverse且原账链齐：取得原source amount O、同原债已核cash支付P、原settle credit S、当前余欠U，则该reference已经冲回的原应付事实为O-P-S-U；须非负/不超过该reverse R，且所有Pay/settle/义务/负metric引用一致。本reverse恢复资产事实=R-已冲原应付额。原source consume时没有原应付，恢复额沿原R及池/metric。当前是O2224/P2224/S0/U0，冲应付0、恢复202；这由原债现金已付和同reverse引用支持，不是看到新池202倒推。

若同reference存在多个reverse，当前公开casebook只有最终debt与操作序号，没有逐操作after快照，不能把合计冲回归给某一条。可发布该reference所有reverse合计的已核来源/总额以及当前原债/池，单条split置unknown并明示不可逐笔划分；不能臆造或在UI重放ledger。若业务验收要求每条精确split，应另审是否需要application安全read slice发表原操作结果（现不越权改app/core）。同pool其它成本/未来抵账也不能反向抵掉这条单票自身已恢复的历史事实；当前剩余池另列。

## 发布与阅读保护

读helper不要求当次command：可在Reader回看原correction，显示“该更正原已登记/累计实际退/当前余欠”；它不发成功回响。scene-result只在same run、saved/no candidate、current.revision=previous+1、last.kind=CorrectRelayUsage、last.revisionAfter匹配、canonical correctionId=relayId(commandId,kind)新出现、sameaudit完成/原report-price-terms-rate不改、target resolve同owner后调用；old/new casebook须ready/run/rev/asOf，所有本次operationIds新形成并原scope/source/date齐。用原cash/debt/pool链认钱，账户cash变化仅第二重一致性；不能账户净差是-606就说退606。

实际新短回响建议先说“这张原票已更正：本次实际退还客户¥6.06；供应恢复¥2.02未用贷项，未有供应现金到账。”再讲收入-6.06/成本-2.02、原报告与价格保留/客户旧保护不变。若本次未付则写“登记应退6.06，实际付0、尚欠6.06/原保护…”，不能庆祝付清；混合冲原应收时分别列。新positive仍先说明确认收入/成本不是现金，新增AR/AP各自原due；不能让修负case改变原positive。

对于同原refund后laterPay，Helper Reader可合计累计P/当前U及原cash/obligation引用；当次回响若last.kind=PayObligation继续已有Pay分支（须canonicaloperatingId），只称这笔旧退款的本次支付，不把同correction重新播收入/成本或初次退款。未保存candidate仍用旧101物件/summary，原retry真正saved后才新paper；Readonly可读已saved效果但更正命令禁用；conflict/跨run/reentry同rev不播新结果。

任一侧casebook missing/stale、重复ID、错biz/account/source/ref/date、无法唯一归属、operation金额/metric或现金+余欠不守恒，只有该侧effects unknown/null，显示“原现金退还/供应抵账明细暂不可核，完整原账仍保留”，原已知调整与可执行原权限不因展示理由改。不能以未知=0/放宽业务资格/隐藏旧保护修UX。

## 最有意义的后续验证（本轮不执行）

真实新101→candidate102→old101→savedretry102/physicalnew/reentry关联字节保身份；用于模型/结果/paper/Reader首层消费者精确断言6.06现金、2.02资产与717578保护不变，同时保原1112/1011与-606/-202。真实positiveR4 102→103与后106/107保Jan18/Jan11、新现金60+60与Pay30/credit30不重复收入成本。明确publicfixture覆盖负receivable-only/现金未付→部分Pay/多源混合/负供应未付冲减/已付恢复/两者混合/多reverse未知/零差额/missing或错引用、跨owner/候选/只读/重进。只视作者与组件/原文层证据，最终Root新build实际短回响与纸件首层仍须同次图/操作核，不能AX或字串绿代真正可见。

本稿先交具体设计，不源改、不工程/codec/重放/Browser/Git运行；active原子producer不写。新金融/金额来源已有casebook安全事实够当前真实case与多数唯一引用，复杂多reverse不给伪精确。原U4B/R2R3/C-S4-R、负分支和物理故障正式整合/当前完整Create/真人/美术认可/原PNG/M01暂停/T18/整个goal责任均不关闭，compat0。
