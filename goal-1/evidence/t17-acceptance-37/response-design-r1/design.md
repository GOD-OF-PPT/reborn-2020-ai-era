# 这张原票，现在愿意怎样回应

当前只交同一U4-B内部设计，不是运行时实现或验收；读入身份见sources.json。沿Game Studio Shared/UI与A长日重启，一次只呈现一项具体回应，不提供新的功能目录或工作台。原稿回翻和完整原账由Root的同对象近景/原册承载，本Editor只提供题目、字段正文、原决定。

## 1. 稳定接口

新增relay-response-draft.ts导出RelayResponseMode = collect | customer-refund | supplier-refund | renew | requote；RelayResponseSubject = {kind: receivable | customer | supplier | business, id: string}。运行时严格核模式/对象组合：collect只接receivable；客户退/续签只接customer；供应退只接supplier；未来重报价只接business。错误组合返回明确issue，无命令。

Scope含accountId/businessId/stationId/subjectKind/subjectId/mode；key为[runId,...scope]。createRelayResponseDraftMemory(runId)的read(requestedRun,scope)/write(requestedRun,scope,draft)仅属该人生、读写均复制数组。revision、当前日期、父入口或页码不入key，同一原票在近景和原册之间保稿；run/账户/站/业务/对象/回应改变则隔离。来源target仍每次严格重验，记忆本身不赋权。

草稿字段：amount、termEnd、paymentMode、creditLimit、customerIds[]、offerKind、unitPrice、resources[]、startAt、effectiveAt。全部空初值（数组空），金额永远是显示字符串，整数分仅由parseMoneyInput产生；明确0信用使用独立零值解析，不将空串转换0。

导出emptyRelayResponseDraft、relayResponseScopeForTarget、relayResponseDraftIssue、relayResponseDraftCommand、useRelayResponseDraft；工厂只返回{kind,payload,label,confirm:true}或null，不执行/预览、不读私有GameRun/ledger。

RelayResponseEditor({p,target,subject,mode,blockedReason?,children?})给render view{title,body,actions}；不自开Dialog、不控制房间、不调用onClose清稿。Root把同一个view置于近景或原册，同一个p.relayResponseDraftMemory实例由App依run创建并传入。children缺省时渲染actions/body；新接口类型由Root在game-types加入optional记忆，不改现有props文件。

## 2. 公开归属与失效

每次先resolveRelaySceneTarget(relay,target,{runId,accountId,operations})，指定失效不挑别站。基础business/station与原账户须唯一。所有subject原ID须唯一且归该业务；原invoice额外校验其唯一customer与原source meter/period所属；supplier同时校验目录/本站option唯一及credit账户/企业。不得仅find首项。

子target再限同对象：customer只接此客户及其原invoice；period只接本期客户/供应及来源本期meter或本期支持原单；meter只接该原meter的invoice与其原客户/供应；跨期audit job沿resolver公开完整periodIds界定允许集合，不把全部客户自动当一份原票。application/audience与其它不支持的来源不给回应表单，以明确回本站或原对象再选择；不私自补target。

主层不是让玩家另选对象的表，subject已经来自其明确打开的原票。未来重报价才逐位选择客户；换过主体/票后原字符串仍保记忆但不执行。客户关闭、企业停止不新增一概生命周期禁令；能否办理仍原preview裁定，不能把终态误作全部动作禁止。

## 3. 五种亲手回应

