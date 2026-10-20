# 54项逐条件复核 R3

最终判定以本版及requirement-review-r3.json为准。源码/具体测试/实际字段分别保留原执行身份；本次索引不执行新游戏测试。Q33/Q35的当前证据满足限定条件，其余未覆盖部分逐条保留。有据行中的边界说明不自动新增验收要求。

| 原编号 | 条件数 | 判定 |
|---|---:|---|
|Q01|3|部分|
|Q02|2|部分|
|Q03|2|部分|
|Q04|2|部分|
|Q05|2|部分|
|Q06|2|部分|
|Q07|2|部分|
|Q08|2|部分|
|Q09|2|部分|
|Q10|2|部分|
|Q11|2|部分|
|Q12|2|部分|
|Q13|2|部分|
|Q14|2|部分|
|Q15|2|部分|
|Q16|3|部分|
|Q17|2|部分|
|Q18|2|部分|
|Q19|2|部分|
|Q20|2|部分|
|Q21|2|部分|
|Q22|3|部分|
|Q23|3|部分|
|Q24|2|部分|
|Q25|2|部分|
|Q26|2|部分|
|Q27|2|部分|
|Q28|2|部分|
|Q29|2|部分|
|Q30|3|部分|
|Q31|2|部分|
|Q32|3|部分|
|Q33|3|有据|
|Q34|2|部分|
|Q35|2|有据|
|Q36|2|部分|
|Q37|2|部分|
|Q38|2|部分|
|Q39|2|部分|
|Q40|2|部分|
|X01|3|部分|
|X02|2|部分|
|X03|3|部分|
|X04|3|部分|
|X05|2|部分|
|X06|5|部分|
|X07|2|部分|
|X08|2|部分|
|X09|3|部分|
|X10|2|部分|
|X11|3|部分|
|X12|3|部分|
|X13|3|缺失|
|X14|6|部分|

## Q01

教学30000现金、24000工资、12000生活、3000学习、12000投资 → 期末27000现金，持仓另列，按日期不透支

- Q01.1 按原教学输入期末现金2700000分；不与首单UX01叠加。 [部分]
  - 对应：src/core/economic-time.test.ts:24 executes the Q01 accounting sequence by actual dates and keeps investment value separate；src/application/market.test.ts:54 reaches old Q01 through normal employment, research, study and a real order without injected cash
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/kernel/t03-kernel-evidence.json#/actual/position/cashFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q01.2 持仓1100000分独立于现金，总财富3800000分。 [部分]
  - 对应：src/core/economic-time.test.ts:24 executes the Q01 accounting sequence by actual dates and keeps investment value separate；src/application/market.test.ts:54 reaches old Q01 through normal employment, research, study and a real order without injected cash
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/kernel/t03-kernel-evidence.json#/actual/position/investmentValueFen（T16 historical execution）；goal-1/evidence/t16-c16-final-a1/replay/kernel/t03-kernel-evidence.json#/actual/position/netAssetsFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q01.3 工资与生活/学习/投资按实际日期发生，最低现金1100000分，不透支。 [部分]
  - 对应：src/core/economic-time.test.ts:9 pauses before a future salary can cover an earlier gap and keeps the debt on resume (Q03)；src/core/economic-time.test.ts:24 executes the Q01 accounting sequence by actual dates and keeps investment value separate
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/kernel/t03-kernel-evidence.json#/minimumCashFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q02

4点已用再执行有成本动作 → 拒绝并说明；阅读与未执行计划取消不收费

- Q02.1 季度共享四点；用尽后有成本动作原子拒绝并显示原因。 [部分]
  - 对应：src/core/economy.test.ts:38 enforces a shared four-point budget and leaves failed reservations atomic；src/application/game-controller.test.ts:24 continues and cancels a real plan at zero available money and zero action points
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q02.2 阅读/只读投影不收费；未执行计划取消返还原预留，不返还已花成本。 [部分]
  - 对应：src/core/economy.test.ts:28 cancels only an unexecuted plan, returning its funds and reserved attention (Q02)；src/application/campaign.test.ts:228 makes memory favorites and news reading free without rerolling or triggering future news；src/application/clock-commitments.test.ts:18 normal clock review shows the actual500 start payment and original reservation without executing either
  - 实际字段：goal-1/evidence/t17-acceptance-01/native-current-r9-audit-a2/normal-browser-export-audit.json#/allByteEqual（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q03

月初不足、月末才有工资 → 不用未来收入付款；提供恢复或清算路径

- Q03.1 月初资金不足不能由月末工资垫付；欠款保留。 [部分]
  - 对应：src/core/economic-time.test.ts:9 pauses before a future salary can cover an earlier gap and keeps the debt on resume (Q03)；src/core/ledger.test.ts:101 records an unpaid due expense rather than borrowing future salary (Q03)；src/application/game-controller.test.ts:30 keeps deferred debt payable, starts zero-cash work, and pays only after the real salary date
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q03.2 资金缺口有真实恢复/有限清算路径，不无偿清债。 [部分]
  - 对应：src/application/game-controller.test.ts:30 keeps deferred debt payable, starts zero-cash work, and pays only after the real salary date；src/application/operations.test.ts:38 exposes loan principal, keeps partial repayment and fees due, and limits borrowing to the actual offer；src/application/epilogue.test.ts:58 personal zero cash does not erase the old principal, fee or living debt
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q04

同一命令或结算重复 → 仅一次流水与奖励，返回既有回执

- Q04.1 相同命令返回已有回执，即使原revision已旧；不重复奖励。 [部分]
  - 对应：src/core/commands.test.ts:15 advances once, returns a prior receipt before revision checks, and rejects changed intent；src/application/session.test.ts:45 coalesces reentrant/in-flight duplicates and isolates a failing view observer
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/save/t04-save-evidence.json#/actual/duplicate（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q04.2 同一结算或流水只记一次，重复日序不重复付钱。 [部分]
  - 对应：src/core/ledger.test.ts:28 returns one posting for replay and rejects reused IDs with changed intent；src/core/timeline.test.ts:19 stops at a required decision and resumes without replaying the processed event；src/core/commands.test.ts:15 advances once, returns a prior receipt before revision checks, and rejects changed intent
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q05

个人给企业注资并增估值 → 转账配平，估值不加现金、不重复算总财富

- Q05.1 个人向企业的资本转移双边配平，不算经营收入。 [部分]
  - 对应：src/core/ledger.test.ts:129 transfers capital between subjects and values equity without adding company cash twice (Q05)
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q05.2 企业增估值不增加现金，个人股权和企业主体不重复合并财富。 [部分]
  - 对应：src/core/ledger.test.ts:129 transfers capital between subjects and values equity without adding company cash twice (Q05)；src/core/ledger.test.ts:139 exchanges cash for a simulated asset and keeps unrealized losses outside income；src/ui/confirmation-money.test.ts:6 shows actual owner capital when the rule correctly reports zero expense
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q06

看到新闻/撮合结果后按过去价格买 → 最早进入后续有效撮合点，不穿越成交

- Q06.1 已看新闻/新报价后下单不能回到旧撮合点。 [部分]
  - 对应：src/application/market.test.ts:28 refuses stale quotes, already observed matching points and malformed lots without mutating the run；src/application/market.test.ts:58 cannot trade at the checkpoint whose new quote has already been seen during a world pause
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q06.2 最早在后续有效检查点成交，不以旧价兜底。 [部分]
  - 对应：src/application/market.test.ts:28 refuses stale quotes, already observed matching points and malformed lots without mutating the run；src/application/market.test.ts:75 does not substitute a price or rule for %s
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q07

停牌、无量、无资格订单 → 具体拒绝或未成交原因，不假装全部成交

- Q07.1 停牌和无量分别保留具体未成交原因，不假造全部成交。 [部分]
  - 对应：src/application/market.test.ts:33 never invents a fill for %s
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q07.2 无资格订单拒绝，数量、制度与未知价格不兜底。 [部分]
  - 对应：src/application/market.test.ts:41 requires a simulated entitlement and refuses every real historical mode request；src/application/market.test.ts:75 does not substitute a price or rule for %s；src/application/market.test.ts:92 keeps missing quotes unavailable until a fresh explicit reference is supplied
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q08

