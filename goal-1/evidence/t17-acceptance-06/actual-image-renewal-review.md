# 实际图像资格拒批后合法续办的单记录抽审

**本文件只审technical_employee / t16-campaign-2的shape-01一个实际记录，不能替代288核心矩阵、378总范围、5b/T17或真人验收统计。** 没有重新运行engine、测试、helper、回放、浏览器或兼容检查，没有改源码或旧证据。仅读取该shape-evidence.json的公开投影、moneyEvidence/cashEvidence/trace；为独立核Jan8失败申请的实际扣费，另读同身份P1 prefix-evidence.json的公开Jan8/Jan15 trace，没有读取任何隐藏完整原档、学习roll或代理profile。未查看、等待或轮询后续delegated形态。

主记录为`matrix-r2/technical_employee-t16-campaign-2/shape-01/shape-evidence.json`，intro_recorded/image_workflows/foundation/self_small，原正常基点第144次/2025-04-08，最终第162次/2025-07-23。原记录status completed、actualClosedShape true、helpedRetainedStudents18、suffixReplayBytesEqual/rejectedReplayEqual true；这些是原采集记录的事实，本抽审没有另运行其原文重放。

## 公开资格历史与实际拒批

该记录公开image_rights applications为：

| appliedAt | 实际job完成/decidedAt | resultRead / approved | expiresAt | 身份 |
|---|---|---|---|---|
| 2022-08-22 | 2022-08-29 | true / true | 2023-08-29 | 原历史资格，2025时早已到期 |
| 2025-01-08 | 2025-01-15 | true / false | null | 当前有限周期首次付费申请，实际拒批 |
| 2025-04-08 | 2025-04-15 | true / true | 2026-04-15 | 当前周期第二次付费申请，实际批准 |

Jan8到Apr8手工日期差为23+28+31+8=90日（2025非闰年），满足原按appliedAt而非结果日计算的90日间隔。没有在Jan15收到拒批后立即重试，没有还持有效资格就提前申请，没有改seed或删除首次失败。Apr8—Apr15又真实耗7日；Apr15批准且resultRead之后才开始新样课，2023已失效的旧许可或Jan15拒批不能支持本次教学。

`actualRejectedCommands=0`是这次P2后缀的命令级拒绝数，不代表历史不存在资格失败：Jan8/Jan15两个正常命令都提交成功，但其业务审批approved=false。这两个层次必须分列，不把失败审批从正常历史抹掉。

## 两笔2025申请都真实扣费/点数，失败不退还

同身份P1补证来源是`../t17-acceptance-05/prefix-r1/technical_employee-t16-campaign-2/prefix-evidence.json`的公开trace：

- 2025-01-08，AdvanceTime第138次：个人cash17,375,000，公司cash2,332,976，Q1 spent3/available1。
- 同日ApplyVideoProgram第139次：个人cash17,275,000，差100,000分/1000元；公司仍2,332,976。Q1 spent4/available0，真实用了1AP。
- Jan15 AdvanceTime第140次、DecideVideoProgram第141次：个人仍17,275,000、公司仍2,332,976、Q1 spent4。结合公开application的approved=false可核定实际拒批后没有退1000元、没有退点或赠资格。

当前P2 shape自身trace独立显示第二次申请：

- Apr8 DefineCourse第145次：个人cash18,475,000，公司cash2,242,976，Q2 spent0/available4。
- `t14-command-145` ApplyVideoProgram第146次：个人18,375,000，再实际扣100,000分；公司仍2,242,976，Q2 spent1/available3。
- Apr15 AdvanceTime第147次、`t14-command-147` DecideVideoProgram第148次：个人18,375,000、公司2,242,976、Q2 spent1均不变。真实申请job `vid:d2affb578284ad76f4318b14a67d8813`从Apr8到Apr15、status completed，批准有效期至2026-04-15，读结果不再发钱/扣费或重抽结果。

所以2025本周期Jan8失败和Apr8成功两笔合计200,000分/2000元、分别占Q1和Q2各1AP。2022原申请是更早前史，不能混成2025三次失败，也不能把Jan8已经发生的成本在本次基点后重扣一次。

原视频channel的business为`ops:ba68f70700d1d9d3ccbd57f76603960e`，accountId personal。课程公司的business是`ops:84eb5f2371eafc22cc8d015ef34b9601`，accountId `ops:e901e6a20698e898d29a1848a192cd9b`。资格申请费来自personal；样课和公司日常费用来自课程公司，不能跨错账户，AP仍全局共用。

## 申请后才实际做样课、教学与原支持