| 当前问题与首层原事实 | 显选输入及原命令 | 明确保留的语义 |
| --- | --- | --- |
| 这张原单到期，这次先收多少？显示原开单/dueAt、原额、已收、冲回、净未收 | amount空；可明确点击填入本单净未收，再自行改；CollectRelayReceivable{receivableId,amountFen} | 0<金额≤净未收；未来到期不提交；只这张单、不重复收入；整客户全部到期CollectRelayDue由Root另作独立决定 |
| 这位客户，退还多少未消费原款？显示现模式、现保护及原余额，原应收另外列 | amount空，可显选填全部；RefundRelayBalance{customerId,amountFen} | 0<金额≤prepaid；后付续签仍存旧预款时仍可核退；登记不假装实付，原应付由Root的casebook显示 |
| 这条供应上，取回多少本站资产？显示明确供应和全站共用池当前remaining、未付另外列 | amount空，可显选填全部；RefundRelaySupplier{businessId,supplierId,amountFen} | 0<金额≤该池原余额；自有资产回现金，不是收入；paidFen不称累计现金充值，不把全池算本期更正 |
| 还愿意怎样续这份客户约定？显示旧期限/旧mode/原信用与仍存余额 | termEnd/paymentMode/creditLimit全空显选；RenewRelayCustomer{customerId,termEnd,mode,creditLimitFen} | prepaid明确后credit=0；postpaid必须显填信用含0。日期不自动顺延；新约不改旧票、不收款；原未结服务门槛由preview核 |
| 要与哪些客户，谈怎样的未来报价？显示同站现客户/原合同 | customerIds、offerKind、unitPrice、resources、startAt、effectiveAt全空；StartRelayRequote{businessId,customerIds,offerKind,unitPriceFen,effectiveAt,resources,startAt} | 不替选人/本人/今天/新价格；旧失效人选仍显示并需明确移除，不能过滤后提交少人。现原谈判0元/1点/7日，工资与已有安排另计；原preview核新生效窗口与对方意愿 |

所有金额超过余额、负值/小数>2位/无穷/空值均无命令；money上限沿原parseMoneyInput。新的信用/价格/日期只做格式/失效核，原业务信用上限、期限/产能/资格/资金由原preview保最终权威。原表单字段不删。

## 4. 保存、草稿与原动作

有效命令用原CommandButton，全部confirm:true；它沿journeyIntent、controller.preview和makeSharedAction重新核同view实例/revision、保存中/readonly/candidate/conflict/unsaved。用户改字段只写UI记忆，不发命令、不改钱/AP/日期。没有预览成功就收起页或清稿的副作用。

旧目标/金额/人选/资源过期：保已填值，正文明确哪项需重选，命令为空或原按钮禁用；原失效ID不可悄悄复活为新记录。来源p变新视图后重算issue和原preview；异步成功结果与focus由Root唯一原写链发布，Editor不自行画成功票。只读可阅读原稿，无法发游戏命令；本地填写不授写权。

部分收/退款成功后同scope原稿仍在（不随revision重置），新余额更小时原金额可变为失效，需玩家明确改。新票或新mode使用空稿；取消/分页/合上/回原册不会清空此票。

## 5. 交互文案与一屏落点

不写“提交任务/进入管理”；标题直接提出上述问题。金额附近永远列范围/性质，原确认由单个主按钮承担。填全部是输入辅助，不执行业务。原ID和完整引用交Root的依据页，按钮可访问名称仍精确。没有默认tab墙/列表总览/持续闪烁/收益动画，无新CSS几何或兼容开发。

## 6. 必要验证计划（当前未执行）

- Canonical草稿跨同票父入口/取消/重开/日期revision保留，数组防外改；跨run/account/business/station/subject/mode隔离。
- 正常原票partial金额转换为整数分，原ID/confirm完整；原父period/customer/meter与跨期batch范围不混。重复ID、跨run/账户/其他期/别客户/不匹配credit拒绝，无默认回落。
- 金额边界/未到期单/已收与冲回净额/后付旧预款/全站供应池；金额变化不成为收入或额外AP。
- 续签与未来重报价保全部字段，无默认；失效多选/资源/日期保值并禁提交，显选移除才改变集合。
- 实际Editor→CommandButton原request载荷与confirm；取消后原稿不变；只读/candidate/conflict/stale view被原binding拒绝。测试不替代原UI/Chrome或完整Create审核。

原33正式UI保留；CorrectRelayUsage和CollectRelayReceivable是本片新增的已有核心首次UI接线两项，本Editor仅拥有其中后者，逐条更正由Root绑定公开audit与实计。ReportRelayUsage不加伪造手工用量入口。原P3/PNG/真人/compat暂停/完整goal责任保留。
