# D10 等待选择的目标页：R5 只读分析

结论：当前最小修缮在源码层面限定通过。只将选择导航中等待项的目标页改为其原主等待按钮所在页，普通章节和全部内容不变；没有必要额外修改键盘或焦点行为。本代理未修改源码、执行测试或连接浏览器。

## 原因与当前改动

R4 的 ScreenBook.tsx 第42—45行用 data-book-chapter 标题所在页生成 choice.page；NarrativeScene.tsx 第70行把该标记放在 WaitChoice 的 strong 标题上。当前观察中标题与主等待按钮分属不同原页，所以“看看选择”仍翻到标题页。chooseWithNumber 第84—87行在按钮不在当前页时复用同一导航按钮，因而继承同一目标错误。此结论只分析原导航链，不涉及尺寸、兼容或布局矩阵。

当前 ScreenBook 改动只包含两部分：

1. 在 choiceNavigation=true、当前节点是 data-book-chapter 且最近的 .scene-wait-decision 有 .clock-main>button 时，以这个原按钮的第一个正面积 rect 交给既有 bookPageAt；没有按钮/有效 rect 时仍用原标题。title、choice、章节顺序、页数算法和全部 children 均保留。
2. 原测量 effect 增加 choiceNavigation 依赖，避免该既有选项切换后沿用先前的目标；没有新增 resize 监听、样式、视口行为或命令。

普通章节（choiceNavigation=false）、其他选择和非等待标题仍用原目标。disabled 和 inert 不作为目标发现的排除条件，这是正确的：离页按钮本就可能 inert，只读或候选状态也应能翻阅看到按钮，但不能因此启用它。没有修改它的 disabled/预览/保存/候选/权限判断。

## 对早先焦点判断的明确纠正

我早先只读到第121行 document 的 body/main 补充监听，漏读了第153行 stage 自身的 onKeyDown，错误提出“翻页后 frame 聚焦会让下一次数字键被忽略”的附加疑虑。这条初步判断撤回；不应扩大修改 effect 或留下这一错误缺陷结论。

第153行 stage 的 onKeyDown 会接收 ScreenBook frame 冒泡并调用 chooseWithNumber；document 第121行仅补 body/main 入口。第一次数字键在原按钮离页时只触发导航，turn(...,true) 聚焦 frame；随后数字键仍由 stage 入口处理，并继续经过原 visible/inert/disabled 判断后才点击原按钮。输入框、组合键、重复键与打开对话框的现有排除均未改变。

## 最小后续实际验证范围

- 当前同一窗口的这份长回响：点击“看看选择”后能看到原主等待按钮；从离页状态按1先定位，之后仍由原按钮办理，不能因为导航就提交推进。
- disabled/只读/未保存候选：可以翻阅目标，但按钮仍不能执行。
- 费用说明、独立“先核对”入口、原下一页/上一页、人物与原记录保持可到达；不裁切、缩字或删除长说明。
- 普通章节和非等待选择仍定位各自原章节。无需启动暂停的 book-layout 多宽度用例或任何兼容专项。

以上只是建议验收，不是本代理已经执行。CUA 中断后本局75的物理原档没有成功重读，不能据本分析宣称其重载或当前数据库状态。原75截图/AX/journal与中断记录保持原身份，恢复后的实际交互证据由根代理另行核定。

## 本次读取身份

| 文件 | 字节 | SHA256 |
| --- | ---: | --- |
| r4-pre-navigation-ScreenBook.tsx.txt | 9000 | 9ec810b63bc6d67831f145ea0b172ebc427d65ee90b629fc75d1da16d56a48f9 |
| src/ui/ScreenBook.tsx | 9382 | 85ec968a34d864e881e002623fbe7ec9187f7df6d19de8c9032063f94ff4b033 |
| src/ui/NarrativeScene.tsx | 36266 | 0d7e2ea15d548c2e0e787ca2da93fc728523a4bdcc14199b08fab6be76b598a9 |

[杠精审查] 限定通过：目标从标题改为原等待按钮，保留全部约定和原页；初步焦点误判已明确纠正。未以源码分析冒充浏览器、兼容、真人或完整D10验收。
