# C16 输入目录与重跑

run-c16.mjs只接受新输出目录；原22个命令、时限/断言/文件隔离均保留。跨路线X06采集器另有原合同输入`ROUTE_EVIDENCE_DIRECTORY`，须指向本次生成的五路线报告目录，不能退回历史T13默认报告。新一轮示例（目录尚不存在时）：

```sh
rtk proxy env ROUTE_EVIDENCE_DIRECTORY=goal-1/evidence/t16-c16-replay-b1/replay node goal-1/evidence/t16-epilogue/run-c16.mjs goal-1/evidence/t16-c16-replay-b1
```

本次a1原执行遗漏此环境输入，最后X06正确以源码哈希变化拒绝旧报告；失败原日志/run-results.json保留。只为失败项提供当前a1/replay报告并改用新输出route-diversity-r2后0退出，五路线来源和正常档再由原收集器完整校验。449冻结文件逐字不变，已通过的21项原执行和88文件529项原单测仍为同一源码；因此没有重复无关的整套执行，也未降低任何校验。组合结果为a1/repaired-final-result.json，不覆盖原失败报告。

这只是当前累计的实际通过。当前原生前缀审核、旧格式原源码审核、最后限定review/字节保护/提交仍需完成，不据本说明勾T16/C16或整个goal；原PNG/真人和M01/后续任务责任保持。
