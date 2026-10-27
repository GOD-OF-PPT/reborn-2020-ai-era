# 静态交回审查（未运行）

1. helper只读取公开relay/casebook/原Workbench metrics及target resolver；没有signature/raw、hidden loss/actualUnits/missedUnits/facts、futurequeue、Rule apply/preview/advance或新命令。relayId/operatingId只核已有原ID，不计算未来损失或赔付规则。
2. compensatedAt/feePostedAt未发生保持pending，所有金额null而非0；缺casebook/错run/rev/asOf/重复/错源归属均unavailable。两marker真实发生且原scope唯一后，0才可表示已处理且确无对应原项。
3. 收入按period.id原income metrics，并核对应原deliver/refund操作；赔付仅同period/customer canonical service-compensation原due_expense，与原cost metric/compensation-due obligation/原日期和金额逐项交叉。没有拿季度income、总现金差或job1500算赔付。
4. 直接现金op.id与payable ref、后续canonicalPay操作/同原债ref/source/account/date分别核；每原债现金已付+remaining=原cost。历史status=due不代现欠；供应池或贷项操作不进入赔付现金。
5. record只在service/support summary及原lines调用同helper，原任务action成本/AP、完整ID和全部原其它票据不删；新helpercache只在当次纯模型调用复用同period，跨revision不持久。未改record keys/target/排序/客户编号或权限。
6. 原records.test13case字节完整保持；新helper测试21case仅编写：真实88/89、pending/200已付/1500原job与100审计预留分开、原13.28应收/个人/AP不变、无book/错scope/缺重数据、明确public财务变体未付→partialPay→付清、canonical/ref/date/amount/源反例、同账户别期与拒读meter getter。公共变体不冒新正常历史/Native。
7. 原P326末读26/26、application projection+test保持R1原冻结，旧fullCreate准备目录所有登记文件字节保持；4产品旧记录中的UI模型身份现在由本新授权修缮替代，不能改旧阶段记录成“全程同源”。官方127范围不增加，Root最终UI sourceCount/extra必须按新增两文件重新绑定。

本审是作者静态自审，不是独立验收或类型/单测通过。Root统一工程、publication调用、新R5实际同次图/动作和最终原文/独立账务仍待，U4-B/C-S4-R不勾。
