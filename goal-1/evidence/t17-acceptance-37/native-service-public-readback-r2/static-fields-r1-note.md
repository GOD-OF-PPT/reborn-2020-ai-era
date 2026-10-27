# 未执行前原字段补正

R1候选未执行。静态原JSON证实pay_obligation操作无businessId，必须沿唯一原obligationId反查debt归属并核同id现金tx.businessId，不要求不存在的字段；供应topup/refund cash.referenceId均null，sourceEventId=cedar-direct，池引用位于原financialOp.prepaymentId。R2只精确补这两项，保原所有金额/日期/AP/引用门槛，原R1不改，不称正式红或产品缺陷。
