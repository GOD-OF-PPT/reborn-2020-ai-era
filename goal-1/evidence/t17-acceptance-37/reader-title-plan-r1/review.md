# 原票标题和比较信息：最小候选

Native n02实际显示全部133票/28页，第一屏两张客户标题携完整rly:ID；该长串不帮助判断预付/后付、旧保护或到期款。保留原图/AX，不用未来重命名冒原画面已修。候选只改relay-records.ts的读者title和原依据辅助函数，绝不改key/recordId/target/顺序/金额/命令。

| 类型 | 标题候选与稳定性 | 移出标题的完整字段去处 |
| --- | --- | --- |
| 客户与引用它的票 | 客户N，N由本站全部ownCustomers原顺序决定；客户原约附当前预付/后付与合同至日 | 客户row首line仍原customer.id/personId/originAudience/source；meter首line仍customerId；refund首line仍customerId；invoice首line仍customerId；period客户/feeQuotes及quote客户/response改独立customerRef保fullID |
| 原复核batch | 第N次原复核 · 原job.startAt—completeAt，N由本站全部auditJobs原顺序决定 | audit lines首行原任务/jobId/业务/完整meterCount/全部periodIds、逐audit/meter/customer引用原样；row.recordId仍jobId，完整batch不缩当前子集 |
| 同客户原应收 | 客户N · 原单M · 开单日 / due到期 · 净未收，M由本站全部receivables原顺序决定 | 原应收ID/customer/source/operation/date/dueAt/amount/collected/reversed/remaining均原lines；新增title只重述既有净额，不推新金额 |
| 同客户实际收据 | 客户N · 收据M · 实际日期/实际金额，M由本站casebook.collections完整原顺序决定 | collection原id/invoiceId/cashOp/date/amount均原lines，collectionId/recordId不变；不按当前invoice过滤后重排编号 |

序号不是新实体和存档内容；只用于眼前阅读，按已有业务原顺序查找，不给筛选后第1/第2个重新编号。新增历史记录只在原数组后追加，旧票序号不跳。完整ID仍可按原依据核，不用短hash冒唯一标识。按business隔离编号，跨企业阅读先由原target/归属标明站点。

## picker至少要让读者能比较什么

- 客户：当前预付/后付、原合同期限，旧保护余额（即使已换后付也不能抹）、到期待收与总应收；标题可给mode/期限，比较small至少给旧保护/到期。只写“原合同继续”不足以选客户。
- 原应收：原due/净未收是选择部分收款的最小信息；同due多单还需原单业务序号/开单日。已全收/冲回净零属完整all历史，不挤占当前回应焦点。
- 原支持/服务/复核：planned/running区别、原start/complete；确定原成本/AP在选中票首层仍显。原复核完整数量与所涉期数帮助区分batch，未完成实计继续未知。
- 原退款：登记额、实际现金已付、尚欠；不能只“原退款已记录”。供应：本站跨期资产/贷项与未付，不能拿pool.paidFen当累计现金；两者原summary保持。义务：due/剩余/保护，金额零属历史。
- 实际收据：实际日期/金额，明确已收非待收和不重复收入。追加更正：原meter日期/客户/已核差额，两边调整不是现金；已追加附票不再作为待更正。

Root可在picker一条small显示这些短比较信息，不把完整长summary/ID塞入radio，也不把关键费用/旧债只留AX。当前summary在选中票首层已完整存在，picker比较仅摘准确原事实，不另算规则。

## “仍需回应/在等”初筛边界

attention=pending不是“正在等”的同义词：当前未复核meter也pending，56条未知meter全部并入等待仍会重现28页。正在等须已有唯一原job处于planned/running，或真实未到期净未收invoice/未结义务；未审计票尚未委托属于可选择核对的依据，保在完整all/计量票入口，可按一期一组引导，不能宣告已结/不可达。

初筛可优先真实due/known（到期净未收、已知待更正、原到期义务）与原active支持/复核；申请完成未读是当前回应，申请进行才等待。station旁账必须继续标“本站原责任”，不能过滤后冒眼前本期。任何显式initialRecordKey或用户先前选择仍优先：失效说明，不以默认初筛自动换票、换书签或改金额。完整all须显选可达，原33/N1/N2/共享Pay入口和全部原字段不删。

## 待授权后最小验证

1. 当前raw87同客户号与原source/customerId均保持，所有title无full rly:ID，lines仍有每个完整原ID。
2. 同客户同due至少两invoice的原单序/开单日可辨；同客户同日两collection的收据序/金额可辨；过滤/逆序显示不改原业务序号，旧recordKey/target不变。
3. 原batch日期和业务内序稳定，完整meterCount/periodIds及原jobId仍在原依据；客户mode切换不抹原保护。
4. 新picker初筛不把未委托未知计量冒等待；默认聚焦原支持/原已知差额/到期原单，仅UI阅读位置，取消/readonly/candidate/书签不改业务。
5. Root实际同窗口复看支持段重复和插画同页组合，原n02/n03留存；不以小测试或candidate patch称当前画面已可用。

本轮仅标题候选和建议。全190检查仍由Root实际进程拥有，未重跑/轮询/改活源，compat0。
