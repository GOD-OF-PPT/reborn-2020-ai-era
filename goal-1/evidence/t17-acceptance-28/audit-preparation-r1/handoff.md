# U1 完整Create审核入口已准备，等待exports齐

固定命令（尚未执行）：

```sh
rtk proxy node goal-1/evidence/t17-acceptance-28/audit-preparation-r1/run-audit.mjs --output-dir goal-1/evidence/t17-acceptance-28/normal-export-audit-r1
```

后续重跑仅换未存在的normal-export-audit-rN目录。每次都重新枚举root28直属chrome-*与全部exports.jsonl，不覆旧；先browser_evidence_guard所有祖先，再建立本轮输出。内部唯一原审核调用是rtk proxy env NATIVE_EXPORT_INPUT_DIRECTORY=goal-1/evidence/t17-acceptance-28 node --experimental-strip-types scripts/verify_normal_browser_exports.ts --output-dir <本轮>/report。旧runner/helper/源码/P3/masters未改。

工具新增：原126源+额外guard/wrapper/baseline/input身份；来源与输入前后逐字/模式身份；五必填字段、原raw bytes/SHA、同目录文件登记去重、可选runId/revision与公开头、所有codec形JSON已登记检查；原stdin无注入，只从可见原文重挣。完整stdout/stderr、真实terminal/code/signal与耗时、失败保留，官方report原文另存不覆。输入漂移或无完整终态不报告通过。

角色边界：官方runner把所有原文完整重放并去重相同Create/命令前缀，files为原文数量，不是新saved结果数。本轮origin是URL，官方inputBuffers=0不能证明无buffer；补充只按明确artifactKind或category origin分类，其他unknown逐行保source与公开头，不凭文件名猜saved/candidate/buffer。candidate/import/readonly也审核字节，但不额外计算新的已保存成果。可选头null/缺省只作公开头addendum，原manifest不改。

准备结果：syntax-result exit0，仅node --check，不是完整Create、浏览器、故障或兼容验收。source-binding实际126份，与root27 native-complete-audit-report-r2及本U1 baseline共同项0变化。原report只读身份SHA e86da5b72fc593961fd0ac291988805db5a0754521466d46f87990e3414029be；wrapper 11351B SHA1b4fea9815496fea74343ed04e88e98afc12a1d6e18fe3658e1c2c6ee83f2e2a。

[杠精审查] 准备边界通过：无提前引擎重放、无原结果伪造、无旧证据写入、不固定预期Create/命令/结果数量；全部正式结论等Root明确exports齐后的实际唯一运行及原终态。真人理解/原PNG/全goal与原P3正式矩阵未被本工具关闭。
