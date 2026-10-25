# U4-A 原33命令与完整字段静态映射 R1

本报告仅为源码/JSX/载荷的静态能力映射，不能替代业务执行、完整Create审核、当前Chrome可点性、保存故障/原retry、真人理解或整片验收。没有运行测试、游戏命令、codec投影/模拟或浏览器。TypeScript仅用于解析源码AST枚举调用点；没有调用生产模块。当前任务仍是U4-A，C-UX06及整体goal未关闭。

## 比对身份与方法

- 前像：Git提交 f9c3798b86361e961c62026f18f61bb3a6095e34 的 RelayPanel.tsx 与 RelayServiceChoice.tsx。这里的“原33”是这两个正式UI入口的33种命令，不是声称核心只有33个API。
- 读取时间：2026-10-24T21:54:18.695Z。本次文档写前后再次逐字节/模式核下列当前输入；不借用r4测试结果覆盖本次恢复后的源。
- 原Panel含31种命令，另两个共享编辑器构造 StartRelayServicePeriod/StartRelayAudit，去重后33。当前Panel + preparation builder + 原共享编辑器也为同一33；缺失命令名0、额外命令名0。
- 枚举后人工展开 assignment={resources,startAt}，检查两种技术准备、两种获客、两种收款、四种支持及单条/整期复核分支。命令名相等只是起点，下面另核对象实例与字段。
- 公共CommandEnvelope的runId/actorId/commandId/expectedRevision仍由原App/Controller链路生成；UI目标的station/run/account不是另造业务载荷。确认列指调用点显式语义，不把AdvanceTime未传第四参数误称无需原App时间/费用核对。

### 前像

| 文件 | 字节 | SHA256 |
| --- | ---: | --- |
| src/ui/RelayPanel.tsx | 34848 | d6c319f7556ee48918841b0a79bf62a3c3e833678b705a981195088da5f2cf62 |
| src/ui/RelayServiceChoice.tsx | 20896 | 7870782ced47731a9f2b2c63ed5209219ba6fc9dd46ba2a2edd736e700ac43db |

### 本报告当前输入

| 文件 | 字节 | 文件模式 | SHA256 |
| --- | ---: | --- | --- |
| src/ui/RelayPanel.tsx | 29988 | 644 | 1787224e24dcf06584de924c16b462f00ee88b25a648b03484bac96a2274020a |
| src/ui/RelayServiceChoice.tsx | 20872 | 644 | b0e5a494ba8db2fd9d8882827ec39edb7efb1bce661ca0d5dd997f3eb111fd71 |
| src/ui/relay-preparation-draft.ts | 12980 | 644 | da2f6a7ff567698b7f402f39c4abfe795c0c14071f6864cb6c46c992b9bfa8ca |
| src/ui/RelayPreparationEditor.tsx | 18853 | 644 | eb1550ba5ffdc56fa5e73e62d5d4de279407df68ad1c32d65d1f5e6cbdde8d74 |
| src/ui/RelayPreparationEditor.test.tsx | 21197 | 644 | 94bfd38fbbb9ef5c74f83e23b53097c0ac051e78c2233fd3630fdc930d484275 |
| src/ui/RelaySceneChoice.tsx | 19050 | 644 | d34ec50a782c35ce26b0ae923aba51c42368354adcdbbbdc896ac25ce10e796c |
| src/ui/relay-journey.ts | 7608 | 644 | 103c5d972dc7bd561efe57eb611b8416437b8592975f4dcfbb7b7aa8b8e1f7a0 |
| src/ui/relay-scene-target.ts | 10871 | 644 | 7051ae1b0a27683b87b18cf5bf9ccfd4f4063656aaad279aac3508e91b8f2424 |
| src/ui/App.tsx | 55302 | 644 | 2686cd212b3adf031cd2810957e011a13bf612d27ab324a1594601dd8dbe32e1 |
| src/ui/game-types.ts | 3446 | 644 | e4a98ab40c8b3c74b7af7818cceb580d2d91b33bd6b9357fd45da0a10b9a31b3 |

## 逐项命令、载荷与可达分支

所有新准备命令都由 RelayPreparationEditor → CommandButton → 原request/preview/confirm 进入；空值、过期或失效原选择不会用默认本人/今天/金额/最新报价补齐。高级原册入口保留。是否在某个具体存档可以执行，仍由原权限、钱、资源、日期、生命周期及保存预览裁定；以下“保留”不等于各分支已运行通过。

