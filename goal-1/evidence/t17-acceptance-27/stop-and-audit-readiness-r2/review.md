# 原R1停期与统一审计准备（只读）

## 原命令与有限停止边界

确切命令为StartRelayServicePeriod与StopRelayPeriod，后者载荷仅{periodId}；没有StopRelayPeriodSource。原册同一期按钮是“停止本周期后续请求，保留支持与旧账”（RelayPanel.tsx:82）。不能误点StopRelayStation：后者暂停交通并WindDownBusiness，会中断本企业其它任务/支持及结算维护；本次仅停期。

core/relay.ts:85、116只校验本期未停/未closed，必要时InterruptJob原service，并设本period.stoppedAt和status stopped。operations.ts:123、economy.ts:194—200使running服务变interrupted，保留已付成本和已用AP；只有尚未开工的planned任务cancel才释放原预留。StopRelayPeriod不操作supportJob、不退款、不清应收应付、不关闭客户/企业、不改供价或权限。未来原meter/support_close事件保留，不得删去或当成免费完成。

## 原生验收顺序（尚未执行为通过）

条件基线是既有已核normal91（[公开读回](../model-r1/normal-candidate-read.json)）：Jan27、0period，企业cash42077.42/可花26077.42/客户保护16000，Q1 spent1/reserved0/available3。以下具体4500/2AP仅适用于实际确认原guided组合；若Root另选payload，按该原预览重新列，不替玩家补默认。

| 节点 | 必须保留的实际证据与预期 |
| --- | --- |
| seed已稳存91、填稿/取消 | 输入原文SHA fbb353ba…a321；同企业/账户/站/所选客户供应、资源、Jan28开工、容量、供应预算和guided支持均显选。取消无新revision或钱/AP变化。 |
| 确认后真正head.put abort | DEV trace须实际writeSucceeded=true/abortIssued=true；Session只展示committed91、旧资源/旧场景与unsaved候选，不能发布候选period/saved成功。exportCandidate可为92，独立exportSaved和物理旧档仍逐字91。候选期禁止source/HMR/重载及新游戏命令。 |
| 独立物理旧/只读 | 原physical91导出逐字同seed；实际只读UI有明确状态且不能提交。候选92、物理91、输入缓冲分别标来源，不把seed导入abort冒充游戏candidate。 |
| 原retry成功 | 保存、重进及独立物理新92逐字等同原候选92；原commandId/载荷/periodId相同，不重新安排另一单或再次抽取。guided参考：cash仍42077.42；客户保护16000另加plan4500，held20500/可花21577.42；spent1/reserved2/available1。这是预留，尚未付3000或1500。 |
| Jan28实际开工 | date到Jan28不足以证明开工；先核public service.status running及原3000 expense/该1AP executed。guided支持仍Feb25—Mar4 planned、1500/1AP reserved；总预算spent2/reserved1/available1。原时钟可能停同日屏障，已生成计量条数按当次公开记录，不预编后续revision或未来实计。 |
| 原StopRelayPeriod确认/保存 | 载荷必须是retry后同periodId；未确认/取消不变。保存后service interrupted/releasedAt为实际停止日、period.stoppedAt同日；原3000/服务1AP保留。相对立即停止前cash/可花/保护/应收应付/支持预留/AP不因这条停止命令释放；企业仍operating、站trafficPaused原值、客户合同/余额仍在。重进同对象，不呈现全期成功或企业关闭。 |

支持残留必须在图和公开记录中看见：本次停期后原support仍planned，保留原Feb25—Mar4排程；实际开工/完成仍核原资源、费用、到期义务与public job状态，不能仅因日期到就报完成，未另InterruptJob时也不自动取消。停止只释放服务未来产能，不返还已经用掉的行动。后续meter事件仍可留下RELAY_REQUESTS_STOPPED/报告0；未复核的public auditedUnits仍null，不拿隐藏实计填0。已发生原计量/欠款/客户保护和供应资产继续存在。

support_close原规则（relay.ts:198—205）：只有support.status completed且确有服务，才按实际服务日/28对原feeQuote作整数四舍五入；未完成支持不收费，存在服务而丢失日/支持未完成时可产生独立赔付义务。此为规则边界，不预报本native分支的未来数额；不必为证明“有限停期”擅自把原支持取消或把整站关掉。

DEV seam重要差异：application/browser-game.ts中abort-relay谓词为meters.length>0，0meter的StartService planned92不会触发；generic abort才可在seed已稳存、原接缝重新装载后截该次head.put。本轮已观察的native日志显示t09 generic隔离库，仍以实际trace/候选raw为准，不靠库名声称通过。原abortAfterHeadWrite每个factory只armed一次；准备seed时已触发过的实例不能假称仍待触发。

## 已知planned支持等待文案与最小候选

