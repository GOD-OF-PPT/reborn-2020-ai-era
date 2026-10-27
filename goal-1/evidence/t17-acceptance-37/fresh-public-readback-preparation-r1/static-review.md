作者静态自审，非独立准入：四版均未import、未syntax、未执行。R1起稿按producer固定period过窄；R2改为每capture显式原scope并要求完整R7/R8矩阵，R3严格绑定auditRole/producer captureRole并核真实新command贡献，R4补维护op→cash/debt引用和单负income/cost分列。这些是执行前静态补正，没有正式红、没有真实验收通过，不能称修复产品。

R4有限字段不读seed/隐藏queue、meter.actualUnits/factId/missedUnits或未完成quote.responses；commands仅hash完整原signature做prefix，payload只解实际末Stop/CorrectUsage/CorrectPeriod/Advance。金融signature只白名单kind/id/account/business/contract/source/date/ref/prepay/obligation/reservation/settlement/dueAt/amount；原signature不输出、无eval/规则/未来模拟。已完成quote.responses和已完成audit身份可读，不能把quoted future terms称当前。递归deep equality比较JSON字段，不受对象键序影响；原supplier preload/refund现金referenceId可以null，不强行假设pool是cashref。

风险/残余：R4自身尚未独立审或语法/执行；原actual public schema字段与每新R8分支仍须最终raw核，若有不同实际业务状态必须保红/明确新适配，不能从净余额兜底。producer/key/role数与未来导出未知，不填R8路径和通过。当前新增工程源/masters还可变，本准备没有被冻结产品源码，不拿历史127/901冒当前。正常Create/verifier/P326等由既有最终Root freeze统一绑定。

现R7 cut与旧35/31脚本/协议只做参考读身份，0旧审核重跑/0正式JSON读回/0工程/0Browser/0Git写。后续独审应重点核maintenance reference真实形状、bulk new invoice.contract customer链、每capture不同period、R8三组byte alias的原source与是否误算new。