真实行情/制度来源不全 → 仅明确模拟，不使用真实名称配虚构价格冒充回放

- Q08.1 真实历史源不全时拒绝真实回放模式。 [部分]
  - 对应：src/application/market.test.ts:41 requires a simulated entitlement and refuses every real historical mode request
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q08.2 股票名称/报价持续标模拟，不以现实名称配虚构价格。 [部分]
  - 对应：src/application/market.test.ts:41 requires a simulated entitlement and refuses every real historical mode request；src/ui/CinematicRoom.test.tsx:11 renders a read-only room without advancing, including delivery and end-of-range UI projections
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q09

视频有播放但无商单或变现资格 → 曝光变化，现金不凭空增加

- Q09.1 真实发布有曝光反馈，但未获变现资格不加现金。 [部分]
  - 对应：src/application/video.test.ts:5 produces and publishes a real manual work; unqualified views generate no money；src/application/video.test.ts:129 separates portfolio, program approval, measured ad income and actual platform payout without retroactive qualification
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/video/t10-video-evidence.json#/cases/1/actual/firstPublicationIncomeFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q09.2 商单、平台应收与实际回款分别发生，不因播放量直接加钱。 [部分]
  - 对应：src/application/video.test.ts:129 separates portfolio, program approval, measured ad income and actual platform payout without retroactive qualification；src/application/video.test.ts:36 replays the independent F02 ledger through three real commissions and paid rework across two quarters
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q10

视频返工占满产能 → 增加成本或延后，不免费重复、不无限接单

- Q10.1 返工占共享人力/日期，产能冲突拒绝或另行排期。 [部分]
  - 对应：src/application/video.test.ts:52 Q10 rejects overlapping video jobs, protects deposits and retains spent costs when exiting an interrupted rework；src/application/operations.test.ts:44 does not duplicate an employee when another owned business accepts overlapping work
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q10.2 追加修改有实际成本、谈判或有限退出，不免费无限接单。 [部分]
  - 对应：src/application/video.test.ts:171 handles a third client revision with paid negotiation, a finite deadline default and no free accepted output；src/application/video.test.ts:284 charges AI material quality correction without spending the client modification allowance；src/application/video.test.ts:318 can exit or hit the finite deadline during a pending negotiation without losing refund duties
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q11

200人199元，20退款，其余交付 → 收入35820、给定费用后利润23029

- Q11.1 独立F03为200人×199元，20退款后确认收入3582000分。 [部分]
  - 对应：src/application/course.test.ts:8 executes F03 through actual production, intake, two stages, post-delivery refunds and paid support
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/course/t11-course-evidence.json#/cases/0/actual/incomeFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q11.2 费用1279100分、利润2302900分，实际生产/阶段/支持均履行；财务夹具与正常生活费分开。 [部分]
  - 对应：src/application/course.test.ts:8 executes F03 through actual production, intake, two stages, post-delivery refunds and paid support
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/course/t11-course-evidence.json#/cases/0/actual/costFen（T16 historical execution）；goal-1/evidence/t16-c16-final-a1/replay/course/t11-course-evidence.json#/cases/0/actual/profitFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q12

收10000、半交付、付成本2000 → 现金8000、负债5000、可动用3000，不可挪用保护款

- Q12.1 原预款1000000分，半交付后付200000分成本，现金800000分。 [部分]
  - 对应：src/application/course.test.ts:12 executes Q12/F05 with pre-existing paid assets, zero opening snapshot cash and a real half delivery；src/core/ledger.test.ts:52 keeps a prepayment protected until delivery and separates cash from profit (Q12)
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/course/t11-course-evidence.json#/cases/1/actual/cashFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q12.2 未履约负债/保护500000分，可动用300000分；保护款不能代付生产。 [部分]
  - 对应：src/application/course.test.ts:12 executes Q12/F05 with pre-existing paid assets, zero opening snapshot cash and a real half delivery；src/application/course.test.ts:13 previews the future support quarter and refuses using student deposits to pay production
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/course/t11-course-evidence.json#/cases/1/actual/heldFen（T16 historical execution）；goal-1/evidence/t16-c16-final-a1/replay/course/t11-course-evidence.json#/cases/1/actual/availableFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q13

中转收入30000、成本18000/3000/2000/1500 → 利润5500，未用充值不计收入

- Q13.1 F04收入3000000分，供应/支持/维护/费用合计2450000分，利润550000分。 [部分]
  - 对应：src/application/relay.test.ts:4 executes F04 through actual daily service and due supplier invoices without spending protected recharge cash
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/0/actual/metrics/profitFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q13.2 未用充值保留为负债和保护，不计收入；实际日用量和供应账期独立。 [部分]
  - 对应：src/application/relay.test.ts:4 executes F04 through actual daily service and due supplier invoices without spending protected recharge cash；src/application/relay.test.ts:19 keeps prepaid supplier assets separate from cost and refunds unused credit without a second income
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/0/actual/funds/prepaidLiabilityFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q14

两上游共享故障域、客户尚有余额 → 非完全独立冗余；停服不抹掉客户负债

- Q14.1 两供应商共享故障域不能构成独立冗余，只有已授权独立备选能避开该故障。 [部分]
  - 对应：src/application/relay.test.ts:17 treats %s according to its actual failure domain and permission rather than provider count
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/3/actual/missedUnits（T16 historical execution）；goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/4/actual/missedUnits（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q14.2 停站保留客户余额、退款和旧任务，不直接关闭企业。 [部分]
  - 对应：src/application/relay.test.ts:18 keeps customer balances through stopping and refuses closure until real refunds and old jobs finish
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/1/actual/business/prepaidLiabilityFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q15

只有钱/技术适配就申请DeepSeek股权 → 不生成历史公开申购；须资格与对方意愿

- Q15.1 技术适配和有钱不生成现实公开申购入口，架空模式另行同意。 [部分]
  - 对应：src/application/deepseek.test.ts:7 keeps historical public subscription, technical adaptation, money and actual counterfactual rights distinct
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q15.2 须真实资格、对方融资意愿及已完成谈判；他方拒绝不能用钱覆盖。 [部分]
  - 对应：src/application/equity.test.ts:14 does not replace missing counterparty financing consent with money or a technical skill；src/application/deepseek.test.ts:11 can decline completed but rejected counterpart terms without receiving any equity
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-deepseek-evidence.json#/cases/8/id（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q16

架空投前800万、增资200万；后续再融资 → 先20%，按E02不跟投后16%；治理/退出仍按条款

- Q16.1 E01投前800000000分，实增200000000分，250000/1250000股为20%。 [部分]
  - 对应：src/application/deepseek.test.ts:9 records E01 and E02 actual integer shares, passive dilution and no free cash or governance
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-deepseek-evidence.json#/cases/0/actual/rounds/0/preMoneyFen（T16 historical execution）；goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-deepseek-evidence.json#/cases/0/actual/rounds/0/totalShares（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q16.2 E02新增312500股，不跟投后250000/1562500股为16%，不免费付跟投资金。 [部分]
  - 对应：src/application/deepseek.test.ts:9 records E01 and E02 actual integer shares, passive dilution and no free cash or governance；src/application/equity.test.ts:7 requires separately paid follow-on consent and actual cash to preserve the original20percent
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-deepseek-evidence.json#/cases/0/actual/agreements/0/holdingBps（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q16.3 股权、董事权、锁定与退出按独立条款，不能默认获治理或买方。 [部分]
  - 对应：src/application/equity.test.ts:8 requires an actually negotiated board right and a completed meeting before a limited project policy changes；src/application/equity.test.ts:10 retains locked shares at actual2025year end without assuming a buyer or free liquidation；src/application/equity.test.ts:12 can have short lock terms and still find no actual exit buyer
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-deepseek-evidence.json#/cases/0/actual/agreements/0/board（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q17

