# 08｜技术实施方案 v0.3

状态：规则开发规格；2026-10-16的T02已建立React/TypeScript/Vite最小工程，只有明确标识的工程预览，尚无可玩游戏。依赖与命令基线见下文；[Vite官方指南](https://vite.dev/guide/)的react-ts模板在临时目录生成后选择性合入，未覆盖既有资料。

## T02工程基线（2026-10-16）

直接依赖与锁文件使用精确版本：React/React DOM 19.3.1，Vite 8.3.4，React插件6.1.2，TypeScript 6.0.2，Vitest 5.0.5，类型包见package.json。TypeScript沿官方create-vite 9.2.1模板的6.0系列基线；Node类型包使用与本机22主线对应的22.20.5。没有添加UI组件库、分析SDK、运行时模型或在线业务依赖。

核验来源：[Vite](https://vite.dev/guide/)、[React自建应用指南](https://react.dev/learn/build-a-react-app-from-scratch)、[Vitest](https://vitest.dev/guide/)及各包npm官方注册表的version/engines/peerDependencies。本机Node 22.12.0、npm 10.9.0；所有所选工具的Node版本交集已在package.json engines与.npmrc严格检查中声明，实际执行结果单独记录于goal-1任务证据。

现有命令为dev、build、preview、typecheck、test:unit、test:docs、check:docs和check。Vitest在Node环境执行src下规则、命令、存档/会话测试及React入口渲染烟测；不提前创建空回放/e2e命令。dev/preview绑定127.0.0.1并启用strictPort。

资料扫描使用目录剪枝，排除node_modules、dist、coverage、浏览器报告及明确缓存目录，仍检查docs、planning、src/content、goal和普通子包中的Markdown/JSON；保留缺原图时text-only与完整资产验收的区别。非法项目Markdown编码返回具名错误；新增扫描回归不算游戏测试。

T03已建立[钱/日期/行动内核](21-economy-kernel.md)，由tsconfig.core.json在无DOM/Node类型的ES2023环境独立检查；实际内核测试通过test:unit执行，evidence:kernel另采集Q01账务起止快照与哈希。T04增加[命令、随机与存档模块](22-command-save-contract.md)：zod 4.6.7严格校验、@noble/hashes 2.4.0作SHA256，开发测试使用fake-indexeddb 6.2.5，全部精确锁定。核心自身仍不使用DOM/Node类型；为跳过Zod中未使用URL声明所需的环境类型，对第三方声明启用skipLibCheck，不声称检查其内部声明。真实浏览器存储与Node适配器结果分别记录。

## 1. 结构与职责

T07的[手工首单25](25-manual-first-order-contract.md)登记正常生产报价及可选组合指令、期限默认、有据案例和提交后投影；schema4明确拒绝旧schema1—3。Session的features扩展只接收已提交Run并置于独立命名空间，不能覆盖保存状态或发布候选收入；本轮没有提前接入可玩UI。

T08的[模拟股票26](26-simulated-market-contract.md)把行情与撮合加入同一世界日序和原子存档：world_update先公布、market_matching只处理此前已提交的订单；订单不耗行动，独立研究耗点与实际日期。共享运行时在创建时组合经营/市场扩展。T08当时schema5、rules-t08-market-v1明确拒绝旧schema1—4；原始价与分红应收分开，未知报价投影为null并保留最后已知值标签。只启用模拟制度；T09继续可玩UI/浏览器。

T06的[共享经营合同24](24-shared-operations-contract.md)增加operations状态、实际就业/工资、统一日期资源、合同收尾和有限融资；正常schema3明确拒绝旧schema1/2。WorldRuntime通过可信扩展处理经营事件和同一产能，不从JSON注册函数；前台仍为工程预览。

T05增加[内容与世界调用合同23](23-content-world-contract.md)：schema2、严格内容包、事件/期限/准备任务、资格、世界时钟与公开投影。正常入口createCampaignRun与经济底座/测试夹具分开；旧schema1明确拒绝并保留历史导出。validate:content实际检查包与初始绑定；evidence:world是内容/时钟夹具回放，不冒充完整路线或浏览器结果。

单人、电脑优先、本地存档，分层二维场景加网页组件。首版无账号、真实支付、真实券商、线上中转站或运行时模型依赖。

| 拟建模块 | 独占职责 | 不允许做什么 |
|---|---|---|
| src/core/calendar.ts、timeline.ts、economic-time.ts、economy.ts | 日期队列、行动预留与执行 | UI点击次数不能当游戏时间 |
| src/core/ledger.ts、money.ts | 账户、资金占用、退款与财务余额 | 业务适配器不得直接改余额 |
| src/core/opportunities | 生命周期、容量、维护、退出 | 不复制五套顶层状态 |
| src/core/market、equity | 订单/撮合/权益/稀释/锁定 | 不能用市值代现金、股权代治理 |
| src/core/business | 视频、课程、中转的交付/用量适配器 | 不实际生成视频或转发模型请求 |
| src/core/world、crisis | 历史、分域记忆、证据、控制和恢复 | 不把现实公司写成虚构恶意代理 |
| src/content | 已校验配置、事件模板、对白与来源 | 无eval、任意路径写入或网络脚本 |
| src/ui | 只读投影、命令、输入校验提示 | 不裁决收益或修改随机状态 |
| src/persistence | 存档封套、原子提交、迁移、备份 | 不把单条数据库请求成功当整档成功 |

当前已建立src/main.tsx、src/ui、钱/日期/行动内核及src/application、src/persistence，src/content仅有独立版本化开局工作参数。完整内容/世界门控和路线业务随对应任务建立。规则模块不引用React、浏览器时钟或网络；同一组规则命令须能在无界面环境回放。

T09的[可玩工作台27](27-playable-workbench-contract.md)接入真实浏览器控制器/会话、不可兼容原档库、背景/愿望/引导、已提交财务与期限投影。当前schema6、rules-t09-playable-v1明确拒绝旧schema1—5；预览到2020-06-30，不代替完整24季度。原始美术与真人试玩继续待办。

## 2. 命令与事务边界

Command = {commandId, runId, expectedRevision, actorId, kind, payload}；缓存payloadHash。相同ID与相同载荷返回既有回执；相同ID与不同载荷返回COMMAND_ID_REUSED；非重复指令遇旧revision返回STALE_REVISION。

纯规则接口：evaluate(state, command, content)返回Rejected(reasonCodes)或Proposed(nextState, ledgerEntries, scheduledEvents, causeEntries, receipt)。预览通过同一前提与成本函数生成只读投影，不抽随机、不揭示隐藏结果，也不预写nextState。

处理顺序：验证格式与版本 → 查幂等回执 → 比对revision → 前提与资源 → 在副本内计算所有效果 → 校验不变量 → 持久化原子提交 → 通知UI。失败必须是整体失败，不能先扣款再发现事件条件不足。

事件、订单和业务各有definitionId与instanceId。定时效果以instanceId + phase + occurrence作为幂等键；按实际日期稳定执行，同日顺序遵守经济文档。日志记录因果父ID而非仅拼接自然语言。

## 3. 持久化与多标签页

IndexedDB中以同一readwrite事务读取runId的当前revision，再写入快照、命令回执和日志批次；事务提交前不能对外宣布保存成功。单个put成功不是事务complete，失败/abort必须保留旧状态。此行为参考[MDN IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction)，核验于2026-10-13。

事务内不等待模型或网络。revision竞争时后写者重新读取并显示冲突，不静默覆盖。P004先实现单写会话，多标签只读提示与revision校验作为双重防线；不依赖UI按钮禁用作为并发保护。

存储失败时，保留已验证的待提交快照作为未保存候选，显示“未保存”，暂停后续改变状态的命令；可重试或导出该候选，不能一边显示成功一边继续叠加新操作。关闭页面丢失未保存候选的风险必须提示。

存档封套包含saveVersion、schemaVersion、rulesVersion、contentVersion、contentHash、rngAlgorithmVersion、runId、revision、状态与日志引用。优先兼容同版本；升级须迁移或明确拒绝，不自动用新内容重算旧结局。

导入工作限制10MiB，验证整数界限、日期顺序、引用、枚举、占款和账本不变量；校验和用于损坏检测，不声称抵抗用户手改。损坏、高版本、不兼容内容拒绝后保留原档。浏览器本地数据可能被清理，应提供导出/导入与最近有效备份。[存储说明](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)。

## 4. 数字、随机和市场

MoneyFen为有界整数，BasisPoints为0—10000整数；计算过程避免乘积溢出，统一四舍五入，负数冲正走显式更正操作而非负成本。所有现金与持仓变化都通过账本服务；占款按ID转换，不能冻结与计划双计。

随机按world、market、opportunity、crisis分域，算法版本在P004锁定。实例隐藏事实创建时固定并保存；新增一段闲聊不能改变股票路径。游戏内日期来自状态，不读取现实今天决定历史。

行情包显式携带simulation/historical、有效区间、交易规则版本、价格与公司行动口径、来源审核状态。未知日期/未知价格返回DATA_UNAVAILABLE；拒绝用前一日价格或现实最新规则静默填补。模拟市场采用虚构代码；真实回放是同一接口的独立数据验收，不阻塞模拟引擎。

## 5. 内容与安全

事件采用[内容契约](15-content-contracts.md)的有类型操作符。缺失账户、后续事件、默认路径或非法日期的生产内容禁止导入。脚本中的演示算例不是生产事件，不能从planning目录自动装载到游戏。

所有玩家文本转义渲染；不把存档当HTML，不执行远程内容。日志不含真实身份、Token或API密钥。运行时即使未来接入文本生成，也仅表达已经确定的事实，不决定收益、胜负、权限或融资资格。

## 6. 构建、测试与交付

T02已提供dev、build、typecheck、test:unit等工程脚本，是否通过以goal对应的实际命令证据为准；后续再添加test:replay、test:e2e和validate:content，未实现前不声称这些检查通过。仓库已有文件不得被脚手架覆盖；模板先在临时目录整理再选择性合入。

测试分层：整数与账本单测 → 命令/日期/存档集成 → 固定种子路线回放 → 内容可达性 → 浏览器操作与美术。Q01—Q40均需实现侧证据。快照S01—S05用于隔离验证，不能替代从2020正常游玩到2025的通关测试。

每个PR附规则变化、任务与验收ID、实际命令输出、测试存档、已知缺口和兼容性。严重阻断包括重复收益、未来现金、不可继续、错误史实标签、存档覆盖和任一核心路线不可玩。

实施先后、功能切片与停止条件见[路线图](09-roadmap-and-backlog.md)。公开部署、CI权限、收费、许可证、真实数据采购和美术授权另行决定。本轮不创建这些外部资源。

T10接入[视频经营28](28-video-business-contract.md)，显式升级schema7，拒绝并保留旧schema1—6。制作/返工/申请/谈判共用OperationsRuntime，平台/客户事件进入同一时钟与原子Session；当前版本与实际验证范围见README和goal-1记录。

T11接入[课程与学员29](29-course-business-contract.md)，schema8/rules-t11-course-v1沿用同一Session与原子保存，拒绝并保留schema1—7。课程任务共用实际产能/行动/公司分账，按学员与原批次/阶段复算预款、退款和费用，世界更新不重收旧生学费。资料、Node回放、原生UI与真人证据分别记录，实际范围见[T11验证](../goal-1/evidence/t11-validation.md)。

T12接入[中转与例行30](30-relay-routine-contract.md)，schema9/rules-t12-relay-v1、world-relay-work-v1和operations-work-v5复用原Session/共享产能，明确拒绝保留schema1—8。用量按实际日期、客户/供应额度与已授权故障域生成；审计后以原账单引用追加更正，供应贷项与客户保护均不变成利润。例行逐项使用同一RunRoutineStep命令及原子保存，手动/批处理完整存档逐字相同，价格/许可/合同/风险/资源变化暂停相关未来项；未来季度仅草稿。严格记录解析按kind索引原schema，Session只缓存冻结的已提交只读预览视图，不减少实际提交/导入验证。C12累计结果、正常/夹具/原生与性能测量边界见[T12验证](../goal-1/evidence/t12-validation.md)。

T13接入[DeepSeek生态与架空股权31](31-deepseek-business-equity-contract.md)，schema10/rules-t13-deepseek-v1/world-deepseek-work-v1、operations-work-v6拒绝保留schema1—9。生态与股权复用同一操作/账本/时钟/Session；新资本和老股、股数和治理、估值和现金、私股应收和实际到账分别记录，少数股份不自动扩权。确认提交中仅保留已核对预览，实际提交与revision/事务验证不减少；规则状态仍只在原子保存后发布。新增严格privateReceivables与关联原投资/买方的处置/回款，费用累计取整和股份FIFO成本验证。两正常前史、独立算例、Node/原生/生产包的实际范围见[T13验证](../goal-1/evidence/t13-validation.md)。


T14已按[历史/代理与控制合同33](33-history-risk-contract.md)接线并完成限定验证，T14阶段schema11/rules-t14-story-v1/world-story-work-v1、operations-work-v7，拒绝并保留旧schema1—10。Story任务与支持使用原日期/行动/账本/产能；原授权、本人停止回执、外部撤权验证和独立证据分开。声明旧责任的原命令携带玩家核对的三份ID清单，提交前重算，导入时绑定原命令，后来的新债不改写旧处置。工作台增加变化/代理/持续处置，旧承诺和所有已知风险不裁剪；月服务应计同时影响可分配利润与承诺现金。462项JS/60工具、19组剧情/12类旧回放、64项原生/生产和22导出完整回放及原字节保护通过，实际范围见[T14验证](../goal-1/evidence/t14-validation.md)；不代表人物/24季度/原图/真人或整体验收。


T15按[人物、生活与年度合同34](34-people-life-year-contract.md)接入独立LifeRuntime和view.features.life，当前schema12/rules-t15-life-v1/world-life-work-v1，明确拒绝并保留旧1—11。life_event进入原WorldRuntime日序，共同任务/休整/环境改善占本人日期产能、个人实际支出和AP，不新增随机抽样。邀请/回应/实际兑现/到期/他方拒绝与原命令、动作、定时器、经济回执和精确日志双向绑定；来源材料从完成次日使用，不以后来结果验证过去决定。

年度个人现金以原交易逐笔核对，Jan1期初与转移/工资/现金流分开，大额有效累计超展示上限明确null/overflow；旧年度截止不读取今天余额。实际workspace完成才选择独立改善图；目标/开工/中断/保存失败都不提前切场景。新增RoomBackdrop真实图片失败降级，减少动效与文本模式只影响呈现；DEV独立三类head.put后abort与图片失败开关在生产构建中禁用。55项累计定向与10组正常/受挫引擎回放已通过，C15全部旧范围和最终原生仍在进行，实际200%与离开提示未验收，不据此标任务或goal完成。
