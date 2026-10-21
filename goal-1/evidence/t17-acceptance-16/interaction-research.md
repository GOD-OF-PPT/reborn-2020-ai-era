# D11｜把准备变成可以玩的选择

研究日期：2026-10-22。按用户指定的 Game Studio Shared/UI 路径，采用 game-ui-frontend 的动词、层级、场景与状态原则；本机技能以名称记录，不把本机技能绝对路径写成网页链接。工程沿现有 React/TypeScript，后续实际验证由根代理按 game-playtest 执行。本次仅阅读公开一手文字材料，没有实机试玩、视频逐帧验证、真人研究、代码实施或测试。兼容开发/测试继续为0。

## 来源与直接可证事实

| 游戏 / 一手来源 | 本次能证实的机制 | 证据边界 |
| --- | --- | --- |
| [Citizen Sleeper 官方 Steam 机制说明](https://store.steampowered.com/app/1578650/Citizen_Sleeper/)；[发行商官方页面](https://www.fellowtraveller.games/citizen-sleeper) | 每轮把已有骰子分配到具体行动；时钟追踪玩家及他人的行动进展；玩家自行选择关注的人与故事。操作、有限投入和时间进展相互关联。 | 页面支持机制存在，没有证明本作玩家能理解，也没有给出可供本作照搬的收益或美术参数。 |
| [Roadwarden 作者 Aureus 的设计复盘，2022-11-04](https://www.gamedeveloper.com/design/deep-dive-roadwarden)；[开发者官方 press kit](https://moralanxietystudio.com/presskit/roadwarden) | 主要决定通过选择具体文本行完成；首次交谈可选择五种态度。人物称呼、问候及灰色对话项转为可操作共同表达关系变化；日志记录已经获得的态度线索。 | 可确认文本选择与可操作状态反馈；不能据此把本作隐藏意愿/未来结果显示出来，也不能推断其使用特定高亮shader。 |
| [Pentiment 官方发售说明，2022-11-15](https://news.xbox.com/en-us/2022/11/15/pentiment-available-now/)；[美术总监 Hannah Kennedy 复盘，2023-01-25](https://www.gamedeveloper.com/art/deep-dive-the-art-of-pentiment) | 有限时间要求玩家选择调查线索，决定的影响在后续多年展开。场景美术服务故事与情绪；受控轨道与构图、较一致的空间朝向帮助理解，先用未上色粗稿在游戏内验证场景/任务结构，再完成美术。 | 支持“结构和时间选择先清楚、后果持续回访”的设计参考；美术复盘没有直接描述可交互物件高亮规则，不逆向声称其材质或shader实现。 |

## 本作设计推论

以下均为本作的执行判断，不是竞品已证明的规则或效果。

1. 准备也应有可玩的眼前一步。按已经提交的公开前提，直接选择自有资金准备教室，再明确选择资源和日期写大纲，经原确认后等待实际完成；完整原册继续承载案例、工具、样课、招生、退款与后续责任。沿本作四点行动和原费用/日期，不新增骰子、筹码、免费资格或自动命令。
2. 一个可见对象应通往它自己的记录。点开某个视频账号下的作品或合同，应携带同run的账号、作品/合同、业务与当前步骤身份；原册定位到该对象。导航只改变查看上下文，不改账户资产或代为提交。过期/缺失目标要明确说明并让玩家重新选择。
3. 辅助准备成功后应能接着原来的选择。仅为明确白名单的辅助命令、同run/同业务、已打开的原册保留表单组件与草稿，保留真实保存回响；资源/资格变化重新核对。融资、交易、开新业务、招生和扩权不因便捷操作隐式接受；失败候选、只读和冲突仍沿原安全流程。
4. TA逐状态表达动作。可行动、已选择、确认、等待、已保存及失败/只读分别有文字、轮廓/形状和局部响应；暖金聚焦当前可操作，纸白表达记录，朱红表达已发生的责任。已选择的资金/资源/日期应持续可辨，等待关联原对象与日期，保存失败不播成功或收益。原减少动效/纯文本保留。这是本作技术美术方案。

## 当前代码问题 → 实施要求 → 待验证事实

以下是本轮读源码时的问题定位，不是修复后或浏览器验收结论。代码可能由其他代理随后实施；最终结果另以实际运行证据记录。

| 当前具体代码与行为 | 本轮实施映射 | 必须留下的实际验证 |
| --- | --- | --- |
| `course-scene-progress.ts` 的大纲/工作室准备分支只返回“查看/核对”文案；`NarrativeScene.tsx` 对无教学stage的课程选择调用 `onOpen()`。`CourseStageChoice.tsx` 仅覆盖已招生的教学阶段，首次准备仍进入整本原册。`CoursePanel.tsx` 中真实 `OpenCourseStudio`、`StartCourseOutline`、`ActivateBusiness` 已存在。 | 在场景内补首次准备步骤；玩家显选资本、实际资源及开工日，经现有 CommandButton/preview/confirm/request/Session。公开状态决定当前一步和下一反馈；复杂后续与原账继续可达。 | 真实正常前史：取消不变；自有资金转移/维护与点/日期按原规则；大纲安排、开工、完成分别可见；完成大纲不冒充样课/收入。检查原暂停屏障和资格拒绝。 |
| `App.tsx` 的 `onSubmission` 在成功保存并取得 committedEcho 后统一 `setWorkspaceOpen(false)`；原册条件挂载在 `workspaceOpen` 下。`CoursePanel.tsx`、`VideoPanel.tsx` 的本地 useState 表单随卸载丢失，辅助准备后需要重新填写。 | 成功关闭策略增加明确辅助命令白名单与同run/同业务/原册已打开门槛；白名单内保留原册实例与草稿，真实回响仍发布。跨身份重置与原未保存候选/冲突保护独立保留。 | 同一原册先填草稿→执行辅助准备→成功后草稿仍同；取消/只读不执行；保存失败仍旧提交；原候选重试不重新抽取或重复收费；不同人生/业务不串草稿。 |
| `NarrativeScene.tsx` 的视频无直接command分支仅 `onOpen()`，没有把当前作品身份传入；`VideoPanel.tsx` 的账号由本地 selected 或首个开放账号回退决定，尚无针对作品/合同的原册目标定位。 | 从公开video progress携带账号/作品/合同及对应步骤，经App和原册定位。保留全账号选择及全部作品/合同记录；缺失或过期目标明确回退，不静默打开另一作品。 | 至少用两个账号/多作品的公开正常状态核同对象导航；实际需要修改的作品定位正确，查看/返回无命令；翻页与取消保留草稿，全部历史记录仍能到达。 |
| 上述准备步骤尚未形成完整可行动/已选择/等待/已保存的状态链；已有电影场景与念头卡不能替代对该链的逐状态检查。 | 新选择卡先校准对象、选择状态、文字/轮廓与响应，再精修装饰；同一状态层级用于鼠标悬停、键盘焦点与确认，不用持续闪烁代替操作提示。 | 当前同一Chrome窗口逐状态检查：可点/已选/确认/等待/保存成功/失败候选/只读，核同次AX与画面、真实金额/日期/AP/权限/保存及重进；不切尺寸/zoom或做几何、跨浏览器、原生离页专项。 |

## 执行与来源边界

AGENTS 保留原12条，并追加准备分步直接操作、同对象导航、辅助准备保草稿、逐状态TA验收四项。研究文字与组件绿色结果都不证明真人理解度/趣味性；真人仍0。旧PNG、完整T17、原未执行5c矩阵及M01/T18责任不变。实际原规则/内容/经济/版本/随机/权限与原子保存不因这次UI研究修改。没有使用ForgeTax，未复制竞品素材或建立新外部资源。

源码问题观察身份：{"head": "351f2f588c70aacdf8cd241e9599a81a6e1f6316", "branch": "main", "origin": "https://github.com/GOD-OF-PPT/reborn-2020-ai-era.git", "repository": {"defaultBranchRef": {"name": "main"}, "nameWithOwner": "GOD-OF-PPT/reborn-2020-ai-era", "url": "https://github.com/GOD-OF-PPT/reborn-2020-ai-era", "visibility": "PUBLIC"}}。

源码观察SHA-256（仅定位当时问题）：

- `src/ui/course-scene-progress.ts`：`f4e87e03756a440f69aa4a3adcb6f0fe861d6b4826b718daf776ea30876688a2`
- `src/ui/CoursePanel.tsx`：`ce531f9510d650b53f5062f629f5329664af300c78247fc6b95e9248d2c173b5`
- `src/ui/CourseStageChoice.tsx`：`18128adf3ce6fb9baf74ad6a5a685ab70d956db7365ae8b4be4b4faa20a75117`
- `src/ui/App.tsx`：`4ddd19923097fc00630625a92e96f7d0c55042bbe4e29a4a218936ff72215ccc`
- `src/ui/NarrativeScene.tsx`：`1e8f45eb2059cbf00b7bb83a1c9a5828c1d934b8cfad6c0a07d0b8a689b4a660`
- `src/ui/VideoPanel.tsx`：`a4010557b2d896e4613203aa2cbb4b1db74d719cc4b6210933b8b96d6a886be7`