当前progress.ts:106—108为停期且support planned返回phase support，jobNext取原startAt Feb25；:158却统一label“等这期原支持完成”，真实completeAt是Mar4。为确定展示缺口，先由Root在真实停止后保红图，再另授权最小修；本项不改源。

最小候选只让bound在phase support按原supportJob.status选label：planned写“等这期原支持开工”，running保“等这期原支持完成”；nextDate仍原jobNext，不改任何钱/AP/日期/状态/命令。wholeperiod仍是同账户/period，outcome继续non-success，历史原job记录不被新安排替代。

有意义回归应复用真实正常停期链：停service后捕获planned support，核wait=startAt、completeAt另列；再沿原屏障实际进入running，核wait=completeAt。另保日期已等于startAt但job仍planned的屏障情况，不用日期猜开工。断言同对象、旧成本/预留、原raw只读不变；保原时限/断言。修源后要新受影响检查/构建/HTTP身份与当前图，不能把旧R5红图称修后实测。候选尚存时绝不做此改动。

## 全部新chrome导出的统一fullCreate入口

沿用原scripts/verify_normal_browser_exports.ts与root27/run.mjs；[未来精确命令](audit-command.txt)已写但未执行。需等normal118、atomic候选/物理旧/原retry后实存和物理新、有限停止原文全部齐全，Root停止对输入journal/raw与生产源的追加/修改，再用fresh native-complete-audit-r2及native-complete-audit-report-r2。执行前再次检查fresh与所有祖先guard，不能覆盖旧native-prefix-audit-r1或其report。

原审核器输入为env NATIVE_EXPORT_INPUT_DIRECTORY=goal-1/evidence/t17-acceptance-27，仅接受--output-dir一个明确新目的地。它扫描该根**直接子目录**中名称以chrome-开头的每个exports.jsonl，不递归扫描prefix-input/chrome-ready-r1，不自动收入未登记的json。故无需手工拼接/复制原档；每份需审原文在其本来chrome-*目录登记一次。相同bytes不同来源可以各自记录，不能在同folder重复file。

每行准确字段来自native-ui-harness-r5：file、origin、source、bytes、sha256、runId、revision。前五项被审核器用于读原档/来源记录，runId/revision最终以官方import所得为准；origin无强枚举，但仅精确import_buffer计为输入缓冲，不能写input_buffer。candidate可记candidate_ui，已实存记saved_ui，独立物理旧新/只读必须在source说清origin、库、实际旧新revision；标签不把candidate变成saved。完整可见pre分块拼回原字节，raw不添尾LF；JSONL行才有换行。既有错标只能保原并另写addendum，不能重写原journal。

最少完备记录：normal-input116-clone及normal-saved118-closed-period；atomic-input91-clone；Start候选92；独立物理旧/只读91；原retry后saved92与独立物理新92；实际Jan28已开工保存；同period有限停止及重进保存。名字/后续revision以Root实际导出为准；本目录journal-snapshot只是仍在增长的就绪快照，不是最终分母或已通过清单。

原工具按完整Create身份/版本与完整命令包建前缀树，同创建下分支分别重放，精确相同前缀才复用；最后逐份byte equal。candidate也能证明提案字节来自原命令，却不能因此证明物理已保存；相同候选/重试原文不算两次业务完成。真正abort、旧/新物理、只读、原retry、有限停止的动作仍须Root原生证据，不由审核器替代。

源绑定双层：审核器自带core/application/content/persistence非test .ts与自身/evidence-output.ts hash，输入journal和raw末核，chrome目录集合末核；**不覆盖UI .tsx/CSS/资产**。外层原run.mjs实际冻结全部src/assets及锁/配置的精确路径、bytes/SHA/mode，并保初末与PID/argv/终态。最终需和实际最新构建/HTTP源manifest实核桥接；planned-label若稍后修过，不能把R5旧图/旧源通过移算到新构建。原报告成功须实际exit0、sourceUnchanged=true、allByteEqual=true，报告里新files/unique commands/inputs/creations按实际读，不沿用旧115/7或预报新计数。

工具内置evidence-output会只读Git ls-files/cat-file，终态读HEAD；后续若Root授权原审核，这些原工具只读元数据属于调用合同，不改共享工具绕开。本轮未运行审核或任何Git。原工具检查新增chrome目录及已读journal/raw/source末hash；未登记raw不会被发现，所以完备导出清单必须由Root先核。失败和旧报告原样保留，fresh再跑。

## 限定交回

16项相关静态源身份见source-snapshot.json；只读规则/调用调查已完成。没有新引擎命令、浏览器/DB动作、源码/master/P3/配置改动、测试或实际审核，不开始U1。Root继续当前真实候选/原retry/停止，已知支持等待文案在候选清空且红图保存后才另行修。R1、R2/R3、S4/S5、P3正式62=0/22例行、旧PNG/真人/M01暂停/T18/goal均不由本准备自动完成。
