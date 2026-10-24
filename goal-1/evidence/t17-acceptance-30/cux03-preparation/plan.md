# C-UX03累计检查准备；未执行检查

本轮先交范围与调度合同，不报告任何新的测试、回放、构建、Chrome或保全通过。root30三文件已读，64b1624/530源/1220 prior/114 markers是本轮起点，最终U3-V源集合按冻结时实际值重新登记，不把旧计数当未来分母。C-UX03在U3-V完整小循环集成后执行，不把大套检查放在画面与交互实施前。

## 覆盖与证据职责

1. **当前全部适用Vitest**：沿`vitest.config.ts`的`src/**/*.test.{ts,tsx}`和`scripts/relay-critical-*.test.ts`范围，完整覆盖core/application/persistence/testing/UI。整文件排除`src/ui/book-layout.test.ts`，不执行兼容或性能专项；冻结后先登记实际文件与case身份，不能以精选视频UI集替代累计。工作/生活/投资、首单、视频、课程、原学员与退款、中转、代理/风险/权限、季度/尾声、writer-lock、codec、IDB及原子候选仍在适用范围。`continuation`中的compatible save是存档匹配，不是页面兼容；退款overflow是整数金额边界，不应误删。P3现有unit可按原文读跑，但不修改26 WIP、不开正式62/22收集器、不升级为P3验收；遇红由Root按原所有权处理。
2. **原规则与命令回放**：保原kernel/Q01整数账、AP、日历/支出屏障，save候选/幂等/权限与首单七分支、market五组、video正常两背景及独立F02财务夹具的原断言。对应现有`collect_kernel_evidence.ts`、`collect_save_evidence.ts`、`collect_first_order_evidence.ts`、`collect_market_evidence.ts`、`collect_video_evidence.ts`；均显式fresh `--output-dir`，不写旧根。完整unit内相同规则仍原样检查，collector提供可读原命令/账快照，二者不叠加算不同成果。原谈判/返工/同版重提以现有video-negotiation、video-atomic及U3-V定向原链为准，不为凑分母启动全路线24季或P3矩阵。
3. **资料与工具**：Python `unittest discover -s scripts -p 'test_*.py'`含离线FakeCommands发布安全测试，不进行真实发布；content、plan、competitive、docs各独立记录终态。原root29 docs最终23红为18逐字外部Skill引用、3旧空JSON、2旧negative marker，须对照路径/错误实判，不把任何本轮新错并入旧23。原PNG/真人/兼容责任仍未验。
4. **U1/U2/U3-V实际主线**：原首单接/拒/略过与实际1300收入原子保存；工作工资后仍在岗、新季不自动续约；生活跨季未完成不换景；原订单部分成交/未付交收、持仓与实际现金分开。视频本片从同run/account/business/channel/work/contract公开问题进入原决定，制作/核对/提交/客户反馈/返工或有限退出/验收/真实预款余款费用分别表现。主操作与物件同callback；同稿近景—原册—日历—回今天—重进；旧未完责任仍可回，普通消息不抢pin，0AP沿真实Clock，强制责任先处理再返原对象。手工与合法AI可用独立正常前史，不强迫一局全部路线、盈利或售清持仓；不泄露未读申请回信或隐藏结果。
5. **实际存储与完整原文**：新视频实际承诺的DEV head.put后abort保旧景/旧AP/旧成本→候选只导出→独立fresh物理旧只读→原retry→独立fresh物理新，候选/物理/已保存/导入缓冲角色分开。跨run、陈旧revision、错误账户/目标、readonly/conflict/busy须原门槛，UI可读不授写权。最终全部Chrome原文用原`verify_normal_browser_exports.ts`从完整Create重放，原byte/seed/资金/资格/命令不编辑。该审核器只证明命令与原文一致，UI按钮、物件、实际图与理解度另记。
6. **工程、独审与保护**：最终tsc、独立Vite产物目录、当前服务全产物/根HTTP逐字节、正常runId/实际DEV标记泄漏扫描，与冻结源精确集/bytes/SHA/mode相连；类型/build/hash不代替上述规则和存储。最后独立读审结果/财务/权限/失败状态、旧P3/root19/旧封存/master原插入保全，Root按真实边界选择性提交与封存。本片不关闭后续U3-C、U4、T17/goal。

