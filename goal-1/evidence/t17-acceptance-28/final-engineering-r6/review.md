# U1 最终工程验核 R6

本轮授权范围实际通过，未改生产源码、masters或Git/index，未运行新行为套件、浏览器、游戏命令、兼容或性能测试，未改变任何服务器。

- 518项源/资产/配置精确集合已按source-r5格式冻结；相对R5仅src/ui/shared-action.test.tsx从13788B/2625880c…变为14208B/6b8e2f7c881a3aa2106132227c19eee67c5d9419ab726b6ce3324e02ba8d2a08。生产与旧资产/配置均无diff。518项全部bytes/SHA/mode及集合在tsc、构建和HTTP检查后仍同。
- 旧518格式没有涵盖实际tsc引用的tsconfig.core.json与public拷贝的startup-metrics-v1.js，已作为2项辅助输入独立冻结/回读同，未混算518分母。
- 原项目npm run typecheck（tsc -b）实际exit0，46713ms；随后Vite production新构建.delivery/t17-u1-r6实际exit0，2610ms。完整stdout/stderr和argv/cwd/起止/终态分别保留。Vite原大chunk提示保留，未将构建时间/体积提示解释为性能验收或另改配置。
- R5/R6产物实际均47文件。文件/目录精确集合、文件mode、bytes/SHA及逐字节内容全部一致；完整清单与比较见artifacts-r5.json、artifacts-r6.json、artifact-comparison.json。
- 对仍在5364的原R5逐一GET，全部47产物均HTTP200且与R6逐字节/SHA相同，另核http://127.0.0.1:5364/根入口等于原index.html。没有启动、停止或切换服务器；继续使用当前5364 R5。
- 对全部47产物扫描本U1原exports中6个runId及源DEV-only故障入口/库名33个literal marker，0命中；确切来源清单与marker范围见artifact-marker-scan.json。这不是对所有任意诊断字样的模糊搜索，不借此宣称运行时完整安全或游戏玩法通过。

本轮没有重跑上一10/10行为case，也没有扩大适用用例分母。实测Chrome、原子候选/只读、完整Create审核及保全各有原证据；这里仅交工程构建/源身份/静态交付与HTTP绑定，真人理解、趣味与完整goal继续开放。Root可据此继续文档终检。
