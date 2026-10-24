# U3-C1 课程准备整合只读结论

本轮找到的2项确定代码缺口，Root已修，复读确认闭合；没有新增确定阻断。此为当前源与CSS/默认文案审查，Chrome扩展失连，本轮无实际图片、浏览器、测试或SSR执行；不能替代现场接触构图与真人理解度。

1. **原已完成样课不应退回定义图形。** 原进度可给 course-sample-completed，同季旧attempt的focusScope仍可为current；此前仅course-ready映成sample-ready，会落回definition。现[course-continuity.ts](../../../../src/ui/course-continuity.ts)第13—16行保history优先，并将该实际completed阶段映到留存样课；暂停/工具或权利待核且有实际job回响时也保原样课留页。这不表示新增招生资格、收入或重新完成。
2. **纸件不应再次套旧动作卡。** 原CourseEncounter把物件button直接放在section.scene-action下，命中[scene-decisions.css](../../../../src/ui/scene-decisions.css)第5—6行旧padding!important/背景/编号。现[CourseEncounter.tsx](../../../../src/ui/CourseEncounter.tsx)第19行增加course-encounter-paper正常流包裹，[course-encounter.css](../../../../src/ui/course-encounter.css)第6行只定义该flow容器；原direct-child规则已不命中纸件，native button和共享binding仍在。没有用裁切、字号或断点修复。

可保留的代码事实：[CourseThreadAction](../../../../src/ui/CourseThreadAction.tsx)让主念头和物件共用同一binding，安排/运行沿原ClockAdvance/确认，结果再显选下一步。房间与路线均只把公开phase传给13态纸件；许可成对范围页与样课留存页不同，不画现金。路线空displayTitle保完整aria-label，等待detail仅在binding已含原日期与标签时去重；readonly/unsaved/unavailable是旁层，textOnly保全文本。新增grid/flex选择器特指course-encounter，覆盖旧book-flow通用display；新纸件CSS不覆盖text-mode的art隐藏、既有focus outline和减少动效设置。样课ready的下一步仍明确显选，原C2与完整原册可到达，没有自动招生。

实际待验边界：低平物件与桌面/人物接触、SVG纸边在当前自然画面的辨识、长条款分页和物件/主操作可点击关系，均需Chrome恢复后以同次图/AX及真实流程确认。当前不报告这些已通过，也不因静态通过把U3-C1或正式无提示真人复测标完。当前读取的22个文件逐项SHA见source-readback.json，仅该有限集合，不称全仓或547源前后同。
