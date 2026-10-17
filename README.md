# 重生2020：AI时代

> 先抓住改变生活的机会，再决定要不要改变这个时代。

**单人网页人生策略游戏，设计基线v0.4；已有首季/半年切片、五路线专用经营内核与重构工作台，历史危机、正式人物界面和完整24季度/结局仍在实施。** 设计更新日期2026-10-13，工程进度见下方goal记录。金额、节奏和范围是待原型验证的工作设计，不冒充玩家验收。

实施路径于2026-10-16复核：按[路线图09](docs/09-roadmap-and-backlog.md)的E01—E18推进，先规则底座和首季小单/模拟投资，再扩展五路线与24季度；已实施范围与后续任务见goal记录，功能验收状态独立保留。

已建立[Goal 1计划](goal-1/plan.md)与[逐任务执行记录](goal-1/tasks.md)，从[开工合同20](docs/20-implementation-contract.md)开始实施；目标状态不代替功能完成状态。

玩家从2020年开始，用记忆、资金、时间与关系参与AI浪潮。五条核心财富路线不变：**A股AI股票、AI生成短视频、AI卖课、API中转站、DeepSeek生态与架空股权投资**。工作、生活与创业可以组合，不要求人人成立软件公司；AI作恶、黑天鹅和失控不强制每局发生。

完整首版仍以2020—2025年24季度、两种背景、每季4点为工作范围。第三套半写实电影感仍是美术偏好；原始三张PNG待上传。2026-10-16已创建工程入口和[钱/日期/行动内核](docs/21-economy-kernel.md)，未更换原始素材或部署，现有切片见下方T09—T14记录，完整首版仍待后续实施。

## 本地开发

使用Node.js 22.x（至少22.12.0），或package.json中engines列出的其他受支持版本；npm基线10.9.0，资料检查需要Python 3.10+。`.nvmrc`选择22主线，直接依赖使用精确版本，package-lock.json锁定依赖树。

```bash
npm ci
npm run dev
```

开发服务默认仅监听127.0.0.1:5173，端口占用时明确失败，不自动换端口。当前首页可开始新人生、继续本机存档和进入工作台、视频、课程、中转、例行方案与DeepSeek机会。

```bash
npm run check
```

统一检查依次执行类型检查、前端单测、Python工具测试、资料检查和构建。可单独运行`typecheck`、`test:unit`、`test:docs`、`check:docs`、`build`；`npm run preview`在本机预览构建产物。尚未提供的游戏回放/内容可达性/浏览器验收入口随对应任务建立，不以空命令报通过。依赖说明与实际证据见技术08和goal执行记录。

本机资源争用时，可用`npm run test:unit -- --maxWorkers=1`以相同断言和原时限串行复核；该命令只覆盖前端单测，其余类型、工具、内容、资料及构建检查仍须通过。T13验证记录保留并发超时和串行复核的各次实际结果。

`npm run evidence:kernel`另采集Q01实际内核操作的起止快照、序列和哈希，仅供账务回归；不是市场撮合、随机域存档或浏览器游戏验收。证据已提交后采集器拒绝原地覆盖，重跑需附`-- --output-dir goal-1/evidence/recheck-YYYYMMDD`指定新目录。

T04建立了[命令、随机与存档合同22](docs/22-command-save-contract.md)。开发服务运行时，访问`/tests/t04-storage.html`可手动运行隔离测试库上的原生IndexedDB/Web Locks检查；页面只用于工程验证，不提供游戏入口，也不进入生产构建。浏览器原生报告与已知限制见[T04验证](goal-1/evidence/t04-validation.md)。

T05建立[内容、世界与资格合同23](docs/23-content-world-contract.md)：正常组合入口为`createCampaignRun`，包含独立运行时内容包、世界按日期推进、有限准备任务及资格门控。`npm run validate:content`校验实际内容与初始化，`npm run evidence:world`采集内容/时钟回放；这些结果不代替五路线经营、正常通关或浏览器可玩验收。T05采用schema2并保留旧schema1历史导出，当前组合版本见下方T14。

T06建立[就业与共享经营合同24](docs/24-shared-operations-contract.md)：季度工作、实际月薪、共享个人/员工产能、合同任务和退出义务接入同一命令/存档入口。T06当时使用schema3，明确拒绝旧schema1/2。`npm run evidence:operations`采集经营底座回放；T06当时正常包尚无专用生产商单，T07接入首单内容。历史采集命令需指定新输出目录。

T07接入[手工第一单25](docs/25-manual-first-order-contract.md)：正常两背景可接、拒绝、跳过或让报价过期；制作、提交、客户复核、收款和已付案例按实际状态处理。T07当时组合为schema4，明确拒绝旧schema1—3；`npm run evidence:first-order`采集独立首季回放。Session公开首单投影已可接线，完整可玩界面仍由T09实施。

