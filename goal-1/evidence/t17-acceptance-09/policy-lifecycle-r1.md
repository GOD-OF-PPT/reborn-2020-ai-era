# P3 生命周期20项执行前政策 r1

此文件是实现前登记，不是执行结果。两固定背景均使用原 t16-campaign-0 的完整 Create 正常前史；每行 sourceRevision 是原前史的真实分叉点。不得删除已发生的案例、资格、学员、款项或命令。全部20原ID保留，原48×六、补充72不能替代本组40行。实际运行与类型检查由根代理串行统一执行；当前本组不运行任何场景、浏览器、兼容性开发或测试。

统一 CourseCriticalContext 记录每个真实命令尝试和严格 codec 往返。预期拒绝检查指定原 reason，并另核完整原文未变；正向使用公开课程/任务/学员/款项与实际账户、流水、AP检查，不读取隐藏学习roll、代理profile或未来结果。未知异常失败保留，不降格为有限通过。

| 原ID | 原revision | 目标与必须留下的实际证据 |
|---|---:|---|
| deadline-stage0 | 74 | 已收款而首段未安排，提交完成日比首段due晚1日的真实命令；精确 COURSE_STAGE_DEADLINE_MISSED 与完整原文不变。 |
| deadline-stage1 | 76 | 首段真实交付后，次段完成比end晚1日；相同精确守卫，不能被前段未完成或已有任务遮盖。 |
| interrupt-sample | 70 | 先推进原样课真实start且running/executed，再InterruptJob；原费用/AP保留，原完成日后无ready版本。 |
| interrupt-stage | 74 | 原首段真实开始后才中断，完成日不认收入，due之后只退未交付款，原attempt与中断记录保留。 |
| interrupt-support | 81 | 原更新已真实完成，原支持真实开始后中断；原费用/AP保留，原完成日不能满足支持/生成学习反馈，旧学员及补救责任保留。 |
| refund-before | 74 | 全款真实预款保护，退一名实付学员；退未交付引用原payment操作、不冲并不存在的收入，0AP。 |
| refund-half | 76 | 首段实际交付/次段未交付；退款分已交付和未交付，分别引用原stage与payment，收入/预款/现金独立守恒。 |
| refund-after | 78 | 两段实交；退款引用两原stage，不新增预款退还，保留原交付记录并冲减收入，0AP。 |
| refund-window-closed | 85 | 原fee已落、窗口已闭；对真实原学员退款精确 COURSE_REFUND_WINDOW_CLOSED，原文不变。 |
| same-person-format | 85 | 为同知识基础版真实新建不同课程形式、支付样课成本/时间并取得原视频受众；明确选公开eligibleMembers内原付费学员，再精确 AUDIENCE_ALREADY_CONVERTED，不能用不合格学员冒充。 |
| same-person-new-business | 85 | 原班结算后真实WindDown/Close旧公司、真实Open/转资/新提纲/Activate/样课，重新同知识实操班；同原学员精确全局去重。新账户基线用实际Open后状态，单列个人到新公司原始转资。 |
| same-person-after-refund | 74 | 先真实退款一名原学员，公开conversion仍在且returned，再向仍开放原班重买，同人精确去重拒绝。 |
| advanced-without-study | 69 | 原基础课已定义，真实父ID但无Study，Define advanced精确 COURSE_NEW_DEMAND_REQUIRED，不用缺父ID等更早错误代替。 |
| update-free-original | 79 | H004真实发生且影响原付费班，付200000分/1AP/7日更新，原学生/预款/付款批次/购买身份不重置、不再收学费，实际版本与原update解除。 |
| update-default | 79 | 不安排更新，推进原due+1真实default/暂停并精确Resume拒绝；再原闭窗推进，旧款依法退款、原款引用/收入/费用与义务保留，不伪造无债关闭。 |
| update-interrupted | 79 | 更新先实际running再Interrupt，费用/AP不退、7日后无新版本/无resolved，due+1实际default/暂停。 |
| stop-sales-old | 74 | 真实StopCourseSales只停新招生；原学员/保护/任务保留，新受众精确拒绝，原两段仍可真实教学、原更新/原支持与闭窗处理继续。 |
| retire-old | 79 | 真实Retire保留旧学员/支持/更新责任；新招生拒绝、Resume精确 COURSE_UPDATE_REQUIRED；退役课仍付费更新7日，不能注销旧款或购买身份。 |
| wind-down-old | 74 | 真实WindDown取消原公司活动任务但不清学员/预款；Close精确 COURSE_UNSETTLED_OBLIGATIONS；旧未交付到期退款、闭窗费用与责任实际结算后才能Close。 |
| zero-ap-refund | 80 | 原季度真实样课+两段+更新已花满4AP，公开available=0；仍对实付学员0AP退款并核原款引用/现金/收入，不能把0AP说成0现金。 |

金额检查复用 captureCourseMoney/assertCourseMoney/assertCourseCashDelta，独立核payment、每段、refund引用、预款保护、收入与公司现金流水；允许真实未付退款债务，不预设全部班已closed。中断检查同一实际job/action绑定、executedAt、原cost/AP及终态，不以planned取消当running中断。更新/停业推进始终work:false，默认世界选择照原真实时钟，不补钱、不赠AP、无回溯。

跨形式/新公司分支在原Apr16闭班后建立新样课，支持安排在下一季度以保持当前真实全局4点上限；新支持计划本身真实占用未来现金/AP。退款/停业/退役均不宣称外部代理权限或旧外部责任恢复。本组不新增生产规则、不改旧封存数据或共享helper。原回放/目标失败须保留，再依新版本策略补充，不以断言弱化换绿。

[杠精审查] 实现前限定通过：20原ID独立，不合并退款阶段/三种去重/三种中断；每项指定实际守卫或状态/资金/AP/任务目标。运行前提不足即失败，不把仅执行过、计划或本文件当通过。
