# 一张原票，接下来怎样回应

本稿属于唯一第8项U4-B的设计阶段，采用Game Studio Shared/UI，沿A长日重启及现有React。未接线、未生成图片、未运行测试/build/浏览器或Git。root37三文件和36号第10节/10.9、37号已读；具体源身份见[sources.json](sources.json)。当前没有RelayServiceAction文件，真正共享动作组件为RelayThreadAction。

## 1. 这一段游戏到底在取舍什么

玩家不是在清空后台任务，而是在问：“答应这些客户以后，我愿意继续投入自己的钱和日子，把哪一份承诺认真收好？”供应/信用/容量/支持的选择带来真实约束，核账、部分收款、退款或收缩改变后续可花和仍要留出的时间。经营和工作/生活可并行；不新增免费奖励、强制灾难、收益保证或无关小游戏。

默认经历是看清原对象→选一种具体回应→核确定代价/原确认→过真实日子或等待对方→看见已保存改变→继续同约、收缩或回生活。以下各幕不是强制线性任务链：原支持、复核与原单到期可以交错；UI只选阅读焦点，不替规则安排下一步。明确日期与硬屏障始终沿原Clock，日常计量不变成28次签到点击。

## 2. 当前断点必须一起修

- 客户纸件统一写未消费预款，即使该客户现在是后付；后付信用/原应收没有对应形状。续签后付但仍有真实旧预款时，也不能反向删掉保护。
- period责任是已知差额→到期应收→整站应付三选一；同一画面可能遗漏同时存在的责任，整站应付也不能全部说成本期。
- 主幕已采用U0-R独立前景，深层仍容易成为摘要→再选菜单；更多选择仍铺11项准备功能。增加十类records只能作资料底座，不能替代当前玩家目的。
- 当前逐计量页主要查看，分单/部分原款与逐条原更正缺直接决定；客户/供应退款只传全额。原核心已有CollectRelayReceivable与CorrectRelayUsage，这次要真正接原字段/确认，而不是只显示“部分已收”。
- 原relay-records.ts未接线WIP仍说“这里不选择部分金额”，其kind排序和术语不能直接成为主层设计或验收。

## 3. 一屏的固定职责

保U0-R真实桌面附近的独立前景列，不再把物件放到所有前文之后。主幕一句处境/一个具体问题，左侧真实回响与确定事实保自然阅读，右侧只突出同一份服务夹及当前所选票。原Clock继续有明确对象/日期；随身册/日历在独立场景边缘，原册入口不被纸签覆盖。不要加统计墙、常驻侧栏、十类tab、状态灯或软件式总览。

普通一主至多两支是决定层级；资金缺口、到期原义务、已知独立风险及未保存恢复必须常显，不受预算裁掉。多种责任用同一可读短段明确并列“本期支持…；已知差额…；到期原款…；本站另外应付…”，保原数量/金额/归属/具体去处，不三选一、不只留AX、不设行数裁切。全部逐笔依据继续同视口分页；同对象选择、翻页和取消保草稿，不能用滚动/缩字/裁切收掉内容。

主物件与主念头用同run/revision同一binding。选择某张票后直达该票当前决定；原记录/依据是旁路。不能“物件→摘要→功能清单→另找对象”。没有可写动作时，物件清楚写查看并保原原因；只读可翻、不可新写。

## 4. 连续逐幕脚本

下表台词均为玩家念头/公开事实模板，花括号必须从当前已提交同对象填入。不是新NPC对白，不声明本轮已经出现这些结果。

