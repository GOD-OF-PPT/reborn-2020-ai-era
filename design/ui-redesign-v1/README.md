# D01 界面重构设计样稿

在仓库运行`npm run dev`后打开`/design/ui-redesign-v1/index.html`。这是独立设计原型，不加载正式游戏、不访问IndexedDB/localStorage，也不提交业务命令。所有金额/日期是明确的固定示例。

可体验：房间→背景选择→季度简报/计划/抉择/结果、五路线、记忆、两层账目、确认框、保存失败与零资源异常态、文本模式与减少动效。动作只切换设计画面。

- [完整设计与正式迁移合同](../../docs/32-interface-experience-redesign.md)
- [可交互入口](index.html)
- [季度视觉概念图](workbench-concept-v1.png)
- [新房间场景](../../assets/ui-redesign/room-2020-v1.png)
- [两张图的完整生成提示词](generation-prompts.json)
- [来源/尺寸/哈希](assets-manifest.json)

采用内置image_gen。生成原文件保留于Codex默认生成目录，选定版本已复制入仓库。房间场景可供D02生产集成；UI概念图仅作视觉参考，所有正式文字/数值/控件由HTML渲染。原三套概念PNG的缺失状态保持原样。
