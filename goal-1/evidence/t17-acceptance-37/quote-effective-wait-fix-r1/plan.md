# 同一原报价：谈妥尚未生效的等待

先与state Owner协同：公开quotes去factId，未完成responses=[]；只有completedAt非null且不晚于当前、原job确已完成才读取公开accepted。Owner当前仅授权correction，quote state/summary由Root另定，不修改records。

仅Reader原job/invoice nextDate之后补原quote候选：唯一同quoteId/business/job，原客户归属完整唯一、responses完整且至少1真实accepted、原完成日与effective ISO合法，effective>当前；才把effective送既有playableAdvanceDate→relayReviewDate→ClockAdvance。谈妥不等已生效，不读取未完成响应、不替改客户activeTerms；已生效/全部拒绝/未知或失效原quote不虚等。提前日历/原单/教学屏障保原，不跳费用/季度，不发新service/renew/requote或换book目标。

四个consumer case：真实114展开同quote/点击Clock原request，planned111未知响应且原任务等待；显式public反例覆盖全拒/坏日期/错owner/job/重复响应/已生效，不伪存；只读/候选/stale handler不request。真实raw仅在test beforeAll20s经原Controller导入，写代码不执行；it默认5s/原配置不变。Reader→ClockAdvance→CommandButton递归真实展开，不只测helper或源码字面。

三小项后静态全面复核，保前像/输入hash/源码diff/独占范围。证据逐次真实JS guard+wx。仅Reader及新test写，records/旧tests/产品其它源/masters/P3不写；无工程/Browser/codec脚本/Git执行，compat0。回滚仅恢复本Reader差异和新test，不动原保存及原失败证据。