| # | 原命令 | 原载荷字段（全部） | 当前入口/对象分支 | 字段/确认与差异 |
| ---: | --- | --- | --- | --- |
| 1 | OpenRelayStation | capitalFen | 新站入口 → Editor open；仅明确个人入口/target=null，金额初始空 | 原确认保留；5000仍是原门槛，不当成整链预算 |
| 2 | FundBusiness | businessId, amountFen | 企业原账 → Editor capital；原 b.company 分支保留 | 自有资金转入，不记经营收入；金额不再默认5000 |
| 3 | StartRelayPreparation | businessId, preparation, resources[], startAt | 技术/材料 → Editor basics/materials；两种 preparation 均保留 | 本人/日期不再默认；原 false 调用改走独立确认，命令规则不变 |
| 4 | ApplyRelaySupply | businessId, supplierId, resources[], startAt | 供应许可 → Editor application；全部公开供应可显选 | 保原资源/日期；原 false 调用改显式确认，批准仍须亲读 |
| 5 | ReadRelaySupplyDecision | applicationId | 供应每份 application article + 原 CommandButton；近景同原命令 | 原免费读信调用保留；任务/结果资格仍由原预览核 |
| 6 | StartRelayAdapter | businessId, supplierId, resources[], startAt | 供应许可 → Editor adapter；选原供应 | 保原独立适配字段；原 false 调用改显式确认，不新授权限 |
| 7 | ActivateBusiness | businessId | 原账 preparing 分支；journey/record 近景另接同一原命令 | 原册调用保留；近景加独立确认，不绕原启用条件 |
| 8 | StartRelayMarketing | businessId, segment, mode；paid: resources[], startAt；video_referral: videoCohortIds[] | 需求 → Editor marketing；三客群、paid/referral 两原模式齐 | 无新视频前置；付费模式改独立确认，既有来源仍显选 |
| 9 | SetRelayOffer | businessId, offerKind, unitPriceFen | 报价 → Editor offer；low_margin/managed_support 两原方案齐 | 方案/单价初始空；无默认最新价，不改旧合同 |
| 10 | SignRelayCustomers | businessId, audienceId, offerId, personIds[], termEnd, mode, creditLimitFen | 签约 → Editor customers 的名单/逐位潜客/条件三步 | 所有原载荷字段齐；count 原为 UI slice 输入而非命令字段，现逐位显选代替；预付信用=0，后付显选且可明确填0 |
| 11 | RechargeRelayCustomer | customerId, amountFen | 客户区/明确客户目标 → Editor customer-funds | 原客户+金额保留；实收/等额保护，本次新增服务收入0；额度由原预览核 |
| 12 | TopUpRelaySupplier | businessId, supplierId, amountFen | 供应许可/资产 → Editor supplier-funds | 原主体/供应/金额保留；自有资金变供应资产，不当期成本 |
| 13 | RefundRelaySupplier | businessId, supplierId, amountFen=原 remainingFen | 每家供应 → SupplierFunds；credit>0 时原退款按钮 | 仍可取回全部未用余额/调账贷项；未新增许可/lifecycle禁令 |
| 14 | StartRelayServicePeriod | businessId, customerIds[], supplierIds[], resources[], startAt, maxUnits, maxSupplierCostFen, supportMode, deploymentId | 本站业务目标 → 原 RelayServiceChoice；历史期先显选回本站 | 4支持模式/原部署/供应顺序与备选/显式零预算均保留；payload构造函数逐字同前像 |
| 15 | StartRelayAudit | meterId 或 periodId（二选一）, resources[], startAt | 选定期/单条meter → 原 RelayAuditEditor；历史job先明确回本期 | meter与period两条载荷分支保留；payload构造函数逐字同前像 |
| 16 | CorrectRelayPeriod | periodId | 每期 RelayPeriodCard 的原更正按钮；主场景已知差额原命令 | 原确认保留；结清/关闭不在UI新增一概禁令 |
| 17 | CollectRelayDue | customerId | 每位原客户 RelayCustomer；主场景实际到期单原命令 | 仍按客户全部到期原单，可能跨期，不缩成仅收本期 |
| 18 | RefundRelayBalance | customerId, amountFen=原 prepaidFen | 原客户余额>0 的退款按钮 | 原整笔未消费余额退款条件/确认保留，不清其它欠款 |
| 19 | CloseRelayCustomer | customerId | 每位原客户原关闭按钮 | 原结清门槛由预览核；选定已关闭客户仍可读原记录 |
| 20 | RenewRelayCustomer | customerId, termEnd, mode, creditLimitFen | 客户 → 原续签 details/form | 新有效期、预付/后付、信用上限全保留；已有合同值沿旧表单保留，不自动执行 |
| 21 | StartRelayRequote | businessId, customerIds[], offerKind, unitPriceFen, effectiveAt, resources[], startAt | 原客户区 → RequoteForm；至少有未关闭客户 | 原全部字段/谈判记录保留；资源/开工/拟谈方案/价格/生效日改空值显选；失效人选不再静默过滤 |
| 22 | PauseBusiness | businessId | 原账 operating 分支；近景更多也提供同原命令 | 暂停新合同；不当成停流或清旧支持 |
| 23 | ResumeBusiness | businessId | 原账 paused 分支 | 原重验条件/主体保留，未合并成另一种恢复 |
| 24 | PauseRelayTraffic | businessId | 原账 station.trafficPaused=false 分支 | 仍为停止新请求，不删余额/费用/支持 |
| 25 | ResumeRelayTraffic | businessId | 原账 station.trafficPaused=true 分支 | 仍由原批准范围与原预览裁定 |
| 26 | StopRelayPeriod | periodId | 每个原期 RelayPeriodCard | 停止本期新请求，不等于停止原支持/清旧账；原确认保留 |
| 27 | StopRelayStation | businessId | 原账非 winding_down 分支；近景更多 | 原停站收尾载荷/确认保留；与停流/停期分别可达 |
| 28 | CloseBusiness | businessId | 原账 winding_down 分支 | 全部旧义务/资产结清原门槛保留，不用停止标记冒关闭 |
| 29 | AcknowledgeRelayMarket | businessId | 已有未确认公开变化提示区 | 旧合同原价与未来调整仍分开；原按钮未丢 |
| 30 | HireWorker | businessId, definitionId=assistant-zhou | 技术/材料区 → 原招聘 details | 原招聘费/行动及实际月工资说明保留，不加免费产能 |
| 31 | DismissWorker | workerId | 原招聘区每位原在岗员工 | 原结算/解聘确认保留，不改变原员工枚举范围 |
| 32 | InterruptJob | jobId | 原 RelayJob：技术/材料、申请、适配、营销、服务、支持、复核、重谈任务 | 营销实例在抽取中曾被移除，已恢复；不同原job均仍送自身id，不只证明命令名存在 |
| 33 | AdvanceTime | date=所选原 job.completeAt；主场景原Clock另沿公开停点/屏障 | 同上每份 active 原任务的 RelayJob 等待按钮；原 Clock 旁路 | 保原显式任务日期入口及 App/journeyIntent 时间/费用核对；未为日常生成新规则/免费点 |