T08接入[模拟股票合同26](docs/26-simulated-market-contract.md)：五类虚构个股、216个有限撮合点、计划/订单同一占款、部分成交/撤改/到期、费用/股份与现金交收、原始价分红、独立研究及公开持仓投影。T08当时正常组合为schema5、rules-t08-market-v1，明确拒绝并保留旧schema1—4导出。`npm run evidence:market`采集正常Q01实际订单与隔离失败路径；Session公开`features.market`只取已提交存档。真实历史行情/制度/使用条件未核验，历史回放禁用；T09负责可玩操作和新浏览器验收。

T09接入[首个可玩工作台27](docs/27-playable-workbench-contract.md)：两背景/人生愿望、两种建议引导与自由安排，工作/首单/投资/研究、五路线门槛、分账户账本、真实本机存读档/下载/导入/备份及失败候选。T09当时为schema6、rules-t09-playable-v1明确拒绝旧schema1—5，原档保留；`npm run evidence:playable`采集两背景正常S01半年。T09当时预览到2020-06-30，后续完整路线与24季度由T10—T18继续实施；不代表P008/P015或W包整体完成。实际浏览器/C09范围与限制见[T09验证](goal-1/evidence/t09-validation.md)。

T10接入[视频经营合同28](docs/28-video-business-contract.md)：三类作品、素材与人工校正、按年代和本局资格开放的图像/视频工具、付费返工/客户谈判/验收/回款、平台和带货结算、稳定受众cohort与转化去重、共享员工及退出义务。T10当时schema7、rules-t10-video-v2明确拒绝并保留旧schema1—6；前台日期开放至2025-12-31以正常到达工具节点，完整24季度/其余路线/结局仍由后续任务验收。`npm run evidence:video`采集F02独立账务和两背景正常视频回放，`npm run evidence:video-browser-audit`审核实际原生导出；最终采集与真实范围见[T10验证](goal-1/evidence/t10-validation.md)。不以夹具、日期开放或工程测试关闭P/W/Q/X整体。

T11接入[课程与学员合同29](docs/29-course-business-contract.md)：三种形式、已付案例/素材权利、真实样课与教学、分批预款保护/分阶段收入/交付前后退款、按日期支持与投诉补交付、七天更新与停售旧义务、固定受众身份去重和有新需求的进阶课程。T11阶段采用schema8；当前组合版本见T14。`npm run evidence:course`采集独立F03/F05与两背景正常S02，`npm run evidence:course-browser-audit`逐字审核原生导出；证据见[T11验证](goal-1/evidence/t11-validation.md)。正常公司维护/工资/生活费与独立财务夹具分列，不能把23029元夹具利润当作玩家保证收益。历史危机、正式人物界面与24季度/结局、原图/真人/整体平衡继续待实施。

## v0.4：从竞品机制转成更清楚的操作

重点调研7款机制相近游戏，记录2款证据有限的直接题材候选；仅桌面研究，未实机试玩或采样评论。保留v0.3账目与边界，把前台操作聚合为**简报→计划→关键决策→结果→下一季**。

可选第一单教学先给一笔可解释回款；五条路线保持不同的核心选择与反馈；明确授权的例行方案减重复操作，重要变化必须暂停。财富对应生活选择，记忆对应实际准备，后期控制权冲突来自真实收益与依赖。以上是设计假设，不声称竞品已经证明本作一定好玩。

## 优先阅读与实现

| 文档 | 用途 |
|---|---|
| [竞品调研与取舍](docs/17-competitive-research.md) | 7款重点、2款候选、一手来源、证据限制、D401—D410 |
| [优化后的玩家流程](docs/18-revised-player-flow.md) | 可选首单、聚合工作台、五路线差异、例行工作与人生回响 |
| [本轮实施补充](docs/19-research-implementation-plan.md) | 7个应用层契约、6个增量工作包、X01—X14及对照试玩 |
| [核心设计](docs/01-game-design.md) | 多路径循环、人物、历史、风险与结局 |
| [界面与信息](docs/06-ui-and-player-flow.md) | 工作台状态、两层财务、异常队列、保存与无障碍 |
| [实施路线图](docs/09-roadmap-and-backlog.md) | M0—M5、E01—E18执行顺序、首季门槛与基础/增量结项条件 |
| [技术方案](docs/08-technical-plan.md) | 规则、命令、持久化、确定性和安全，沿用v0.3 |
| [经济与行动](docs/02-economy-and-actions.md) | 日期、账户、占款、交付、退款、交易与终局义务 |
| [内容契约](docs/15-content-contracts.md) | 状态机、条件效果、实例ID与导入边界 |
| [原可玩规格](docs/16-playable-experience.md) | 15个事件、S01—S05及12个财务算例，仍有效 |
| [原验收矩阵](docs/14-acceptance-matrix.md) | Q01—Q40待实现功能验收，不因新增X用例而废止 |

方向背景：[五路线专项](docs/13-opportunity-playbook.md)、[玩家叙事](docs/07-player-walkthrough.md)、[历史](docs/03-history-and-memory.md)、[风险](docs/04-ai-risk-and-control.md)、[美术](docs/05-art-direction.md)、[原决策记录](docs/10-decisions-and-open-questions.md)、[历史来源](docs/11-historical-sources.md)。

## 版本与任务权威

