# 失败保原及不重跑规则

1. 当前只是候选准备。最终raw/cut/readback未齐时不freeze、不运行、不填结果；缺输入不是一次失败重放。
2. freeze预检失败：没有Create；若已建partial正式根，保其原件，修具体合同/helper另fresh同级根重新冻结并独审，不能覆盖旧根。不要把metadata cut成功说成重放成功。
3. runner preflight/GO/identity失败：先取真实外层进程terminal和产物，确认command.json/replay-terminal是否已存在；不能因缺result就断言没执行。原helper可能在try外throw，外层终态必须落证。
4. 原verifier非0：保完整stdout/stderr/terminal/input/sourcecut，分清原字节/规则拒绝与审计器假设。原输入不改、不伪造runId、不热修官方源/旧helper来消红；Root决定确切修补与新cut/GO后才能另授权。已发生Create尝试与历史post尝试保实数，不把失败算0后静默重跑。
5. 原verifier exit0、逐份原文成功，而public readback非0/字段假设错/输出协议错：禁止再跑完整runner或新完整Create。保原完整Create report与terminal/hash，只按原readback-correction-r2模式新增fresh读回补正根、精确脚本差异/输入/授权，单独执行一次读回；resolved结果引用旧Create和新readback，不覆盖原失败result。
6. readback已写部分产物或passed前源漂移：不覆盖、不回写；收真实terminal，保持原红。读回补正也要fresh根，不能为更换输出目录重跑已绿旧35脚本。
7. source/dependencies/raw/manifests/GO/独审报告任一首末漂移：本cut结论无效，保真实漂移/时序；不能重算hash后冒原同一GO。新输入或继续操作用新producer/cut，旧journal保确切prefix及晚事件责任。
8. 多分支/别名：完整receipt trie可复用完全相同prefix，但Native新命令事实按显式branch及原producer计。若Root最终选同一wrapper内多replayGroup物理分开Create，各组报自己的实际统计和terminal；不把共享命令相加伪称全局unique。

上述均不授权本轮执行；未来只有Root实际明确一次命令、输入/源窗及独审GO后才能动。正向35既有事实不代负分支、保存故障、当前美术/真人或完整U4B；compat0及所有后续责任保持。
