# 官方只读账务读回 R1

实际单次运行已终态exit0，wall7555ms；7条注册原文、5种不同SHA各一次codec导入/导出及公开投影，27/27断言通过。126官方源、P326、输入raw/manifest与脚本extraReferences初末逐字节/模式一致。详细数值见public-facts.json，进程见terminal.json，独立文件核定见final-readback.json。没有运行正式完整Create、Controller/Session/Store、命令/preview、浏览器、测试或兼容。

## 原文与角色

main91为saved_ui；atomic为buffer80、旧saved81、未保存candidate82、独立物理旧81/新82、saved停止83。合计3 saved_ui / 2 physical_readonly / 1 import_buffer / 1 unsaved_candidate。旧81与物理旧81逐字同（SHA4d083f3b…）；候选82与物理新82逐字同（SHA5f6c135e…）。没有额外导出一份writer-saved82，不能补称该文件存在；原retry的持久化过程由Root Native原记录负责，本脚本只核公开事实/原文关系。

## 开工与停止

原80→81仅一笔StartRelayServicePeriod；81→82仅原AdvanceTime到2024-10-09，计划服务真正running。企业现金2634517→2334517分，服务300000分实际支付一次；本季spent1/reserved2/available1→spent2/reserved1/available1，未发免费行动。候选82在保存前不能当成旧81的已提交画面。

82→83仅StopRelayPeriod，仍是同一原期：服务stopped/interrupted，钱/已耗成本/行动不退，旧客户/条款/供应/许可及原账不变。原集中支持仍planned于2024-11-06—13，150000分与1点预留保留；客户保护18792分、应收1208分、应付1208分均未清除。

## 正常main91

原main91为2024-11-30，同一原期2024-10-09—11-06已经closed，支持11-06—13实际completed；企业仍operating。56条原计量中34条有供应、可适用复核，34条已实际审完；CorrectRelayPeriod留下34条更正记录（33条零差额、1条非零），已知差额pending0，应收应付0。

原客户独立预款20000分，与两次真正回款不同：11月13日20000分、11月30日120分，共20120分。企业累计已确认收入40120分，累计成本（含适用应计）945543分，利润−905423分；企业现金/可花2094577分、客户保护0。该亏损是已读回的累计业务结果，不能把回款或自有资本说成利润。原供应预算100000分、容量10000单位是授权；报告用量供应成本20000分，供应更正差额60分，不把预算全额记成本。

所有上述数据只从原公开playing/account/relay/ledger与已经存下的命令回执取得，没有读取未揭示事实/随机或推演未来。正常main与atomic从同一个80前史分岔，实际后续command/period ID不同，不要求整份features或原文跨分支相同。旧输入不是本轮重新挣得的历史。

本读回不证明当前UI可见/可点、原生存储因果、人类理解或完整Create重放，也不关闭U4-A/C-UX06、P3正式62/22、R2/R3深状态/C-S4-R、T17、原PNG/真人、M01暂停、T18或整个goal。stderr仅保留原Node22 experimental type-stripping提示，无运行错误。