[backlog](planning/backlog.json)保留v0.3基础P001—P022；[playable-spec](planning/playable-spec.json)保留原快照与财务规格。本轮新增[competitive-design](planning/competitive-design.json)作为v0.4增量：9项证据、10项设计取舍、14项X验收、6个关联基础任务的工作包及UX01。不重编号、不关闭功能任务，未创建远端Issues。

经济02管钱/时间，内容15管效果，技术08管核心与保存；新版01/06/18替代旧页面顺序和信息层级，19补应用层契约；任务JSON管基础状态，增量JSON管本轮映射。完整版本验收需要Q01—Q40与X01—X14，不只通过资料脚本。

## 资料检查

```bash
python scripts/check_docs.py --text-only
python scripts/check_plan.py
python -m unittest discover -s scripts -p test_check_plan.py -v
python scripts/check_competitive_design.py
python -m unittest discover -s scripts -p test_competitive_design.py -v
```

命令面向完整克隆目录。资料检查、固定算例和校验器自身测试不是游戏规则、浏览器或真人试玩；本轮实际执行范围见[VALIDATION](VALIDATION.md)，交付与未完成项见[DELIVERY-STATUS](DELIVERY-STATUS.md)。

先读[AGENTS](AGENTS.md)，从远端当前提交继续工作。不强推原始资料包的独立历史，不改变公开可见性。本轮不新增真实交易/支付、AI服务后台、分析SDK、部署或许可证。所有经营收益是游戏设计，不是现实投资指导；真实节点与架空融资持续分开。

T12接通[中转与例行合同30](docs/30-relay-routine-contract.md)：供应许可/适配、实际客户与预付或信用条款、按日用量/供应账期、三天审计与原账单更正、已授权故障转移、停站与旧余额；例行草稿/逐项确认/同序批处理及条件变化暂停沿用同一原子Session。T12阶段采用schema9；当前组合版本见T14。`npm run evidence:relay`采集F04/两背景正常S03/故障域/X04/X05，`npm run evidence:relay-browser-audit`审核原生导出；实际结果与C12见[T12验证](goal-1/evidence/t12-validation.md)。F04利润5500元是独立财务算例，正常经营承担真实生活/工资/维护/审批与营销；停站不清客户负债，例行不自动交易、招生、融资或扩权。没有真实中转服务、收费或模型调用。

T13接通[DeepSeek生态与架空股权31](docs/31-deepseek-business-equity-contract.md)：实际部署/培训、用途适配、分阶段验收/支持/预款保护/回款、有限退出；另行确认的架空邀请/尽调/资格/谈判、增资/老股、整数股份20%/16%、独立治理、锁定及实际买方转让/延迟到账。T13阶段schema10、rules-t13-deepseek-v1、world-deepseek-work-v1、operations-work-v6明确拒绝保留schema1—9。`npm run evidence:deepseek`采集15组分层回放，`evidence:deepseek-browser-audit`逐字审核原生导出，`evidence:route-diversity`交叉核对五路线专用状态与反馈；见[T13验证](goal-1/evidence/t13-validation.md)。正常两背景小额2万元实际参与与大额200万元夹具分开；估值不是现金，少数股份不自动成为治理权，没有现实公开申购或真实融资服务。正常24季度、完整尾声、原图/真人及整体Q/X仍待后续任务。

2026-10-17按用户补充新增[完整界面/流程/视觉重构合同32](docs/32-interface-experience-redesign.md)。先完成D01设计与[可交互样稿](design/ui-redesign-v1/index.html)，D02覆盖正式前台全部已有页面，之后接续T14；D01样稿采用内置image_gen生成的场景与HTML控件，不连接真实引擎或存档。D02正式React前台沿用该场景，接通四项主导航、渐进开局、季度四阶段、五路线工作区与两层账本；运行时检查记录在goal任务证据，不用固定设计样例代表实际收益。原计划/证据和三张原PNG缺失状态保留，新增资产有独立来源与提示词记录。

D02正式前台、累计检查和实际浏览器范围见[重构验证](goal-1/evidence/d02-validation.md)。原三张PNG和真人试玩仍未验收，人物生活及正常24季度/尾声继续按goal实施；局部历史与危机见T14。


T14接通[历史、代理权限与控制恢复33](docs/33-history-risk-contract.md)：实际合作的局部分支、准备兑现、同源发布影响、真实课程/中转辅助支持与单独权限、独立调查和有成本恢复，以及“变化与处置”工作区。当前工作树采用schema11/rules-t14-story-v1，旧1—10原档保留并明确拒绝，T13段落记录的是当时版本。`npm run evidence:story`用于新目录中的正常前史与固定全样本回放，`evidence:story-browser-audit`逐字审核另行采集的真实UI导出；462项JS/60工具、19组固定剧情/12类旧回放、64项实际浏览器及22导出完整回放通过，范围见[T14验证](goal-1/evidence/t14-validation.md)和[任务记录](goal-1/tasks.md)。原PNG/真人、人物生活与正常24季度/尾声仍归后续任务。未接入真实模型、委托、收费或网络分享。
