# 先行字段迁移与状态门槛

| 原事实/操作 | 第一层 | 按需完整去处 |
|---|---|---|
| 当前主体/可用钱/客户保护/架空性质 | 原owner与性质行保 | 同账户原账 |
| board/实际股份/无单方控制、会议成本/AP/天数与可能拒绝 | 当前权利与费用短行 | 原holdingFacts/原确认 |
| independent_audit真实已发生资本用途报告/不揭未来 | 短政策卡说明范围 | 原effect/limit、policy确认与报告 |
| commercial_scope次日起新申请/旧报价不改/可能缩窄接手 | 短政策卡完整后果与风险 | 原effect/limit/原确认 |
| policy显选/资源/日期/本季AP/预留、未来安排 | 显选后原表单与短动作 | 原捕获preview费用与反馈日、同原草稿/原册 |
| 原锁定/转让同意/仍持数/买方可能拒绝或有限报价 | 买方页常显、500/1/7 | 其余holdingFacts展开/原规则拒绝 |
| 原报价每股/最大股数/截止/用途限制 | 报价短行常显 | 原逐笔来源/原册 |
| 实转股数/总价/累计费/净应收/最早收款/余股/现金尚未增 | 输入旁原preview同值 | 原独立确认所有字段/完整费率条款 |
| 已转/原净应收/已收/未收/到期/本次金额、非重复收益 | 余额/日期及原款短行 | 原确认与原册/完整费用说明 |
| exitCash来源部分/已核现金/未核余款及原允许动作 | 原reason常显不收起 | 完整来源/原账，不补零或改资格 |
| 回Today/尾声与原款保留/不新承诺 | 短阅读动作 | 原today绑定，原记录和全局责任不变 |
| 只读/候选/冲突/保存中/资格/AP/资金/过期/空稿 | 原可见状态与原因保 | 原preview与原恢复，显示文字不控制权限 |

完整手记入口放在各自可见的条款/原账展开区，阅读可分页；默认决策保同一页，不承诺所有完整条款或确认一页。原Exit/Collect等全部command payload、confirm、preview、draft.current/retire不改。零/重复/未知对象按原resolution，不换最新记录。

完整policy.effect/limit仍保；新增choiceLabel/choiceEffect/choiceLimit仅用于两张短卡。移除exit-request外层重复holdingFacts，全部原事实在其条款区。测试只迁移实际新按钮定位，原费用/日期/AP/身份/候选/草稿/原retry断言不删。

## 当前原142 Chrome复核补充（新代码前）
原277的实际转让确认，EquityDecisionFacts已列完整金额/股数/余股/日期/AP，CommandDetails又重复一整段privateSale金额。仅当捕获的AcceptEquityExit有decisionFacts与privateSale时，将modal.details收进“完整转让说明”，完整节点原样保，不按理由赋予或撤销权限；缺facts/其他命令保持原层级。坏来源仍由事实卡显式报核对，完整原说明可展开，不补数字。

原报价的调查已completed，默认页却还显示长“原安排与中断选择”。将完成/取消/中断job的阅读入口放进本对象条款（不删原Interrupt/Reschedule入口及原拒绝）；planned/running任务仍常显。明确按job.status组织阅读，不把已发生业务失败当未保存失败。未增加规则或日期跳转。