## 原记录与非载荷字段

| 原字段/对象族 | 当前可见去处与完整性 |
| --- | --- |
| 业务账/主体 | RelayBusiness/BusinessLedger保company/lifecycle、availableFen/cashFen/heldFen/prepaidLiabilityFen/receivableFen/supplierPrepaidFen/payableFen、累计income/cost/profit及保护/承诺缺口。新增近景不把余额当利润。 |
| 技术与材料 | 原每条preparation kind、RelayJob状态/startAt/completeAt及等待/中断保留；新资源/日期来自共享草稿。原article未有独立prep锚点，仍以business/resources入口进入，没有删除一个原先存在的prep锚点。 |
| 供应申请与适配 | 每家供应label/failureDomain/billing/currentRate/creditLimit、permitted/adapted、剩余资产/outstanding保留；每份application article id、RelayJob、已读批准/拒绝/有效期保留；每份adapter RelayJob保留。未读批准仍不展示。原adapter本无单独目标锚点，不能把缺少新专门锚点误称本次删掉原能力。 |
| 营销批次 | 曾在抽取时被误删的逐批article id、原RelayJob、mode/segment和实际名单数已恢复；现在另保createdAt/真实completedAt。未完成不编名单；新签约表单仍只来自共用Editor，不恢复count/slice默认。 |
| 潜客/报价 | 三客群、实际视频来源id/date/segment/members、收费方案及支持基准费、已保存offer id/date/用量价/服务费可显选；具体personIds逐位与所选audience绑定。 |
| 原客户 | 原mode、personId/编号、合同期限、activeTerms用量价/支持费、prepaid/receivable/due/recognizedIncome、充值上限保留。续签mode/credit/date与原退款/关闭仍在原客户details/card。 |
| 服务/支持 | 原期status/from/to、客户、供应顺序、maxUnits/maxSupplierCost、observedDays/reportedUnits/failedDays、服务/支持job与停止按钮均保留；guided/self/assisted/delegated及合法既有deploymentId未删。 |
| 复核/更正 | 原meterCount/auditedMeters/knownCorrections、每个原audit job/批量meterCount、单条meter定位/period定位仍在；date/reportedUnits/auditedUnits（未知仍空）、用量价/rateId、reason/correction及更正date/customerDelta/supplierDelta/meter引用保留。后50/全部原计量入口仍在。 |
| 历史及旧责任 | 关闭企业档案、已结期原页、已知差额回到currentPeriods、原客户保护/供应资产/应收应付及到期日期保留。已结/关闭不新增 blanket 禁令；具体原允许动作由预览裁定。 |