不点新闻推进日期 → 事件仍发生，同一节点影响相关路线

- Q17.1 不打开新闻，按日期所有历史节点仍发生。 [部分]
  - 对应：src/application/campaign.test.ts:75 advances every historical anchor without opening news, while keeping missing access and unpaid duties
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/world/t05-world-evidence.json#/cases/0/actual/readNews（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q17.2 同一真实世界节点传播到相关路线，阅读不决定世界是否发生。 [部分]
  - 对应：src/application/story-combined.test.ts:9 consumes one actual R1 source in market, an existing course and a real second business in the same normal run；src/application/course.test.ts:16 uses the actual H004 world event once and only completes a paid seven-day refresh after physical work
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q18

林舟工具分岔 → 经营条件与记忆两种实际变化；无关域不清空

- Q18.1 林舟分岔需已履约合作、对方同意和实际发布参与权。 [部分]
  - 对应：src/application/story-history.test.ts:15 normally reaches the open tool branch with %s；src/application/story-history.test.ts:16 money without an actual case cannot buy collaboration or publication control；src/application/story-history.test.ts:17 paid completed collaboration cannot force the other actor to agree
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q18.2 开放/封闭改变经营条件与局部记忆两种真实结果，不清空无关域。 [部分]
  - 对应：src/application/story-history.test.ts:15 normally reaches the open tool branch with %s；src/application/life.test.ts:97 does not change market randomness or the original Linzhou decision merely by setting a life priority
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/story/t14-story-evidence.json#/cases/6/actual/story/linzhou/branch（T16 historical execution）；goal-1/evidence/t16-c16-final-a1/replay/story/t14-story-evidence.json#/cases/8/actual/story/linzhou/branch（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q19

调查、读档、预览或变更窗口 → 隐藏事实与随机状态不因UI重抽

- Q19.1 调查/导入保留预冻结隐藏事实和随机状态，不把证据揭示当重抽。 [部分]
  - 对应：src/persistence/codec.test.ts:91 preserves frozen facts and random state through paid investigation, preview and import；src/application/story-history.test.ts:21 preview and visible reports do not reveal frozen intent or consume a random stream
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q19.2 预览/窗口/场景翻阅为只读，不能因UI增删改变随机；私密状态不进入读模型。 [部分]
  - 对应：src/application/market.test.ts:49 does not consume any random domain for previews, projections, plans or cancellations；src/application/life-year.test.ts:24 reading people/years/scenes never changes cash, AP, timeline or random and excludes private notes/hidden facts；src/application/clock-commitments.test.ts:51 clock queries reject stale/non-clock/out-of-range requests and never publish private notes or hidden state
  - 实际字段：goal-1/evidence/t17-acceptance-01/native-current-r9-audit-a2/normal-browser-export-audit.json#/allByteEqual（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q20

危机0行动0可用现金 → 能有限停新业务/撤权或停工推进，不免费接管

- Q20.1 危机实际0行动/0可用现金仍可停止可控新增行为并有限推进。 [部分]
  - 对应：src/application/story-agency.test.ts:29 reaches actual zero cash available and zero AP with paid hires, keeps old debt, and can stop and enter the next quarter；src/application/relay.test.ts:28 stops and refunds through a finite path with zero remaining attention and zero spendable cash
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/story/t14-story-evidence.json#/cases/10/id（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q20.2 撤权/停工不等于免费调查、拆离、观察或人工接管；原债保留。 [部分]
  - 对应：src/application/story-agency.test.ts:22 stopping the owned channel keeps the used fee and gives no independent withdrawal proof；src/application/story-risk.test.ts:24 pays for actual isolation, investigation, a full window and replacement while retaining old customer money；src/application/story-risk.test.ts:25 a paid takeover changes actual new-business control but leaves funding and old duties accessible
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q21

只有暂停回执，无独立验证 → 不能宣称恢复控制；证据不足状态明确

- Q21.1 只有自身停止/暂停回执不能宣称独立恢复控制。 [部分]
  - 对应：src/application/story-risk.test.ts:23 does not mistake a free owned stop report for independently verified recovery；src/application/story-agency.test.ts:22 stopping the owned channel keeps the used fee and gives no independent withdrawal proof
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q21.2 独立验证窗口、原责任清单与替代条件不足时，证据不足状态明确。 [部分]
  - 对应：src/application/story-risk.test.ts:24 pays for actual isolation, investigation, a full window and replacement while retaining old customer money；src/application/story-risk.test.ts:55 does not accept an incomplete reviewed liability list before doing any recovery work；src/application/story-risk.test.ts:57 lowering future scope records the adjustment without pretending that the independent external channel was stopped
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q22

正常24季度，非软件创业人生 → 投资/内容/服务都有完整结局，五机会按前提可达

- Q22.1 两背景正常创建实际关闭24季度，含保留工作与不采用代理。 [部分]
  - 对应：src/application/journey.test.ts:47 a normal no-agent working life records all 24 real quarters, salaries and costs without viewing rewards；src/application/story-risk-modes.test.ts:9 not using an agent still permits income, normal time and independent external organisations
  - 实际字段：goal-1/evidence/t16-epilogue/matrix-full-r2-checked.json#/closed24（T16 historical execution）；goal-1/evidence/t16-epilogue/matrix-full-r2/t16-journey-evidence.json#/results/0/phase（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q22.2 投资、内容、服务各有真实收入和完整回顾，不能把未完成策略仅归档说成该路线成功。 [部分]
  - 对应：src/application/deepseek-normal.test.ts:3 reaches actual ecosystem service and small counterfactual equity from normal2020 %s without snapshot grants；src/application/course.test.ts:32 reaches the S02 video-to-course loop from a normal %s start with separate company finances；src/application/video.test.ts:197 reaches qualified image-assisted video from a normal %s start with actual living costs
  - 实际字段：goal-1/evidence/t16-epilogue/matrix-full-r2-checked.json#/strategyStoppedOrRefused（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q22.3 五机会按真实前提可达，非程序员软件创业单一路径。 [部分]
  - 对应：src/application/deepseek-normal.test.ts:3 reaches actual ecosystem service and small counterfactual equity from normal2020 %s without snapshot grants；src/application/course.test.ts:32 reaches the S02 video-to-course loop from a normal %s start with separate company finances；src/application/market.test.ts:54 reaches old Q01 through normal employment, research, study and a real order without injected cash
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-deepseek-evidence.json#/cases/13/actual/origin（T16 historical execution）
  - 余项/边界：42正常结果中13项策略受阻保留；步骤5逐形态核对主策略成功/被拒/有限退出，步骤11当前重验，不以归档代替路线完成。

## Q23

目标视口、200%缩放和键盘 → 主操作可达、焦点正确，保存与模拟/架空标识可见

- Q23.1 目标桌面核心选择可达，保存及模拟/架空标识持续可见。 [有据]
  - 对应：src/ui/NarrativeScene.test.tsx:27 scene choices are read-only and keep delivery, end-of-range and read-only action guards；src/ui/CinematicRoom.test.tsx:11 renders a read-only room without advancing, including delivery and end-of-range UI projections
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-r9/final-life-geometry.json#/outsideViewport（T17 steps1-3 execution, source matched; not executed again in this index）；goal-1/evidence/t17-acceptance-01/chrome-r9/final-life-geometry.json#/scroll（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前限定三桌面和所验证场景；全部形态继续步骤5/12。
- Q23.2 真实200%浏览器缩放仍须实际验收，不能拿等效小视口替代。 [后置]
  - 对应：尚无实际测试/人测
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：真实菜单缩放与完整原生离页结果待M01；未标通过。
- Q23.3 键盘编号/翻页/对话框及焦点恢复正确，编辑不误触。 [有据]
  - 对应：src/ui/scene-play.test.tsx:21 numbered thoughts navigate, while modal dialogs and editing keep their keys；src/ui/book-layout.test.ts:4 keeps every column reachable including a last page with a single line；src/ui/NarrativeScene.test.tsx:27 scene choices are read-only and keep delivery, end-of-range and read-only action guards
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-r9/final-life-geometry.json#/books/0/offPageTabStops（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：本轮已验证的焦点链有据；完整兼容矩阵在M01归还。

