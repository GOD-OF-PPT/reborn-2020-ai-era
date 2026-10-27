# 原Clock早停与原Audit反馈的准确分层

真实R4类型已过；随后6文件65项实际64pass/1fail、exit1/23948ms原文保留，不能称一次全绿。唯一红是测试错误要求Clock按钮直达Nov14原audit开工，实际原时钟会先给Nov8已公开原应收决定。不是游戏规则bug。

已静态沿normal86公开字段核唯一早于Nov14的未收原单：rly:26fafc4431c01d61357e398bfe54d47b，Oct25开单、Nov8到期、720分未收，原客户/企业账户受控。新断言由同public helper playableAdvanceDate→relayReviewDate算safeDate，核它确是Nov8且小于auditStart，再核唯一原单ID/开单/due/720分/零已收冲回和实际按钮含safeDate。没有只删日期测试。

原progress.wait.date===auditStart、job.startAt、job.completeAt、完整batch1条、实计仍未知、不重复委托、无request、原档不变等断言全部保留，21case/其它源码与门槛不变。两行pure helper import加一条错误assert替换，精确逆变后整文件等R6。原产品Clock/屏障/费用/AP/日期规则未改。

[杠精审查] 静态补正通过：同一原委托的实际反馈时间与推进前需面对的更早原账决定分别核定，既不越屏障也不丢原job身份。没有新跑checks/type/build/Browser/Git，Root统一复核后才可记修后通过。本test重新冻结。