## 对象可达性发现、修复和剩余界限

1. **确定P1已恢复，尚待新检查：** 抽取前像 RelayIntake.audiences.map 的 article id={audience.id}+RelayJob 曾被整个移除；恢复前Panel为29161B/SHA ac30c397ccd5db4c97c8282f8d1f75db24066234b496d45b79d83575b29d138e。33个命令名仍齐，却缺营销实例的等待/中断及audienceId锚点，不能按名字集合报全保留。本次已恢复每批原记录、mode/segment/日期/实际人数和原RelayJob，保三个新Editor。relayPanelTargetLocation(audience)再次有对应article id。
2. **同类对照：** 准备、application、adapter、service、support、audit与requote的原RelayJob调用未被删。application article id、customer article id、period原页/原job/meter锚点仍在；这些字段未只有无法进入的函数声明。原prep/adapter没有专门typed child target/独立锚点，business入口可读其记录；这不证明新增的任意recordId都可精确跳到其中一个prep/adapter，专门定位若需扩展应另列。
3. **新增定向用例仅已写，未在本次运行：** RelayPreparationEditor.test.tsx第8个it使用原正常 r75（goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0075.json，1070264B/SHA 78c28531038880e8a63d9e9fb214959ce896d495199849aa717bbaa77e6ef3eb），只在测试中实际导入该旧generated_normal_input并核原册audience锚点、三个共有Editor、原任务等待/中断handler与一次原Controller中断保存；源码文件写入不是测试通过。本报告未运行该用例，原7case及原时限未放宽。输入为旧正常历史，不能当本轮Chrome或新人生证据。
4. **高级重谈的明确限制：** 原重谈/续签等仍是原册控件而非所有步骤都被移入近景。重谈资源/日期从空显选，旧人选失效时保值并禁提交，不再过滤后提交更少人；局部advanced state仍没有新增全局跨重开草稿协议。若要保跨重开高级草稿或给失效多选增加专门清除入口，应另列UI改进，不冒充此次已全部统一。
5. **无源声明替代实际可点性：** HTML details及ScreenBook存在内容、目标解析与id对应，只能证明源码路径；没有据此断言当前自然窗口每页均可见/可点。保存失败、只读、原retry、跨季、两背景及预付/后付深状态分别按root33后续实际证据交回。
6. **未扩大核心API声明：** ReportRelayUsage/CorrectRelayUsage/CollectRelayReceivable等未出现在本前像这33个UI命令集合中，不能靠此表声称其原始低层API均已新增近景；原正式33的字段映射与核心全部能力验收是不同范围。

## 静态核定

- 原/现命令种类33=33，差集为空。
- relayDraftScopeForTarget、relayDraftIssue、relayServiceDraftCommand、relayAuditDraftCommand、RelayServiceFields与f9前像逐字一致；服务/审计仅移除了原request前onClose，原字段、校验和确认不删。
- 具体营销对象分支的已知遗漏已修，不以r4（修复前）绿色结果冒称修后通过；原source身份及原红保持。
- 本次只写此fresh文件，不改源码、三master、旧封存、P3或Git索引/提交；源码恢复与新增测试是Root在r4终态后另行授权的独立先行操作，准确当前字节见上表。
- 本报告不关闭U4-A、C-UX06、R2/R3深状态、C-S4-R、T17/P3正式62/22、原PNG/真人、暂停M01、T18或整个goal；兼容/几何/浏览器/测试/模拟执行均0。