## Q24

损坏/高版本导入、旧revision写入 → 保留旧档，给具体错误，不静默覆盖

- Q24.1 损坏/高版本/不兼容导入具体拒绝并保留原始旧档。 [部分]
  - 对应：src/persistence/codec.test.ts:76 refuses corrupt, higher-version, incompatible and oversized files with explicit errors；src/persistence/library.test.ts:9 lists and exports an existing incompatible save without executing or silently converting it；src/application/journey.test.ts:19 rejects the actual prior schema12 export without rewriting its original text
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q24.2 旧revision及同revision物理代次旧写者不能覆盖另一提交。 [部分]
  - 对应：src/persistence/indexeddb.test.ts:33 restores an older snapshot explicitly while preventing an old same-revision writer from overwriting it；src/persistence/indexeddb.test.ts:72 allows one conflicting revision winner while deduplicating the same concurrent command；src/application/session.test.ts:81 keeps a conflicting candidate exportable and requires explicit discard before reload
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/save/t04-save-evidence.json#/actual/stale（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q25

计划资金转换为订单冻结 → 同一占款移动，不重复扣可用现金

- Q25.1 计划资金转订单冻结沿用同一预留，占款不重复扣可用现金。 [部分]
  - 对应：src/core/ledger.test.ts:39 moves the same reservation into an order and releases only its remainder；src/application/market.test.ts:18 converts the same planned reservation, partially fills shared volume, then cancels only the remainder
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q25.2 部分使用及剩余释放精确，不把释放当收入。 [部分]
  - 对应：src/core/ledger.test.ts:39 moves the same reservation into an order and releases only its remainder；src/application/market.test.ts:18 converts the same planned reservation, partially fills shared volume, then cancels only the remainder
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q26

已交付课程后退款 → 冲减收入/应收，赔偿另列；不伪造未履约负债

- Q26.1 已交付课程退款冲减原确认收入或未收应收。 [部分]
  - 对应：src/core/ledger.test.ts:77 reduces delivered income for a refund instead of inventing a prepayment liability (Q26)；src/core/ledger.test.ts:89 recognizes postpaid delivery once and applies a refund against unpaid receivables；src/application/course.test.ts:8 executes F03 through actual production, intake, two stages, post-delivery refunds and paid support
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q26.2 实际赔偿另列，缺现金保留应付，不重造未履约负债。 [部分]
  - 对应：src/core/ledger.test.ts:156 retains a delivered refund as payable when cash is missing, including after a partial payment；src/core/ledger.test.ts:169 keeps source and original delivery references on non-cash refund corrections；src/application/course.test.ts:17 stops new sales but retains old support, update and refund duties until the finite close path
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q27

中转重复用量上报后更正 → 不重复收费；更正关联原记录，不覆盖账单

- Q27.1 重复用量ID不重复收费、成本、现金或抽随机。 [部分]
  - 对应：src/application/relay.test.ts:9 reuses an observed meter ID without duplicate usage, cash, costs or random draws
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q27.2 审计更正逐条关联原计量/账单，不改写已发生记录或重计收入。 [部分]
  - 对应：src/application/relay.test.ts:10 audits real %s reporting and appends an original-reference correction exactly once；src/application/relay-finance.test.ts:7 can settle a refunded delivery using its restored protection bucket while preserving all unconsumed customer money
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/1/actual/corrections（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q28

股票部分成交后撤剩余 → 仅按已成交部分更新仓位和资金，剩余冻结准确释放

- Q28.1 部分成交只更新实际成交的股份、成本与资金。 [部分]
  - 对应：src/application/market.test.ts:18 converts the same planned reservation, partially fills shared volume, then cancels only the remainder；src/application/market.test.ts:88 conserves weighted cost and buy fees across partial sales until the final share is sold
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q28.2 撤余量只释放未成交冻结/股份锁；已成交与独立交收仍保留。 [部分]
  - 对应：src/application/market.test.ts:18 converts the same planned reservation, partially fills shared volume, then cancels only the remainder；src/application/market.test.ts:66 locks sale shares across orders and releases the lock on cancellation；src/application/market.test.ts:79 charges a minimum fee once across multiple fills and blocks closure until the sale receivable settles
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q29

同一员工/时间段重复分配 → 超容量拒绝或重新排期，不两份任务都满产

- Q29.1 同一员工/日期在多个业务共用容量，不生成第二个人。 [部分]
  - 对应：src/application/operations.test.ts:44 does not duplicate an employee when another owned business accepts overlapping work；src/application/operations.test.ts:41 shares the player production pool with world preparation instead of granting a second personal resource
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q29.2 返工、课程支持、世界准备跨业务冲突拒绝或显式重排。 [部分]
  - 对应：src/application/course.test.ts:30 shares future support capacity with video jobs and never offers a larger unpaid class than its actual plan；src/application/story-history.test.ts:18 story work and video production cannot book the same person twice；src/application/operations.test.ts:29 reschedules planned capacity atomically and ignores old timers after actual completion
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q30

同日历史更新、到账、义务、动作、撮合 → 稳定顺序；未来收入、刚看到的行情不能追溯获益

- Q30.1 同日世界→确定到账→到期义务→动作→撮合→快照按原阶段稳定执行。 [部分]
  - 对应：src/core/timeline.test.ts:5 processes every same-day phase and orders equal priorities by stable instance ID (Q30)；src/application/market.test.ts:58 cannot trade at the checkpoint whose new quote has already been seen during a world pause
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q30.2 同优先级按稳定ID，不因新事件或继续暂停重复旧处理。 [部分]
  - 对应：src/core/timeline.test.ts:5 processes every same-day phase and orders equal priorities by stable instance ID (Q30)；src/core/timeline.test.ts:19 stops at a required decision and resumes without replaying the processed event；src/core/timeline.test.ts:34 processes newly scheduled follow-ups before advancing past their dates
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q30.3 未来工资不能支付此前费用，已见行情不能倒流成交。 [部分]
  - 对应：src/core/economic-time.test.ts:9 pauses before a future salary can cover an earlier gap and keeps the debt on resume (Q03)；src/application/market.test.ts:58 cannot trade at the checkpoint whose new quote has already been seen during a world pause
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q31

课程停售或中转停站 → 旧交付、退款、余额和应付留存，清算后才能closed

- Q31.1 课程停售保留旧教学、更新、支持和退款，实际结束才能关闭。 [部分]
  - 对应：src/application/course.test.ts:17 stops new sales but retains old support, update and refund duties until the finite close path
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q31.2 中转停站保留未用充值、退款、供应应付与旧任务，清算后才能closed。 [部分]
  - 对应：src/application/relay.test.ts:18 keeps customer balances through stopping and refuses closure until real refunds and old jobs finish；src/application/relay.test.ts:31 recognizes only the actual partial-cycle support fee after stopping, keeping the unearned balance protected；src/ui/work-visibility.test.ts:31 archives cancelled contracts only after their original obligation is actually paid
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/1/actual/business/prepaidLiabilityFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q32

2025年末尚有预款、欠款和锁定股权 → 尾声结清/转让/计提，不免费确认利润或峰值套现

