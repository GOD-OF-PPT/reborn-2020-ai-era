# T17 / 5c-U1 最终源码与规则桥接独立复核 R13

审查者：/root/relay_final_review。结论：当前冻结源码及指定技术证据的限定复核通过，未发现新增确定可触发的代码缺陷。原规则49项可按未变依赖保留其历史证据身份；它们没有在R12或本次重新执行。当前UI、类型与生产构建有各自R12实际终态。生产5318上的复核/更正与完整browser原文审核尚由主控进行，不能据本报告提前称通过。

## 身份与冻结核定

写前核实仓库GOD-OF-PPT/reborn-2020-ai-era、owner GOD-OF-PPT、PUBLIC，main，HEAD 7f7f0dfcb5d6f86e46ac11585f94c32817f16caa。本次针对该HEAD之上的冻结工作树，未stage、未提交或修改源码/测试/旧证据。

R12的relay-ui、typecheck、build三份source-freeze.json内容相同，均366条；每条bytes/SHA256均与当前实际文件一致。src下所有.ts/.tsx/.css都在清单内，当前src没有其他扩展名文件。相对于R5/relay-rules-save，公共路径发生变化的是plan.md及9份UI/CSS/测试；新增relay-scene-clock及其测试，登记/runner由r2换为r4。故不能把R5整个UI快照或其旧build当作最终UI身份。

| 当前目录 | R12冻结文件数 | 非test文件数 | 与R5相同 |
|---|---:|---:|---:|
| src/application | 66 | 21 | 66 |
| src/core | 103 | 85 | 103 |
| src/content | 13 | 13 | 13 |
| src/persistence | 19 | 4 | 19 |
| src/testing | 38 | 38 | 38 |

应用/内核/内容/持久化合计201份、另38份夹具/工具源码均与R5逐字相同。package.json、package-lock.json、vite/vitest配置及4份tsconfig也全部相同，规则/版本/金额/随机/权限/存储实现未由本轮UI改变。外部包的版本与配置可据锁文件桥接；node_modules实物未在两份清单中逐文件冻结，不能据此宣称完整第三方安装字节已经比较。

## 原49项可以桥接的部分及其边界

只读解析原8份测试的TypeScript相对导入闭包，得到135份TS文件：application25、core86、content13、persistence6、testing5；全部存在于R5与R12冻结且bytes/SHA256相同，闭包没有UI模块。排序后按“路径 空格 SHA256 换行”计算的闭包摘要为15927a4273cd5a5f222f8abac86f017eb62db3524034e94bab7d943197440b12。静态导入解析没有执行测试或生产模块。

额外raw依赖是relay-codec.test.ts导入的goal-1/evidence/t11-browser-closed.json?raw。它不在R5或R12的source-freeze中，不能声称这两份清单独自覆盖了全部测试输入。本次单独核实该原档964601字节，SHA256 906d3baa19c639abf48e5db418e0c0a6872d9991cd9590b99bdc558f9228a3ba，与baseline-tracked.json开工条目及该HEAD的Git blob e4782914bf1e6008df210ef1170ed1eef42503e9完全相同；这是开工基线/HEAD辅助桥接，不回写成R5当时另有JSON冻结。

因此可保留R5的原账、用量/更正、供应资产/保护、例行同序、命令/codec与事务失败原候选等49项结果，指向未变规则依赖。不能把49改称本次重跑，不能用它证明后加的日期输入、轻票签、收款/读信回响或任务反馈日UI，更不能由它推断正常全5c形态、真实浏览器或完整业务验收通过。

## 最终UI与原命令/存储接线

