# 当前U6恢复任务的真实凭据短回放诊断
父r461正常2024Q4/2025/80万董事实际签署治理仍由71876/15729原416kernel/459codec运行，driver/control/命令namespace/策略不得热改、重启或换路径。此前money子469已完成全原613 byte/GameRun等值，但整步1916474.55ms没有提速证明；本子是同一恢复任务的只读诊断，不是新路线/另一个游戏功能。Main457/DB/全部兼容开发测试0操作。

## 症状和可否证假设
1. 重复账本历史核验或扫描主导：同实际过账操作的applyLedger短序列耗时高，CPU落assertLedger/assertSupplierHistory/receipt解析或遍历。
2. 大图复制、分配与GC主导：cloneLedger/数组复制或GC占主要样本，primitive CPU/wall高但不能只归因金额。
3. 混合调用下sumMoney仍是主要成本：真实金额大小和数组形状的完整过账子树中，money回调仍占高比重；冷一次的26%不能外推。
4. 主要成本在账本之外：真实过账短回放较轻，账本子树不足以解释整步，此时另查时间线/运行时全校验，不机械继续money优化。
当前只测/分层解释，不据未返回的诊断修改产品或宣布任何假设成立。

## 最小反馈环
- 只读同原612与原真正已保存613（均来自既有已封存路径和SHA），经原unpackSave解码，确认整个原612 receipts是613同序前缀。
- 从原613追加receipt的signature逐字解析原LedgerOperation，校id/kind/account/date，取最前40笔实际连续过账；不足40明确拒绝，不造数据或另挑有利段。原上层命令与GameRun/timeline/AP不执行。
- 使用冻结464原money与469最终money的独立同版ledger模块，从同原612 ledger起逐笔applyLedger，保原全部校验。基线先assertLedger模拟原codec已验状态；每步记录整个canonical ledger的hash，要求40个完整状态前缀相等，并核baseline未被改动。它只证明过账组件回放，不代完整正常存档/Native/IDB或正式性能。
- 先在自有进程使用Inspector Profiler自检，确认启停/采样有效才做实际序列；仅自身Session.connect，不开端口、不用Debugger/Runtime.evaluate、不连原PID。采集候选整段时把applyLedger的调用子树与prefix hash读回分列，GC单列；不拿包含hash的总样本冒作过账CPU占比。
- 保存原始profile、逐笔操作出处/结果/CPU与完整source身份，分清冷模块/缓存/顺序和一次性观察限制。已封70 producer、P3/旧红/原输入/用户DB/master前缀完整保护。
- 结束后按实际结果完成诊断记录并提交；不进入产品修复。事实索引、money验证与本诊断之后作一次累计review/debug（不重复未改功能长测、无兼容专项）。

## 风险、验证与回滚
直接过账会漏掉上层时间线/预算，因此只称组件诊断，不能替代原完整612→613已经证明的wire身份，更不能接回原正常人生。所有输入都从已发生的原receipt读取，不读未来队列，不改seed/钱/AP/日期/权限/规则/保存。若原账本还有非receipt修改导致短前缀不相等，保拒绝而不绕校验；若取样无效，保工具错误并修自检，不能提前执行实际序列。脚本读取大解码图有内存开销，数据解码/前缀hash与applyLedger计时分别记。冻结469全部980源与原464全源核验，WT/P3不带。
本子无产品源改，回滚仅新诊断文件；原71876/15729与所有已封存子、原负例、实际head/log绝不清理/改写/信号，不创建停止请求。所有新输出只在本新子，结束后才seal；父活root/execution不seal，不stage活输出或mixedmasters，无push/deploy/外发/新委派/global memory写。全部U6/17+5/正常board Native/后续原组合/PNG0/真人0/P3正式未跑/M01须明确恢复/T18最后/goal继续未完。

[杠精审查]通过准备：用同已发生凭据而非合成小数替代实际问题，40笔不缩、保持完整账本前缀和原校验；若其成本不主导，明确转向其它假设，不追加无据优化。

## 首轮证据与缓存阈值见证
observe-v1已actual exit0：原实际新增465笔中固定前40笔（due_expense1/expense1/deliver_prepaid19/incur_supplier_usage19），原464与469全部40个完整canonical ledger hash/原receipt结果同，baseline未变/源精确。原40笔apply wall32587.06ms、CPU33709.174/2031.354ms；新wall30503.89ms、CPU33587.735/1851.778ms，候选有Profiler且原先新后，不作正式性能推断。
profile5986样本，applyLedger子树27561.1ms，原始总样本65003.819ms中还有prefix hash31623.159ms与全局GC5610.893ms；这些不能归入过账或整体日期。apply子树self前列supplierReceiptOperation30.45%、assertLedger22.34%、assertSupplierHistory17.60%、identifier13.52%；money回调约0.19%，是这40笔内的限定结论，不推整步归因。
源码发现private parse WeakMap达到32768条/16Mi字符预算会整表清空；同原612 receipts=47156。下一只在自有副本短时代理JSON.parse，仍调用原native parse，连做三次不变ledger的assertLedger，记录原凭据实际解析次数/大小与budget，核完整baseline hash不变和绑定恢复。代理只计数，不拿其耗时当性能结论；若重复调用仍接近全部解析，支持预算驱动thrash假设，否则保反证。无产品修改、无新游戏命令或原进程注入。