| 幕与眼前问题 | 亲手回应与确定取舍 | 真实变化/可停留终点 | 物件与原记录 |
| --- | --- | --- | --- |
| 0 原客户的约定：“这一位客户，约定怎样付款？” | 看冻结原价、合同期限与现付款模式。预付可单独显选充值；后付先辨信用上限/到期单。续签和重报价必须另显选，不自动改旧约。 | 查看不收费；签约/续签保存也不凭空收钱。新约留下以后仍可先回生活。 | 服务夹中一张客户合同，预付保护带/后付信用折页不同；原客户完整页。 |
| 1 “愿意把哪段时间留给这一期？” | 原客户/供应顺序/资源/未来开工/容量/预算/支持逐步显选。显示服务3000/1点/28日与所选支持另预留；供应需要预付则另作资本转资产决定。 | 原确认后才是已安排；开工、实际用量、支持和收款都未因此完成。 | 虚线日期单，独立支持小页；本期及原两份job。 |
| 2 “这一天的原记录，说了什么？” | 选择实际客户/日期/供应的单票，读报告、冻结条款/供价与公开原因；实计未核时明确未知。可显选本票或整期复核，或保留记录先等原反馈。 | 未发生记录不补，未复核不显示0或差额；查看无命令。 | 单张撕口计量票，没有实计页；完整meter页。 |
| 3 “这一批送去核对的票，查到哪里了？” | 看同audit job完整批次及全部原期；“本期筛选{x}条/全批{n}条”分开。原资源/100元/1点/3日显选；已安排的批次只等或明确中断，不能再收一遍委托费。 | 完成才展开实计；后来的计量不自动加入原批次。 | 夹起的一叠票与批次夹，planned/running合着、完成才展开；原batch任务和全部meter引用可分页。 |
| 4A “这张票的两份数字相符。” | 原报告/实计相同：看依据、继续原支持/生活即可，不强迫做更正或发奖励。原允许的高级动作仍在原册。 | 这张已核事实可收好；不等于整站全部核清。 | 两页对照但无朱红折签，无假实收票。 |
| 4B “这张票，留下了一处已知差额。” | 看已完成auditId及公开实计，核原量/原价与两边影响；逐条CorrectRelayUsage的correctUnits必须沿该公开实计，不让玩家编数字。整期更正仍是独立明确选择。 | 原确认保存后追加附票，不覆盖原报告/原价；更正不是收钱，新单有自己的dueAt。 | 朱红角签指向该原票；保存后原票与更正附票相夹。 |
| 5 “原单已经到期，这次先收多少？” | 显选一张receivable及金额，保原金额/实收/冲回/净未收和dueAt。可以本单部分收，或另明确选择该客户全部到期原单；两者范围不能混。 | 实际保存后才出现该次现金回执；净未收继续。到账不再确认新收入，未来原单不提前取用。 | 原单半折页＋已收短联仍与剩余原单并存；原receivable、现金引用及原客户。 |
| 6 “退还这位客户多少未消费原款？” | 显选客户和本次金额，可用全额填入但不默认；读现保护/原可退额/退款后仍存责任。已消费更正退款与未消费余额退款分开。 | 原退款登记不必然等于实际现金已付。资金不足仍有原退款应付；仅唯一公开付款引用核定才写已实际退。 | 返还方向的折联，写退还客户；不画收入收据或把释放保护当利润。 |
| 7 “这条供应上，哪些钱仍是本站资产？” | 区分未用预付/调账贷项池、当期实际消耗和原应付。显选供应、本次退回额，或保留资产以供后续；许可、适配和新服务仍另定。 | 资产退回是自有资金收回，不是经营收入；共用池跨期，不把整池余额称本期更正。 | 供应资产小夹/退回联，绑定站与供应；保原应付另页。 |
| 8 “请求停了，原支持还怎么办？” | 分别选停止新请求、停本期、暂停新合同、停止原支持job或停站收尾。每个按钮写清停什么，列已耗费用/AP、未来预留和仍在的支持/退款/应付。 | 等待不会免费补做中断支持，停止服务不抹支持；已保存业务受挫真实留下，不伪装成未保存。 | 中性收起服务单；原支持小页保独立planned/running/completed/interrupted，只有真实未清责任才加朱红折签。 |
| 9 “这一期收好了，接下来把日子留给什么？” | 原账财务closed、独立复核与资产余额分别说；继续同一未完约、另拟空的新一期，或回今天/生活。 | 新一期必须重新显选，旧合同/资产不免费转利润；企业仍在业则维护仍按原日历。 | 收好的本期服务夹，实际收款另留回执；没有新事实不播收钱/升级。 |

无某幕的事实就不强迫出现该幕：没有差额是正常结果；没有学名/客户名不补人物；未知供应故障原因不画爆炸；未出现投诉不伪造电话对白。

## 5. 状态→物件→原动作→完整原账路径

“现路径”指当前已有typed target/Panel锚点；新增票引用的精确读取接口由Root定型并验证，以下不把设计接口说成已实现。