- Q32.1 2025年末未结预款/欠款和锁定股权继续保留，归档不是清债。 [部分]
  - 对应：src/application/epilogue.test.ts:42 keeps original Q4 points, living expenses and the original loan while settling actual future dates；src/application/epilogue.test.ts:58 personal zero cash does not erase the old principal, fee or living debt；src/application/epilogue.test.ts:74 archives without clearing liabilities, preserves the first record on resume, and never renews the budget；src/application/equity.test.ts:10 retains locked shares at actual2025year end without assuming a buyer or free liquidation
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q32.2 尾声沿实际收款/退款/处置/计提与原Q4行动，不免费确认收入或按峰值卖股。 [部分]
  - 对应：src/application/epilogue.test.ts:66 exposes over-reserved old future plans without permitting a fifth closing point；src/application/epilogue.test.ts:91 requires an explicit bounded recovery assumption and does not turn it into cash；src/application/equity.test.ts:11 records partial private share disposal and delayed collection separately from the remaining position；src/ui/ending-stage.test.tsx:14 retains the actual old partial-sale ending and every dated recovery assumption in the public read-only review
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q32.3 回收估计需明确假设，估计不入现金，继续旧事项保留原回顾。 [部分]
  - 对应：src/application/epilogue.test.ts:91 requires an explicit bounded recovery assumption and does not turn it into cash；src/application/epilogue.test.ts:100 the public product controller reaches, archives and resumes the earned ending, then starts an independent life；src/ui/ending-stage.test.tsx:14 retains the actual old partial-sale ending and every dated recovery assumption in the public read-only review
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q33

持久化中途失败 → 旧提交完整；候选显示未保存，不能继续静默写入

- Q33.1 head.put成功后事务中止，旧完整提交和物理旧档仍为Jan6/3。 [有据]
  - 对应：src/application/session.test.ts:17 keeps a failed candidate visibly unsaved, blocks new mutations, exports it and retries once；src/application/game-controller.test.ts:18 keeps an aborted controller candidate private, blocks exit, and retries the original result
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-dev-a1/workspace-completion-old-saved-s3.json#/state/timeline/cursor/date（T17 steps1-3 execution, source matched; not executed again in this index）；goal-1/evidence/t17-acceptance-01/chrome-readonly-a1/physical-old-s3-readonly.json#/revision（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：限定IndexedDB实际中途abort；不声称断电或磁盘损坏测试。
- Q33.2 候选单独标未保存，界面不提前改日期/完成场景，新写入被阻挡。 [有据]
  - 对应：src/application/session.test.ts:17 keeps a failed candidate visibly unsaved, blocks new mutations, exports it and retries once；src/application/game-controller.test.ts:18 keeps an aborted controller candidate private, blocks exit, and retries the original result；src/application/world-session.test.ts:9 does not publish world evidence before the entire state/receipt/cause transaction commits
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-dev-a1/workspace-completion-old-saved-s3.json#/state/life/jobs/0/status（T17 steps1-3 execution, source matched; not executed again in this index）；goal-1/evidence/t17-acceptance-01/chrome-dev-a1/workspace-completion-unsaved-candidate-s4.json#/state/life/jobs/0/status（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前真实候选/旧UI和API阻挡有据。
- Q33.3 只重试原候选，实际commit后才发布完成，另一物理连接读回相同新4。 [有据]
  - 对应：src/application/session.test.ts:17 keeps a failed candidate visibly unsaved, blocks new mutations, exports it and retries once；src/application/world-session.test.ts:9 does not publish world evidence before the entire state/receipt/cause transaction commits
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-dev-a1/retried-workspace-completion-s4.json#/revision（T17 steps1-3 execution, source matched; not executed again in this index）；goal-1/evidence/t17-acceptance-01/chrome-readonly-a1/physical-retried-s4-readonly.json#/revision（T17 steps1-3 execution, source matched; not executed again in this index）；goal-1/evidence/t17-acceptance-01/native-current-r9-audit-a2/normal-browser-export-audit.json#/allByteEqual（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：候选/重试/物理4与旧3/物理3整档字节相等另行核对。

## Q34

超限/非法字段/带HTML存档 → 拒绝非法数据、文本转义，旧档保留

- Q34.1 超限、非法字段、坏checksum及非法引用拒绝，旧档原字节保留。 [部分]
  - 对应：src/persistence/codec.test.ts:52 rejects a resigned but malformed save: %s；src/persistence/codec.test.ts:76 refuses corrupt, higher-version, incompatible and oversized files with explicit errors；src/persistence/codec-encoding.test.ts:33 retains canonical UTF8 expansion limits before invalid-envelope or unsupported-version errors；src/core/commands.test.ts:32 rejects foreign identity, malformed data and raw money commands before mutation
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q34.2 允许的玩家文本含HTML时仅作文本转义展示，不执行任意代码。 [部分]
  - 对应：src/core/commands.test.ts:32 rejects foreign identity, malformed data and raw money commands before mutation
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：命令测试证实标签字符串保留且不泄露私密投影；当前专用浏览器/DOM转义检查需步骤6/12核对，不能用Node存储断言代替渲染。

## Q35

相同commandId不同payload → COMMAND_ID_REUSED，不复用错误回执或再扣一次

- Q35.1 相同commandId但payload不同，返回COMMAND_ID_REUSED。 [有据]
  - 对应：src/core/commands.test.ts:15 advances once, returns a prior receipt before revision checks, and rejects changed intent
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/save/t04-save-evidence.json#/actual/changed（T16 historical execution）
  - 余项/边界：当前已执行的commands用例直接检查此拒绝，旧save字段单独标历史。
- Q35.2 拒绝不返回错误旧回执、不再次扣钱；相同载荷重试才复用原回执。 [有据]
  - 对应：src/core/commands.test.ts:15 advances once, returns a prior receipt before revision checks, and rejects changed intent；src/application/session.test.ts:45 coalesces reentrant/in-flight duplicates and isolates a failing view observer
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前共同命令入口/会话用例已执行；不将独立新commandId当作重复意图。

## Q36

花1点启动7天课程更新 → 不当天宣称完成；中断保留费用与义务，完成不双扣

- Q36.1 课程更新花1点并经历真实七天，开始当天不完成。 [部分]
  - 对应：src/application/course.test.ts:16 uses the actual H004 world event once and only completes a paid seven-day refresh after physical work；src/application/campaign.test.ts:19 starts a real seven-day preparation, charges once and grants readiness only on completion
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q36.2 中断保留已花费用/AP与原学员义务，完成不再扣一次。 [部分]
  - 对应：src/core/economy.test.ts:49 keeps spent points and costs after interruption and does not complete early；src/application/campaign.test.ts:105 leaves costs and spent action points after an interrupted preparation, without awarding its completion；src/application/course.test.ts:16 uses the actual H004 world event once and only completes a paid seven-day refresh after physical work
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q37

加一条闲聊/非相关事件 → 市场随机域不变；相关世界改变仍能有因果影响

- Q37.1 无关闲聊/生活或事件不改市场随机域，序列化后续接同流。 [部分]
  - 对应：src/core/random.test.ts:20 derives independent domains and resumes the exact stream from serialized state；src/application/life.test.ts:97 does not change market randomness or the original Linzhou decision merely by setting a life priority；src/application/market.test.ts:49 does not consume any random domain for previews, projections, plans or cancellations
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q37.2 相关世界改变可按真实来源影响相应域，不把全部域清零或锁死。 [部分]
  - 对应：src/application/story-combined.test.ts:9 consumes one actual R1 source in market, an existing course and a real second business in the same normal run；src/application/story-history.test.ts:15 normally reaches the open tool branch with %s
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/world/t05-world-evidence.json#/cases/0/actual/marketRandomMatchesQuoteClock（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q38

测试快照能玩但正常流程没前置 → M4判失败；必须提供正常开局可达路径