- 新relay-scene-progress仍只读公开RelayProjection，保留全部periodIds、明确选择的旧期、已揭示未更正差额、未读申请与真实任务状态。ReadRelaySupplyDecision仍仅applicationId且免费读信；CorrectRelayPeriod和CollectRelayDue仍用原ID且明确确认。旧计量/价格、支持中断、客户保护、供应资产、应收应付及停站责任未改成新利润或免费完成。
- RelaySceneChoice的票签/完整服务单仅局部打开与导航；period身份由同一progress绑定，多period切换仍在。日期onInput/onChange/onBlur只更新同一局部草稿，空/极端值原样进入原preview拒绝，估算助手不钳制或重写载荷。复核footer与正文共享period/resource/startAt，仍是原StartRelayAudit的严格三字段payload、100元/1点/3日条款及confirm=true。
- CommandButton的showReason默认true，只控制small.reason文字。唯一false条件是该复核日期无效，并在原日期旁保留范围提示；preview始终执行，!allowed/busy/candidate/readOnly/conflict禁用条件与request传递均保留。日期合法后其他原首因提示恢复，资源/费用/工资/责任说明与原册入口未消失。
- App原request仍捕获context/contextFeatures与command封套，CommandDetails在modal.details保留该次公开快照；新RelayCommandDetails只追加原客户/实际到期额/未到期额或复核范围，不重新绑定控制器当前值。核心继续校验runId、revision、幂等ID、载荷、AP、资源、可花资金及权限。稳定客户N规则与未改RelayPanel中该企业全部原客户的顺序一致。
- relay-scene-clock仅把公开任务开工/完成反馈日交给原playableAdvanceDate；已知quarterTarget、交付/pause、显式下一季与2025边界继续约束。原ClockAdvance仍调用AdvanceTime/{date}与支出投影，原队列逐项执行中途日期事件并在需处置/现金缺口处停下，不附带新经营或代理授权。原自选日期与先核对入口仍在。
- scene-result的中转专用回响仍要求同run、较新revision、saved且无candidate，并据实际新增工作/更正/公开读信或原应收collected增量产生。到账还核同客户、原企业现金增量相同及recognizedIncome不变；未来应收/未消费充值不进入到账数。Session.view仍只投影已提交record.run；store.commit成功后才发布新record，失败保留原candidate重试，UI没有第二条写账或原子保存路径。
- 全原功能的静态导航链保留：中转页固定页脚p.onOpen → App原workspace/Dialog → 未改RelayPanel；票单另有原账入口，原供应/准备/客户/报价/充值/服务/支持/收付款/审计/更正/停止/历史都继续通过原册。CommandDetails为追加，原能力/风险/分账未删除。这里只证明源码保留接线，不冒充所有实际书页与浏览器操作已经验收。

## 实际技术报告核定

| 证据 | 实际核定 | 当前结论 |
|---|---|---|
| R12/relay-ui | 精确24文件，164条assertion全部passed，report.success=true；wrapper/driver均0，metadata/validationErrors为空 | 当前366冻结源码上的UI定向技术验证 |
| R12/typecheck | command为npm run typecheck，tsc -b；wrapper/driver均0，错误数组为空 | 当前同366冻结源码的严格类型检查 |
| R12/build | npm run build -- --outDir .delivery/t17-relay-ui-r12；tsc -b与Vite终态0 | 当前同366冻结源码的独立生产构建 |
| R5/relay-rules-save | 精确8文件/49条assertion全passed，report.success=true；wrapper/driver均0，错误数组为空 | 原执行保留，按上述源码/夹具证据桥接；不是R12重跑 |

UI文件集合直接取vitest.json的testResults，与r4登记完全一致；JSON顶层numTotalTestSuites=25不当作文件数，实际文件仍24。book-layout.test.ts的两项多宽度用例在登记中paused，未出现在命令或实际文件集合；不能把JSON的pending=0解释为它们已执行或通过。兼容性开发/测试为0。

生产构建原console保留大于500kB块的warning，退出为0；这不是性能验收或浏览器通过证据。新UI测试内展示变体、prepaid/postpaid夹具及原规则夹具均维持各自身份，不能转写成正常Create/真人样本。

本审查没有重跑任何测试、类型或构建，没有浏览器/尺寸/缩放/移动/离页/兼容操作。尚未审核的最终生产服务/支持/复核/更正/回款、存储失败/重载和完整browser/Create原文，仍由主控对应证据负责；全5c及后续任务、M01暂停、原PNG/真人/资产/整体QX责任均不据此关闭。

[杠精审查] 限定通过：不仅比较了改动文件，还核实际导入闭包与冻结遗漏的raw输入、独立读取终态JSON/console、核当前源码和暂停集合；没有把原49项、build或静态入口保留扩大成当前全业务/Chrome验收。报告只新增，不改旧证据或冻结源码。

## 最终模块与证据物理 SHA256

