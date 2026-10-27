# 最终独立公开账务脚本的审查合同（待最终输入，不执行）

最终Root应给一份单独、可审阅、哈希固定的publicReadback脚本，读取U4B_AUDIT_DIRECTORY/frozen-contract.json。产出只写新正式根readback-result.json/public-facts，所有祖先guard，原inputs/旧helper不写。当前未编造该脚本或预期全部断言，因为后续producer/raw尚未齐。freeze-final-cut必须取得它的完整身份才可完成；run还须独立静审结果与Root单次GO。

## 数据与身份

原codec import/export只在正式授权后，用官方projectRun/runtime.project（现含enrichRelayCasebook）读取已提交公共事实，完毕原run完整codec封套仍逐字同。每个casebook检查ready、runId/revision/asOf，旧stub缺字段不可当零或成功。公开财务operations仅应用层已授权安全摘要；不在审计UI模型或额外脚本读未审actualUnits/fact/RNG/世界队列。需要原账独立金额核验时按Root明确允许的已发生财务来源字段与原canonical op映射，不以同模型自证。

所有比较先锁原run/账号/企业/站/账期/客户/计量/audit/batch/原单；一项不唯一就保原失败，不find首个或按金额猜。新增source127不是旧126保持；正式源数组精确以Root最终登记为准。原action cost/AP来自已经保存的ActionRecord，不能取本版内容报价冒原实际；已承诺未来支持/到期日可读，不执行未来。

## 已知R2部分收款分支必核（后续状态另按原文增量）

- old86原客户2同张原单dateOct24/dueNov7/amount1216，before已收0；new partial87是原CollectRelayReceivable，显选608，after该单已收608/净未收608，未来720分单未动。
- 原企业现金/可花21525.81→21531.89、应收1936→1328分，已确认收入/成本/利润、原日期Nov7、个人220000、AP1/预留0不变。以原collection.id、原invoiceId、canonical relayId('collect',relayId(commandId,kind))和cash.source/ref/account/business/date核，不以正cash猜收入。
- partial87原SaveExit/reload/Continue及R3仅304fen UI草稿原文皆逐字5d675…，0新增命令；old whole-client due87 a19914…只是独立旧分支/备份，不能与partial先后累加。

## 后续最终producer若实际发生，才追加对应断言

独立single-meter复核：已安排/运行实计null，真实完成才公开；0实计不是未知，单条更正只匹配auditId+公开实计，保原report/price/rate/terms。batch完整跨期与子集分开，零差额可留下核对记录但不造钱。更正正负两边分列，新增AR/AP读取新单date/dueAt，不按旧meter日推。

客户partial refund：原refund→rechargeIDs/opIDs→原obligationHistory，再对应当次cash.referenceId与后续Pay；实际已付+尚欠=登记额。op.referenceId可指充值op，cash.referenceId指payable，两者不同且都正确；不能相互套同值断言。

共享Pay：canonical operatingId(commandId,'PayObligation')且sourceEventId=commandId，精确原obligation/account/date/amount及cash.referenceId=debt.id，未付继续，收入/费用不重复。

供应asset/credit：pool跨期，paidFen含已付后贷项不是现金累计；原incur/consume/ref→reverse→Pay/settle/refund按operations.order和原ID引用核。tx.order是现金数组序，不可与operation.order跨数组硬比较；用原ID关联。settle_supplier_credit为非现金。未来已建due义务保，已结历史保，个人/别站不串。

支持中断/停止：保原executedAt、已耗成本/AP、未开工取消与原预留分别核；服务和支持独立，旧保护/应收应付/供应资产和有限停止门槛不清。实际存储故障：旧saved/physical/candidate/retry/reentry字节组按Root明确角色核，candidate投影只称proposed而非旧UI；retry不新增命令。

所有新回执计数只来自Root固定Native范围：历史前缀重放数量、capture rows、unique raw states、新Create、新保存、备份/缓冲/物理/候选/重进分开。不把同run different revision chain当完整浏览器0→2025经历，也不把不同分支拼作一次收入。

## 失败与保全

原红先保存所有stdout/stderr/terminal/inputs/script身份；审计器假设错另fresh correction-rN仅改具体断言，保其它原门槛，已绿完整Create不重复跑。真正规则/原文不匹配先报Root，不修原raw或source凑通过。只对本正式输入cut及源窗发表结论，不代Native图、真人、美术认可、compat/P3/全goal。