| 状态/对象 | 可辨物件子态与首层必留事实 | 具体原动作 | 原账与定位合同 |
| --- | --- | --- | --- |
| 客户预付约定/已充值 | 合同双页＋未消费保护带；合同期、冻结收费、未消费余额、应收分别列 | RechargeRelayCustomer(customerId,amountFen)；RefundRelayBalance(customerId,amountFen)；RenewRelayCustomer；CloseRelayCustomer | 现customer target→customer.id；到期则relay-customer-due:customerId动作行；客户全条款/原期引用均可读。 |
| 客户后付/仍存旧预款 | 信用折页与未到期/到期票；creditLimit、原应收/到期额；若真实旧prepaid>0继续同显保护 | 单票CollectRelayReceivable；整客户CollectRelayDue；续签仍独立 | 同一customer，无换账户或过滤重编号；后付不是预款0的假保护图。 |
| 单meter实计未知 | 原报告一张，实计页合起，文字待独立复核 | StartRelayAudit({meterId,resources,startAt})；ReportRelayUsage原低层幂等API不伪装新调查/新报告收入 | 现period+meterId→relay-meter:meterId；冻结date/customer/termsId/rateId/reason/operation引用。 |
| 单meter已核相符 | 两页相符对照，无差额红签 | 看依据/回同一期；原允许整期/单条更正能力仍高级可达，不强迫 | 原meter及有效已完成audit，不能借别次实计；未来记录仍未知。 |
| 有效已知差额未更正 | 两页对照＋朱红角签，原报告与实计都保 | CorrectRelayUsage({auditId,correctUnits})；CorrectRelayPeriod({periodId})另确认 | 原meter→原完成audit→对应更正；确切ID链必须唯一，不自动挑最近audit。 |
| audit batch已安排/运行 | 叠票/夹子、虚线日期/实线工作；完整n条与当前子集x条 | 原Clock；InterruptJob(jobId)；不重复StartRelayAudit | 现period+jobId→relay-period-job:periodId:jobId；跨期batch保全部periodIds及原审计行，不以当前period充全批。 |
| batch完成/中断 | 完成才展开实计；中断折回但保已耗费用/行动与原记录 | 查看具体meter；有已知差额再逐票更正；原允许的新审计另显选 | 当前job target识别原audit；闭包/子集与全批均能回原页，查看不另收费。 |
| 正/负更正已追加 | 原票外夹附票；显示追加日、客户/供应调整，非现金回执 | 查更正新生receivable/原obligation；到期后才沿原收/付款 | 设计record引用必须绑定correction.id→meterId/auditId/operationIds；新单dueAt直接读原单。不能由旧meter日重算。 |
| receivable未到期 | 原应收票半折、虚线到期边；原开单/到期、金额/已收/冲回/净未收 | 原Clock到公开到期日；查看；禁止提前收/花 | 设计单票引用receivableId→customer→本站→source meter/period或更正operation唯一关系，原客户完整页旁路保。 |
| receivable到期/部分已收 | 原单与收联并存；剩余仍开着，不能打全部结清印 | CollectRelayReceivable({receivableId,amountFen})，0<amount≤原净未收；另选CollectRelayDue({customerId})核全部到期跨期范围 | 同上；本次金额必须显选，原单的collected/reversed不重算；原现金transactions按sourceId和canonical operation核。 |
| 原退款登记/实际支付/仍应付 | 退还客户联与应付折签分开；客户、登记额、实际现金和未结明示 | RefundRelayBalance显选原金额；原obligation支付沿原财务能力 | 设计refund.id→customerId/operationIds/rechargeIds；若公开引用不能唯一拆出实付，写登记已保存/实付待核，不编拆分或归本期。 |
| 供应预付/贷项/退回 | 原供应资产夹、退回联；当前全站余额与本期消耗分别表达 | TopUpRelaySupplier；RefundRelaySupplier({businessId,supplierId,amountFen})显选部分/全额 | 当前station business target可读每家供应；新增读取细锚须Root落合同，不默认最近供应。credit pool跨期，只可称本站余额。 |
| 原供应应付/资金缺口 | 朱红责任折签与原日期；原来源/剩余/保护范围常显 | 原财务付款/有限停止；原preview拒绝就保欠款 | 设计obligation.id→originOperation/sourceEventId→meter/correction；不能唯一归本期则标本站，不藏到普通阅读预算。 |
| 原支持planned/running/completed | 独立小页分别虚线日期/实线/双线完成；本支持job和服务job不同 | 原Clock；只允许原任务InterruptJob/RescheduleJob等既有门槛，不擅造免费恢复支持 | 现period+supportJobId→relay-period-job；资源/成本/AP/预留与原服务分开。 |
| 支持interrupted/cancelled | 支持页明确停止折痕/断开系带及文字，不靠灰色 | 原允许重排/原收尾；原支持费/部分服务赔付按真实原账 | 原supportJob、period feePostedAt/compensatedAt、原退款/应付均可读；发生处理不等于实付。 |
| 停交通/停期/暂停合同/停站/关闭 | 四种停止对象文字不同；无责中性、有未清责才朱红；关闭用实际日期 | Pause/ResumeRelayTraffic；StopRelayPeriod；Pause/ResumeBusiness；StopRelayStation；CloseBusiness各独立原确认/预览 | business/period/job/customer各自原target。closed/settled不一概禁原允许复核、更正、旧账动作，原preview裁定。 |

