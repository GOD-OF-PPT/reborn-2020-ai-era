# 委托补充策略的季度核查预算与跨季日历静态核对

**静态未执行。** 本文件仅核父代理提出的后续补充排程，不修改已有`delegated-observed-path-investigation.md`及其SHA，不修改P1前史、原288注册/失败、runtime、collector或policy。没有运行engine、测试、回放、浏览器或兼容检查，没有读取隐藏原档、学习roll、事实原值或代理profile。下列日期/AP是对原guard的纸面推导，不保证未来调查verdict、资格审批、现金或正向履约结果。

## “每季1AP核查预算”的准确含义

本次采用父代理后补明确的定义：每季为风险核查的**总预算为1点**，当季已经真实调查消耗的点计入这份预算，不再额外留一个空点。策略在决定未来普通动作时预留：

`buffer(q)=max(0,1-本补充策略当季已实际花费的调查AP)`

因此Q2样课1+真实调查1+企业首段2=4，可以满足该策略；不能把已经真实花过的调查1再算成额外空点，使它误成5点。此buffer只是测试玩家策略的有限预算选择，不写入运行时、不把季度4点改成5点、不预建虚构调查action。每个被接受的真实StartRiskTask仍按原action.definition.startAt所在季度计点；确认、Ack不消耗调查点。被拒绝的任务不算已花点，已开工后中断的任务不能返还点数。

若同季再次出现真实新signal，仍以当前实际剩余AP/本人资源/现金和原deadline为准；没有点数就保留有限拒绝/未解责任，不赠点、不免期限，不宣称1点足以解决无限新风险。

依据：`src/core/economy.ts:51`起的原spent/reserved总额；`src/core/story-work.ts:19`起的真实调查报价、当前日期开工与同一资源；`src/core/story-risk.ts:60`起的风险守卫。

## 前置真实调查的条件

P1同主体已经有真实assisted支持结果，原部署仍active/未欠服务费，且不存在当前未解的同公司事件时，源码允许先显式cross_flow、后Plan和收学费；SetHengxingAuthority不要求先有本次新cohort。+7检查若产生真实公开signal，实际100元/1AP/连续3日investigate→完成后Confirm；只有公开normal/ordinary且stage normal才按登记策略继续。若violation/confirmed，则按原Stop本人权限并保留外部撤回未验、已发生费用/义务等真实受阻。不能按incident.kind=agent直接判危险，因为普通代理事件的kind也是agent。

调查及确认需严格早于openedAt+14日deadline；deadline为world_update，调查完成为player_actions，不能把同日完成当及时避免默认Stop。+7没有真实incident时不能编造调查，须按另行登记的no_public_signal分支或保留未执行。

这些前提与日期仍须真实命令核定。调查后重算所有点数、真实本人资源、全期许可、未来原支持预留、现金和期限；不能沿用调查前的旧候选，也不能从已Stop的原R2结局复活原grant或cancelled支持。

## 候选A：视频企业内训（及Q2额外续办的企业图像分支）

候选为首段Jul17—31、次段Oct1—15，原delegated支持Oct15—17、endOct15。

### 原日期守卫

- `PlanCourseCohort.startAt`必须晚于真实Plan提交日。所以前置调查/确认、必要实际许可必须在Jul17之前完成；如果合法续办拖到Jul17之后，本示例失效，不能回填Jul17。
- Jul17到Oct15手工为Jul余14+Aug31+Sep30+Oct15=90日，恰原班期上限，不超过。企业两段14+14日和原最小28日也满足。
- 第0段Jul17—Jul31为14日，原dueAt=开班+14日=Jul31，实际需在该日完成，不能晚一天。后续Aug1原stage_due见已有真实交付才不会退未交付部分。
- 第1段Oct1—Oct15为14日，必须在Jul31真实第0段完成后才下原StartCourseStage，实际完成不晚endOct15。原规则没有要求第1段必须紧接第0段，受原最终期限约束。
- 支持Oct15开始等于班末，处于原end至end+90区间；Oct15—17为delegated原2日/1AP/1000元。教学与支持同日边界按原区间相接，不重叠。
- 支持完成Oct17，退款窗口Oct24，费用/关闭最早Oct25；均在2025内。原grant/deployment expiry Dec31能够覆盖完整支持区间，但仍须实际active、scope/额度/欠费/公开风险守卫通过。
- 全部样课/教学必须由真实有效许可覆盖。视频若实际June20续办批准至2026June20可覆盖上述两段；如果本分支实际审批失败或过期，则不得引用其他反事实的批准。资格截止2026不等于使用2026新AP。

依据：`src/core/course.ts:176`的Plan、`:212`的阶段；`:313`的原支持/窗口冻结；`src/core/story-state.ts:30`和`src/core/story-support.ts:9`的完整授权与已确认任务约束。

### 本人产能、季度点数和Aug1响应

若本视频企业分支Q2真实花费为样课1+续办1+前置调查1=3：

| 季度 | 本候选的真实花费/预留 | 核查预算解释 |
|---|---|---|
| Q2 | 样课1+续办1+调查1=3 | 该季调查预算已经实际花1，额外buffer0；仍以真实4点上限为准 |
| Q3 | Jul17首段2+实际Aug1调查1=3 | 若Aug1真实出现signal，Aug1—4本人有空，实际再付100元/1AP；已花预算1，额外buffer0 |
| Q4 | Oct1次段2+Oct15原支持1=3 | 尚无该季真实调查时保留buffer1；原支持这1点必须从Plan起计入未来Q4，不到Oct15再补算 |