- Q38.1 财务/权限快照能运行不算正常可达；M4必须从CreateRun保留前置和资源来源。 [部分]
  - 对应：src/application/deepseek-normal.test.ts:3 reaches actual ecosystem service and small counterfactual equity from normal2020 %s without snapshot grants；src/application/course.test.ts:32 reaches the S02 video-to-course loop from a normal %s start with separate company finances；src/application/video.test.ts:197 reaches qualified image-assisted video from a normal %s start with actual living costs
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q38.2 两背景五路线需真实获客/资格/技能/工资/日期前史，不赠资金或授权。 [部分]
  - 对应：src/application/deepseek-normal.test.ts:3 reaches actual ecosystem service and small counterfactual equity from normal2020 %s without snapshot grants；src/application/course.test.ts:32 reaches the S02 video-to-course loop from a normal %s start with separate company finances；src/application/market.test.ts:54 reaches old Q01 through normal employment, research, study and a real order without injected cash
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-deepseek-evidence.json#/cases/13/actual/origin（T16 historical execution）；goal-1/evidence/t16-c16-final-a1/replay/course/t11-course-evidence.json#/cases/2/actual/origin（T16 historical execution）；goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/1/actual/origin（T16 historical execution）
  - 余项/边界：旧正常主路径有据；步骤5仍须逐产品形态/关键与默认分支检查，不能用一条成功链代替全部形态。

## Q39

同一受众反复导向同一期课程 → 同一转化不重复收款；新产品需新需求/交付

- Q39.1 同一人口身份/产品版本跨账号与班期不重复转化收款。 [部分]
  - 对应：src/application/video.test.ts:69 does not convert the same qualified client twice, even after cancellation or reopening a channel；src/application/video.test.ts:149 Q39 keeps finite shared audience identities and one affiliate purchase per product version, including returns；src/application/course.test.ts:13 previews the future support quarter and refuses using student deposits to pay production
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q39.2 维护更新不生成新付费身份；新产品必须新需求研究、样课和实际交付。 [部分]
  - 对应：src/application/course.test.ts:16 uses the actual H004 world event once and only completes a paid seven-day refresh after physical work；src/application/course.test.ts:18 requires actual extra support for complaints, then allows a new-demand study rather than rebilling a maintenance version
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## Q40

事件到期无人响应、0资源 → 明确默认分支且可继续；不免费领取有成本成果

- Q40.1 事件到期有明确免费默认，0现金/0AP仍有限停止并继续。 [部分]
  - 对应：src/application/campaign.test.ts:40 expires with a real free stop branch at zero cash and zero action points；src/core/content.test.ts:5 rejects arbitrary operators and a default branch that charges resources
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/world/t05-world-evidence.json#/cases/3/origin（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- Q40.2 默认不领取收费成果或新承诺，互斥分支后继仍可处理。 [部分]
  - 对应：src/application/campaign.test.ts:240 uses the free default for a mutually exclusive follow-up after the first branch was accepted；src/application/campaign.test.ts:40 expires with a real free stop branch at zero cash and zero action points；src/application/equity.test.ts:20 shows unresponded invitations and old accepted terms as effectively expired by the actual game date, with no default payment；src/application/life-workbench.test.ts:14 leaves the final response day usable and advances the ignored invitation to its real default event
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X01

UX01接单分支按日期执行 → 回款1300、成本500、净赚800；期末42800；旧Q01仍27000，不在2020开放未来模型

- X01.1 UX01技术分支按Jan5成本500、Jan20回款1300，净800，季末42800。 [部分]
  - 对应：src/application/first-order.test.ts:14 earns the manual first order from a normal %s start
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/first-order/t07-first-order-evidence.json#/cases/0/actual/cashFen（T16 historical execution）；goal-1/evidence/t16-c16-final-a1/replay/first-order/t07-first-order-evidence.json#/cases/0/actual/result/netOrderFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X01.2 旧Q01仍27000，内容背景独立为36800，不混算两教学结果。 [部分]
  - 对应：src/application/market.test.ts:54 reaches old Q01 through normal employment, research, study and a real order without injected cash；src/application/first-order.test.ts:14 earns the manual first order from a normal %s start
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/kernel/t03-kernel-evidence.json#/actual/position/cashFen（T16 historical execution）；goal-1/evidence/t16-c16-final-a1/replay/first-order/t07-first-order-evidence.json#/cases/1/actual/cashFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X01.3 2020不开放未来图像/视频模型；手工生产持续明确。 [部分]
  - 对应：src/application/video.test.ts:91 gates image and video tools by actual world date and separately earned access, including expiry；src/application/course.test.ts:6 keeps future courses gated and previewing them does not change the run
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/first-order/t07-first-order-evidence.json#/cases/0/actual/productionMode（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X02

投资玩家跳过第一单，或自由选择起始计划 → 可正常继续；不因没赚800而失败，不强制创业；五入口可查看准备条件

- X02.1 可拒绝/跳过首单，按投资或自由计划正常继续，不以没赚800判失败。 [部分]
  - 对应：src/application/first-order.test.ts:24 keeps %s free and allows ordinary quarterly continuation；src/application/game-controller.test.ts:10 creates and resumes a normal game through the same public controller, saving before publishing choices
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/first-order/t07-first-order-evidence.json#/cases/3/actual/result/paymentFen（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X02.2 不强迫创业，五路线始终可查准备和时代门槛。 [部分]
  - 对应：src/ui/CinematicRoom.test.tsx:11 renders a read-only room without advancing, including delivery and end-of-range UI projections；src/application/video.test.ts:91 gates image and video tools by actual world date and separately earned access, including expiry；src/application/deepseek.test.ts:7 keeps historical public subscription, technical adaptation, money and actual counterfactual rights distinct
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X03

默认工作台与展开账本切换 → 金额/主体一致；默认能找到可花现金、最早缺口和未履约；无需打开总账才可普通推进

- X03.1 场景与展开账本的账户主体/钱数一致，现金与企业不混合。 [部分]
  - 对应：src/application/cash-forecast.test.ts:7 forecasts only committed income and spending, without turning an unaccepted first order into money；src/application/life-year.test.ts:9 keeps actual annual cash, salary and ownership separate, without using today balance as the previous year；src/ui/confirmation-money.test.ts:6 shows actual owner capital when the rule correctly reports zero expense
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-r9/r9-actual-next-quarter-s25.json#/state/personalAccountId（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X03.2 默认能找到可花、最早承诺缺口、未履约，全部主体缺口不截断。 [部分]
  - 对应：src/ui/NarrativeScene.test.tsx:117 the cinematic layer retains every known account shortfall rather than selecting one highlight；src/ui/work-visibility.test.ts:27 does not call missing balances or an unreadable obligations account settled；src/application/cash-forecast.test.ts:7 forecasts only committed income and spending, without turning an unaccepted first order into money
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X03.3 普通日期无需打开总账即可推进，仍可先核对费用。 [有据]
  - 对应：src/ui/clock-advance.test.tsx:12 time controls expose the original500 and optional review without rendering or executing a mandatory time dialog；src/ui/clock-command-details.test.tsx:10 renders the actual original dated500 payment and reservation separately from a free clock instruction
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-r9/r9-actual-next-quarter-s25.json#/revision（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：R7完整首季与R9原生Space跨季有据；其他复杂场景继续步骤5/12。

## X04

同版本同种子同指令，手动与已授权批处理 → 规则状态、账本、日期和随机域相同；草稿复用不扣钱，不越界交易/招生/扩权

- X04.1 同版本/种子/同序已确认动作，逐步手动与批处理完整档/账目/日期/随机相同。 [部分]
  - 对应：src/application/routines.test.ts:16 produces byte-identical saved runs for manual step execution and batch execution of the same confirmed instructions
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/5/actual/fullSaveByteEqual（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X04.2 跨季复用先生成免费待确认草稿，禁止交易、招生、融资与代理扩权。 [部分]
  - 对应：src/application/routines.test.ts:11 keeps routine drafts and next-quarter copies free, refuses forbidden operations and requires new-quarter confirmation；src/application/story-routine.test.ts:10 a finite routine never implicitly upgrades approval-only agent permissions
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X04.3 每步仍原子保存，失败停止批次，不能提前发布后续结果。 [部分]
  - 对应：src/application/routine-atomic.test.ts:9 stops batching on an actual head.put abort, publishes no jobs or receipt early, and retries the same candidate
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X05

例行方案遇价格生效、资格变化、现金或容量不足 → 暂停相关未来动作并说明；已履约成本不回滚；没有擅自改供应或借款