| 文件 | SHA256 |
|---|---|
| src/ui/relay-scene-progress.ts | 9f958d7f989e6a4d4cd488f06a7b3fdcb402bde5310b91fe042ba2857a4128cb |
| src/ui/RelaySceneChoice.tsx | 0ccde60aefd407fdac545bafd71a66f3827aa73f0e14220dc7195ca43484d3bd |
| src/ui/RelayCommandDetails.tsx | 363f7f077726af1630a183f6f5dfe8ef13b158def86ee01e4d36dda9b410c9a4 |
| src/ui/relay-audit-dates.ts | f971ec7926a17b4b6ab844179b80acb6a8f4c83147e8d8805a6b6e02ce20ea82 |
| src/ui/relay-scene-clock.ts | 9eb2b1e6e02166d0266ae1bcdfc5d171c47552d714bbf2f9c8374b6e7aabacbb |
| src/ui/CommandButton.tsx | 17fa2e2799afb252392afb2fa10e3253023c1b5f2a5f77e079c3ea783eeebf43 |
| src/ui/CommandDetails.tsx | 3a22f9a25326d8ab537364d1bade35acbcf7c683a0b2011669b59e101dbbc5b0 |
| src/ui/NarrativeScene.tsx | d59587d2a8262e41b88f49b990e35adbc82c196dde85f99aab7ed744d80edf46 |
| src/ui/scene-result.ts | ca76b8d5e1c26f2168bc02f1a786d27a56fc88d6da2df19e433f5760aac83be8 |
| src/ui/scene-decisions.css | 3772f90ee195d1753bb044a8cb78b2e0fd38e6f51a2a0423d966edb6eb05ca22 |
| goal-1/evidence/t17-acceptance-11/checks-r12/relay-ui/source-freeze.json | 306de3ea6c32e738d3d14bd7467ea52be46c8dc147b69a691e5ff245a3fa0a05 |
| goal-1/evidence/t17-acceptance-11/checks-r12/relay-ui/complete.json | d15f02b6938d64599d12219a6c511bfba46097adf84cbd277eb84866069c6aaf |
| goal-1/evidence/t17-acceptance-11/checks-r12/relay-ui/vitest.json | 3ca792d441b0eb5eb864d07a42de1ce60bf2c92d11c17b0528974a291de4366f |
| goal-1/evidence/t17-acceptance-11/checks-r12/typecheck/source-freeze.json | 306de3ea6c32e738d3d14bd7467ea52be46c8dc147b69a691e5ff245a3fa0a05 |
| goal-1/evidence/t17-acceptance-11/checks-r12/typecheck/complete.json | 4321513913a079b6e84f4bb2de8396cd609eeedbaddb4f1b67478c32a8648f31 |
| goal-1/evidence/t17-acceptance-11/checks-r12/build/source-freeze.json | 306de3ea6c32e738d3d14bd7467ea52be46c8dc147b69a691e5ff245a3fa0a05 |
| goal-1/evidence/t17-acceptance-11/checks-r12/build/complete.json | 0b90b7f2534635c4ca6914201b96f1f0ab80f3699cdddcdb1e917c7b8c53f825 |
| goal-1/evidence/t17-acceptance-11/checks-r12/build/console.txt | 95cbd928e1b84afa1ff4063a8f48151c3e181b165f87df1d42f2994b0d2bd691 |
| goal-1/evidence/t17-acceptance-11/checks-r5/relay-rules-save/source-freeze.json | dc5b340dbbd00101eed4a15998c03768c717e603f677cef5cd4e941420fbfd67 |
| goal-1/evidence/t17-acceptance-11/checks-r5/relay-rules-save/complete.json | 12906ace643e93dee5d8167bb674d8804febab0b51604534476c808d5d248f9a |
| goal-1/evidence/t17-acceptance-11/checks-r5/relay-rules-save/vitest.json | 7cc76842faddcb1c66d17dd19603c0cc5923bd566573c07a67c0e7d97e1f917c |
| goal-1/evidence/t17-acceptance-11/baseline-tracked.json | ba09aa4408ec7af617301b2c0f32439342de6bce7acfefab3ebc8a7e8a14babc |
| goal-1/evidence/t11-browser-closed.json | 906d3baa19c639abf48e5db418e0c0a6872d9991cd9590b99bdc558f9228a3ba |
| goal-1/evidence/t17-acceptance-11/regression-registration-r4.json | f98cf4079cfa6f781c8a9ce8907462fb6e16c63708a6b6e6a56974ad45e9c05a |
| goal-1/evidence/t17-acceptance-11/independent-date-input-review-r12.md | ab20e8ba8d68917f3cf9276c5e0e10109f0c0f2f6066ad299944aef10fd704be |
