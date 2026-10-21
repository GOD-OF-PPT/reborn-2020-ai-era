# 竞品交互/UI/TA研究与本作实施依据

研究日期2026-10-21。用户指定game-studio；本任务路由Shared→game-ui-frontend与game-playtest，保留既有React/TS/DOM叙事场景，不更换引擎。TA按技术美术处理，也考虑玩家理解门槛；不是移动适配。原兼容开发测试全部暂停。

## 公开一手依据

| 来源 | 实际阅读到的公开事实 | 对本作的设计推论 |
|---|---|---|
| [Citizen Sleeper官方Steam](https://store.steampowered.com/app/1578650/Citizen_Sleeper/)与[发行商介绍](https://www.fellowtraveller.games/citizen-sleeper) | 作者使用Dice/Clocks/Drives组织周期行动、进展与玩家选择的故事；工作、人与生存处在同一循环 | 将原4AP显化为有限时间；先呈现人在经历的矛盾和下一反馈，不照搬骰子、不引入新随机 |
| [Suzerain开发者2.0公告](https://www.torporgames.com/press-releases-new/2023/07/31/torpor-games-fellow-traveller-unveil-suzerain-20-amendment-update)及[官方press kit](https://www.torporgames.com/presskit) | 官方同时重构叙事、UI/地图、音乐音效，人物选择与地图/报告等信息层并存 | 决定发生在场景当下，完整资料按需展开；只换材质无法改变菜单任务感 |
| [Reigns作者François Alliot设计复盘](https://www.gamedeveloper.com/design/game-design-deep-dive-creating-an-adaptive-narrative-in-i-reigns-i-) | 单一手势与状态后果结合；内容按当前状态筛选，旧选择影响后续遭遇 | 统一可发现、可理解的操作语法；只读公开状态安排场景，不把真实经济简化成随机卡或二选一加钱 |
| [inkle／Joseph Humfrey GDC文本UX摘要](https://www.gdcvault.com/play/1025104/Designing-Text-UX-for-Effortless) | 摘要明确focus/pacing；字体排版、去分心、用动画引导视线协助阅读 | 一幕聚焦一个问题，状态变化给可见结果；动效有阅读和因果作用，不做持续装饰噪声 |
| [Heaven’s Vault作者官网](https://www.inklestudios.com/heavensvault/)与[Roadwarden开发者press kit](https://moralanxietystudio.com/presskit/roadwarden) | 前者公开2D人物与3D环境结合、选择记忆；后者公开有限调色盘和几乎无动画，时间/资源与对话机制结合 | 游戏感来自选择与反馈的一致性，技术美术不等于特效数量；本作保留A电影环境，以物件、纸本、光色和真实阶段区分信息 |

这些是官方说明、创作者文章与演讲摘要的研究，未实际运行竞品、未完成玩家研究，未观看完整GDC视频。对shader、动效时长、留存或收益没有逆向结论。未采用撤回的竞品参考，未复制/下载竞品素材进游戏。

发行商页面可定位原始Citizen Sleeper界面图链接；本次Chrome图片标签的URL/title已到达，但截图接口返回星空空白帧，故不将它记为成功的竞品像素目检，不由此推断具体布局或TA实现。GDC另一份大PDF读取失败、Reigns GIF工具不支持，均不冒充已读全稿/已看动效；可用文字来源足以支持上表有限结论。

## 当前实现的明确问题

1. CinematicRoom同时有四热点、四念头、通用主CTA、胶片和主导航，多个入口重复去同一页面。玩家反复选择菜单，无法直接经历事件。
2. NarrativeScene的Choice和Action外形/语气相近；许多“认真完成”的标题只调用onOpen，真正命令埋在原册→分区→表单里。资料入口与世界行动需要明确区别。
3. SceneTimeNotice接收到真实savedSceneResult，却默认显示固定“原安排已经记下”；时间后的作品完成、客户结果和到账被迫再打开详情。
4. 房间默认为季节独白，缺少眼前可回应的请求；AP只是系统计数，未与当前取舍建立关系。FirstChapterTrail默认四打勾轨迹强化任务表观感。

## 实施标准与覆盖

已将12条可执行规则先写入根AGENTS.md：动词循环、每幕问题、名称对应行为、少量不同选择、确定取舍、阶段分明、有对象的等待、完整原账/强制义务、人物/物件来源、TA状态、因果动效、实际完整小循环。

本轮落实房间当前抉择与首单直接经营闭环；后期已有工作以具体任务/日期引导，完整五路线与责任保留。所有路线共享查看/行动/等待的不同用语/视觉、默认可见的真实时间结果。四AP筹码来自当前原预算。具体命令与原付款、权限、日期和原子保存不改；角色对白/奖励不造假。美术沿A原创背景，物件聚焦和轻纸本承载选择，不引入新素材授权或依赖。

首单选择、工作、等待制作、亲手提交、验收和到账需要真实Chrome操作及完整创建重放；只读/保存失败保持旧态。研究指导不等于玩家已经理解或觉得好玩，真人仍0。完整后期内容继续按原目标审查，暂停的5c-P1/核心288/关键62/例行22等不能由此关闭。
