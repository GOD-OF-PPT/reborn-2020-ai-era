# 原生候选与有限停止：只读读回

官方 codec 导入/导出及公开 playing 投影读回通过，终态 exit 0；2026-10-24T02:10:27.186Z—02:10:34.174Z。本次未构造 controller/session/store，未执行新命令、preview、replay、浏览器或游戏存储写入。

- 六份输入 canonical 往返逐字一致，run 为 normal-relay-technical_employee-ee9cb440，公开 revision 为 91/92/93/94。
- abort 后旧91与独立物理旧91完全相同：1,143,084B，SHA fbb353ba3c510d4e2a116170f78e5ee1bd4b93580541823195f8aa9c8f41a321。
- candidate92与重试后独立物理92完全相同：1,159,923B，SHA ae94d0c6e03fa447a0f5acd72a847176f290c34cc402651ba59baa8a42d30f54。91→92仅新增一条原 StartRelayServicePeriod 回执；未重复开工。
- running93为1,197,820B/SHA 4aecbd255fdc098e06636110460113410ab245bcf09e3c77cec8f830de5e451e；Stop94为1,200,676B/SHA 5ad7831f40234bb13e5f32b0c1898bb90ad4f98e22f9a710277207680a9f1441。93→94仅新增一条原 StopRelayPeriod，仍是 period rly:c89c1062f0ddd18e27ea8de398634f9e，原服务 running→interrupted。

服务已实际付款¥3,000并消耗1点行动；停止不退款、不恢复已耗点。未来支持仍 planned，原¥1,500现金预留和1点行动预留完全保留。季度总账在93/94都为已耗2、预留1、可用1、总4；其中本服务消耗1，不能把季度总已耗写成1。

停止前后企业公开现金¥39,077.42、可用¥21,820.06、客户预付款负债/保护需求¥15,757.36、应收¥121.32、应付¥121.32逐字对应不变。总占款¥17,257.36包含未来支持，不等同预款负债。完整 ledger、原客户/供应/批准与权限/计量等集合、原支持行动及现金预留均未变；企业与站点未因本期停止而关闭。没有把预款当利润或把停止当清债。

绑定与末核见 source-before/source-after、inputs-before、script-before：保守官方依赖闭包117个src模块（102个core/application，0个UI）；另绑定package/lock/guard。源、六原文和脚本前后均未变。UI planned-support文案处于并行修改，未纳入此会计闭包，不宣称整个506源同一身份。

证据：result.json列实际回执/posted ledger/public投影与全部十项断言；readback-r1.log保完整输出；terminal.json保原exit与时间。readback.mjs 15,958B/SHA 6e7b8e005767b7589295b2ca4b6320febdd04bf215d948d82dcb3c065e0e2fe4；result.json 132,814B/SHA fddd49cae2aaa46e99fa6f0fa3efc775feb4d473c1837fbb0520aed0abd2ca3f。

这是给定原生导出的只读官方账务/回执核对，不重新打开物理库，不是完整Create重放、新Chrome或真人试玩；不扩为整R1/S4/goal、盈利、P3/62/22或兼容验收。原input逐字保留本轮用户输入，具体派工界限见plan与本报告。