- X05.1 价格/资格/现金/容量变化暂停受影响的未来步骤，解释具体原因。 [部分]
  - 对应：src/application/routines.test.ts:14 persists a price-change pause before an unexecuted refill while retaining actual daily service and old obligations；src/application/routine-atomic.test.ts:13 pauses a previously approved action when actual cash or global video capacity no longer fits；src/application/routine-atomic.test.ts:16 revalidates supply permission at the actual execution date instead of extending it during a batch；src/application/routine-atomic.test.ts:19 does not use protected customer money when a confirmed refill lacks actual own cash
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/6/actual/plan/status（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X05.2 已履约费用和已发生日期保留，不擅自换供应、借款或重授权。 [部分]
  - 对应：src/application/routines.test.ts:15 rolls back an out-of-validity proposal while keeping clock advancement and prior obligations；src/application/routines.test.ts:21 lets unrelated work proceed while preserving the original supplier guard for a later action；src/application/routines.test.ts:24 can cancel one unrelated pending step without rebasing or invalidating the remaining authorization
  - 实际字段：goal-1/evidence/t16-c16-final-a1/replay/relay/t12-relay-evidence.json#/cases/6/actual/meters（T16 historical execution）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X06

分别进入五路线的决策与结果 → 每条至少有独特策略维度与专用收入反馈；不是同一收益按钮换标题

- X06.1 股票有仓位/撮合/交收策略和真实实现损益反馈。 [部分]
  - 对应：src/application/market.test.ts:11 executes F06 through real orders; unsettled sale cash cannot fund purchases；src/application/market.test.ts:18 converts the same planned reservation, partially fills shared volume, then cancels only the remainder
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X06.2 短视频有原创/热点/品牌、质量/返工/议价和曝光/商单独立收入。 [部分]
  - 对应：src/application/video.test.ts:377 gives original series a real audience and inquiry advantage in exchange for higher cost, time and fewer views；src/application/video.test.ts:339 collects a negotiated price increase only after all remaining revisions and charges the corresponding fee；src/application/video.test.ts:129 separates portfolio, program approval, measured ad income and actual platform payout without retroactive qualification
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X06.3 课程有产品/班额/支持排程/预款保护及实际分段收入。 [部分]
  - 对应：src/application/course.test.ts:8 executes F03 through actual production, intake, two stages, post-delivery refunds and paid support；src/application/course.test.ts:30 shares future support capacity with video jobs and never offers a larger unpaid class than its actual plan
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X06.4 中转有供应故障域/价格/信用/用量/更正与实际服务利润。 [部分]
  - 对应：src/application/relay.test.ts:4 executes F04 through actual daily service and due supplier invoices without spending protected recharge cash；src/application/relay.test.ts:17 treats %s according to its actual failure domain and permission rather than provider count；src/application/relay.test.ts:10 audits real %s reporting and appends an original-reference correction exactly once
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X06.5 DeepSeek有生态合同及另行架空股权、尽调/权利/融资/退出，非同一收益按钮。 [部分]
  - 对应：src/application/deepseek.test.ts:8 actually produces, reviews, supports and collects %s without treating a prepayment as profit；src/application/equity.test.ts:8 requires an actually negotiated board right and a completed meeting before a limited project policy changes；src/application/equity.test.ts:11 records partial private share disposal and delayed collection separately from the remaining position
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：五路线旧专用维度与收入有据，全部形态/普通默认/关键分支及当前UI结果仍由步骤5/6/12核对。

## X07

前世记忆绑定准备，推进到真实节点前后 → 不提前授予能力；投入形成的案例/关系实际解锁选项；无免费收益乘数

- X07.1 记忆收藏不收费，真正准备仍按点/费用/日期完成，不提前授予未来能力。 [部分]
  - 对应：src/application/campaign.test.ts:19 starts a real seven-day preparation, charges once and grants readiness only on completion；src/application/campaign.test.ts:228 makes memory favorites and news reading free without rerolling or triggering future news；src/application/video.test.ts:91 gates image and video tools by actual world date and separately earned access, including expiry
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X07.2 准备案例/关系在真实节点实际解锁变化，不发免费收益乘数。 [部分]
  - 对应：src/application/story-history.test.ts:15 normally reaches the open tool branch with %s；src/application/story-history.test.ts:16 money without an actual case cannot buy collaboration or publication control；src/application/deepseek-normal.test.ts:3 reaches actual ecosystem service and small counterfactual equity from normal2020 %s without snapshot grants
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X08

一个发布节点关联股票、课程、中转 → 同一世界事件只发生一次，路线效果各结算一次；未选反事实不给精确预知利润

- X08.1 一个实际发布源同时关联股票、已有课程、中转，源只发生一次，各消费者只结算一次。 [部分]
  - 对应：src/application/story-combined.test.ts:9 consumes one actual R1 source in market, an existing course and a real second business in the same normal run；src/application/story-combined.test.ts:20 rejects deleting the shared impact or either real consumer from a correctly rechecksummed same-run save
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X08.2 未选反事实不泄露隐藏意愿、另一分支精确利润或种子事实。 [部分]
  - 对应：src/application/story-history.test.ts:21 preview and visible reports do not reveal frozen intent or consume a random stream；src/application/video.test.ts:79 exposes only revealed defects and responses; inspecting and projecting do not draw random numbers；src/application/clock-commitments.test.ts:51 clock queries reject stale/non-clock/out-of-range requests and never publish private notes or hidden state
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X09

年度回顾中选择改善生活或保持不变 → 选择才扣费/占行动；无自动豪宅；场景反映已完成行动且主体正确

- X09.1 生活改善/保持不变要明确选择；开始才从个人账户扣费用/AP，企业和客户款不能代付。 [部分]
  - 对应：src/application/life.test.ts:27 pays workspace cost at start, preserves the failed attempt, and changes completion only after a real retry；src/application/life.test.ts:35 cannot spend company capital on private life, but a zero-cost rest still consumes actual AP and days；src/application/life-year.test.ts:16 does not turn a selected lifestyle goal or an interrupted purchase into a completed environment
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-dev-a1/workspace-completion-old-saved-s3.json#/state/life/jobs/0/status（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X09.2 实际完成且保存后才换场景，不自动豪宅，不把后来家具放入旧年度。 [有据]
  - 对应：src/application/life.test.ts:27 pays workspace cost at start, preserves the failed attempt, and changes completion only after a real retry；src/ui/NarrativeScene.test.tsx:94 annual scenes use completion as of that date, and text mode needs no decorative image；src/application/life-year.test.ts:16 does not turn a selected lifestyle goal or an interrupted purchase into a completed environment
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-dev-a1/retried-workspace-completion-s4.json#/state/life/jobs/0/status（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前正常改善完成abort/物理旧档/重试及年度只读渲染有据；全年细项当前累计仍待步骤11。
- X09.3 年度回顾只读，主体、当年工资/现金与当前余额分开。 [部分]
  - 对应：src/application/life-year.test.ts:9 keeps actual annual cash, salary and ownership separate, without using today balance as the previous year；src/application/life-year.test.ts:24 reading people/years/scenes never changes cash, AP, timeline or random and excludes private notes/hidden facts；src/application/life-year.test.ts:35 cannot present an unobserved future part of a year as already committed annual cash
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X10

使用例行计划后，再遇虚构代理扩权请求 → 前者不隐式授予代理权限；后者单独确认；自报不等于独立控制恢复

- X10.1 确定性例行计划不隐式授予代理权限；扩权另行确认范围/预算/日期。 [部分]
  - 对应：src/application/story-routine.test.ts:10 a finite routine never implicitly upgrades approval-only agent permissions；src/application/story-agency.test.ts:23 requires explicit cross-flow scope for the cheaper delegated support mode
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X10.2 自报停止不等于独立控制恢复，独立信号可暂停未来例行。 [部分]
  - 对应：src/application/story-risk.test.ts:23 does not mistake a free owned stop report for independently verified recovery；src/application/story-routine.test.ts:11 an independent signal pauses the future routine with a durable receipt instead of performing it
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X11

