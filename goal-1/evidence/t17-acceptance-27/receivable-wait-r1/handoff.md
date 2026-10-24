# 原应收等待修缮冻结

仅变更source-final列的2文件，原红2条保red-r1.log；最终3文件32pass（Vitest报告5.65s），strict-r1.log实际exit0。target/clock源码仍同前像。

明确whole-period先沿原progress优先级；只有settling、无active原服务/支持/audit、无已知差额、无当前应收可收时，选择仍未清且dueAt>today的本period原应收。sourceId须原period或本期同customer的meter，customer唯一属于该business；按原dueAt/id排序，不按旧meter.date重算更正。

progress.phase仍settling，nextDate/wait.date是原dueAt，wait.label为“等客户N的原应收到期”，outcome pending（既有non-success保留），command/audit/intent仍null，resultRefs追加原receivable ID与原发生日。历史job/meter早返record不受影响；没有自动收款或钱/到期变更。

4个新增语义测试覆盖最近原单/更正dueAt、跨source/错customer/已清单不采用、服务/支持/audit/已知差额/当前due原优先、历史job/meter不转等待，及JSON原投影不变。它们是明确public display variants，既有target.test内正常r91小suffix同批通过，未重放多年Create或操作浏览器。

Root拥有NarrativeScene，需按真实progress.wait允许settling接原Clock；只改phase模型不能替代该接线/实际小循环验证。原review-r1-final的等待缺口由本新修缮闭合模型部分，旧报告原文保留。无兼容、P3、core、配置、Git或其他production改动。