## 执行顺序与原runner

实施期先各owner小批红绿，冻结统一当前源后：①登记适用全集与排除；②完整Vitest单worker、原隔离/原时限；③原账/保存/首单/market/video有限回放；④工具/content/plan/competitive/docs独立步骤；⑤tsc与Vite/HTTP；⑥当前Chrome完整小循环和候选物理链；⑦全部新原文固定后完整Create审核；⑧仅对本轮修后受影响集重验、必要新构建/实际图，最后独审保全。Root可把Chrome实施反馈放到统一冻结前先做；正式同源累计期间不与浏览器引擎、其他Node重负载并行。

可复用root29的`run-step-r1.mjs`：它硬编码root29，不能原地运行或改旧sealed脚本；在root30复制，仅适配输出根，继续用已有tree/ident/hash、祖先guard、fresh wx日志、完整argv/cwd、status/signal、源初末及extra身份。不要每一步重复复制整树，只保存索引；必要红源才存前像。长步骤保持同一exec/session并取实际终态，禁止另开同批。命令形状为`rtk proxy node <root30-runner> <fresh-step> npm run test:unit -- --exclude src/ui/book-layout.test.ts --maxWorkers 1`；不附`--no-isolate`、`--testTimeout`、`--hookTimeout`或其他放宽。配置默认maxWorkers2，CLI单worker只调度串行、不改变隔离。不要用不带排除的`npm run test:unit`或会短路/包含暂停项的`npm run check`。

各collector默认会写旧`goal-1/evidence`，必须明确新输出。原`evidenceDirectory`先拒sealed/已提交/已有产物，部分工具会先mkdir，故外层先guard root30且给不存在的fresh子目录；谈判collector还要求显式fresh路径。工具内置只读Git元数据，不进行stage/commit/push；不为此修改共享工具。

审核调用合同为`rtk proxy env NATIVE_EXPORT_INPUT_DIRECTORY=goal-1/evidence/t17-acceptance-30 node --experimental-strip-types scripts/verify_normal_browser_exports.ts --output-dir <root30下新的report目录>`。它只收顶层`chrome-*`目录中的`exports.jsonl`；每行至少保真实`file/origin/source/bytes/sha256`。file须单一合法JSON文件名、同folder不得重复；raw保持完整可见pre原byte（不加尾LF）。`origin:import_buffer`不是saved；candidate也不计已保存结果。审核输入必须包含所用完整正常前史的原文/manifest，显式记录各自旧UI来源；当前UI源码/构建/HTTP另绑定，因为审核sourceHashes只含core/application/content/persistence及两个审核脚本。

## 既有耗时与异常保全

不是性能目标，也不预测新树耗时。root25 `unit-cs3-r2`实际单worker/原隔离144文件936项，929pass+7原5秒超时，wall2052693ms（34.21分钟）；同源前后487同。第一次精确重验40.333秒仍5pass/2原超时；第二次原2项实际2/2、7.19秒Vitest/9.212秒外层，但源集合已488，不虚称与前轮全树一样。root29当前18文件131身份是分层结果：初C129为116pass/13红（9原5秒超时+4断言/驱动红），精确9原条件复验9/9；修后7文件29、后续3文件16、最终季页8与前轮重叠，不能相加，也没有最新131一次全绿。均只作调度/保红依据。

首次失败保stdout/stderr、argv、源集/时限/seed/资金/输入、真实终态；先分类逻辑/驱动/类型/超时/环境/来源漂移，不从“超5秒”推断产品bug或唯一CPU原因。原断言原隔离原限时精确复验，仅失败case或必要依赖，结果与原红并列；两次同类复现先报Root，不擅加时、删case、换seed/资金或直接改P3。源码漂移、审核输入增长、产物/HTTP不符分别单列，不称同源通过。浏览器动作timeout先读DOM和原档/实际物理状态，未知提交不盲重试；candidate期间停止HMR、reload和额外游戏命令。新证据根append只在祖先guard允许时，旧sealed不追加。全部通过也只关闭本片适用自主检查，不声称真人理解/趣味性、性能、兼容或全goal通过。
