# T15电影版接续：实际首屏加载取证

2026-10-19。前一goal轮为progress：D03/C-D03完整电影重构及功能c2da7ac、完成记录77c4b54已提交，当前main/77c4b5403ddc5994c015259df53b114bdd365ba7干净，PUBLIC仓库/远端main9bf4399保持。本轮仍只执行T15，不进入T16，不重建goal。

## 需求与现状

T15两项原生200%与离页提示的能力复核仍只有IAB、visibility/viewport；不重复旧快捷键/离页试验，不把缩视口或应用对话框充作完成。新电影版的首次内容绘制、入口操作可用、素材请求尚无真实浏览器时间，34号合同要求实际首屏与包体积分开。当前没有已获确认的数值性能预算，本轮记录基线与限制，不自定阈值后称产品验收通过。

## 串行步骤

1. 冻结当前293源/旧证据和index.html，保留5234及旧构建；记录能力库存与官方Paint Timing/Navigation Timing定义。新增仅本机、显式performanceTest=startup-v1才加载的独立诊断资源；默认游戏不加载/输出，不增加SDK/网络上报/持久记录，不包含存档、种子、备注或完整URL。
2. 诊断在真实顶层游戏文档使用PerformanceObserver的buffered paint、Navigation/Resource Timing，MutationObserver只读观察现有首页主按钮启用。FCP、DOM操作可用、load和场景资源responseEnd分别命名，不将资源下载或DOM状态冒充图片绘制/完整交互延迟；不存在的值为null/unavailable，不补零。加载后输出一次本地控制台JSON并断开观察/清理定时器；10秒取证超时如实输出不完整，不影响游戏。
3. 独立固定生产构建/新端口5235；当前源除index及新增public诊断资产，其余293源及35旧产物逐字同D03 C2。先普通入口确认无诊断资源/日志，再3次显式本机真实浏览器样本，记录UA/视口/可见性/缓存不受控/原始时序与截图，保持正常存档不变。完成1—3后全面检查-debug；如指标暴露真实问题，先记录再做最小修缮并新源/新证据重验。
4. node语法/类型/构建、受影响资料/原规格与字节保全；不为纯诊断入口重跑未改的500游戏断言，不沿用D03计数当本轮执行。默认UI/玩法/存档保持原字节，实际截图复核电影构图/光色/文字/主动作可达，登记美术问题与是否有新增修缮。
5. GJ/REPEAT、实际证据本地提交、任务阶段记录/提交后读回；T15/C15仍未勾，原200%/离页/完整性能预算和T16/T17/M01/T18原责任保留。当前是恢复后首次同类外部门槛审计，不复用旧三轮计数；有独立实际取证可推进时不标blocked。

## 风险、验证与回滚

诊断不能提前绘制额外面板污染FCP，也不能输出玩家数据或改变游戏命令；只在明确本机query加载，console数据由浏览器原生API生成，通过CUA日志读回，不使用Node/tool耗时。显式诊断自身有微小请求/观察开销，结果是该同源码诊断运行，不当作未诊断、冷缓存、节流、其他设备或线上性能。后台文档未产生paint时保留不完整结论。

保留index原字节和D03固定5234，新端口不覆盖旧目录。任何代码/诊断失败原记录保全，新修复不改历史日志。回滚用独立新提交移除index条件入口与新增public诊断资源；无需存档迁移。不会为了T15阻塞而降低全目标、绕过原生门槛或提前进入T16。

## 官方依据

- [W3C Paint Timing](https://www.w3.org/TR/paint-timing/)：FCP是实际文档首次内容绘制，不能等同应用可操作或完整场景完成。
- [W3C Navigation Timing 2](https://www.w3.org/TR/navigation-timing-2/)：导航时间取自同一文档performance time origin，loadEventEnd等无报告时保留原值。
- [PerformanceObserver.observe](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver/observe)：单entry type配buffered取得已有paint记录，缺能力不造值。

[杠精审查] 计划通过：新增真实浏览器取证而非重复已通过测试/旧阻塞探测；不加业务按钮/分析SDK，不用控制台采样冒充整个T15完成。复用已有独立证据目录/源冻结/固定构建/原字节流程，无新Skill、代理、自动化或外部资源。

## 第一份实际样本后的诊断修缮

C1首样本实际FCP404ms、首页主按钮首次观察491.4ms，但sceneResource为null。浏览器真实DOM确认背景为本机ordinary JPEG、文本模式false；资源列表当时尚无图片，说明原报告只等待核心3条件不足以取得完整场景资源时序，不能把complete解释成场景完成。原console/截图/源冻结保留。

保全原诊断JS后，仅新增buffered resource观察，并把当前CSS场景确有资源时序加入汇总条件；没有背景的文本模式仍允许null且明确无需场景资源。10秒仍有限清理，缺项保留不完整；responseEnd依然不冒充decode/paint。新源冻结/独立build02与5236，新3样本明确属C2；5235/C1原样保持，默认游戏34资产字节同，不能在旧固定目录重构覆盖。
