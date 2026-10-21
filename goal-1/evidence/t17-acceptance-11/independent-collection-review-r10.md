# T17 / 5c-U1 原应收确认与到账回响独立审查 R10

审查者：/root/relay_final_review。结论：本次UI增量限定通过，未发现新增确定可触发的代码缺陷。范围为relay-scene-progress、RelayCommandDetails、scene-result的CollectRelayDue增量及receipt测试源，并对照原客户编号、捕获确认和收款规则。不是Chrome实际收款、正常Create回放、全5c、T17或goal验收。

写前只读核实：GOD-OF-PPT/reborn-2020-ai-era，owner GOD-OF-PPT，PUBLIC；main，HEAD 7f7f0dfcb5d6f86e46ac11585f94c32817f16caa。对象为其冻结工作树；原R9报告哈希保持原值。本报告独立新增，不回写旧AX、存档或报告。

## 具体核查

1. **客户身份稳定**：场景主操作、确认正文和到账回响均按该businessId的全部原customers顺序findIndex+1，保留已经关闭的原客户在序列中的位置；与RelayPanel.tsx:26、46、59一致，没有按当前未关闭客户重新编号。客户选择及原payload仍由customerId绑定，数字是展示编号，没有把编号当合同ID。

2. **仅到期应收可收**：场景金额仍按该客户dueAt<=当前公开日期的原receivables，减已收collectedFen与已冲回reversedFen；确认则读捕获投影的dueReceivableFen。core/relay-projection.ts用同一到期过滤生成该值，余额receivableFen等于全部原应收余款。新增确认把“尚未到期”明确列为receivableFen-dueReceivableFen；未使用客户prepaidFen、供应资产或未到期应收来放大本次收款。

3. **确认快照不重绑**：App.tsx:69仍在request时捕获context与contextFeatures，创建CommandDetails ReactNode保存在modal.details；新RelayCommandDetails只读其传入relay，没有向controller重新取当前客户。合同起止、企业账户、编号和金额均来自该次捕获。原command封套继续携带runId、expectedRevision和幂等ID；确认时preview/submit仍复核原封套，旧revision不能静默重绑新的收款条件。

4. **实际到账证据与收入分离**：scene-result的新分支先经原同run、更新revision、saved且无candidate门槛；再只对原已有receivable取collectedFen正增量，并要求相同customerId、仅一个客户、原客户/企业存在、同企业cashFen增量精确等于该收款总额、该客户recognizedIncomeFen未变。无新收款、现金增量不符、新确认收入或未保存候选均不给专用“实际到账”回响。未到期原应收继续保留在文案与原账，不把它加入已到账数。

5. **原规则与载荷保留**：CollectRelayDue严格payload仍只有customerId。原core inspect要求实际存在到期未收余额，apply只遍历该客户dueAt<=date且余额大于0的原单；ledger collect_receivable只做对手到企业账户的现金转入及原receivableFen减少，不追加收入。只读git diff核实App、RelayPanel、relay-projection、relay runtime、ledger及relay-commands均未因本次增量改变。场景仍confirm:true，日期/AP/钱数/权限没有新的UI裁决入口。

新增receipt测试源实际构造独立prepaid/postpaid小夹具；postpaid链保留未到期应收，核对收款现金与收入不变，并覆盖无现金、收入变化、旧回执与未保存候选，以及捕获的确认客户/合同/金额语义。夹具注释继续明确不是正常游玩或原生存储。本审查只读测试源，没有运行它们，也不把主控报告的18/18运行结果归为本审查执行。

主控保存的原r94/Feb25确认缺口和原存档属于原历史证据；修后Chrome实际收取、保存/重载和完整Create核定尚由主控随后完成，本报告不代替这些结果。

本次未修改源码、测试或任务文件；未运行测试、类型检查、build、浏览器或兼容检查，页面兼容开发/测试为0。仅经父目录保护以wx新建本报告，写前后核对以下字节不变。

[杠精审查] 限定通过：回查了关闭客户后的稳定编号、到期/未来应收分界、原确认ReactNode的捕获路径和底层到账不记收入规则；没有用纯显示夹具或预计结果冒充正常业务收款。

## 写前后保持不变的 SHA256

| 文件 | SHA256 |
|---|---|
| src/ui/relay-scene-progress.ts | 9f958d7f989e6a4d4cd488f06a7b3fdcb402bde5310b91fe042ba2857a4128cb |
| src/ui/RelayCommandDetails.tsx | 363f7f077726af1630a183f6f5dfe8ef13b158def86ee01e4d36dda9b410c9a4 |
| src/ui/scene-result.ts | ca76b8d5e1c26f2168bc02f1a786d27a56fc88d6da2df19e433f5760aac83be8 |
| src/ui/relay-scene-result.test.ts | 040955672b72c0a99c7a66c662ace144fd6d484d63bcd5c11ddc1c570e0d350c |
| src/ui/RelayPanel.tsx | 0faeb4d8dfe2ff7865716b7cde17d44c3174f0798e132760f4550bb4cc98a0c5 |
| src/ui/App.tsx | f1e35804b73813b46fdc7e7253d0bd42894f665a1a36f56e708dc430bef58c77 |
| src/core/relay-projection.ts | 448313a8d7046b6bc319c4c42d1a1553430ec6d79103bb6385cae8a39448a3e1 |
| src/core/relay.ts | 979ee69da37af324b422313d2665f9d98b38a601919b095e2513a2ba6e269a72 |
| src/application/relay-commands.ts | a6e74a7e827dbae5c6f9dc0d435996419116ca44a8f9e227e0cb8b0d08f210ca |
| src/core/ledger.ts | 48e5d86f8b556645ac8aad0f6314bbe4fca2722db8202b14798573e58bd92123 |
| goal-1/evidence/t17-acceptance-11/independent-scene-clock-review-r9.md | 2ecda6f8dc09b9301bc7cc70ca628d3940c1b8f9e68faacd1a84bd0c79d40971 |
