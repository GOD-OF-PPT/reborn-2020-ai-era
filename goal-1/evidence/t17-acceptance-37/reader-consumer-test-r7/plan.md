# 同一U4-B：原Clock较早公开停点的准确断言

Root R4类型实际通过，随后6新文件检查真实65=64pass/1fail、exit1/23948ms，599源与extra初末同。唯一失败是本test强制Clock按钮直接含auditStart Nov14，错误忽略了原helper已知Nov8客户原单早停。原结果及R6 test完整前像保留。

独立normal86公开原单 rly:26fafc4431c01d61357e398bfe54d47b，2024-10-25开单、2024-11-08到期、720分未收，属于受控本站原客户；它先于Nov14已安排audit。新test沿实际同public helper playableAdvanceDate→relayReviewDate计算safeDate，核Nov8< auditStart且确有此已公开720分原单，再核按钮含safeDate。保progress.wait.date===auditStart、原job开始/完成日期、同批次/实计未知/不重复委托/request和原raw不变等全部断言。

只加两pure helper imports与替换这一个错误按钮日期assert为更强同来源safeDate检查；不改产品Clock/日期规则/屏障、原金额或case/门槛。没有新跑checks/Browser/Git；Root后续统一运行才证明修后结果。
