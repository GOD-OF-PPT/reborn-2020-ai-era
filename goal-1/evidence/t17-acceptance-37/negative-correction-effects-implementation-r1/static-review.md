# 作者静态复核（不运行工程）

已实现完整两侧映射：客户正原预款消耗/新AR原date/due与后来collect，负refund_delivered原receivable冲回/现金登记→直接付款+canonicallaterPay→余欠/匹配保护；供应正原AP/cashPay/原creditsettle/余欠，负原consume恢复资产、原incur按原额-已核现金-已核creditsettle-当前余欠的引用守恒核冲债/恢复，当前池另标跨期；多reverse同ref不能拆则供应unknown。不使用ledger重放、min、preview或未来计算。

sharedscope核strict target/同run account business station period meter audit correction；原audit完整批次与原job再resolve、completedAt与原job完成日对齐后才读audit公开actual。book ready/run/revision/asOf严格，operations/debts/cash唯一，原metric/source/ref/日期/金额与原报告价逐侧核，未知null不是0。ID先按canonical或现有kind归属侧，然后侧内strictcanonical核；少合法customer/supplier一边op仅一边unknown。全局身份/重复id/错book才全unknown。

原due自动供应Pay不能误认手动Pay：已分别核relayId('supplier-payment',relayId('supplier_due',原cost,原due))及operatingId(command,'PayObligation')；creditsettle也精确同originalcost/pool/debt/date/canonical，非cash非新cost。客户cash.ref=原退款debt、operation.ref=原delivery分开；原protection/currentremaining守恒，历史receipt.statusdue不代现欠。

只在已完成audit读取actualUnits，不访问meters.actualUnits/seed/facts/queue/rawsignature。源码文本没有JSON.parse/signature/evaluate/preview/createRun/Math.min；公开差额×原价仅交叉验证已保存调整，不生成账。没有业务commands/allowed/权限变更；只读/原候选保旧view的历史不抹，candidate新ID不存在不借成功。

新test30展开case只编写：7份实际raw由官方codec+同registryproject setup（新beforeAll20秒）给原事实；正103/106核原Jan18AR/Jan11AP/30cash+30credit/部分60，负102/103/104/109核实际606退现金/202历史资产恢复与后池101/505、原717578保护，真正0差额、Reader首层与原ID。明确publicfixture覆盖预款收入、冲AR、混合冲AR+cash、退款未付/部分或全laterPay、错Pay ref/account/source/date/amount/canonical，供应未付/混合/consume原资产/多reverseunknown、缺两侧canonicalop各局部unknown、stale/crossowner/未完成audit/readonly/candidate旧view/禁止hiddengetter，均不冒新正常历史。

旧13case正文门槛字节不动。records并发quote修改由response另一Root授权独占，作者diff只import/cache+correction摘要/原依据；完整sharedfile身份共同确认。一次apply_patch误用未存在的旧上下文被工具原子拒绝，0源码变更，后实际补base完整refs成功；不是工程红或业务缺陷，无原件覆盖。

本作者未执行type/unit/build/codec脚本/projector/replay/Browser/Git，测试不是通过。原app projection/P32626保持，本scope无core/application/schema/master/旧seal/旧准备候选写。Root须统一类型/新与原回归/新build原图，并完成负分支/故障/fullCreate/累计及全部原责任；此交回不勾U4B/C-S4-R/goal，compat0。
