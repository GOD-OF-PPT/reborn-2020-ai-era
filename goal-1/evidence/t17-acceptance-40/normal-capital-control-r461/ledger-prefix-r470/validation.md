# 真实凭据组件短回放与缓存失效诊断
本轮只读，同原正常612/实际613固定SHA，取真实追加465笔的最前40笔。控制464与候选469各从同原ledger起保原applyLedger全部校验；40个完整canonical ledger SHA和实际原receipt全部字段均匹配，baseline未变，源精确。操作组成：due_expense1、expense1、deliver_prepaid19、incur_supplier_usage19。没有新上层游戏命令或写回真实人生、Main/DB。

Profiler自检23样本与实际exit0后才启动实际回放；仅自有进程Session.connect，无端口/Debugger/原PID注入。实际5986样本；整体profile65003.819ms中，applyLedger子树27561.1ms、observer完整hash31623.159ms、全局不可归因GC5610.893ms。只对apply子树报告self：supplierReceiptOperation30.45%、assertLedger22.34%、assertSupplierHistory17.60%、identifier13.52%、全部money.ts合计0.515%。它不是整个日期步的占比，也不能把hash/GC都归到业务。原/新40笔apply的CPU总量接近（原user33709.174/system2031.354ms，新user33587.735/system1851.778ms），候选带Profiler且原先新后，不作正式性能判断。

同原612有47156条可缓存receipt、17408664字符；原缓存上限32768条/16777216字符/单条8192。原生JSON.parse代理仅计数并原样转发，值与native错误自检过。连续三次同一不变ledger的assertLedger都通过，每次都解析47156条、其他JSON.parse0，完整ledger SHA不变且全局JSON.parse恢复；实际exit0。47156条均未超单条限制，排除“本来不可缓存”解释。与源码达到预算就整表清空的逻辑共同定位本长档缓存不能预热的问题；当前未修复。
冻结416/464/469的ledger.ts全部字节同（SHA12632f41d435a1d82ee4a4a350c74739a0ef068bd9c62883af6e2d1583ed7456），即实际原进程仍使用同一实现。该证据是组件/缓存行为，不能冒正常2025/完整GameRun/Controller/IDB/Native、正式性能或人类体验完成。原40笔诊断不是新正常进度。

后续边界和有据候选见next-fix-contract.md；三子累计检查见cumulative-review.md。0产品源改，全部业务规则/限额/钱/AP/日期/随机/权限/格式/保存未改。原70完整封存/P3/旧红/原输入/master前缀保，原71876继续原策略，整个父任务/U6/goal及所有原后续未完成，Main457/DB未动、兼容开发测试0，无push/deploy/外发/新委派/global memory写。
