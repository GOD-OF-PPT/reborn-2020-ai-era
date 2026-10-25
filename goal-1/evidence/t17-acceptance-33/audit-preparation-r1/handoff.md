# U4-A 完整Create审核入口交接

状态：准备完成，未执行审核，未冻结当前活写Chrome原文。正式输出目录尚不存在。

## 最终由Root调用

Root先明确全部本轮chrome-*原文/exports.jsonl停止写入并确认最终源身份，再在仓库根目录以Node22运行一次：

```sh
rtk proxy node goal-1/evidence/t17-acceptance-33/audit-preparation-r1/run-audit.mjs --output-dir goal-1/evidence/t17-acceptance-33/normal-export-audit-r1
```

这不是现在应执行的命令。本轮只准备入口。若该输出已存在或有owned进程在跑，先读其真实状态，不覆盖、不重复启动。原输出父级必须是root33，名称只允许normal-export-audit-r正整数，创建与每次写入均实际guard+wx。失败保持原终态/原输入，不修改来源或放宽检查造绿；需要重新执行时另用fresh同级输出并保旧失败。

正式wrapper的input-before.json在官方回放前枚举当时全部chrome-* JSON与exports.jsonl，核每条五个必要字段、原bytes/SHA、可选header一致、codec-shaped raw无漏登；它才是这次正式执行的精确输入冻结。结束后重新发现全部输入并逐项核同，新增、删除或改写会失败。当前preparation-identity-r1.json只是活写期间观察的四条清单快照，不是最终冻结或预期数量，不应据此断言最终只有四份。

## 保留的审核合同

- 新wrapper：15216B，SHA a5a4c26703034bc8c2520245a1a3bfb2dab1cf9eda8571f8b1d4cb41396c2de2。旧root32路径、baseline及范围标签机械适配；原helper硬编码旧root，无法直接传新root参数，故未另起第二套审计算法而复用其原主体。旧helper仍为12846B/SHA 1db134797dc1b06a365f2b118a1d1e939b18d23308691867c082007e31e94a2a。
- 官方实际执行仍是scripts/verify_normal_browser_exports.ts，原完整Create/全部后续回执/规范导出逐字等同/唯一命令缓存断言不变；原126依赖枚举、原spawnSync参数及maxBuffer不改，没有增加放宽时间限制的选项。
- official-source-contract-r1.json：SHA 60c10fa4bda76e17ec4073d1b839fc503b22c7d4ab4bc44b1f9a402a7185166e。准备时实际只读核126官方源码、P326与root33开工workingtree（含原未提交P3）一致。正式运行前又拒绝与此合同漂移，执行后再核源/P3/官方report逐126 SHA同。该合同不声称冻结当前并行UI源码或构建。
- 正式extraReferences额外绑定本wrapper、guard、root33 baseline、准备合同、immutable root32 template、goal原input，以及执行当时全部native-inputs*.json和其中列明的旧前史原文件。后者重新枚举，可发现新增来源清单；原SHA/bytes/notNewNativeHistory声明须成立。

## 角色及前史解释

角色只由source严格前缀SAVED_UI:/PHYSICAL_READONLY:/IMPORT_BUFFER:/UNSAVED_CANDIDATE:声明，origin必须匹配对应小写；不按文件名、同字节、revision或origin单独推断。缺失/冲突直接拒绝；所有角色原文都审，但candidate、buffer和physical-readonly都不是额外保存成果。

native-inputs-r1.json声明的technical原65与content原120是固定历史输入，不是本轮从零新做的65/120步；source声明为saved_ui的“可见导入后导出65”也不是新增游戏命令。正式replay.creations/executedUniqueCommands/files/inputBuffers按实际报告，不把其唯一命令总数解释成本轮新Chrome命令数或新保存次数。旧前史来源文件是provenance绑定，不因引用就伪造一条新Chrome export。

## 完成后的读回

保同一进程到真实终态。读取result.json或failure.json、stdout/stderr、source/input/P3前后、官方report/identity，区分真实exit与wrapper passed，报告实际创建/唯一命令/文件/缓冲/各角色数，不设3/4或任何提前预期。源/extraReferences/原文清单初末均须同，官方report每份fullNormalCreatePrefixByteEqual和allByteEqual须真。最后再与Root最终UI构建/source证据桥接；这个官方126审核不验证UI/画面/同屏可点性。

语法结果见syntax-r1.json；独立静态意见见static-review-r1.md。当前未启动任何完整Create/构建/验收/浏览器/兼容/游戏命令，未修改官方auditor、旧helper、旧raw、manifest或P3。原P3正式62/22、R2/R3深状态/C-S4-R、T17、PNG/真人、暂停M01、T18、C-UX06及完整goal责任均不由本入口准备关闭。