同季10条消息，包含强制付款和风险证据 → 普通聚合不丢实例；强制事项可见可处理；0行动时仍能走已有恢复路径

- X11.1 同季10条消息的普通1主2支预算不丢任何原实例；长册全部可达。 [部分]
  - 对应：src/application/campaign.test.ts:123 keeps all forced and risk items while applying the ordinary 1+2 display budget without drawing randomness；src/ui/book-layout.test.ts:4 keeps every column reachable including a last page with a single line
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X11.2 强制付款、每个账户缺口与全部风险证据不受普通截断。 [部分]
  - 对应：src/ui/NarrativeScene.test.tsx:86 every unresolved public risk survives the ordinary highlight budget without assuming recovery；src/ui/NarrativeScene.test.tsx:117 the cinematic layer retains every known account shortfall rather than selecting one highlight；src/ui/work-visibility.test.ts:18 keeps another business audit out of the selected business attention queue
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X11.3 0AP仍保留已有有限恢复/停止路径，不免费执行人工处置。 [部分]
  - 对应：src/application/story-agency.test.ts:29 reaches actual zero cash available and zero AP with paid hires, keeps old debt, and can stop and enter the next quarter；src/application/relay.test.ts:28 stops and refunds through a finite path with zero remaining attention and zero spendable cash；src/application/game-controller.test.ts:24 continues and cancels a real plan at zero available money and zero action points
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X12

通关、分享回顾、开启另一局 → 不清负债、不发永久收益倍率；只分享已揭示节点，不带隐藏种子事实或备注

- X12.1 实际通关/归档仍保留负债，不发永久倍率，不按账面峰值变现。 [部分]
  - 对应：src/application/epilogue.test.ts:74 archives without clearing liabilities, preserves the first record on resume, and never renews the budget；src/application/equity.test.ts:10 retains locked shares at actual2025year end without assuming a buyer or free liquidation；src/application/epilogue.test.ts:91 requires an explicit bounded recovery assumption and does not turn it into cash
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X12.2 分享只含用户选中的已揭示因果；财务需另勾选，不带隐藏种子或私人备注。 [部分]
  - 对应：src/core/ending-share.test.ts:4 shares only selected known fragments and requires a separate financial opt-in；src/application/epilogue.test.ts:100 the public product controller reaches, archives and resumes the earned ending, then starts an independent life
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。
- X12.3 明确新人生重新正常创建，不继承旧财富/权限，旧回顾仍可读。 [部分]
  - 对应：src/application/epilogue.test.ts:100 the public product controller reaches, archives and resumes the earned ending, then starts an independent life；src/application/game-controller.test.ts:10 creates and resumes a normal game through the same public controller, saving before publishing choices
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：当前全量/相关业务重验尚待步骤6或11，不能仅凭声明或旧报告结项。

## X13

执行预登记的灰盒对照试玩 → 记录版本、任务、顺序、实际样本、时间/错误与失败；不把目标写成结果

- X13.1 相同动作/奖励的灰盒与电影前台对照入口，预登记版本/任务与交叉顺序。 [缺失]
  - 对应：尚无实际测试/人测
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：步骤10仍需实现独立本机对照入口及预登记；默认游戏保持电影风格，不接SDK。
- X13.2 记录实际样本、开始/结束、时间/操作/错误/中止，8—12人和目标用时不能冒充成绩。 [缺失]
  - 对应：尚无实际测试/人测
  - 实际字段：goal-1/evidence/t17-acceptance-01/step3-final-summary.json#/humanParticipants（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：已提供的实际真人记录为0；用户组织/提供实际匿名记录后在步骤13核验。
- X13.3 只本机记录，参与者同意后手动导出匿名数据，不自动分享。 [缺失]
  - 对应：尚无实际测试/人测
  - 实际字段：只有源码/测试条件链接，不推断未执行字段。
  - 余项/边界：随独立对照入口实现明确本机范围和同意；没有授权对外招募/发消息。

## X14

1366×768与1280×720键盘操作、减少动画、保存失败 → 核心选择与标签可读；焦点恢复；失败明确未保存；动画时长不影响现金

- X14.1 1280×720/1366×768核心选择与标签可读、全部长内容同屏翻页，不滚动或缩字藏操作。 [部分]
  - 对应：src/ui/NarrativeScene.test.tsx:27 scene choices are read-only and keep delivery, end-of-range and read-only action guards；src/ui/book-layout.test.ts:4 keeps every column reachable including a last page with a single line；src/ui/CinematicRoom.test.tsx:11 renders a read-only room without advancing, including delivery and end-of-range UI projections
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-r9/final-life-geometry.json#/outsideViewport（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前三桌面/稳定逐页图有据；全部形态步骤5/12继续。
- X14.2 键盘聚焦与对话框恢复正确，编号翻页不执行隐藏按钮。 [有据]
  - 对应：src/ui/scene-play.test.tsx:21 numbered thoughts navigate, while modal dialogs and editing keep their keys；src/ui/NarrativeScene.test.tsx:27 scene choices are read-only and keep delivery, end-of-range and read-only action guards；src/ui/clock-advance.test.tsx:12 time controls expose the original500 and optional review without rendering or executing a mandatory time dialog
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-r9/final-life-geometry.json#/books/0/offPageTabStops（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前原生编号/焦点/弹窗链有据；不充真实200%或移动。
- X14.3 文本和减少动态模式保留可读选择与全部分页。 [部分]
  - 对应：src/ui/NarrativeScene.test.tsx:94 annual scenes use completion as of that date, and text mode needs no decorative image；src/ui/book-layout.test.ts:4 keeps every column reachable including a last page with a single line
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-r7/text-reduced-1280x720-p1-geometry.json#/scroll（T17 steps1-3 execution, source matched; not executed again in this index）；goal-1/evidence/t17-acceptance-01/chrome-r7/text-reduced-1280x720-p1-geometry.json#/outsideViewport（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前两页稳定图、所有原操作和模式恢复有据；完整形态仍步骤5/12。
- X14.4 显示/动效变化不影响现金或随机，不因播放动画执行规则。 [有据]
  - 对应：src/ui/clock-advance.test.tsx:12 time controls expose the original500 and optional review without rendering or executing a mandatory time dialog；src/application/clock-commitments.test.ts:18 normal clock review shows the actual500 start payment and original reservation without executing either
  - 实际字段：goal-1/evidence/t17-acceptance-01/native-current-r9-audit-a2/normal-browser-export-audit.json#/allByteEqual（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：模式切换和取消核对前后的完整24逐字相同，另行核对原文对；未以工具响应时间冒充动画耗时。
- X14.5 保存失败明确未保存且旧画面保全，候选重试才给回响。 [有据]
  - 对应：src/application/session.test.ts:17 keeps a failed candidate visibly unsaved, blocks new mutations, exports it and retries once；src/application/game-controller.test.ts:18 keeps an aborted controller candidate private, blocks exit, and retries the original result；src/application/world-session.test.ts:9 does not publish world evidence before the entire state/receipt/cause transaction commits
  - 实际字段：goal-1/evidence/t17-acceptance-01/chrome-readonly-a1/physical-old-s3-readonly.json#/revision（T17 steps1-3 execution, source matched; not executed again in this index）；goal-1/evidence/t17-acceptance-01/chrome-readonly-a1/physical-retried-s4-readonly.json#/revision（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：当前正常DEV实际abort和独立物理读回有据。
- X14.6 P022原资产按manifest原字节核验，不用新图替代。 [缺失]
  - 对应：尚无实际测试/人测
  - 实际字段：goal-1/evidence/t17-acceptance-01/step3-final-summary.json#/originalPNG（T17 steps1-3 execution, source matched; not executed again in this index）
  - 余项/边界：原三PNG0/3继续T17资产责任，不能提前关闭X14/W405；Q23真实200%等兼容责任另交M01，不混在本条件内。