## 6. 不把一组纸签做成记录目录

房间只展当前焦点票的状态形状与必要事实：服务单保原期；支持页独立；当前收/退/更正票按性质出现。主操作直接进该决定，不先开十类菜单。主对象外的同时责任仍用可读短段/单一责任区并列数量/金额/日期与对象归属，不通过三选一“优先级”消失；点击该具体责任后再进入其逐票分页。

近景先读具体矛盾，再显示该决定字段，完整原量/原价/引用放同对象“看依据”页；翻回字段时原金额、资源、日期与对象不丢。原册保检索/全账及原33能力；它不是被删掉，也不占默认目的。旧more11项可保高级准备入口，但在已有差额/原单/退款处不能先要求玩家识别系统分类。

## 7. 金钱性质与回响发布合同

1. customer.mode与真实prepaid余额是两件事。后付显示信用/未回款；旧预款若仍>0照样保护，不可因续签换mode清掉。预付0也是实际0，但不画已充值的带子。
2. 资本、供应预付/贷项退回是转移/资产，预算是上限；均不是利润或已经消耗的成本。后付客户应收不是当前可花。退款释放保护不产生利润。
3. 只用最后原receipt的commandId/kind/revisionAfter与公开同account/business/source的官方canonical transaction关联“本次已收/已退/已取回”。不能见正额现金就判为服务收入，不能借累计余额变化假造当前回执。
4. 客户退款可能多operation/并留应付；先用实际refund.operationIds关联。无法唯一证明实际付款或归本期时保持“本次退款登记/实付与原欠款另核”，不播已退成功。供应退回同样绑定本次原命令/供应/主体；跨期共用池不拆编到某原期。
5. 更正附件只说已追加的调整；正向更正可生新应收/供应应付，负向可能冲应收/付款或恢复供应资产。未有唯一公开逐笔关系时只列已知原账，不画“赚回钱”或一概“贷项退款”。
6. 未保存candidate/冲突/保存中只留旧committed纸件、旧金额/日期/AP，原恢复按钮持续；原retry成功才换物件。已保存的服务不足/拒绝/亏损是业务事实，必须留真实非成功结果。

## 8. 原33正式UI能力及新增深层原API

原33的权威是root33/capability-map-r1：旧Panel+ServiceChoice正式UI入口，而不是核心只有33API。当前逐幕方案必须保其全部对象实例和原字段；命令名集合相同并不能证明可点或完整。

| 能力组 | 必保原命令与路径 |
| --- | --- |
| 准备与经营前提 | OpenRelayStation、FundBusiness、StartRelayPreparation（basics/materials）、ApplyRelaySupply、ReadRelaySupplyDecision、StartRelayAdapter、ActivateBusiness、StartRelayMarketing（paid/referral）、SetRelayOffer、SignRelayCustomers；原准备Editor/对应application/audience均保每份实际job与等待/中断。 |
| 合同与资金 | RechargeRelayCustomer、TopUpRelaySupplier、RefundRelaySupplier、CollectRelayDue、RefundRelayBalance、CloseRelayCustomer、RenewRelayCustomer、StartRelayRequote；显选对象和完整金额/期限/模式/信用/原价/资源/日期全部保。 |
| 服务与核账 | StartRelayServicePeriod、StartRelayAudit（meter/period）、CorrectRelayPeriod；四种支持/已有deployment、供应先后/容量/预算、两种复核范围保。 |
| 收缩与旧责任 | PauseBusiness、ResumeBusiness、PauseRelayTraffic、ResumeRelayTraffic、StopRelayPeriod、StopRelayStation、CloseBusiness、AcknowledgeRelayMarket均保独立语义。 |
| 人与时间 | HireWorker、DismissWorker、InterruptJob、AdvanceTime：技术/材料/申请/适配/营销/服务/支持/复核/重谈各真实实例保，不只剩一个命令名。 |
| 本次新增直达，不能靠原33冒已覆盖 | CorrectRelayUsage(auditId,correctUnits)与CollectRelayReceivable(receivableId,amountFen)接原preview/confirm/save；后者真实部分收款，不是仅展示“部分已收”。ReportRelayUsage是原低层接口，本设计不擅加成“调查”或奖励命令，也不把它列作原33缺失。 |

