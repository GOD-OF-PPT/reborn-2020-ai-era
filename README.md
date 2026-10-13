# 重生2020：AI时代

> 先抓住改变生活的机会，再决定要不要改变这个时代。

**单人网页人生策略游戏，当前为设计与实施规划v0.3，没有可运行游戏。** 2026-10-13更新；数值、范围和选型均为工作设计，未逐项通过产品或试玩验收。

玩家从2020年开始，用记忆、资金、时间和关系参与AI浪潮。五条核心财富路线保持不变：**A股AI股票、AI生成短视频、AI卖课、API中转站、DeepSeek生态与架空股权投资**。可以结合工作、生活和创业，也可以只经营一条路。AI作恶、黑天鹅和失控保留，但不强制所有成功走向灾难。

完整首版工作范围为2020—2025年24季度；先做五个测试切片，再串成完整人生。第三套半写实电影感是偏好，不是最终验收。三张原始PNG仍待上传，本轮没有修改素材或部署游戏。

## 本轮补齐什么

把路线名称细化成可操作、可结算、可退出的玩法：产能与等待时间、个股部分成交、退款前后会计、中转用量更正、受众去重、股权稀释、危机默认选择、停业及年末义务。工程补齐原子命令、保存失败、多标签冲突、内容范围、分批PR和完成证据。

## 从这里继续开发

| 文档 | 用途 |
|---|---|
| [可玩体验规格](docs/16-playable-experience.md) | 玩家做什么；五路线；15个首批事件模板；回报、退场和页面 |
| [经济与行动](docs/02-economy-and-actions.md) | 日期、资金保护、占款、交付、退款、订单和尾声 |
| [技术实施](docs/08-technical-plan.md) | 模块、命令、账本、随机、原子保存与安全 |
| [实施路线图](docs/09-roadmap-and-backlog.md) | M0—M5、建议PR顺序、S01—S05和退出门槛 |
| [内容契约](docs/15-content-contracts.md) | 实体、状态机、完整课程更新模板、导入边界 |
| [验收矩阵](docs/14-acceptance-matrix.md) | Q01—Q40，全部是待实现功能验收 |
| [任务清单](planning/backlog.json) | 保留P001—P022，补依赖与验收；均未创建远端Issue |
| [规格数据](planning/playable-spec.json) | 五测试切片、10个现金算例、2个股权算例；不是游戏内容包 |

方向背景继续参考：[核心玩法](docs/01-game-design.md)、[财富机会专项](docs/13-opportunity-playbook.md)、[玩家视角](docs/07-player-walkthrough.md)、[历史与记忆](docs/03-history-and-memory.md)、[AI风险](docs/04-ai-risk-and-control.md)、[美术](docs/05-art-direction.md)、[界面](docs/06-ui-and-player-flow.md)、[决策](docs/10-decisions-and-open-questions.md)、[史实来源](docs/11-historical-sources.md)。

口径优先级：经济02管资金/时间，内容15管数据与效果，体验16管操作，实施08/09管工程，任务JSON管状态，验收14管证据。旧v0.2文本用于背景，冲突时以对应v0.3规格为准，不把文档全部重写成重复副本。

## 资料检查

```bash
python scripts/check_docs.py --text-only
python scripts/check_plan.py
python -m unittest discover -s scripts -p test_check_plan.py -v
```

第一条检查资料链接并报告缺图；后二者检查规划结构、固定算术与校验器自身。**都不是游戏构建、可达性或浏览器测试。** 本轮实际范围见[验证记录](VALIDATION.md)与[交付状态](DELIVERY-STATUS.md)。

先读[AGENTS](AGENTS.md)，从远端当前版本创建任务分支，不覆盖旧历史。下一步按PR-A评审口径与模拟边界，再以PR-B建立工程。尚未生成package.json、src、可玩站点、真实支付、账号、API密钥或许可证。经营数字不是现实投资建议，真实节点与架空安排必须分开。
