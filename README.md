# 重生2020：AI时代

> 先抓住改变生活的机会，再决定要不要改变这个时代。

**单人网页人生策略游戏，当前为设计与实施规划v0.4，没有可运行游戏。** 本轮更新日期2026-10-13。金额、节奏和范围是待原型验证的工作设计，不冒充玩家验收。

玩家从2020年开始，用记忆、资金、时间与关系参与AI浪潮。五条核心财富路线不变：**A股AI股票、AI生成短视频、AI卖课、API中转站、DeepSeek生态与架空股权投资**。工作、生活与创业可以组合，不要求人人成立软件公司；AI作恶、黑天鹅和失控不强制每局发生。

完整首版仍以2020—2025年24季度、两种背景、每季4点为工作范围。第三套半写实电影感仍是美术偏好；原始三张PNG待上传，本轮未更换素材、创建游戏工程或部署。

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
| [实施路线图](docs/09-roadmap-and-backlog.md) | M0—M5、PR顺序、基础与增量验收门槛 |
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
