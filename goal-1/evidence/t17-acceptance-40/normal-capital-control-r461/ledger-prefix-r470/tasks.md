# r461真实过账组件诊断
- [x] 自检取样工具，用原实际40笔连续凭据建立保全校验的短回放，核完整账本前缀和CPU子树，完成累计review并提交诊断（0产品源改）。
  - 固定原输入与出处：同原612 SHA/实际原613 SHA，原47156 receipts完整前缀同；实际新增465中固定最前40笔，无新游戏命令。
  - 自检门槛：selftest-v1 23样本/actual exit0；同helper SHA门槛后才实际observe-v1，后者actual exit0。
  - 40笔实际原序/完整前缀：原464/新469全部40个完整canonical账本SHA及实际receipt全部字段同，baseline不变/源精确。
  - CPU原始采样与分类：5986样本，明确apply子树27561.1ms，observer hash31623.159ms/全局GC5610.893ms另列；private解析/历史核验为本段热点，money self0.515%。
  - 三子累计review/debug：cumulative-review.md已按facts/money/本诊断及所有旧红/未验/全goal逐层检查；70封存/P3等保护通过。
  - [杠精审查]：通过（限定诊断）：三次不变ledger都解析47156且native绑定恢复/全账hash不变；source预算清表解释有据，未把诊断当修复或整步性能完成。
  - 提交/读回：本组一次封存提交；实际commit及逐blob/字节/SHA/mode回读见父目录ledger-prefix-post-commit-01/readback.json，0产品源改。
父恢复/完整U6/goal仍未完成；兼容开发测试0。
