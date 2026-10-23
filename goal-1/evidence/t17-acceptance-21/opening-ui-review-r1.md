# S1当前接线独立只读审查 r1

本轮读取发现3处必要修正。仅审源码与CSS层级；未运行测试、服务、浏览器或Git，未做尺寸、缩放、几何或兼容检查。以下行号对应本轮首次读取版本，后续修复须另核。

1. **[P2] 投资物件近景与主念头的动作不同。** `OpeningMoment.tsx:78` 在 `canChooseOrder` 时用 `MarketSceneChoice` 打开显选委托；`:87` 的物件近景却只调用 `originalAction(true)`，其 `:61–67` 无该分支，落到查看原记录。玩家点同一对象后不能继续主幕已呈现的“选择模拟委托”。应共用同一主操作/委托草稿所有者，近景打开同一选择流程；不要复制两份互不关联的草稿，也不要把查看改名为提交。

2. **[P2] 近景与随身册没有命中新舞台样式。** `Dialog.tsx` 将内容 portal 到 `.game-app`，因此 `OpeningMoment.tsx:87–93`、`CinematicRoom.tsx:78` 的 `.opening-paper` 实际不在 `.opening-room` 内。当前CSS无 `.opening-paper` / `.opening-directions` 规则；`.opening-room .opening-room-records` 也不能命中随身册内记录。其主操作仍落到旧 `.cinema-app .moment-decision` 宽块按钮，Dialog沿通用纸册样式，确定存在视觉语言回退。建议限定补 `.opening-scene-active .dialog.opening-paper`、该作用域内 `.moment-decision`、`.opening-directions`、`.opening-room-records` 的近景/轻念头样式；保留 `ScreenBook` 全文分页、原确认、失败原因及焦点，不修改全局专业页。是否遮挡场景或需要调整具体位置，须当前窗口目检，源码不能代验。

3. **[P2] 工作首幕把同一决定列成两种念头。** 在“换个念头”选择工作且尚未就业时，`player-thread.ts:198` 提供主 `WorkQuarter`；`OpeningMoment.tsx:81` 的 `!employed&&!market` 又生成第二个 `WorkQuarter`。01/02实际是同一投入，不构成不同旁路。副选择应排除与主命令相同的kind/载荷，至少排除工作关注，再给生活或查看方向。

已核成立的源码边界：

- `RoomMoment.tsx:74` 仅在正常2020Q1使用S1。`OpeningMoment` 的意图、文字section、`OpeningObject`由Fragment并列；在 `CinematicRoom.tsx:68–73` 下成为舞台直属元素，已匹配 `.opening-room>.opening-object`，没有再把前景放进左栏。S1不渲染旧 `.moment-time`，AP仍只由App的一组HUD表达。
- 普通动作区域通常为主选择、一个不同副选择及探索；工作重复项除外。随身册仍通向季度、五路线、记忆、账本、人物、年度与篇章；`urgent`和“牵挂与日历”、App的 `SceneAttention` 未被删除，责任由原投影/中断逻辑承载。
- `CommandButton` 继续检查预览、busy、候选、只读与冲突；`ClockAdvance` 保留原预览与提交状态保护。App `onSubmission` 仅在saved且 `committedEcho` 成立后设回响，unsaved/conflict清回响。`OpeningObject`只读父props、没有计时器或成功业务状态；打开只读近景不等于提交。上述仅支持“未发现本片新增成功泄漏”，不证明运行时失败/重试已验收。

轻HUD、单图物件、真实状态文本与主幕细行念头在代码上已接入；实际一屏阅读顺序、可理解度及是否仍像工作台，留待当前窗口的小循环与真人反馈，不能由此审查宣称通过。