| 任务 | 实际区间 | 原资格/期限覆盖 | 真实AP/公司现金 |
|---|---|---|---|
| 新图像入门样课 | Apr15—Apr29，14日 | `[Apr15 2025,Apr15 2026)`新已批准资格覆盖全程 | 1AP、200,000分 |
| 第0段 | Apr30—May7，7日 | 同新资格；实际May7早于dueMay14 | 1AP、0分 |
| 第1段 | May7—May14，7日 | 同新资格；实际May14早于end/dueMay21 | 1AP、0分 |
| 原self支持 | Jul1—Jul15，14日 | 本人真实产能；support不另要求图像工具许可 | Q3 2AP、0分、容量20、completed、recovery=false |

Apr8 DefineCourse并不冒称已具资格或已做样课。实际申请完成Apr15后才Build；两段连续相接，且均在已批准区间内，没有利用2026新AP。班期Apr30—May21满足至少21日；Jul1支持在end后41日，未超过原90日上限。Jul15公开实际反馈后按原窗口退款，Jul22退款窗结束，Jul23原费用/关闭，支持完成+8日在2025内。

实际Q2点数为申请1+样课1+第0段1+第1段1=4；原self支持的2点安排在Q3。关键公开moneyEvidence：

- 原支持安排后第152次，Q2 spent2/reserved0，Q3 reserved2；公司尚无学生合同/预款。
- 第154次只安排第0段：Q2 spent2+reserved1=3；第0段deliveredAt仍null，收入仍0。
- May7第155次实际第0段完成，Q2 spent3；May14第157次两段完成，Q2 spent4，Q3仍reserved2。
- Jul15实际支持完成后，Q3 spent2/reserved0。没有在Q2已有4点后再塞2点自答疑，也没有用申请费的另一个账户生成额外点数。

## 学生、保护、退款/费用及公司现金手工对照

实际20人×19,900=398,000分。Apr15样课实际200,000支出后，公司2,242,976−200,000=2,042,976；Apr29报名后现金2,440,976、学生保护398,000，故可花仍2,042,976，原支持0元但Q3两点已预留。

每人每段9,950，第0/1段各20×9,950=199,000。May7实际第0段后合同prepaid199,000/recognized199,000；May14第1段后prepaid0/recognized398,000。两段是原保护释放/收入确认，没有第二次收学生现金。

Jul15公开needs_recovery两人为`vid:8b7f93f9852fe602e6b4c0d458a18bef`和`vid:26f6e54809f821607b18f51c84b88563`，同日仅实际退这两人的原价：2×19,900=39,800，两个原阶段各反冲19,900。退款操作分别reference实际stage operation `crs:11b09967aa10d108610cb5975445a77e`、`crs:e518cd16c493ced6ee8730e7e5e45132`。现金退款行另reference各自退款obligation，最终remainingFen均0；旧学生身份仍存在，不把退款当新需求。

合同净收入398,000−39,800=358,200=18×19,900。Jul23费用按原退款后收入：`floor((358,200×500+5000)/10000)=17,910`。原退款/费用债务均付清，学生和已交付退款保护都released/0，closedAt=Jul23；本例不额外验证未付退款债务或半分费率边界。

公司本次现金行：样课−200,000，报名+398,000，Apr/May/Jun代理各−20,000和维护各−10,000，两个阶段原退款各−19,900，费用−17,910。手工合计：

`2,242,976−200,000+398,000−(20,000+10,000)×3−39,800−17,910=2,293,266`

公司净增50,290，与原cashEvidence.transactionDeltaFen一致。第二次资格申请100,000在personal，不得从公司再扣一次，也不能据公司增加502.90元宣称整个玩家本次新增净赚502.90元。只合并此次申请与公司增量、不含其他同期个人生活时，跨主体部分差额为50,290−100,000=−49,710分；这是明确限定的对照，不是玩家完整期间利润。Jan8失败100,000已在P1基点之前发生并保留，不在此式再次扣除。

## 限定结论和范围

该一个实际记录清楚保留Jan8真付费拒批、90日后Apr8另付费申请、七日实际批准后才做新样课/两段，以及全局Q2四点/Q3两点和分账户费用。手工核对未发现上述日期、资格、AP或现金矛盾。

不因一个记录补称288完成、三次拒批政策通过、delegated风险或其他身份通过。未读取后续shape，未查看隐藏完整原档。公开P1补证只核Jan8/Jan15这四条trace，未重验P1整条回放；原Create/后缀逐字证明仍来自其原已封存采集，而非本次新执行。兼容开发和测试未执行。

## 本次绑定的原记录字节

- `matrix-r2/technical_employee-t16-campaign-2/shape-01/shape-evidence.json` SHA256 `e0a4ce1b1b5c84c2b49f4392bca15c25eaa07d5be2f65fe3c329f26196d58e74`。
- `../t17-acceptance-05/prefix-r1/technical_employee-t16-campaign-2/prefix-evidence.json` SHA256 `8e616cb42581965d0e6258d684047f50289c4867248a6e767a0869aa4a3c7d95`，仅用其公开Jan8/Jan15 trace。