Aug1位于Jul31首段完成之后、Oct1次段开工之前，本人有完整Aug1—4三日产能；真实Aug1事件deadline为Aug15，Aug4调查完成并Confirm严格早于deadline。若实际结果normal/ordinary，不触发默认Stop，原绑定grant/support仍须继续按原有效性与费用检查；若violation/confirmed，不继续把这份支持称正向，执行原有限Stop/责任路径并保留原已付钱/点数。

视频可以有如下**未执行的前置例子**：June20实际批准后扩权，June27实际+7 signal，June27—30真实调查/确认，June30再Plan Jul17班期。调查1点记Q2，不能因之后教学跨Q3而另返一份点。若六月没有合法调查窗口，或实际先有别的未解事件，原guard可拒绝，不能为固定Jul17表格免验。

图像seed2的Q2若实际也是续办1+样课1+调查1=3，可使用相同跨季模板；它的真实有效资格与实际完成调查日仍应独立核。当前问题中的两段14日/2AP是**enterprise**条款，不把这一表格直接当intro/practical的实际测试结果。

## 候选B：图像seed0/1的较早企业班期

提议首段May10—24、次段Jul1—15、原delegated支持Jul15—17，endJul15、费用关闭Jul25。

- 若原企业样课Apr8—29已真实完成，Apr29扩权、May6—9前置调查/确认后，May9才Plan May10开班，满足startAt>date。这是条件例子，不能预判实际普通结论。
- May10到Jul15手工为May余21+Jun30+Jul15=66日，满足企业最小28日及最大90日。第0段14日恰在May24原due完成；第1段Jul1—15在班末完成。
- Jul15支持开始等于end，2日到Jul17，窗口Jul24，费/关闭Jul25，在2025内。两段和支持同资源只在边界相接，没有日期重叠。
- Q2样课1+前置实际调查1+首段2=4；因为核查1点已实际花掉，策略额外buffer0，符合本次澄清的预算，不是违反原4点。
- Q3次段2+原支持1=3；尚未发生Q3调查时buffer1真实留在原4点内。如果后来Aug1有实际新signal，本人Jul17支持后已空闲，可以Aug1—4真实调查1点，Q3总4，额外buffer变0。这不是额外第五点。
- 原图像有效许可必须覆盖完整May/Jul两段；已观察的Jan15 2025批准至Jan15 2026等许可若属于本实际分支可覆盖，但不能从其他seed/反事实复制。

## Jul25关班不是自动结束Dec31外部承诺

上述早班即使Jul25实际closed，原cross_flow grant/externalDelegation和deployment仍可能有效至Dec31。原Aug1网络取实际active部署，或仍有未独立核实撤回且未到期的外部委托；关课程不会自动Stop、撤权、隔离或证明外部控制已恢复。

因此“闭窗在Aug1前”只证明本份原课程可先履约收尾，**不免除Aug1实际signal的调查预算或后续责任**。Q3所留1点应在实际出现事件时真实使用，不能因课程已closed把它提前隐含交给工作/普通新任务。Q4没有本班课程任务也不代表现有外部承诺自动清空，保留策略核查预算和公开责任直到原授权/独立撤回等实际条件变化。

如果补充采集只到Jul25班期关闭，其正向结论只能是本份课程/原支持已实际完成；Aug1之后未执行的风险职责须明确留待后续，不把停止采集当作没有事件。原已完成支持不因后续事件被倒改成未完成，反过来也不能据已完成支持保证后续代理安全。

依据：`src/core/story-risk.ts:104`起的network与authority_check、`:119`的真实默认；`src/core/story-agency.ts`的Stop不等于外部撤回；`src/core/story-projection.ts:13`公开grants/externalDelegations和支持结果。

## 尚需实际核定的边界

1. 所有示例均以新独立补充策略从原P1真实基点回放，保留原R2每个失败；不改P1、seed、概率、4AP、首段14日或班末90日。
2. 本人排程、许可证、support source/额度、实际自有现金和各月持续服务费用都要按每个实际sourceRevision重算；100元核查本身也必须有现金，不能用未来学生预款支持当前调查。
3. 只有实际完成调查才有公开verdict。无signal时不发明调查；真实violation或缺钱/点/资源、既有默认Stop均保留有限拒绝和责任，不绕过原guard。
4. 如果同季另一个实际事件使剩余AP不足，或调查只能在deadline当天完成，仍是受阻；buffer不是提前免掉原期限的保险。
5. 新的普通结论不会暂停后续真实风险事件。每个真实新来源按实际证据处理，原已用点/费用不回收。实际Stop后的原cancelled支持仍不可复活。

**结论：按父代理明确的“已用调查AP抵扣当季1点核查预算”定义，这两组具体企业日期在原Plan/阶段/支持/90日/2025期限/AP守卫上没有静态不合法点；不存在可据此直接声称成功的证据。** 晚许可/晚调查错过classStart、真实未解风险、资金/资源不足和后续新事件仍可能阻断。以上仅为后续新同级补充策略调查，原288后台和全部原失败保持独立。