续签新termEnd/mode/creditLimit；重谈customerIds/offerKind/unitPriceFen/effectiveAt/resources/startAt；退款customer/supplier/amount；原服务全部字段都按同对象草稿保留。招聘解聘的实际工资、既有权限/独立风险与已发生公开市场变化仍通过原册/责任入口可到，不自动扩权/涨价。

## 9. 素材与TA交付，不先重画背景

重用：room-ordinary/improved现有分层、relay-service-kit-v1低平接线盒/服务夹/原木托面、U0-R独立前景布局和contact shadow、现有六态SVG底层、字体/暖金/纸白/朱红。完整DOM文字和金额不烘焙进图。

本片确需增加的主要是原生形状子态：后付信用折页、保留旧预款的独立带；单票与batch叠票/夹子；原报告与已核实计双页；更正追加附票；部分收款未收余联；客户退款反向联；供应资产夹/退回联；支持中断折痕/断开系带；中性停止与有责任停止。它们都适合SVG/CSS/DOM，当前没有证据要求新imagegen资产。

只有实际近景发现kit透视/支撑无法承载上述票种且不能原生修时才补一张统一角度的空白物件：低平服务夹、少量空白票、回形针，左上暖光/右后冷青窗光，透明背景、完整边缘；无字/数字/人物/品牌/屏幕/LED/金钱符号，不生成一整间机房或新桌面。先保存用途/同镜头参考/遮挡与动作brief，再生图并保原PNG/衍生/SHA；新图不替代缺失原三PNG。

状态材质要覆盖普通/悬停/键盘焦点/按下/禁用/只读/候选，保U0-R高优先级wrapper inset重置和真实桌面接触，不让旧top41%恢复下移。光只引导可点处，无持续闪烁/假进度。动效只有UI显选聚焦、原确认停顿、真正保存后换纸三个节奏，减少动效保同文字/动作；不新增音效或宣称声音已交付。

## 10. Root确认接口后才实施的接缝

模型/读取者负责唯一公开关系、原记录与金额/状态；编辑器负责同对象显选、空值/过期/失效草稿、原preview/confirm；Root负责主线目的/同binding/保存后focus和各入口；本代理未来限定paper/continuity/CSS，把已验证事实变成物件及文字，不读隐藏state、不调用request、不重算规则钱。

建议兼容扩展现PaperLabels：付款性质（预款/后付/实际收/客户退/供应退回/更正）、有明确归属的多项责任、原支持子态及当前票种。字段名/形状由Root与模型接口确认后再写，不先猜consumer。原responsibility/string、phase/state/data属性及原纸件优先级保持；新层只服务实际公开对象。单条/批次/资金回响没有唯一绑定时宁用中性原记录，不伪造当前结果，但完整原依据/合法动作继续可达。

本片验收必须串真实当前服务小循环与受挫/退出：看原对象→选择/原确认取消保稿→真实日期/复核→公开差额/零差额→分单部分实收→退款/资产退回或保留→停止/支持中断与旧责任→回同对象/今天/重进。每种图都核原钱/日期/AP/权限/物理旧新/原retry，完整未收起回响和所有责任/Clock/阅读入口同幅。只用当前自然Chrome，不做任何页面兼容/几何专项。正式真人理解/趣味与美术认可及完整goal仍未证明。

[杠精审查] 设计通过本次静态完整性：没有把十类rows当主线；原33与新增两API分别保；先未知后公开实计、部分实收/退款/供应资产/全站归属与停止支持旧债均有具体去处。所有状态和稿件仍是待实施/待实际验证，不勾U4-B/R2/R3/C-S4-R。
