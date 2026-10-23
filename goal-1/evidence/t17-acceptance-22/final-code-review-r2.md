# S2最终源码独立复核 R2：随身册点击修缮

限定结论：当前CSS未发现新的确定层叠、DOM语义或状态规则冲突。只读src/ui/opening-play.css及其必要DOM/导入上下文，未改源码/文档，未运行测试、浏览器、Git、几何或兼容专项。R1仍保留其原R4身份；本R2不把静态推理当R5实际点击或美术通过。

审阅CSS SHA256：e0f28b59ab18d0310556106d98f7df085091ec27fec69a89152ec998da23a6ec，与pocket-click-fix-r1/static-check.json一致。本轮另用只读diff核对该目录opening-play.before.css，变更只涉及底部入口层级、stage物件边界/grid、图像分配、旁签margin及纯文本grid；未新增断点、字体缩减、overflow裁切或隐藏正文。已有postcss parsePassed等是原记录，本轮未重跑。

1. 层叠：main.tsx最后导入opening-play.css；非探索opening-room的room-pocket原本为position:absolute，新z-index:4高于stage物件z-index:3。两者处于原cinematic-stage隔离层内，物件自身transform/isolation形成的子层仍不能越过pocket父层。原nav及按钮未被移入物件button，不依赖DOM覆盖或取消指针事件来换目标。该规则只用于非探索room，不改探索热点层。
2. 完整按钮：OpeningMoment当前fragment使OpeningObject为stage直接原生button，命中direct selector；top:29%与bottom:132px作用于完整按钮，direct路径没有height:100%与两端定位相冲突。两行minmax(0,1fr)/auto让插图分剩余行、旁签保自然高度；min-height:0及object-fit:contain用于插图，stage旁签覆盖原负margin为0。可选wrapper子按钮才使用height:100%，未泛化到其他近景对象。
3. DOM与状态：OpeningObject仍是一个type=button，原disabled、onActivate、aria-labelledby/aria-describedby及文字均在；图像与装饰仍aria-hidden/pointer-events:none，未新增嵌套交互元素或修改游戏命令。纯textOnly原本不生成插图DOM；text-mode仍隐藏插图，后置的单auto行/align-content:start/gap:0覆盖新增双行grid，已有文字状态/禁用样式保留。
4. 动效：只读diff未改变原hover/focus/active transform、减少动效class或prefers-reduced-motion块。按钮焦点轮廓、文字和原控制语义继续存在，未凭静态样式声称其当前窗口呈现已验。

剩余验收由根持原任务执行：R4真实点击随身册误开物件的红证保留；R5须在当前窗口实际鼠标分别点随身册、物件及牵挂日历，核正确对话/返回、长旁签可读与游戏raw不变。文字自然高度、旋转与现有stage overflow的最终组合效果无法由源码推出，不能仅因z-index或构建通过关闭此问题。本次不加尺寸矩阵，不改规则；原P3/62/22及整体goal范围保持。
