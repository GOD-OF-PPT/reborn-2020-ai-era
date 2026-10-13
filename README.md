# 重生2020：AI时代

> 你知道AI时代会到来。先抓住改变生活的机会，再决定要不要改变这个时代。

**单人网页人生策略游戏，当前是设计与实施规划v0.2，不含可运行游戏。** 更新日期：2026-10-13。名称、数值和完整版本范围仍是工作设计，未逐项通过产品验收。

## v0.2核心修正

不再把软件创业设为唯一主线。用户要求的五类机会进入核心玩法和开发清单：**投资A股AI股票、AI生成短视频、AI卖课、做API中转站、投资DeepSeek相关机会**。工作、生活、关系、应用创业和技术贡献仍可组合。

完整首版工作目标调整为2020—2025年24季度；先做教学季度和2023/2025测试快照，再串成整局。AI作恶、黑天鹅和失控保留，但不能挤掉赚钱与人生选择的乐趣。

DeepSeek历史生态机会与架空直接股权谈判分开；A股个股投资与抽象AI组合分开；课程预售、中转充值、收入、利润与可用现金分开。每种机会必须有投入、决策、交付/交易、结算和退出，不能只写成一条新闻。

## 优先阅读

| 文档 | 内容 |
|---|---|
| [AI财富机会专项](docs/13-opportunity-playbook.md) | 五类赚钱方式的进入、操作、收益、风险、成长与退出 |
| [核心设计](docs/01-game-design.md) | 普通人多路径玩法、季度循环、人物和结局 |
| [经济与行动](docs/02-economy-and-actions.md) | 时间、分账、预付款、股权及可复算样例 |
| [玩家视角流程](docs/07-player-walkthrough.md) | 工作、投资、视频、卖课、中转到DeepSeek与架空危机 |
| [实施路线图](docs/09-roadmap-and-backlog.md) | M0—M5交付物、依赖与退出条件 |
| [技术方案](docs/08-technical-plan.md) | 共享机会引擎、专用经济模型、确定性与存档 |
| [验收矩阵](docs/14-acceptance-matrix.md) | Q01—Q24，均为未来功能验收，不是已通过测试 |
| [内容契约](docs/15-content-contracts.md) | 机会、业务、事件与专用字段 |

其他文档：[项目概要](docs/00-project-brief.md)、[历史与记忆](docs/03-history-and-memory.md)、[风险与控制](docs/04-ai-risk-and-control.md)、[美术](docs/05-art-direction.md)、[界面](docs/06-ui-and-player-flow.md)、[决策](docs/10-decisions-and-open-questions.md)、[事实来源](docs/11-historical-sources.md)、[GitHub协作](docs/12-github-workflow.md)。

[22项开发任务](planning/backlog.json)尚未创建为远端Issues，功能状态均待实施/验证。依据验收推进，不因文档存在就把任务标为完成。

## 美术与素材状态

用户偏向第三套半写实电影感，尚未最终定稿。三张原始PNG仍在对话的完整项目包，未进入远端仓库。本轮仅更新文本和规划校验脚本，不上传、替换或伪造原图；路径和哈希见[资产清单](assets/concepts/manifest.json)。

## 资料检查

```bash
python scripts/check_docs.py --text-only
python scripts/check_plan.py
```

这些不是游戏构建或玩法测试。第一条报告缺少原图；第二条检查任务依赖、验收ID引用与固定算例。真实执行记录见[VALIDATION](VALIDATION.md)，交付范围见[DELIVERY-STATUS](DELIVERY-STATUS.md)，变更见[CHANGELOG](CHANGELOG.md)。

## 继续开发

先读[AGENTS](AGENTS.md)，从当前远端创建任务分支。先完成账本、时间、行动和存档，再做五机会切片；不先搭建真实券商、收费课程、视频生成服务或API中转基础设施来模拟游戏。

所有经营金额、收益、架空投资和失控因果为游戏设计，不是投资建议或真实企业背书。历史事实有一手来源及未完成核验项；模拟行情不冒充实盘。本轮不改变公开可见性、不部署站点、不建立新账号或许可证。
